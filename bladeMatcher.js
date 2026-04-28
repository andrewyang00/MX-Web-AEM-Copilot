// ─────────────────────────────────────────────
// AEM Copilot — Blade Matcher
//
// Maps AEM page sections to official Reimagine blade names from the KB.
//
// Two-stage approach:
//   Stage 1: Structural fingerprint match against a curated AEM-resource-type lookup
//            built from the KB's AEM_Component_Mapping table.
//   Stage 2: For section-master wrappers (which carry no blade identity themselves),
//            inspect children and use the same lookup against child resource types
//            and structural patterns.
//
// All blade names returned must be in window.AEMKBData.knownBladeNames.
// If a section can't be confidently matched, return "? Unable to Confirm".
// We never invent names.
// ─────────────────────────────────────────────

(function () {
  // ── AEM resource-type → KB blade name ──────────────────────
  // This is structural pattern matching: the resource-type substring on the LEFT
  // is what AEM authors actually use. The blade name on the RIGHT must be in
  // window.AEMKBData.knownBladeNames (validated at load time).
  //
  // These are the high-confidence direct matches. Order matters: more specific
  // patterns first.
  const RESOURCE_TYPE_MATCHES = [
    // Page-level chrome
    { pattern: 'blade/secondary-sticky-nav', blade: 'Secondary Sticky Navigation', confidence: 'high' },
    // Announcement banner is not in the KB. Don't invent a blade name. Returning null
    // here means it falls through to "Unable to Confirm".
    { pattern: 'blade/announcement-banner', blade: null, confidence: 'high', note: 'Resource type "blade/announcement-banner" is not in the KB. Treat as page chrome.' },

    // Heroes — resource type alone is rarely enough; usually need to look at variant + page slot.
    // Keep these out of direct match. They go through section-master rules.

    // Pricing
    { pattern: 'card-plan-detail-list', blade: 'Features - Pricing', confidence: 'high' },
    { pattern: 'card-plan-detail', blade: 'Features - Pricing', confidence: 'high' },

    // Interactive demo → Impact - Media Demo
    { pattern: 'blade/interactive-demo', blade: 'Impact - Media Demo', confidence: 'high' },

    // Stats blade — ambiguous between three KB variants. Flag for QA.
    { pattern: 'blade/stats', blade: 'Stats - Data with Icon', confidence: 'medium', note: 'Stats blade has three KB variants (Data with Icon, Data Tiles, Featured); QA should confirm which' },

    // Banner features → Banner - Featured (KB name is "Banner - Featured", singular)
    { pattern: 'blade/banner-features', blade: 'Banner - Featured', confidence: 'medium', note: 'banner-features matches Banner - Featured in KB' },

    // Product Highlight → Features - Product Highlight
    { pattern: 'blade/product-highlight', blade: 'Features - Product Highlight', confidence: 'high' },

    // FAQ
    { pattern: 'blade/faqs', blade: 'FAQ', confidence: 'high' },

    // CTA Stacked
    { pattern: 'blade/cta-stacked', blade: 'CTA Stacked', confidence: 'high' },

    // Footnote — recognized in KB mapping but not in any template's required/optional list.
    // Surface it so the agent can mention it but the validator won't error on it.
    { pattern: 'atomic/footnote', blade: 'Utility - Footnote', confidence: 'high', note: 'Recognized blade but not in any template required/optional list per KB' },
  ];

  // ── Foundation-only resource types ──────────────────────
  // These are NEVER blades on their own. From AEM_Component_Mapping.md.
  // We populate this from the KB at runtime so it stays in sync.
  function getFoundationOnlyTypes() {
    const kb = window.AEMKBData;
    if (!kb || !kb.foundationOnlyTypes) return [];
    return kb.foundationOnlyTypes.map(t => t.toLowerCase());
  }

  // ── Section-master rules ──────────────────────
  // section-master is a structural wrapper. Look at child signals to identify the blade.
  //
  // Each rule:
  //   blade   : KB blade name (must be in knownBladeNames)
  //   confidence: 'high' | 'medium' | 'low'
  //   note    : human-readable reason surfaced in the inventory
  //   match(signals, ctx) → bool
  //
  // ctx fields:
  //   index, isFirstSection, sectionId, sectionVariant, parentKey, headings, pageTemplate
  //
  // When multiple rules match, the highest-confidence one wins. Ties broken by rule order.
  const SECTION_MASTER_RULES = [
    // ── Heroes — only on the first 1-2 sections of the page ──
    // Hero variant choice depends on template. We propose a Hero candidate;
    // the validator picks the right variant for the detected template.
    {
      blade: 'Hero - Slim',
      confidence: 'medium',
      note: 'First section-master with H1 + media + action group. KB QA should confirm Hero variant against template.',
      match: (s, ctx) =>
        ctx.isFirstSection &&
        s.hasH1 &&
        (s.hasMedia || s.hasImage) &&
        s.hasActionGroup,
    },

    // ── Impact - Vertical Tabs ──
    // tabs-pill-bar containing accordion-vertical-item.
    {
      blade: 'Impact - Vertical Tabs',
      confidence: 'high',
      note: 'tabs-pill-bar with accordion-vertical-item children — matches Reimagine Vertical Tabs structure',
      match: (s) => (s.hasTabsPillBar || s.hasTabs) && s.hasAccordionVerticalItem,
    },

    // ── Impact - Media Demo (when wrapped in section-master) ──
    {
      blade: 'Impact - Media Demo',
      confidence: 'high',
      note: 'section-master wrapping interactive-demo blade',
      match: (s) => s.hasInteractiveDemo,
    },

    // ── Features - Pricing ──
    {
      blade: 'Features - Pricing',
      confidence: 'high',
      note: 'card-plan-detail / card-plan-detail-list pattern',
      match: (s) => s.hasCardPlanDetail,
    },

    // ── Banner - Featured ──
    {
      blade: 'Banner - Featured',
      confidence: 'high',
      note: 'banner-features atomic — matches Banner - Featured pattern in KB',
      match: (s) => s.hasBannerFeatures,
    },

    // ── Stats variants ──
    // The KB has three: Stats - Data with Icon, Stats - Data Tiles, Stats - Featured.
    // We can't tell them apart structurally without more clues. Default to medium-confidence
    // with a note pointing the agent at the three variants.
    {
      blade: 'Stats - Data with Icon',
      confidence: 'medium',
      note: 'stats blade detected; KB has 3 variants (Data with Icon, Data Tiles, Featured) — agent should confirm against template',
      match: (s) => s.hasStatsBlade,
    },

    // ── Carousel - Storytelling ──
    {
      blade: 'Carousel - Storytelling',
      confidence: 'high',
      note: 'carousel with testimonial-card or mediaBar variant — Storytelling pattern',
      match: (s) => s.hasTestimonialCard || (s.hasCarousel && s.carouselVariant === 'mediaBar'),
    },

    // ── Carousel - Card Grid ──
    // Plain card carousel. Tabs+carousel is also Card Grid per KB (no separate Filtered name in the KB).
    {
      blade: 'Carousel - Card Grid',
      confidence: 'high',
      note: 'carousel of cards — Card Grid pattern',
      match: (s) =>
        s.hasCarousel &&
        s.carouselVariant !== 'mediaBar' &&
        !s.hasTestimonialCard &&
        s.hasCards,
    },

    // ── CTA Stacked ──
    {
      blade: 'CTA Stacked',
      confidence: 'high',
      note: 'cta-stacked blade',
      match: (s) => s.hasCtaStacked,
    },

    // ── FAQ ──
    {
      blade: 'FAQ',
      confidence: 'high',
      note: 'faqs blade',
      match: (s) => s.hasFaqsBlade,
    },

    // ── Features - Product Highlight ──
    {
      blade: 'Features - Product Highlight',
      confidence: 'high',
      note: 'product-highlight blade',
      match: (s) => s.hasProductHighlight,
    },

    // ── Cards - Logo Wall ──
    {
      blade: 'Cards - Logo Wall',
      confidence: 'medium',
      note: 'logo-grid pattern detected',
      match: (s) => s.hasLogoWall,
    },

    // ── Search - Filter Grid ──
    {
      blade: 'Search - Filter Grid',
      confidence: 'medium',
      note: 'filter grid pattern detected',
      match: (s) => s.hasFilterGrid,
    },

    // ── Footnote — recognized but not a template-blade ──
    {
      blade: 'Utility - Footnote',
      confidence: 'high',
      note: 'footnote atomic — recognized blade, not a template slot',
      match: (s) => s.hasFootnote,
    },
  ];

  // ── Public API ──────────────────────

  // Validate that a blade name is in the KB's known list.
  // Returns the name if known, null otherwise. Never invents.
  function validateBladeName(name) {
    const kb = window.AEMKBData;
    if (!kb || !kb.knownBladeNames) return name; // KB not loaded — accept
    if (kb.knownBladeNames.includes(name)) return name;
    return null;
  }

  // Match a single node against the resource-type table.
  // Returns { blade, confidence, note } or null.
  function matchByResourceType(resourceType) {
    const rt = String(resourceType || '').toLowerCase();
    if (!rt) return null;
    // Foundation-only types are never blades by themselves.
    for (const fnt of getFoundationOnlyTypes()) {
      if (rt.includes(fnt)) return null;
    }
    for (const rule of RESOURCE_TYPE_MATCHES) {
      if (rt.includes(rule.pattern)) {
        if (rule.blade === null) return null; // explicit non-blade
        const validated = validateBladeName(rule.blade);
        if (!validated) {
          console.warn(`[bladeMatcher] Rule produced unknown blade: ${rule.blade}`);
          return null;
        }
        return {
          blade: validated,
          confidence: rule.confidence,
          note: rule.note || `Direct resource-type match: ${rule.pattern}`,
          via: 'resource-type',
        };
      }
    }
    return null;
  }

  // Match a section-master wrapper using child signals. Returns array of candidates,
  // sorted by confidence descending. Empty array if nothing matched.
  function matchSectionMaster(signals, ctx) {
    const candidates = [];
    for (const rule of SECTION_MASTER_RULES) {
      try {
        if (rule.match(signals, ctx)) {
          const validated = validateBladeName(rule.blade);
          if (!validated) {
            console.warn(`[bladeMatcher] section-master rule produced unknown blade: ${rule.blade}`);
            continue;
          }
          candidates.push({
            blade: validated,
            confidence: rule.confidence,
            note: rule.note,
            via: 'section-master-rule',
          });
        }
      } catch (e) {
        console.warn('[bladeMatcher] rule threw:', rule.blade, e);
      }
    }
    const rank = { high: 3, medium: 2, low: 1 };
    candidates.sort((a, b) => (rank[b.confidence] || 0) - (rank[a.confidence] || 0));
    return candidates;
  }

  // Resolve template name from cq:template using KB routing rules.
  function resolveTemplate(cqTemplate) {
    const kb = window.AEMKBData;
    if (!cqTemplate || !kb || !kb.templateRouting) {
      return { template: null, confidence: 'low', note: 'No cq:template or KB routing not loaded' };
    }
    const t = String(cqTemplate).toLowerCase();
    for (const rule of kb.templateRouting) {
      if (t.includes(rule.needle.toLowerCase())) {
        return { template: rule.template, confidence: 'high', matchedNeedle: rule.needle };
      }
    }
    return {
      template: null,
      confidence: 'low',
      note: `cq:template "${cqTemplate}" did not match any KB routing rule. Per KB: ? Unable to Confirm — Template cannot be confidently identified.`,
    };
  }

  window.AEMBladeMatcher = {
    matchByResourceType,
    matchSectionMaster,
    resolveTemplate,
    validateBladeName,
    // Exposed for diagnostics
    RESOURCE_TYPE_MATCHES,
    SECTION_MASTER_RULES,
  };
})();
