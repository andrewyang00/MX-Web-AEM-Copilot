#!/usr/bin/env node
// Build kbData.js from the Reimagine Copilot KB markdown files.
// This makes the extension's rules a derivative of the same KB the agent uses,
// not a hand-typed transcription that can drift.
//
// Usage:
//   node build_kbdata.js <kb-dir> <out-file>
//
// Parses:
//   - Full_Template_Library.md  → templateRules
//   - AEM_Component_Mapping.md  → aemSignalMap, foundationOnlyTypes
//   - Template_Routing.md       → templateRouting
//   - Operational_Core_KB.md    → supportedTemplates, statusVocab
//
// Output is a single JS file that exposes window.AEMKBData.

const fs = require('fs');
const path = require('path');

const [, , kbDir, outFile] = process.argv;
if (!kbDir || !outFile) {
  console.error('Usage: build_kbdata.js <kb-dir> <out-file>');
  process.exit(1);
}

function read(name) {
  return fs.readFileSync(path.join(kbDir, name), 'utf8');
}

// ── Parse Full_Template_Library.md ────────────────────────────
// Structure: H2 = template name, H3 sections = "Required Blades" / "Optional Blades" / "Rules"
function parseTemplates(md) {
  const templates = {};
  const blocks = md.split(/^## /m).slice(1); // skip preamble
  for (const block of blocks) {
    const [header, ...rest] = block.split('\n');
    const name = header.trim();
    const body = rest.join('\n');
    const required = extractBulletList(body, 'Required Blades');
    const optional = extractBulletList(body, 'Optional Blades');
    const rules = extractBulletList(body, 'Rules');
    templates[name] = { required, optional, rules };
  }
  return templates;
}

function extractBulletList(body, sectionName) {
  // Match "### sectionName" up to the next H3 or end of block
  const re = new RegExp(`### ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n### |$)`, 'i');
  const m = body.match(re);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).trim())
    .filter(Boolean);
}

// ── Parse AEM_Component_Mapping.md ────────────────────────────
function parseAemSignalMap(md) {
  const map = [];
  // Find the table after "## Direct / Strong Signals"
  const tableMatch = md.match(/## Direct \/ Strong Signals\s*\n([\s\S]*?)(?=\n## )/);
  if (!tableMatch) return map;
  const rows = tableMatch[1].split('\n').filter(l => l.startsWith('|'));
  for (const row of rows) {
    // Skip header and divider rows
    if (row.includes('AEM signal')) continue;
    if (/^\|\s*-+/.test(row.trim())) continue;
    if (/^\|---/.test(row.trim())) continue;

    const cells = row.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    const [signal, bladeName] = cells;
    if (!signal || !bladeName) continue;
    map.push({ signal: stripBackticks(signal), bladeName });
  }
  return map;
}

function parseFoundationOnly(md) {
  const m = md.match(/## Foundation Components Are Not Blades by Themselves\s*\n([\s\S]*?)(?=\n## )/);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).trim().replace(/`/g, ''))
    .filter(Boolean);
}

// ── Parse Template_Routing.md ────────────────────────────
function parseTemplateRouting(md) {
  const map = [];
  const tableMatch = md.match(/## Primary Routing by `cq:template`\s*\n([\s\S]*?)(?=\n## )/);
  if (!tableMatch) return map;
  const rows = tableMatch[1].split('\n').filter(l => l.startsWith('|'));
  for (const row of rows) {
    if (row.includes('cq:template')) continue;
    if (/^\|\s*-+/.test(row.trim())) continue;
    if (/^\|---/.test(row.trim())) continue;
    const cells = row.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    const [pattern, template] = cells;
    if (!pattern || !template) continue;
    // pattern may contain "or" — split into multiple needles
    const needles = pattern
      .split(/\s+or\s+/i)
      .map(p => stripBackticks(p))
      .filter(Boolean);
    for (const needle of needles) {
      map.push({ needle, template });
    }
  }
  return map;
}

function stripBackticks(s) {
  return s.replace(/`/g, '').trim();
}

// ── Build everything ────────────────────────────
const templateRules = parseTemplates(read('Full_Template_Library.md'));
const aemSignalMap = parseAemSignalMap(read('AEM_Component_Mapping.md'));
const foundationOnlyTypes = parseFoundationOnly(read('AEM_Component_Mapping.md'));
const templateRouting = parseTemplateRouting(read('Template_Routing.md'));

// Sanity-check
console.error(`Templates: ${Object.keys(templateRules).length}`);
for (const [t, r] of Object.entries(templateRules)) {
  console.error(`  ${t}: ${r.required.length} req, ${r.optional.length} opt, ${r.rules.length} rules`);
}
console.error(`AEM signals: ${aemSignalMap.length}`);
console.error(`Foundation-only types: ${foundationOnlyTypes.length}`);
console.error(`Template routing rules: ${templateRouting.length}`);

const data = {
  generatedAt: new Date().toISOString(),
  source: 'Reimagine Copilot KB v2.1',
  templateRules,
  aemSignalMap,
  foundationOnlyTypes,
  templateRouting,
  // Lift out the canonical blade name list. Union of:
  //   1. required + optional across all templates (from Full_Template_Library.md)
  //   2. blade names referenced in the AEM signal map (from AEM_Component_Mapping.md)
  // The mapping table includes recognized blades like Utility - Footnote that aren't
  // in any template's slot list but are valid KB blade names.
  knownBladeNames: [...new Set([
    ...Object.values(templateRules).flatMap(r => [...r.required, ...r.optional]),
    ...aemSignalMap.map(s => s.bladeName),
  ])].sort(),
};

const out =
`// AUTO-GENERATED from the Reimagine Copilot KB. Do not edit by hand.
// To regenerate: node build_kbdata.js <kb-dir> kbData.js
// Source: ${data.source}
// Generated: ${data.generatedAt}
window.AEMKBData = ${JSON.stringify(data, null, 2)};
`;

fs.writeFileSync(outFile, out);
console.error(`\nWrote ${outFile}`);
