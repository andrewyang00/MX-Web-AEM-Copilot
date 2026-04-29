# Visual Template Core KB

Source: Frontify scrape + exported PNG annotation boards, April 2026

Purpose: Use this document to ground AEM Copilot in the core visual templates represented by the exported PNG boards. These rules complement the authoritative Reimagine Copilot KB. They do not replace QA governance or authoring rules.

## How to Use

- Use blade composition and visual anatomy as the primary signal for template identification.
- Use `cq:template` only as fallback or tiebreaker context.
- Treat AEM PDP3 / `product-detail-3` as a flexible chassis. It can host different visual template patterns.
- Use the surfaced names in this document when reporting to authors.
- Use PNG annotation labels only as aliases when reconciling visual boards to official names.

## Core PNG-Backed Templates

### Product Home Page

Frontify template: Reimagine Product Home Page

PNG boards:
- Template - Azure Home.png
- Template - Cloud Home - Annotations.png

Goal: Introduce, demonstrate, and validate product or cloud platform capabilities, then guide users toward deeper product exploration or purchase paths.

Required blades:
- Hero - Slim
- Secondary Sticky Navigation
- CTA Stacked
- Cards - Featured
- Impact - Vertical Tabs
- Card Grid
- Impact - Media Demo

Optional blades:
- Banner - Featured
- Banner - CTA
- Stats - Data Tiles
- Carousel - Card Grid
- Features - Pricing

Rules:
- Hero module is required.
- Sub-navigation is required.
- Next Steps module is required.
- Order of components can be changed.
- Cannot have more than one Hero.
- Cannot have more than one CTA Stacked / Next Steps module.

PNG label mappings:
- Hero - Product -> Hero - Slim
- Secondary Nav -> Secondary Sticky Navigation
- Card Grid - Featured -> Cards - Featured
- High Impact - Product Attention -> Impact - Vertical Tabs
- Card Grid - Products -> Card Grid
- High Impact - Media Demo -> Impact - Media Demo
- Banner - CTA Banner -> Banner - CTA
- Stats - Data With Icon -> Stats - Data Tiles
- Carousel - Case Study -> Carousel - Card Grid

### Product Detail Page

Frontify template: Reimagine Product Detail Page (PDP)

PNG board:
- Template - PDP - Annotations.png

Goal: Define and demonstrate a product and its key features to influence evaluation and purchase.

Required blades:
- Hero - Slim
- Secondary Sticky Navigation
- CTA Stacked
- Impact - Vertical Tabs
- Features - Pricing

Optional blades:
- Impact - Media Demo
- Stats - Data with Icon
- Banner - Featured
- Carousel - Card Grid
- FAQ

Rules:
- Hero blade is required.
- In-page navigation should be present.
- Next Steps / CTA Stacked is required.
- Cannot have more than one Hero.
- Cannot have more than one CTA Stacked / Next Steps module.
- Features Grid may substitute for Interactive Demo if no feature videos exist.

### Product Detail 3

Frontify template: Product Detail 3 (BizApps)

PNG board:
- Template - PDP - Annotations.png

Goal: Validate and demonstrate product features and guide the customer to purchase. This is a visual pattern, not a strict AEM chassis rule.

Required blades:
- Hero - Slim
- Secondary Sticky Navigation
- Impact - Vertical Tabs
- Features - Pricing
- Cards - Logo Wall
- CTA Stacked

Optional blades:
- Features - Product Highlight
- Stats - Featured
- Carousel - Card Grid

Rules:
- Hero blade is required.
- Sub-navigation is required.
- Next Steps module is required.
- Cannot have more than one Hero.
- Cannot have more than one CTA Stacked / Next Steps module.

### Product Category Landing

Frontify template: Product Category Landing

PNG board:
- Template - Product Category Landing.png

Goal: Help customers identify the right product or path within a product family.

Required blades:
- Hero - Slim
- Secondary Sticky Navigation
- Features - Product Highlight
- Search - Filter Grid
- Carousel - Card Grid

Optional blades:
- Impact - Vertical Tabs
- Features - Pricing Comparison
- Stats - Data Tiles

Rules:
- Hero blade is required.
- Secondary navigation is required.
- Category pages should help users find the right product or path.
- Cannot have more than one Hero.

### Product Solutions Landing

Frontify template: Product Solution Landing

PNG board:
- Template - Solution Landing.png

Goal: Educate visitors on how a combination of products and services can help customers achieve specific business outcomes.

Required blades:
- Hero - Slim
- Secondary Sticky Navigation
- Impact - Vertical Tabs
- Cards - Logo Wall
- Carousel - Card Grid
- Features - Pricing

Optional blades:
- Features - Product Highlight
- Banner - Featured
- Stats - Data Tiles
- FAQ

Rules:
- Hero module is required.
- Sub-navigation is required.
- Next Steps module is required.
- Use solution-oriented content and routing.
- Cannot have more than one Hero.
- Cannot have more than one CTA Stacked / Next Steps module.

### Solution Center

Frontify template: Solution Center (B2B Hub)

PNG board:
- Template - Solution Center.png

Goal: Enable customers to explore and discover relevant Microsoft solutions and connect them to relevant solution paths.

Required blades:
- Hero - Featured Cards Carousel
- Carousel - Card Grid
- Impact - Vertical Tabs
- Stats - Featured
- Cards - Featured Grid
- CTA Stacked

Optional blades:
- Banner - Featured
- Stats - Data Tiles
- Carousel - Card Grid

Rules:
- Hero module is required.
- Next Steps module is required.
- Filtering should update relevant card blades when applicable.
- When filtered results exceed expected visible rows, a Load More CTA should appear.
- Cannot have more than one Hero.
- Cannot have more than one CTA Stacked / Next Steps module.

### Solution Category Landing

Frontify template: Solution Center Category Landing (B2B Hub)

PNG board:
- Template - Solution Category Landing - Annotations.png

Goal: Help customers discover relevant solutions based on category selection and connect them to solution detail paths.

Required blades:
- Hero - Slim
- Search - Filter Grid
- Card Grid
- Carousel - Card Grid
- Features - Product Highlight
- Banner - Featured
- CTA Stacked

Optional blades:
- Carousel - Card Grid

Rules:
- Hero module is required.
- Next Steps module is required.
- Order of components can be changed.
- Filter updates all 3-up card blades and supports multiple selections.
- Cannot have more than one Hero.
- Cannot have more than one CTA Stacked / Next Steps module.

## Reporting Guidance

When a detected section visually matches a PNG annotation label, report the surfaced blade name, not the annotation label. Example: report `Impact - Vertical Tabs`, not `High Impact - Product Attention`.

When a page uses AEM `product-detail-3`, do not assume Product Detail 3 from the technical template alone. Infer the visual template from detected blades and visual structure.
