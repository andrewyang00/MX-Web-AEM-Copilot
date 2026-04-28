// ─────────────────────────────────────────────
// AEM Copilot — Blade Validator
//
// Reads template rules from window.AEMKBData (sourced from Full_Template_Library.md)
// and produces a deterministic compliance report against the detected inventory.
//
// All blade names referenced are KB-canonical (validated by bladeMatcher).
// Templates are resolved by AEMBladeMatcher.resolveTemplate using the KB routing rules.
// ─────────────────────────────────────────────

(function () {
  function validateInventory(payload) {
    const kb = window.AEMKBData;
    const matcher = window.AEMBladeMatcher;
    if (!kb || !matcher) {
      return { error: 'KB data or matcher not loaded' };
    }

    const tplResolution = matcher.resolveTemplate(payload.cqTemplate);
    if (!tplResolution.template) {
      return {
        templateResolution: tplResolution,
        message: tplResolution.note,
        unableToConfirmTemplate: true,
      };
    }

    const templateRules = kb.templateRules[tplResolution.template];
    if (!templateRules) {
      return {
        templateResolution: tplResolution,
        message: `Template "${tplResolution.template}" resolved but no rules in KB.`,
      };
    }

    const inventory = payload.detectedBladeInventory || [];

    // Build map: blade name → list of inventory entries supporting it.
    const detected = new Map();
    for (const item of inventory) {
      for (const cand of item.candidateBlades || []) {
        const key = cand.officialBladeName;
        if (!detected.has(key)) detected.set(key, []);
        detected.get(key).push({
          confidence: cand.confidence,
          note: cand.note || cand.reason,
          order: item.order,
          nodeName: item.nodeName,
          aemPath: item.aemPath,
          headings: item.evidence?.headings || [],
          parentNodeName: item.parentNodeName || null,
        });
      }
    }

    function bestEvidence(name) {
      const list = detected.get(name);
      if (!list || !list.length) return null;
      const rank = { high: 3, medium: 2, low: 1 };
      return list.reduce((best, cur) =>
        (rank[cur.confidence] || 0) > (rank[best.confidence] || 0) ? cur : best,
      list[0]);
    }

    const present = [];
    const possibleQaIssues = [];
    const missing = [];
    const accountedFor = new Set();

    function classify(name, severity) {
      accountedFor.add(name);
      const ev = bestEvidence(name);
      if (!ev) {
        if (severity === 'required') {
          missing.push({ name, severity, status: '✕ Missing' });
        }
        return;
      }
      if (ev.confidence === 'high') {
        present.push({ name, severity, status: '✓ Present', evidence: ev });
      } else if (ev.confidence === 'medium') {
        // Per KB Author_Output_Style: "Closely resembles" → ⚠ Possible QA Issue
        possibleQaIssues.push({
          name, severity,
          status: `⚠ Possible QA Issue — Closely resembles ${name}`,
          reason: ev.note,
          evidence: ev,
        });
      } else {
        possibleQaIssues.push({
          name, severity,
          status: `? Unable to Confirm — ${name}`,
          reason: ev.note,
          evidence: ev,
        });
      }
    }

    for (const name of templateRules.required || []) classify(name, 'required');
    for (const name of templateRules.optional || []) classify(name, 'optional');

    // Apply explicit KB rules (e.g. "Cannot have more than one Hero")
    const ruleViolations = checkExplicitRules(templateRules.rules || [], detected, inventory);

    // Anything detected but not in either list → extras
    const extras = [];
    const unableToConfirm = [];
    for (const [name, list] of detected.entries()) {
      if (accountedFor.has(name)) continue;
      if (name === '? Unable to Confirm' || name === 'Unmapped / Needs Review') {
        unableToConfirm.push({ name, evidence: list[0] });
      } else {
        const ev = bestEvidence(name);
        extras.push({ name, evidence: ev });
      }
    }

    // Optional Blades Available — KB optional list minus what's already present/QA-flagged.
    const optionalCovered = new Set([
      ...present.filter(p => p.severity === 'optional').map(p => p.name),
      ...possibleQaIssues.filter(p => p.severity === 'optional').map(p => p.name),
    ]);
    const optionalAvailable = (templateRules.optional || []).filter(n => !optionalCovered.has(n));

    return {
      templateResolution: tplResolution,
      templateRules,
      present,
      possibleQaIssues,
      missing,
      ruleViolations,
      extras,
      unableToConfirm,
      optionalAvailable,
      summary: {
        requiredTotal: (templateRules.required || []).length,
        requiredPresent: present.filter(p => p.severity === 'required').length,
        requiredMissing: missing.filter(m => m.severity === 'required').length,
        possibleQaIssues: possibleQaIssues.length,
        ruleViolations: ruleViolations.length,
      },
    };
  }

  // ── Check explicit rules from the KB ──
  // Rules are natural-language strings like "Cannot have more than one Hero."
  // We pattern-match the most common ones; the agent handles softer rules in prose.
  function checkExplicitRules(rules, detected, inventory) {
    const violations = [];
    for (const rule of rules) {
      const r = rule.toLowerCase();

      if (/cannot have more than one hero/.test(r)) {
        const heroCount = countMatchingDetections(detected, name => name.startsWith('Hero - '));
        if (heroCount > 1) {
          violations.push({
            rule,
            severity: 'error',
            detail: `${heroCount} Hero blades detected; KB rule allows only one.`,
          });
        }
      }

      if (/cannot have more than one cta stacked/.test(r) || /cannot have more than one next steps/.test(r)) {
        const ctaCount = countMatchingDetections(detected, name => name === 'CTA Stacked');
        if (ctaCount > 1) {
          violations.push({
            rule,
            severity: 'error',
            detail: `${ctaCount} CTA Stacked blades detected; KB rule allows only one.`,
          });
        }
      }

      const maxSections = r.match(/should not use more than (\d+) sections/);
      if (maxSections) {
        const limit = parseInt(maxSections[1], 10);
        const sectionCount = inventory.length;
        if (sectionCount > limit) {
          violations.push({
            rule,
            severity: 'warning',
            detail: `${sectionCount} sections detected; KB recommends no more than ${limit}.`,
          });
        }
      }

      const minSections = r.match(/should contain (\d+).(\d+) major sections/);
      if (minSections) {
        const lo = parseInt(minSections[1], 10);
        const hi = parseInt(minSections[2], 10);
        const sectionCount = inventory.length;
        if (sectionCount < lo || sectionCount > hi) {
          violations.push({
            rule,
            severity: 'warning',
            detail: `${sectionCount} sections detected; KB expects ${lo}–${hi} major sections.`,
          });
        }
      }
    }
    return violations;
  }

  function countMatchingDetections(detected, pred) {
    let count = 0;
    for (const [name, list] of detected.entries()) {
      if (pred(name)) count += list.length;
    }
    return count;
  }

  window.AEMBladeValidator = { validateInventory };
})();
