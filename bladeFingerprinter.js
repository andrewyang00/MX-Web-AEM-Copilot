// ─────────────────────────────────────────────
// AEM Copilot — Blade Fingerprinter
//
// Computes structural fingerprints from any AEM JSON node. Used for two things:
//
// 1. Library indexing: walk the blade library, fingerprint each example blade,
//    cache by path + cq:lastModified. Stored in chrome.storage.local.
//
// 2. Page section QA: fingerprint each page section, then compare against the
//    library fingerprint for its matched blade name to surface field-level
//    QA issues (image quality, button data-behaviors, missing required fields).
//
// A fingerprint captures the SHAPE and AUTHORED VALUES of a section — enough to
// say "this section has the same structure as the canonical Hero - Slim but with
// image quality 85 instead of 100".
// ─────────────────────────────────────────────

(function () {
  // Keys to skip during fingerprint walk (pure metadata noise).
  // CRITICAL: do NOT skip image, media, badge, metadata, videoModal — those are
  // real child nodes with QA-relevant fields.
  const SKIP_KEYS = new Set([
    'jcr:primaryType', 'jcr:created', 'jcr:createdBy', 'jcr:lastModified', 'jcr:lastModifiedBy',
    'jcr:mixinTypes', 'jcr:uuid', 'jcr:baseVersion', 'jcr:versionHistory', 'jcr:predecessors',
    'cq:lastModified', 'cq:lastModifiedBy', 'cq:lastRolledout', 'cq:lastRolledoutBy',
    'cq:annotations', 'customTelemetry', 'linkItemImage',
  ]);

  function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  function walk(node, cb, depth = 0, maxDepth = 12) {
    if (!isObject(node) || depth > maxDepth) return;
    cb(node, depth);
    for (const [k, v] of Object.entries(node)) {
      if (SKIP_KEYS.has(k)) continue;
      if (isObject(v)) walk(v, cb, depth + 1, maxDepth);
    }
  }

  // ── Fingerprint shape ──
  // {
  //   resourceType,          : top-level node sling:resourceType
  //   variant,               : top-level "variant" property
  //   childResourceTypes,    : Set<string> — distinctive child sling:resourceType values
  //   componentNames,        : Set<string>
  //   styleIds,              : Set<string>
  //   carouselVariant,       : if any nested carousel had a variant
  //   counts                 : { images, videos, actions, accordionItems, tabs }
  //   authoredValues         : { ... aggregate authored fields for QA comparison }
  // }
  function fingerprint(node) {
    if (!isObject(node)) return null;

    const fp = {
      resourceType: String(node['sling:resourceType'] || node[':type'] || ''),
      variant: node.variant || null,
      childResourceTypes: new Set(),
      componentNames: new Set(),
      styleIds: new Set(),
      carouselVariant: null,
      counts: {
        images: 0, videos: 0, actions: 0,
        accordionItems: 0, tabs: 0, cards: 0,
        statBlocks: 0, planCards: 0,
      },
      authoredValues: {
        // Distributions across all images/videos/actions in the section.
        // For library fingerprints, these are the canonical values. For page
        // sections, we diff against them.
        imageQualities: [],
        imageHasAlt: { yes: 0, no: 0 },
        imageDecorative: { yes: 0, no: 0 },
        videoAutoplay: { yes: 0, no: 0 },
        actionDataBehaviors: [],
        actionStyleOptions: [],
        headingTags: [],
      },
    };

    walk(node, (child) => {
      const rt = String(child['sling:resourceType'] || child[':type'] || '').toLowerCase();
      if (rt) fp.childResourceTypes.add(rt);
      if (child.componentName) fp.componentNames.add(child.componentName);
      if (Array.isArray(child['cq:styleIds'])) {
        for (const sid of child['cq:styleIds']) fp.styleIds.add(String(sid));
      }

      // Counts
      if (rt.includes('atomic/accordion/v2/accordion-vertical-item')) fp.counts.accordionItems++;
      if (rt.includes('atomic/tabs')) fp.counts.tabs++;
      if (rt.includes('atomic/card/v')) fp.counts.cards++;
      if (rt.includes('blade/stats') || rt.includes('atomic/block-feature')) fp.counts.statBlocks++;
      if (rt.includes('card-plan-detail')) fp.counts.planCards++;

      // Carousel variant
      if (rt.includes('atomic/carousel') && typeof child.variant === 'string') {
        fp.carouselVariant = child.variant;
      }

      // Image authoring fields
      if (rt.includes('foundation/image') && isObject(child.images)) {
        for (const ik of Object.keys(child.images)) {
          const img = child.images[ik];
          if (!isObject(img)) continue;
          fp.counts.images++;
          if (img.serverQuality) fp.authoredValues.imageQualities.push(String(img.serverQuality));
          fp.authoredValues.imageHasAlt[img.alt ? 'yes' : 'no']++;
          fp.authoredValues.imageDecorative[
            (img.isDecorative === 'true' || img.isDecorative === true) ? 'yes' : 'no'
          ]++;
        }
      }

      // Video authoring fields
      if (rt.includes('cascade-media-player') || rt.includes('onecloud-player')) {
        fp.counts.videos++;
        const ap = child.options?.autoplay;
        if (ap === 'true' || ap === true) fp.authoredValues.videoAutoplay.yes++;
        else fp.authoredValues.videoAutoplay.no++;
      }

      // Action authoring fields
      if (rt.includes('foundation/action/v') && !rt.includes('action-group')) {
        fp.counts.actions++;
        if (child.dataBehavior) fp.authoredValues.actionDataBehaviors.push(String(child.dataBehavior));
        if (child.styleoption) fp.authoredValues.actionStyleOptions.push(String(child.styleoption));
      }

      // Heading tag detection
      for (const k of ['title', 'enTitle']) {
        const v = child[k];
        if (typeof v === 'string') {
          const tagMatch = v.match(/<(h[1-6])[\s>]/i);
          if (tagMatch) fp.authoredValues.headingTags.push(tagMatch[1].toLowerCase());
        }
      }
    });

    return fp;
  }

  // ── Diff page section fingerprint against library canonical fingerprint ──
  // Returns array of human-readable QA findings.
  function diffAgainstLibrary(pageFp, libraryFp, bladeName) {
    if (!pageFp || !libraryFp) return [];
    const findings = [];

    // 1. Image quality drift
    const libQualities = new Set(libraryFp.authoredValues.imageQualities);
    const pageQualities = pageFp.authoredValues.imageQualities;
    if (libQualities.size === 1 && pageQualities.length > 0) {
      const expected = [...libQualities][0];
      const offSpec = pageQualities.filter(q => q !== expected);
      if (offSpec.length > 0) {
        findings.push({
          severity: 'warning',
          message: `${bladeName}: ${offSpec.length} image(s) at quality ${[...new Set(offSpec)].join('/')}, library uses ${expected}.`,
        });
      }
    }

    // 2. Missing alt text on non-decorative images
    const pageMissingAlt = pageFp.authoredValues.imageHasAlt.no;
    const pageDecorative = pageFp.authoredValues.imageDecorative.yes;
    if (pageMissingAlt > pageDecorative) {
      findings.push({
        severity: 'error',
        message: `${bladeName}: ${pageMissingAlt - pageDecorative} non-decorative image(s) missing alt text.`,
      });
    }

    // 3. Component count mismatches (only for blade types where count is meaningful)
    if (libraryFp.counts.accordionItems > 0 && pageFp.counts.accordionItems === 0) {
      findings.push({
        severity: 'warning',
        message: `${bladeName}: library has ${libraryFp.counts.accordionItems} accordion item(s), this section has 0 — may be a partial implementation.`,
      });
    }

    // 4. Variant mismatch
    if (libraryFp.variant && pageFp.variant && libraryFp.variant !== pageFp.variant) {
      findings.push({
        severity: 'info',
        message: `${bladeName}: section uses variant "${pageFp.variant}", library example uses "${libraryFp.variant}".`,
      });
    }

    // 5. Missing distinctive child resource types from library
    const missing = [];
    for (const rt of libraryFp.childResourceTypes) {
      // Only flag distinctive (blade- or atomic-level) types, not foundation
      if (!rt.includes('blade/') && !rt.includes('atomic/')) continue;
      if (rt.includes('foundation/')) continue;
      if (!pageFp.childResourceTypes.has(rt)) missing.push(rt.split('/').slice(-2).join('/'));
    }
    if (missing.length > 0 && missing.length <= 3) {
      findings.push({
        severity: 'info',
        message: `${bladeName}: library example contains ${missing.join(', ')} which is not present in this section.`,
      });
    }

    return findings;
  }

  // Serializable form for chrome.storage.local cache.
  function serializeFingerprint(fp) {
    if (!fp) return null;
    return {
      ...fp,
      childResourceTypes: [...fp.childResourceTypes],
      componentNames: [...fp.componentNames],
      styleIds: [...fp.styleIds],
    };
  }

  function deserializeFingerprint(obj) {
    if (!obj) return null;
    return {
      ...obj,
      childResourceTypes: new Set(obj.childResourceTypes || []),
      componentNames: new Set(obj.componentNames || []),
      styleIds: new Set(obj.styleIds || []),
    };
  }

  window.AEMBladeFingerprinter = {
    fingerprint,
    diffAgainstLibrary,
    serializeFingerprint,
    deserializeFingerprint,
  };
})();
