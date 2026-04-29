// AEM Copilot - Visual Template References
//
// Normalized from the Frontify scrape plus the PNG annotation boards. This file
// is intentionally separate from kbData.js because the markdown KB remains the
// compliance source, while these references describe the core visual templates
// authors actually compare against.

(function () {
  const bladeAliases = {
    // PNG annotation labels -> surfaced Frontify/KB names.
    'Hero - Product': 'Hero - Slim',
    'Secondary Nav': 'Secondary Sticky Navigation',
    'Card Grid - Featured': 'Cards - Featured',
    'High Impact - Product Attention': 'Impact - Vertical Tabs',
    'Card Grid - Products': 'Card Grid',
    'High Impact - Media Demo': 'Impact - Media Demo',
    'Banner - CTA Banner': 'Banner - CTA',
    'Stats - Data With Icon': 'Stats - Data Tiles',
    'Carousel - Case Study': 'Carousel - Card Grid',

    // Frontify scrape variants -> surfaced names.
    'CTA Stack': 'CTA Stacked',
    'CTA Stack (Next Steps)': 'CTA Stacked',
    'CTA Stacked (Next Steps)': 'CTA Stacked',
    'CTA Stacked (Next Steps / Get Started)': 'CTA Stacked',
    'Hero - Slim (Slim Variation)': 'Hero - Slim',
    'Impact - Vertical Tabs (Vertical Accordion)': 'Impact - Vertical Tabs',
    'Features - Pricing (Pricing)': 'Features - Pricing',
    'Features - Pricing (1-Up Card)': 'Features - Pricing',
    'Features - Pricing (1-up card)': 'Features - Pricing',
    'Features - Pricing (2-Up Pricing Cards)': 'Features - Pricing',
    'Features - Product Highlight (Feature Grid)': 'Features - Product Highlight',
    'Features - Product Highlight (Feature Card w/ Dropdown)': 'Features - Product Highlight',
    'Features - Pricing Comparison (Filterable Comparison Table)': 'Features - Pricing Comparison',
    'Search - Filter Grid (Filtered Card Grid)': 'Search - Filter Grid',
    'Search - Filter Grid (Card Grid - Multi Filter Variation)': 'Search - Filter Grid',
    'Carousel - Card Grid (Card Carousel)': 'Carousel - Card Grid',
    'Carousel - Card Grid (Case Study Carousel)': 'Carousel - Card Grid',
    'Carousel - Card Grid (Card Carousel Regular)': 'Carousel - Card Grid',
    'Carousel - Card Grid (Card Carousel - Regular)': 'Carousel - Card Grid',
    'Carousel - Card Grid (Card Carousel x2)': 'Carousel - Card Grid',
    'Cards - Featured (3-Up Card)': 'Cards - Featured',
    'Cards - Featured Grid (Card Grid - Featured)': 'Cards - Featured Grid',
    'Card Grid (3-Up Card Grid)': 'Card Grid',
    'Stats - Data Tiles (Data Bar)': 'Stats - Data Tiles',
    'Stats - Data Tiles (Data Card)': 'Stats - Data Tiles',
    'Stats - Data with Icon': 'Stats - Data with Icon',
    'Banner - Featured (Full Screen Banner)': 'Banner - Featured',
    'Banner - CTA (Stacked Variation)': 'Banner - CTA',
    'Hero (Card Carousel Variation + Modal)': 'Hero - Featured Cards Carousel',

    // Existing deterministic matcher names that can satisfy visual-template labels.
    'Cards - Featured Grid': 'Cards - Featured',
  };

  const coreTemplates = [
    {
      template: 'Product Home Page',
      frontifyTemplate: 'Reimagine Product Home Page',
      sourcePngs: [
        'visual-references/source-boards/product-home-azure.png',
        'visual-references/source-boards/product-home-cloud-annotations.png',
      ],
      required: [
        'Hero - Slim',
        'Secondary Sticky Navigation',
        'CTA Stacked',
        'Cards - Featured',
        'Impact - Vertical Tabs',
        'Card Grid',
        'Impact - Media Demo',
      ],
      optional: [
        'Banner - Featured',
        'Banner - CTA',
        'Stats - Data Tiles',
        'Carousel - Card Grid',
        'Features - Pricing',
      ],
      rules: [
        'Hero module is required.',
        'Sub-navigation is required.',
        'Next Steps module is required.',
        'Order of components can be changed.',
        'Cannot have more than one Hero.',
        'Cannot have more than one CTA Stacked / Next Steps module.',
      ],
      pngLabelMappings: {
        'Hero - Product': 'Hero - Slim',
        'Secondary Nav': 'Secondary Sticky Navigation',
        'Card Grid - Featured': 'Cards - Featured',
        'High Impact - Product Attention': 'Impact - Vertical Tabs',
        'Card Grid - Products': 'Card Grid',
        'High Impact - Media Demo': 'Impact - Media Demo',
        'Banner - CTA Banner': 'Banner - CTA',
        'Stats - Data With Icon': 'Stats - Data Tiles',
        'Carousel - Case Study': 'Carousel - Card Grid',
      },
    },
    {
      template: 'Product Detail Page',
      frontifyTemplate: 'Reimagine Product Detail Page (PDP)',
      sourcePngs: ['visual-references/source-boards/product-detail-page-annotations.png'],
      required: [
        'Hero - Slim',
        'Secondary Sticky Navigation',
        'CTA Stacked',
        'Impact - Vertical Tabs',
        'Features - Pricing',
      ],
      optional: [
        'Impact - Media Demo',
        'Stats - Data with Icon',
        'Banner - Featured',
        'Carousel - Card Grid',
        'FAQ',
      ],
      rules: [
        'Hero blade is required.',
        'In-page navigation should be present.',
        'Next Steps / CTA Stacked is required.',
        'Cannot have more than one Hero.',
        'Cannot have more than one CTA Stacked / Next Steps module.',
        'Features Grid may substitute for Interactive Demo if no feature videos exist.',
      ],
    },
    {
      template: 'Product Detail 3',
      frontifyTemplate: 'Product Detail 3 (BizApps)',
      sourcePngs: ['visual-references/source-boards/product-detail-page-annotations.png'],
      required: [
        'Hero - Slim',
        'Secondary Sticky Navigation',
        'Impact - Vertical Tabs',
        'Features - Pricing',
        'Cards - Logo Wall',
        'CTA Stacked',
      ],
      optional: [
        'Features - Product Highlight',
        'Stats - Featured',
        'Carousel - Card Grid',
      ],
      rules: [
        'Hero blade is required.',
        'Sub-navigation is required.',
        'Next Steps module is required.',
        'Cannot have more than one Hero.',
        'Cannot have more than one CTA Stacked / Next Steps module.',
      ],
    },
    {
      template: 'Product Category Landing',
      frontifyTemplate: 'Product Category Landing',
      sourcePngs: ['visual-references/source-boards/product-category-landing.png'],
      required: [
        'Hero - Slim',
        'Secondary Sticky Navigation',
        'Features - Product Highlight',
        'Search - Filter Grid',
        'Carousel - Card Grid',
      ],
      optional: [
        'Impact - Vertical Tabs',
        'Features - Pricing Comparison',
        'Stats - Data Tiles',
      ],
      rules: [
        'Hero blade is required.',
        'Secondary navigation is required.',
        'Category pages should help users find the right product or path.',
        'Cannot have more than one Hero.',
      ],
    },
    {
      template: 'Product Solutions Landing',
      frontifyTemplate: 'Product Solution Landing',
      sourcePngs: ['visual-references/source-boards/product-solutions-landing.png'],
      required: [
        'Hero - Slim',
        'Secondary Sticky Navigation',
        'Impact - Vertical Tabs',
        'Cards - Logo Wall',
        'Carousel - Card Grid',
        'Features - Pricing',
      ],
      optional: [
        'Features - Product Highlight',
        'Banner - Featured',
        'Stats - Data Tiles',
        'FAQ',
      ],
      rules: [
        'Hero module is required.',
        'Sub-navigation is required.',
        'Next Steps module is required.',
        'Use solution-oriented content and routing.',
        'Cannot have more than one Hero.',
        'Cannot have more than one CTA Stacked / Next Steps module.',
      ],
    },
    {
      template: 'Solution Center',
      frontifyTemplate: 'Solution Center (B2B Hub)',
      sourcePngs: ['visual-references/source-boards/solution-center.png'],
      required: [
        'Hero - Featured Cards Carousel',
        'Carousel - Card Grid',
        'Impact - Vertical Tabs',
        'Stats - Featured',
        'Cards - Featured Grid',
        'CTA Stacked',
      ],
      optional: [
        'Banner - Featured',
        'Stats - Data Tiles',
        'Carousel - Card Grid',
      ],
      rules: [
        'Hero module is required.',
        'Next Steps module is required.',
        'Filtering should update relevant card blades when applicable.',
        'When filtered results exceed expected visible rows, a Load More CTA should appear.',
        'Cannot have more than one Hero.',
        'Cannot have more than one CTA Stacked / Next Steps module.',
      ],
    },
    {
      template: 'Solution Category Landing',
      frontifyTemplate: 'Solution Center Category Landing (B2B Hub)',
      sourcePngs: ['visual-references/source-boards/solution-category-landing-annotations.png'],
      required: [
        'Hero - Slim',
        'Search - Filter Grid',
        'Card Grid',
        'Carousel - Card Grid',
        'Features - Product Highlight',
        'Banner - Featured',
        'CTA Stacked',
      ],
      optional: [
        'Carousel - Card Grid',
      ],
      rules: [
        'Hero module is required.',
        'Next Steps module is required.',
        'Order of components can be changed.',
        'Filter updates all 3-up card blades and supports multiple selections.',
        'Cannot have more than one Hero.',
        'Cannot have more than one CTA Stacked / Next Steps module.',
      ],
    },
  ];

  const templateRules = Object.fromEntries(coreTemplates.map(t => [
    t.template,
    { required: t.required, optional: t.optional, rules: t.rules },
  ]));

  const templateAliases = {
    'Azure Home': 'Product Home Page',
    'Cloud Home': 'Product Home Page',
    'Reimagine Product Home Page': 'Product Home Page',
    'Reimagine Product Detail Page (PDP)': 'Product Detail Page',
    'PDP': 'Product Detail Page',
    'Product Detail 3 (BizApps)': 'Product Detail 3',
    'Product Solution Landing': 'Product Solutions Landing',
    'Solution Landing': 'Product Solutions Landing',
    'Solution Center (B2B Hub)': 'Solution Center',
    'Solution Center': 'Solution Center',
    'Solution Center Category Landing (B2B Hub)': 'Solution Category Landing',
    'Solution Category Landing': 'Solution Category Landing',
  };

  const knownBladeNames = [...new Set(coreTemplates.flatMap(t => [
    ...t.required,
    ...t.optional,
    ...Object.keys(t.pngLabelMappings || {}),
    ...Object.values(t.pngLabelMappings || {}),
  ]))].sort();

  function resolveBladeName(name) {
    return bladeAliases[name] || name;
  }

  function resolveTemplateName(name) {
    return templateAliases[name] || name;
  }

  function getTemplateRules() {
    return templateRules;
  }

  function getCoreReferenceSummary() {
    return coreTemplates.map(t => ({
      template: t.template,
      frontifyTemplate: t.frontifyTemplate,
      sourcePngs: t.sourcePngs,
      required: t.required,
      optional: t.optional,
      pngLabelMappings: t.pngLabelMappings || {},
    }));
  }

  window.AEMVisualTemplateReferences = {
    source: 'Frontify scrape + PNG annotation boards, April 2026',
    coreTemplates,
    templateRules,
    templateAliases,
    bladeAliases,
    knownBladeNames,
    resolveBladeName,
    resolveTemplateName,
    getTemplateRules,
    getCoreReferenceSummary,
  };
})();
