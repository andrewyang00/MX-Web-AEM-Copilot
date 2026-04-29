# Template Inference Guidance KB

Source: AEM Copilot architecture update, April 2026

Purpose: This document defines how AEM Copilot should identify a page's visual template when AEM technical template names do not map cleanly to visual template intent.

## Core Principle

Infer the visual template from blade composition and visual structure first. Treat `cq:template` as fallback or tiebreaker context only.

## Why

AEM technical templates can be broad chassis rather than exact visual templates. In particular, PDP3 / `product-detail-3` can be used as a catch-all chassis and may host different visual page patterns.

Therefore:
- Do not assume a page is Product Detail 3 solely because `cq:template` contains `product-detail-3`.
- Do not reject template identification solely because `cq:template` does not match a routing rule.
- Use detected blade inventory, visual structure, and PNG-backed template anatomy to infer the intended page type.

## Recommended Inference Flow

1. Build detected blade inventory from AEM JSON and page structure.
2. Normalize detected blade names using the Blade Name Normalization KB.
3. Score detected blades against the core visual template rules.
4. Prefer templates with strong unique anchor blades.
5. If no unique anchor exists, prefer the template with the strongest required and optional blade coverage.
6. Use `cq:template` only when blade composition is ambiguous.
7. If blade inventory is too thin or multiple templates remain genuinely close, return `? Unable to Confirm`.

## Anchor Examples

Pricing Hub anchors:
- Hero - Pricing Hub
- Plan Card Grid
- Banner - CTA

Solution Center anchors:
- Hero - Featured Cards Carousel
- Stats - Featured

CLE anchors:
- Hero - Featured XL
- Cards - Featured Stack
- Carousel - Storytelling

Product Home Page anchors:
- Cards - Featured
- Impact - Media Demo

Product Detail Page has no strong unique required anchor. It is often identified by complete or near-complete coverage of its full anatomy:
- Hero - Slim
- Secondary Sticky Navigation
- CTA Stacked
- Impact - Vertical Tabs
- Features - Pricing

## Handling Ambiguity

If a page fully satisfies Product Detail Page anatomy and competing templates only match through shared optional blades, report Product Detail Page with confidence rather than returning ambiguous.

If two templates share required coverage and both have template-specific anchors present, return:

`? Unable to Confirm — Template cannot be confidently identified from the provided JSON summary.`

Then list the likely candidate templates and the blade evidence that caused ambiguity.

## Author-Facing Output

Use the standard status vocabulary:
- `✓ Present`
- `⚠ Possible QA Issue`
- `✕ Missing`
- `? Unable to Confirm`

Do not expose raw AEM node names, `sling:resourceType`, or implementation details unless the author asks for technical detail.

When visual references are available, explain matches in author-friendly language:

`This section visually and structurally matches Impact - Vertical Tabs.`

Do not say:

`This matched section_master_11773 because it contains accordion-vertical-item.`
