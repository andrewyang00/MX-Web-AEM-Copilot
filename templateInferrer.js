// AEM Copilot - Template Inferrer
//
// Infers the visual template from detected KB blade composition. cq:template is
// intentionally only a fallback/tiebreaker because AEM PDP3 can be used as a
// catch-all chassis for several visual page types.

(function () {
  const REQUIRED_WEIGHT = 3;
  const OPTIONAL_WEIGHT = 1;
  const MISSING_REQUIRED_WEIGHT = -2;
  const ANCHOR_WEIGHT = 5;
  const CLOSE_SCORE_MARGIN = 2;
  const CLOSE_NORMALIZED_MARGIN = 0.12;

  function getDetectedBladeSet(inventory) {
    const detected = new Map();
    const visualRefs = window.AEMVisualTemplateReferences;
    function addName(name, evidence) {
      if (!name) return;
      if (!detected.has(name)) detected.set(name, []);
      detected.get(name).push(evidence);
    }

    for (const item of inventory || []) {
      for (const cand of item.candidateBlades || []) {
        const name = cand.officialBladeName;
        if (!name || name === '? Unable to Confirm' || name === 'Unmapped / Needs Review') continue;
        const evidence = {
          confidence: cand.confidence || 'low',
          note: cand.note || cand.reason || '',
          order: item.order,
          nodeName: item.nodeName,
          aemPath: item.aemPath,
        };
        addName(name, evidence);
        const resolvedName = visualRefs?.resolveBladeName ? visualRefs.resolveBladeName(name) : name;
        if (resolvedName !== name) {
          addName(resolvedName, { ...evidence, matchedAs: name });
        }
      }
    }
    return detected;
  }

  function getTemplateRules() {
    const kb = window.AEMKBData;
    const visualRefs = window.AEMVisualTemplateReferences;
    return {
      ...(kb?.templateRules || {}),
      ...(visualRefs?.getTemplateRules ? visualRefs.getTemplateRules() : {}),
    };
  }

  function buildAnchorMap(templateRules) {
    const requiredOwners = new Map();
    for (const [template, rules] of Object.entries(templateRules || {})) {
      for (const blade of rules.required || []) {
        if (!requiredOwners.has(blade)) requiredOwners.set(blade, []);
        requiredOwners.get(blade).push(template);
      }
    }

    const anchorsByTemplate = {};
    for (const [blade, templates] of requiredOwners.entries()) {
      if (templates.length !== 1) continue;
      const template = templates[0];
      if (!anchorsByTemplate[template]) anchorsByTemplate[template] = [];
      anchorsByTemplate[template].push(blade);
    }
    return anchorsByTemplate;
  }

  function scoreTemplate(template, rules, detected, anchorsByTemplate) {
    const required = rules.required || [];
    const optional = rules.optional || [];
    const anchors = anchorsByTemplate[template] || [];
    let score = 0;
    let maxPositiveScore = 0;
    const requiredPresent = [];
    const requiredMissing = [];
    const optionalPresent = [];
    const anchorsPresent = [];

    for (const blade of required) {
      maxPositiveScore += REQUIRED_WEIGHT;
      if (detected.has(blade)) {
        score += REQUIRED_WEIGHT;
        requiredPresent.push(blade);
      } else {
        score += MISSING_REQUIRED_WEIGHT;
        requiredMissing.push(blade);
      }
    }

    for (const blade of optional) {
      maxPositiveScore += OPTIONAL_WEIGHT;
      if (detected.has(blade)) {
        score += OPTIONAL_WEIGHT;
        optionalPresent.push(blade);
      }
    }

    for (const blade of anchors) {
      maxPositiveScore += ANCHOR_WEIGHT;
      if (detected.has(blade)) {
        score += ANCHOR_WEIGHT;
        anchorsPresent.push(blade);
      }
    }

    return {
      template,
      score,
      normalizedScore: maxPositiveScore ? score / maxPositiveScore : 0,
      requiredPresent,
      requiredMissing,
      optionalPresent,
      anchors,
      anchorsPresent,
      requiredCoverage: required.length ? requiredPresent.length / required.length : 0,
    };
  }

  function sortScores(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (b.anchorsPresent.length !== a.anchorsPresent.length) return b.anchorsPresent.length - a.anchorsPresent.length;
    if (b.requiredCoverage !== a.requiredCoverage) return b.requiredCoverage - a.requiredCoverage;
    return a.template.localeCompare(b.template);
  }

  function isCloseScore(top, other) {
    if (!top || !other) return false;
    return (top.score - other.score) <= CLOSE_SCORE_MARGIN ||
      (top.normalizedScore - other.normalizedScore) <= CLOSE_NORMALIZED_MARGIN;
  }

  function confidenceFor(score, ambiguous, usedCqTiebreaker) {
    if (ambiguous) return 'low';
    if (usedCqTiebreaker) return 'medium';
    if (score.anchorsPresent.length > 0) return 'high';
    if (score.requiredCoverage >= 0.8 && score.score > 0) return 'medium-high';
    if (score.requiredCoverage >= 0.5 && score.score > 0) return 'medium';
    return 'low';
  }

  function inferTemplate(payload) {
    const kb = window.AEMKBData;
    const matcher = window.AEMBladeMatcher;
    const templateRules = getTemplateRules();
    if (!Object.keys(templateRules).length) {
      return {
        template: null,
        confidence: 'low',
        method: 'blade-inventory',
        unableToConfirmTemplate: true,
        note: 'KB template rules not loaded',
      };
    }

    const inventory = payload?.detectedBladeInventory || [];
    const detected = getDetectedBladeSet(inventory);
    const anchorsByTemplate = buildAnchorMap(templateRules);
    const scores = Object.entries(templateRules)
      .map(([template, rules]) => scoreTemplate(template, rules, detected, anchorsByTemplate))
      .sort(sortScores);

    const cqResolution = matcher?.resolveTemplate
      ? matcher.resolveTemplate(payload?.cqTemplate)
      : { template: null, confidence: 'low', note: 'AEM matcher routing not loaded' };

    const top = scores[0] || null;
    if (!top || detected.size === 0 || top.score <= 0 || (top.requiredPresent.length === 0 && top.anchorsPresent.length === 0)) {
      return {
        template: null,
        confidence: 'low',
        method: 'blade-inventory',
        unableToConfirmTemplate: true,
        cqTemplateResolution: cqResolution,
        detectedBlades: [...detected.keys()],
        scores,
        anchorsByTemplate,
        note: 'Blade inventory is too thin to infer a visual template. cq:template is fallback context only.',
      };
    }

    const closeMatches = scores.filter(score => score.template !== top.template && isCloseScore(top, score));
    const anchorTemplates = scores.filter(score => score.anchorsPresent.length > 0);
    const conflictingAnchorTemplates = anchorTemplates.filter(score =>
      score.template !== top.template &&
      isCloseScore(top, score) &&
      top.normalizedScore < 0.95
    );
    let selected = top;
    let ambiguous = conflictingAnchorTemplates.length > 0 ||
      (selected.anchorsPresent.length === 0 && closeMatches.length > 0 && selected.normalizedScore < 0.95);
    let usedCqTiebreaker = false;
    let note = selected.anchorsPresent.length
      ? `Inferred from anchor blade(s): ${selected.anchorsPresent.join(', ')}.`
      : 'Inferred from weighted required/optional blade overlap.';

    if (ambiguous && cqResolution.template) {
      const cqCandidate = [top, ...closeMatches].find(score => score.template === cqResolution.template);
      if (cqCandidate && conflictingAnchorTemplates.length === 0) {
        selected = cqCandidate;
        ambiguous = false;
        usedCqTiebreaker = true;
        note = `Blade inventory was close between templates; cq:template tiebreaker selected ${selected.template}.`;
      }
    }

    const ambiguityScores = [];
    for (const score of [selected, ...closeMatches, ...conflictingAnchorTemplates]) {
      if (score && !ambiguityScores.some(s => s.template === score.template)) {
        ambiguityScores.push(score);
      }
    }

    return {
      template: ambiguous ? null : selected.template,
      inferredTemplate: selected.template,
      confidence: confidenceFor(selected, ambiguous, usedCqTiebreaker),
      method: selected.anchorsPresent.length ? 'blade-anchors' : 'blade-score',
      unableToConfirmTemplate: ambiguous,
      ambiguous,
      ambiguityCandidates: ambiguous ? ambiguityScores.map(s => s.template) : [],
      cqTemplateResolution: cqResolution,
      usedCqTiebreaker,
      detectedBlades: [...detected.keys()],
      selectedScore: selected,
      scores,
      anchorsByTemplate,
      note: ambiguous
        ? `Unable to confirm a single visual template from blade composition. Top candidates: ${ambiguityScores.map(s => s.template).join(', ')}.`
        : note,
    };
  }

  window.AEMTemplateInferrer = {
    inferTemplate,
    getDetectedBladeSet,
    buildAnchorMap,
  };
})();
