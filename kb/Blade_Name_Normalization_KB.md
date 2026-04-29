# Blade Name Normalization KB

Source: Frontify scrape + exported PNG annotation boards, April 2026

Purpose: Use this document to normalize legacy, Frontify scrape, and PNG annotation names to the surfaced blade names AEM Copilot should use in author-facing responses.

## Reporting Rule

Always surface the normalized name in author-facing output. Do not expose raw annotation labels, legacy names, or AEM component names unless the author asks for technical detail.

## PNG Annotation Labels to Surface Names

| PNG / annotation label | Surface name |
|---|---|
| Hero - Product | Hero - Slim |
| Secondary Nav | Secondary Sticky Navigation |
| Card Grid - Featured | Cards - Featured |
| High Impact - Product Attention | Impact - Vertical Tabs |
| Card Grid - Products | Card Grid |
| High Impact - Media Demo | Impact - Media Demo |
| Banner - CTA Banner | Banner - CTA |
| Stats - Data With Icon | Stats - Data Tiles |
| Carousel - Case Study | Carousel - Card Grid |

## Frontify Scrape Names to Surface Names

| Frontify / scrape name | Surface name |
|---|---|
| CTA Stack | CTA Stacked |
| CTA Stack (Next Steps) | CTA Stacked |
| CTA Stacked (Next Steps) | CTA Stacked |
| CTA Stacked (Next Steps / Get Started) | CTA Stacked |
| Hero - Slim (Slim Variation) | Hero - Slim |
| Impact - Vertical Tabs (Vertical Accordion) | Impact - Vertical Tabs |
| Features - Pricing (Pricing) | Features - Pricing |
| Features - Pricing (1-Up Card) | Features - Pricing |
| Features - Pricing (1-up card) | Features - Pricing |
| Features - Pricing (2-Up Pricing Cards) | Features - Pricing |
| Features - Product Highlight (Feature Grid) | Features - Product Highlight |
| Features - Product Highlight (Feature Card w/ Dropdown) | Features - Product Highlight |
| Features - Pricing Comparison (Filterable Comparison Table) | Features - Pricing Comparison |
| Search - Filter Grid (Filtered Card Grid) | Search - Filter Grid |
| Search - Filter Grid (Card Grid - Multi Filter Variation) | Search - Filter Grid |
| Carousel - Card Grid (Card Carousel) | Carousel - Card Grid |
| Carousel - Card Grid (Case Study Carousel) | Carousel - Card Grid |
| Carousel - Card Grid (Card Carousel - Regular) | Carousel - Card Grid |
| Carousel - Card Grid (Card Carousel x2) | Carousel - Card Grid |
| Cards - Featured (3-Up Card) | Cards - Featured |
| Cards - Featured Grid (Card Grid - Featured) | Cards - Featured Grid |
| Card Grid (3-Up Card Grid) | Card Grid |
| Stats - Data Tiles (Data Bar) | Stats - Data Tiles |
| Stats - Data Tiles (Data Card) | Stats - Data Tiles |
| Banner - Featured (Full Screen Banner) | Banner - Featured |
| Banner - CTA (Stacked Variation) | Banner - CTA |
| Hero (Card Carousel Variation + Modal) | Hero - Featured Cards Carousel |

## Template Name Aliases

| Source name | Surface template name |
|---|---|
| Azure Home | Product Home Page |
| Cloud Home | Product Home Page |
| Reimagine Product Home Page | Product Home Page |
| Reimagine Product Detail Page (PDP) | Product Detail Page |
| PDP | Product Detail Page |
| Product Detail 3 (BizApps) | Product Detail 3 |
| Product Solution Landing | Product Solutions Landing |
| Solution Landing | Product Solutions Landing |
| Solution Center (B2B Hub) | Solution Center |
| Solution Center | Solution Center |
| Solution Center Category Landing (B2B Hub) | Solution Category Landing |
| Solution Category Landing | Solution Category Landing |

## Ambiguity Rule

If two labels appear to refer to the same visual pattern but one is a component family name and the other is a specific blade name, prefer the blade name used in the current deterministic validation payload or the core visual template KB.
