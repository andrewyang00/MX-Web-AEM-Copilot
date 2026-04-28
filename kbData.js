// AUTO-GENERATED from the Reimagine Copilot KB. Do not edit by hand.
// To regenerate: node build_kbdata.js <kb-dir> kbData.js
// Source: Reimagine Copilot KB v2.1
// Generated: 2026-04-28T17:01:26.651Z
window.AEMKBData = {
  "generatedAt": "2026-04-28T17:01:26.651Z",
  "source": "Reimagine Copilot KB v2.1",
  "templateRules": {
    "Product Detail Page": {
      "required": [
        "Hero - Slim",
        "Secondary Sticky Navigation",
        "CTA Stacked",
        "Impact - Vertical Tabs",
        "Features - Pricing"
      ],
      "optional": [
        "Impact - Media Demo",
        "Stats - Data with Icon",
        "Banner - Featured",
        "Carousel - Card Grid",
        "FAQ"
      ],
      "rules": [
        "Hero blade is required.",
        "In-page navigation should be present.",
        "Next Steps / CTA Stacked is required.",
        "Cannot have more than one Hero.",
        "Cannot have more than one CTA Stacked / Next Steps module.",
        "Features Grid may substitute for Interactive Demo if no feature videos exist."
      ]
    },
    "Product Detail Pricing": {
      "required": [
        "Hero - Transactional",
        "Secondary Sticky Navigation",
        "Card Grid",
        "Features - Pricing",
        "Carousel - Card Grid",
        "CTA Stacked"
      ],
      "optional": [
        "Search - Filter Grid",
        "Carousel - Card Grid",
        "FAQ"
      ],
      "rules": [
        "Hero blade is required.",
        "In-page navigation should be present.",
        "Next Steps / Get Started is required.",
        "Use catalog data in the Hero.",
        "Do not use hard-coded pricing in the Hero.",
        "Cannot have more than one Hero.",
        "Cannot have more than one CTA Stacked / Next Steps module."
      ]
    },
    "Pricing Hub": {
      "required": [
        "Hero - Pricing Hub",
        "Secondary Sticky Navigation",
        "Plan Card Grid",
        "Cards - Featured Grid",
        "Banner - CTA"
      ],
      "optional": [
        "Search - AI Overview",
        "Utility - Jumplinks",
        "FAQ",
        "Features - Pricing"
      ],
      "rules": [
        "Hero module is required.",
        "Navigation should be present.",
        "Use AI assistant functionality when available.",
        "Next Steps module is required.",
        "Cannot have more than one Hero.",
        "Cannot have more than one Next Steps module."
      ]
    },
    "Product Category Landing": {
      "required": [
        "Hero - Slim",
        "Secondary Sticky Navigation",
        "Features - Product Highlight",
        "Search - Filter Grid",
        "Carousel - Card Grid"
      ],
      "optional": [
        "Impact - Vertical Tabs",
        "Features - Pricing Comparison",
        "Stats - Data Tiles"
      ],
      "rules": [
        "Hero blade is required.",
        "Secondary navigation is required.",
        "Category pages should help users find the right product or path.",
        "Cannot have more than one Hero."
      ]
    },
    "Product Solutions Landing": {
      "required": [
        "Hero - Slim",
        "Secondary Sticky Navigation",
        "Impact - Vertical Tabs",
        "Cards - Logo Wall",
        "Carousel - Card Grid",
        "Features - Pricing"
      ],
      "optional": [
        "Features - Product Highlight",
        "Banner - Featured",
        "Stats - Data Tiles",
        "Carousel - Card Grid",
        "FAQ"
      ],
      "rules": [
        "Hero module is required.",
        "Sub-navigation is required.",
        "Next Steps module is required.",
        "Use solution-oriented content and routing.",
        "Cannot have more than one Hero.",
        "Cannot have more than one CTA Stacked / Next Steps module."
      ]
    },
    "Solution Center": {
      "required": [
        "Hero - Featured Cards Carousel",
        "Carousel - Card Grid",
        "Impact - Vertical Tabs",
        "Stats - Featured",
        "Cards - Featured Grid",
        "CTA Stacked"
      ],
      "optional": [
        "Banner - Featured",
        "Stats - Data Tiles",
        "Carousel - Card Grid"
      ],
      "rules": [
        "Hero module is required.",
        "Next Steps module is required.",
        "Filtering should update relevant card blades when applicable.",
        "When filtered results exceed expected visible rows, a Load More CTA should appear.",
        "Cannot have more than one Hero.",
        "Cannot have more than one CTA Stacked / Next Steps module."
      ]
    },
    "CLE": {
      "required": [
        "Hero - Featured XL",
        "Secondary Sticky Navigation",
        "Cards - Featured Stack",
        "Carousel - Storytelling",
        "Banner - Featured"
      ],
      "optional": [
        "Media - Playlist Video",
        "Cards - Mixed Stack",
        "Banner - News",
        "Cards - Logo Wall",
        "Cards - Featured Grid"
      ],
      "rules": [
        "Should contain 4–6 major sections.",
        "Should use focused content relevant to the campaign.",
        "Should not use more than 6 sections.",
        "Should not add extra CTAs that detract from campaign KPIs."
      ]
    }
  },
  "aemSignalMap": [
    {
      "signal": "secondary-sticky-nav",
      "bladeName": "Secondary Sticky Navigation"
    },
    {
      "signal": "pricing cards, plan cards, pricing table, comparison pricing",
      "bladeName": "Features - Pricing"
    },
    {
      "signal": "pricing hub hero pattern",
      "bladeName": "Hero - Pricing Hub"
    },
    {
      "signal": "transactional pricing hero pattern",
      "bladeName": "Hero - Transactional"
    },
    {
      "signal": "product/detail approved hero pattern",
      "bladeName": "Hero - Slim"
    },
    {
      "signal": "vertical tabs, product accordion, tabbed feature explorer",
      "bladeName": "Impact - Vertical Tabs"
    },
    {
      "signal": "interactive demo / media demo pattern",
      "bladeName": "Impact - Media Demo"
    },
    {
      "signal": "logo grid, logo bar, logo wall",
      "bladeName": "Cards - Logo Wall"
    },
    {
      "signal": "featured multi-card grid",
      "bladeName": "Cards - Featured Grid"
    },
    {
      "signal": "featured card stack",
      "bladeName": "Cards - Featured Stack"
    },
    {
      "signal": "card carousel",
      "bladeName": "Carousel - Card Grid"
    },
    {
      "signal": "storytelling carousel",
      "bladeName": "Carousel - Storytelling"
    },
    {
      "signal": "stats with numbers/icons",
      "bladeName": "Stats - Featured"
    },
    {
      "signal": "data tiles",
      "bladeName": "Stats - Data Tiles"
    },
    {
      "signal": "data/stat with icon",
      "bladeName": "Stats - Data with Icon"
    },
    {
      "signal": "filter grid / page-level filter grid",
      "bladeName": "Search - Filter Grid"
    },
    {
      "signal": "AI overview / AI assistant search module",
      "bladeName": "Search - AI Overview"
    },
    {
      "signal": "CTA banner",
      "bladeName": "Banner - CTA"
    },
    {
      "signal": "featured banner",
      "bladeName": "Banner - Featured"
    },
    {
      "signal": "campaign featured XL hero",
      "bladeName": "Hero - Featured XL"
    },
    {
      "signal": "featured cards carousel hero",
      "bladeName": "Hero - Featured Cards Carousel"
    },
    {
      "signal": "FAQ accordion/list",
      "bladeName": "FAQ"
    },
    {
      "signal": "jumplink anchor navigation",
      "bladeName": "Utility - Jumplinks"
    },
    {
      "signal": "legal/disclaimer footnote",
      "bladeName": "Utility - Footnote"
    }
  ],
  "foundationOnlyTypes": [
    "foundation/media/v1/media",
    "foundation/image/v1/image",
    "foundation/action/v1/action",
    "foundation/action-group/v1/action-group",
    "foundation/text/v1/text",
    "foundation/icon/v1/icon",
    "foundation/modal/v2/modal"
  ],
  "templateRouting": [
    {
      "needle": "reimagine---product-detail-page",
      "template": "Product Detail Page"
    },
    {
      "needle": "product-detail-pricing",
      "template": "Product Detail Pricing"
    },
    {
      "needle": "pricing-hub",
      "template": "Pricing Hub"
    },
    {
      "needle": "product-category-landing",
      "template": "Product Category Landing"
    },
    {
      "needle": "product-solution-landing",
      "template": "Product Solutions Landing"
    },
    {
      "needle": "solution-center",
      "template": "Solution Center"
    },
    {
      "needle": "campaign-landing",
      "template": "CLE"
    },
    {
      "needle": "cle",
      "template": "CLE"
    }
  ],
  "knownBladeNames": [
    "Banner - CTA",
    "Banner - Featured",
    "Banner - News",
    "CTA Stacked",
    "Card Grid",
    "Cards - Featured Grid",
    "Cards - Featured Stack",
    "Cards - Logo Wall",
    "Cards - Mixed Stack",
    "Carousel - Card Grid",
    "Carousel - Storytelling",
    "FAQ",
    "Features - Pricing",
    "Features - Pricing Comparison",
    "Features - Product Highlight",
    "Hero - Featured Cards Carousel",
    "Hero - Featured XL",
    "Hero - Pricing Hub",
    "Hero - Slim",
    "Hero - Transactional",
    "Impact - Media Demo",
    "Impact - Vertical Tabs",
    "Media - Playlist Video",
    "Plan Card Grid",
    "Search - AI Overview",
    "Search - Filter Grid",
    "Secondary Sticky Navigation",
    "Stats - Data Tiles",
    "Stats - Data with Icon",
    "Stats - Featured",
    "Utility - Footnote",
    "Utility - Jumplinks"
  ]
};
