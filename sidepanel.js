// ─────────────────────────────────────────────
// AEM Copilot — Side Panel
// ─────────────────────────────────────────────

const CONFIG = {
  // Direct Line secret is entered in the side panel for this POC and saved to chrome.storage.local.
  // Do not ship this pattern to production. Use a token broker before distribution.
  directLineSecret: '',

  // AEM blade library path
  bladeLibraryPath: '/content/microsoft/bade/en-us/qa-folder/reimagine-component-library/reimagine-blade-library',

  // AEM author host
  aemHost: 'https://golf-author.adobeprod.microsoft.com',
};

// ── State ──
let currentTab = null;
let currentPageUrl = null;
let currentAemJson = null;
let bladeLibrary = [];
let chatStarted = false;

// ── DOM refs ──
const contextIndicator = document.getElementById('context-indicator');
const contextUrl = document.getElementById('context-url');
const analyzeBtn = document.getElementById('analyzeBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusBar = document.getElementById('status-bar');
const chatPlaceholder = document.getElementById('chat-placeholder');
const webchatEl = document.getElementById('webchat');
const libraryList = document.getElementById('library-list');
const libraryStatus = document.getElementById('library-status');
const librarySearch = document.getElementById('librarySearch');
const directLineSecretInput = document.getElementById('directLineSecretInput');
const saveSecretBtn = document.getElementById('saveSecretBtn');


// ── POC secret storage ──
async function loadSavedSecret() {
  try {
    const result = await chrome.storage.local.get(['directLineSecret']);
    const secret = result?.directLineSecret || CONFIG.directLineSecret || '';
    CONFIG.directLineSecret = secret.trim();
    if (directLineSecretInput && CONFIG.directLineSecret) {
      directLineSecretInput.value = CONFIG.directLineSecret;
      setStatus('Direct Line secret loaded for POC');
      setTimeout(() => setStatus(null), 1600);
    }
  } catch (e) {
    console.warn('Unable to load Direct Line secret:', e);
  }
}

async function saveSecretFromInput() {
  const secret = (directLineSecretInput?.value || '').trim();
  if (!secret) {
    setStatus('Paste the Direct Line secret first.', true);
    return;
  }
  CONFIG.directLineSecret = secret;
  await chrome.storage.local.set({ directLineSecret: secret });
  setStatus('Direct Line secret saved for this POC.');
  setTimeout(() => setStatus(null), 1800);
}

saveSecretBtn?.addEventListener('click', saveSecretFromInput);
directLineSecretInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveSecretFromInput();
});

directLineSecretInput?.addEventListener('input', () => {
  CONFIG.directLineSecret = (directLineSecretInput.value || '').trim();
});

// ── Mode tabs ──
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.mode}`).classList.add('active');
  });
});

// ── Utility ──
function setStatus(msg, isError = false) {
  if (!msg) { statusBar.classList.add('hidden'); return; }
  statusBar.textContent = msg;
  statusBar.classList.remove('hidden', 'error');
  if (isError) statusBar.classList.add('error');
}

function slugToTitle(slug) {
  return slug.replace(/---/g, ' — ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isAemPage(url) {
  return url && (
    url.includes('adobeprod.microsoft.com') ||
    (url.includes('microsoft.com') && !url.includes('claude.ai'))
  ) && !url.includes('chrome://') && !url.includes('edge://');
}

// ── Detect current page ──
async function detectPage() {
  try {
    currentTab = await getCurrentTab();
    if (!currentTab?.url || !isAemPage(currentTab.url)) {
      contextUrl.textContent = 'No AEM page detected';
      contextIndicator.className = '';
      analyzeBtn.disabled = true;
      return;
    }
    const url = new URL(currentTab.url);
    const displayUrl = url.pathname.replace(/\.html$/, '');
    contextUrl.textContent = displayUrl;
    contextIndicator.className = 'active';
    analyzeBtn.disabled = false;
    currentPageUrl = currentTab.url;
  } catch (e) {
    console.error('detectPage error:', e);
  }
}

// ── AEM URL helpers ──
function getAemContentPath(pageUrl) {
  const url = new URL(pageUrl);
  let path = url.pathname;
  path = path.replace(/^\/editor\.html/, '');
  path = path.replace(/^\/sites\.html/, '');
  path = path.replace(/\.html$/, '');
  return path;
}

function getAemJsonUrl(pageUrl, selector = 'infinity') {
  const url = new URL(pageUrl);
  const contentPath = getAemContentPath(pageUrl);
  return `${url.origin}${contentPath}.${selector}.json`;
}

// ── Fetch AEM JSON via passive session ──
async function fetchAemJson(pageUrl) {
  const jsonUrl = getAemJsonUrl(pageUrl, 'infinity');
  setStatus('Fetching AEM page infinity JSON…');
  contextIndicator.className = 'loading';
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: async (url) => {
        async function fetchJson(fetchUrl) {
          const res = await fetch(fetchUrl, { credentials: 'include' });

          // AEM can return 300 Multiple Choices for .infinity.json when versioned JSON exists.
          // The body is often an array of paths like page.18.json, page.17.json, etc.
          // Treat 300 as parseable JSON instead of a hard failure.
          if (!res.ok && res.status !== 300) {
            return { error: `HTTP ${res.status} — ${res.statusText}`, status: res.status, url: fetchUrl };
          }

          const text = await res.text();
          try {
            return { data: JSON.parse(text), status: res.status, url: fetchUrl };
          } catch (e) {
            return { error: `Could not parse JSON from ${fetchUrl}: ${e.message}`, status: res.status, body: text.slice(0, 500) };
          }
        }

        function pickHighestVersionPath(paths) {
          if (!Array.isArray(paths)) return null;

          const candidates = paths
            .filter(p => typeof p === 'string')
            .map(p => {
              const match = p.match(/\.(\d+)\.json$/);
              return match ? { path: p, version: Number(match[1]) } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.version - a.version);

          return candidates[0]?.path || null;
        }

        try {
          const first = await fetchJson(url);
          if (first.error) return first;

          const versionPath = pickHighestVersionPath(first.data);

          if (versionPath) {
            const versionUrl = new URL(versionPath, location.origin).href;
            const second = await fetchJson(versionUrl);
            if (second.error) return second;
            return { data: second.data, sourceUrl: versionUrl, versioned: true, versionList: first.data };
          }

          return { data: first.data, sourceUrl: first.url, versioned: false };
        } catch (e) {
          return { error: e.message };
        }
      },
      args: [jsonUrl],
    });
    const result = results?.[0]?.result;
    if (result?.error) throw new Error(result.error);
    if (result?.versioned) {
      console.info('AEM versioned JSON selected:', result.sourceUrl);
      setStatus('✓ Versioned JSON loaded');
    }
    contextIndicator.className = 'active';
    return result.data;
  } catch (e) {
    contextIndicator.className = '';
    throw e;
  }
}

// ── Fetch blade library via passive session ──
async function fetchBladeLibrary() {
  if (bladeLibrary.length > 0) return bladeLibrary;
  libraryStatus.textContent = 'Loading blade library…';
  try {
    const queryUrl = `${CONFIG.aemHost}/bin/querybuilder.json?path=${CONFIG.bladeLibraryPath}&type=cq:Page&p.limit=200&p.hits=selective&p.properties=jcr:path%20jcr:content/jcr:title`;
    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: async (url) => {
        try {
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) return { error: `HTTP ${res.status}` };
          return { data: await res.json() };
        } catch (e) { return { error: e.message }; }
      },
      args: [queryUrl],
    });
    const result = results?.[0]?.result;
    if (result?.error) throw new Error(result.error);
    const hits = result.data?.hits || [];
    bladeLibrary = hits.map(h => ({
      path: h['jcr:path'],
      title: h['jcr:content']?.['jcr:title'] || slugToTitle(h['jcr:path'].split('/').pop()),
      slug: h['jcr:path'].split('/').pop(),
      previewUrl: `${CONFIG.aemHost}/editor.html${h['jcr:path']}.html`,
    }));
    libraryStatus.textContent = `${bladeLibrary.length} blades loaded`;
    renderBladeLibrary(bladeLibrary);
    return bladeLibrary;
  } catch (e) {
    libraryStatus.textContent = `Error: ${e.message}`;
    throw e;
  }
}

// ── Render blade library ──
function renderBladeLibrary(blades) {
  libraryList.innerHTML = '';
  if (!blades.length) {
    libraryList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No blades found</div>';
    return;
  }
  blades.forEach(blade => {
    const item = document.createElement('div');
    item.className = 'blade-item';
    item.innerHTML = `
      <div class="blade-item-name">${blade.title}</div>
      <div class="blade-item-path">${blade.slug}</div>
      <a class="blade-item-link" href="${blade.previewUrl}" target="_blank">Open in AEM ↗</a>
    `;
    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      sendBladeContextToChat(blade);
    });
    libraryList.appendChild(item);
  });
}

// ── Library search ──
librarySearch.addEventListener('input', () => {
  const q = librarySearch.value.toLowerCase().trim();
  if (!q) { renderBladeLibrary(bladeLibrary); return; }
  renderBladeLibrary(bladeLibrary.filter(b =>
    b.title.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
  ));
});

// ── Get Direct Line token using embedded secret ──
async function getDirectLineToken() {
  const secret = (CONFIG.directLineSecret || '').trim();
  if (!secret || secret.includes('YOUR_DIRECT_LINE_SECRET')) {
    throw new Error('Missing Direct Line secret. Paste the POC Direct Line secret and click Save.');
  }
  const res = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const details = await res.text().catch(() => '');
    throw new Error(`Direct Line token generation failed (${res.status}). ${details}`.trim());
  }
  const data = await res.json();
  if (!data.token) throw new Error('No token returned');
  return data.token;
}

// ── Wait for WebChat SDK to load ──
async function waitForWebChat(timeoutMs = 10000) {
  if (window.WebChat) return;
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (window.WebChat) { clearInterval(check); resolve(); }
      if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        reject(new Error('Web Chat SDK failed to load. Check your connection.'));
      }
    }, 100);
  });
}

// ── Start Copilot chat ──
async function startChat(aemJson, pageUrl) {
  chatPlaceholder.style.display = 'none';
  try {
    setStatus('Loading Web Chat SDK…');
    await waitForWebChat();
    const token = await getDirectLineToken();
    const directLine = window.WebChat.createDirectLine({ token });
    const templateName = extractTemplateName(aemJson);
    const openingMessage = buildOpeningMessage(pageUrl, aemJson, templateName);
    let connected = false;
    const store = window.WebChat.createStore(
      {},
      ({ dispatch }) => next => action => {
        if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED' && !connected) {
          connected = true;
          setTimeout(() => {
            dispatch({
              type: 'WEB_CHAT/SEND_MESSAGE',
              payload: { text: openingMessage }
            });
          }, 500);
        }
        return next(action);
      }
    );
    window.WebChat.renderWebChat(
      {
        directLine,
        store,
        userID: 'aem-author',
        username: 'Author',
        styleOptions: {
          backgroundColor: '#0f0f12',
          bubbleBackground: '#17171c',
          bubbleBorderColor: '#2a2a35',
          bubbleBorderRadius: 8,
          bubbleFromUserBackground: '#0078d4',
          bubbleFromUserBorderColor: '#0078d4',
          bubbleFromUserBorderRadius: 8,
          bubbleFromUserTextColor: '#ffffff',
          bubbleTextColor: '#e8e8ed',
          sendBoxBackground: '#17171c',
          sendBoxBorderTop: '1px solid #2a2a35',
          sendBoxTextWrap: true,
          suggestedActionBackground: '#1e1e25',
          suggestedActionBorderColor: '#2a2a35',
          suggestedActionTextColor: '#e8e8ed',
          transcriptTerminatorBackgroundColor: '#0f0f12',
          primaryFont: "'DM Sans', system-ui, sans-serif",
          fontSize: 12,
        }
      },
      webchatEl
    );
    chatStarted = true;
    setStatus(null);
  } catch (e) {
    setStatus(`Chat error: ${e.message}`, true);
    chatPlaceholder.style.display = 'flex';
    chatPlaceholder.querySelector('#placeholder-text').innerHTML =
      `<strong>Error</strong><br>${e.message}`;
  }
}

// ── Send blade context to chat ──
function sendBladeContextToChat(blade) {
  if (!chatStarted) { setStatus('Analyze a page first to start the chat', true); return; }
  document.querySelector('[data-mode="copilot"]').click();
  setStatus(`Blade selected: ${blade.title} — ask Copilot about it`);
}

// ── Extract template metadata from AEM JSON ──
function getPageContent(json) {
  return json?.['jcr:content'] || json;
}

function extractTemplateName(json) {
  const content = getPageContent(json);
  const template = content?.['cq:template'] || json?.['cq:template'] || json?.template || '';
  if (template) return template.split('/').pop();
  return content?.['jcr:title'] || 'Unknown Template';
}

function extractTemplatePath(json) {
  const content = getPageContent(json);
  return content?.['cq:template'] || json?.['cq:template'] || '';
}

function stripHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max = 180) {
  const text = stripHtml(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

// Keys to skip during signal-collection walk. These are pure metadata/styling
// noise. NOTE: do not skip 'image', 'images', 'media', 'metadata', 'badge', or
// 'videoModal' — those are real child nodes that carry blade-relevant fields
// (image filename, video poster, badge variant, etc.). Skipping them was hiding
// signals like 'has interactive demo' and 'has accordion-vertical-item'.
const SKIP_SUMMARY_KEYS = new Set([
  'jcr:primaryType', 'jcr:created', 'jcr:createdBy', 'jcr:lastModified', 'jcr:lastModifiedBy',
  'jcr:mixinTypes', 'jcr:uuid', 'jcr:baseVersion', 'jcr:versionHistory', 'jcr:predecessors',
  'cq:lastModified', 'cq:lastModifiedBy', 'cq:styleIds', 'cq:lastRolledout', 'cq:lastRolledoutBy',
  'cq:annotations', 'customTelemetry', 'linkItemImage'
]);

function walkTree(node, cb, path = '', depth = 0) {
  if (!isObject(node)) return;
  cb(node, path, depth);
  for (const [key, value] of Object.entries(node)) {
    if (SKIP_SUMMARY_KEYS.has(key)) continue;
    if (isObject(value)) walkTree(value, cb, path ? `${path}/${key}` : key, depth + 1);
  }
}

function collectChildSignals(node) {
  const resourceTypes = new Set();
  const componentNames = new Set();
  const ids = new Set();
  const headings = [];
  const ctas = [];

  // Field-level QA data the agent can compare against the blade library.
  const qaFields = {
    images: [],         // { fileReference, alt, isDecorative, serverWidth, serverHeight, serverQuality, viewportTarget }
    videos: [],         // { videoAsset, posterImage, autoPlay, loop, mute }
    actions: [],        // { ctatext, hyperlink, dataBehavior, openInNewTab, styleoption, buttonColor }
    headingsRaw: [],    // first H1/H2/H3 with their tag detected
    componentVariants: [], // { resourceType, variant }
    cqTemplates: [],
    cqStyleIds: new Set(),
  };

  // Specific resource-type flags. Booleans here let classifyBladeCandidate
  // map directly to KB blade names instead of using fuzzy substring matches.
  let hasMedia = false;
  let hasImage = false;
  let hasVideo = false;
  let hasActionGroup = false;
  let hasTabs = false;                  // generic tabs OR tabs-pill-bar
  let hasTabsPillBar = false;           // specifically tabs-pill-bar
  let hasAccordion = false;             // accordion-inpage (FAQ-style)
  let hasAccordionVerticalItem = false; // accordion/v2/accordion-vertical-item — Vertical Tabs signal
  let hasInteractiveDemo = false;       // blade/interactive-demo
  let hasPricing = false;
  let hasCardPlanDetail = false;        // card-plan-detail or list — Pricing signal
  let hasCards = false;
  let hasCarousel = false;
  let carouselVariant = null;           // 'card' | 'mediaBar' | 'default' | ...
  let hasStats = false;
  let hasStatsBlade = false;            // blade/stats/v2/stats specifically
  let hasBannerFeatures = false;        // blade/banner-features
  let hasProductHighlight = false;      // blade/product-highlight
  let hasFilterGrid = false;
  let hasLogoWall = false;
  let hasFaq = false;
  let hasFaqsBlade = false;             // blade/faqs/v2/faqs specifically
  let hasModal = false;
  let hasFootnote = false;              // atomic/footnote
  let hasCtaStacked = false;            // blade/cta-stacked
  let hasTestimonialCard = false;
  let hasH1 = false;
  let hasH2 = false;

  walkTree(node, (child) => {
    const rt = String(child['sling:resourceType'] || child[':type'] || '').toLowerCase();
    const cn = String(child.componentName || '');
    const id = String(child.id || '');
    if (rt) resourceTypes.add(rt);
    if (cn) componentNames.add(cn);
    if (id) ids.add(id);

    // Specific resource-type checks — these are the high-signal blade markers.
    if (rt.includes('blade/interactive-demo')) hasInteractiveDemo = true;
    if (rt.includes('blade/banner-features')) hasBannerFeatures = true;
    if (rt.includes('blade/stats/v2/stats')) hasStatsBlade = true;
    if (rt.includes('blade/product-highlight')) hasProductHighlight = true;
    if (rt.includes('blade/faqs')) hasFaqsBlade = true;
    if (rt.includes('blade/cta-stacked')) hasCtaStacked = true;
    if (rt.includes('atomic/accordion/v2/accordion-vertical-item')) hasAccordionVerticalItem = true;
    if (rt.includes('atomic/accordion-inpage')) hasAccordion = true;
    if (rt.includes('atomic/tabs-pill-bar')) hasTabsPillBar = true;
    if (rt.includes('atomic/tabs/v')) hasTabs = true;
    if (rt.includes('card-plan-detail')) hasCardPlanDetail = true;
    if (rt.includes('atomic/footnote')) hasFootnote = true;
    if (rt.includes('atomic/testimonial-card')) hasTestimonialCard = true;
    if (rt.includes('atomic/carousel')) hasCarousel = true;
    if (rt.includes('atomic/card/v')) hasCards = true;
    if (rt.includes('foundation/modal')) hasModal = true;
    if (rt.includes('foundation/media')) hasMedia = true;
    if (rt.includes('foundation/image')) hasImage = true;

    if (hasTabsPillBar) hasTabs = true;

    // Carousel variant (atomic/carousel exposes a "variant" property: card / mediaBar / default)
    if (rt.includes('atomic/carousel') && typeof child.variant === 'string') {
      carouselVariant = child.variant;
    }

    // Heading tag detection from the rich-text title field
    for (const k of ['title', 'enTitle']) {
      if (typeof child[k] === 'string') {
        const v = child[k];
        if (/<h1[\s>]/i.test(v)) hasH1 = true;
        if (/<h2[\s>]/i.test(v)) hasH2 = true;
        const t = truncate(v, 160);
        if (t && !headings.includes(t) && headings.length < 8) headings.push(t);
      }
    }

    // Field-level QA capture — image authoring fields
    if (rt.includes('foundation/image') && isObject(child.images)) {
      for (const imgKey of Object.keys(child.images)) {
        const img = child.images[imgKey];
        if (!isObject(img)) continue;
        if (qaFields.images.length < 12) {
          qaFields.images.push({
            fileReference: img.fileReference || '',
            alt: img.alt || '',
            isDecorative: img.isDecorative === 'true' || img.isDecorative === true,
            serverWidth: img.serverWidth || '',
            serverHeight: img.serverHeight || '',
            serverQuality: img.serverQuality || '',
            viewportTarget: img.viewportTarget || '',
          });
        }
      }
    }

    // Field-level QA capture — video authoring (cascade-media-player or onecloud-player)
    if ((rt.includes('cascade-media-player') || rt.includes('onecloud-player')) && isObject(child.metadata)) {
      qaFields.videos.push({
        title: child.metadata.title || '',
        description: child.metadata.description || '',
        videoAsset: child.metadata.videoAsset?.fileReference || '',
        posterImage: child.metadata.posterImageAsset?.fileReference || '',
        autoplay: child.options?.autoplay || '',
        loop: child.options?.loop || '',
        mute: child.options?.mute || '',
      });
    }

    // Field-level QA capture — actions / CTAs
    if (rt.includes('foundation/action/v')) {
      if (qaFields.actions.length < 16) {
        qaFields.actions.push({
          ctatext: child.ctatext || '',
          hyperlink: child.hyperlink || '',
          dataBehavior: child.dataBehavior || '',
          openInNewTab: child.openInNewTab || '',
          styleoption: child.styleoption || '',
          buttonColor: child.buttonColor || '',
          isDisabled: child.isDisabled || '',
        });
      }
      hasActionGroup = true;
      const t = truncate(child.ctatext || child.enCtatext || '', 80);
      if (t && !ctas.includes(t) && ctas.length < 8) ctas.push(t);
    }
    if (rt.includes('foundation/action-group')) hasActionGroup = true;

    // Component variants (e.g. block-feature variant=stacked-list, section-master variant=2-column)
    if (rt && typeof child.variant === 'string' && qaFields.componentVariants.length < 20) {
      qaFields.componentVariants.push({ resourceType: rt, variant: child.variant });
    }

    // Style IDs
    if (Array.isArray(child['cq:styleIds'])) {
      for (const sid of child['cq:styleIds']) qaFields.cqStyleIds.add(String(sid));
    }
  });

  // Other heuristic flags
  for (const rt of resourceTypes) {
    if (rt.includes('logo')) hasLogoWall = true;
    if (rt.includes('faq')) hasFaq = true;
    if (rt.includes('filter')) hasFilterGrid = true;
    if (rt.includes('stats')) hasStats = true;
  }
  if (hasFaqsBlade) hasFaq = true;
  if (hasCardPlanDetail) hasPricing = true;
  if (hasStatsBlade) hasStats = true;

  return {
    resourceTypes: [...resourceTypes].slice(0, 30),
    componentNames: [...componentNames].slice(0, 12),
    ids: [...ids].slice(0, 12),
    headings,
    ctas,
    hasMedia, hasImage, hasVideo, hasActionGroup,
    hasTabs, hasTabsPillBar, hasAccordion, hasAccordionVerticalItem,
    hasInteractiveDemo,
    hasPricing, hasCardPlanDetail,
    hasCards, hasCarousel, carouselVariant,
    hasStats, hasStatsBlade,
    hasBannerFeatures, hasProductHighlight,
    hasFilterGrid, hasLogoWall,
    hasFaq, hasFaqsBlade, hasModal,
    hasFootnote, hasCtaStacked, hasTestimonialCard,
    hasH1, hasH2,
    qaFields: {
      images: qaFields.images,
      videos: qaFields.videos,
      actions: qaFields.actions,
      componentVariants: qaFields.componentVariants,
      cqStyleIds: [...qaFields.cqStyleIds].slice(0, 20),
    },
  };
}

function classifyBladeCandidate(node, signals, index, ctx = {}) {
  const matcher = window.AEMBladeMatcher;
  const rt = String(node['sling:resourceType'] || node[':type'] || '');
  const id = String(node.id || '');
  const variant = node.variant || '';

  const candidates = [];
  function add(name, confidence, note, via) {
    if (!name) return;
    if (!candidates.some(c => c.officialBladeName === name)) {
      candidates.push({ officialBladeName: name, confidence, note, via });
    }
  }

  if (!matcher) {
    // Matcher not loaded — fall back to "needs review" rather than guess.
    if (rt || node.componentName) {
      add('? Unable to Confirm', 'low', `Matcher not loaded; raw resource type: ${rt || '(none)'}`, 'fallback');
    }
    return candidates;
  }

  // Step 1: direct resource-type lookup against KB-derived map.
  // Skips wrappers (section-master) and foundation-only types automatically.
  const isSectionMaster = rt.includes('section-master');
  if (!isSectionMaster) {
    const direct = matcher.matchByResourceType(rt);
    if (direct) {
      add(direct.blade, direct.confidence, direct.note, direct.via);
      return candidates;
    }
  }

  // Step 2: section-master wrapper — apply child-signal rules.
  if (isSectionMaster) {
    const ruleCtx = {
      index,
      isFirstSection: index <= 1,
      sectionId: id,
      sectionVariant: variant,
      headings: signals.headings,
      ...ctx,
    };
    const matches = matcher.matchSectionMaster(signals, ruleCtx);
    for (const m of matches) {
      add(m.blade, m.confidence, m.note, m.via);
    }
    if (candidates.length > 0) return candidates;
  }

  // Step 3: nothing matched but the node has structural content. Do not invent
  // a name — per KB anti-hallucination rules, mark as Unable to Confirm.
  if (rt || node.componentName) {
    add(
      '? Unable to Confirm',
      'low',
      `No KB rule matched. Resource type: ${rt || '(none)'}. Headings: ${signals.headings.slice(0, 2).join(' | ') || '(none)'}.`,
      'fallback'
    );
  }

  return candidates;
}

function getMainResponsiveGrid(content) {
  return content?.root?.layout_container?.responsivegrid ||
    content?.root?.responsivegrid?.layout_container?.responsivegrid ||
    content?.root?.responsivegrid ||
    content?.root?.layout_container ||
    content?.root || null;
}

// A node is a viable blade-bearing entry only if it has:
//   - a sling:resourceType, OR
//   - a recognizable componentName / non-empty content
// Empty stubs like { jcr:primaryType: nt:unstructured } at grid root must be filtered.
// foundation/modal at grid root is also filtered — KB says modals are supporting
// functionality for a Hero/media experience, never a top-level blade.
function isViableGridChild(value, key) {
  if (!isObject(value)) return false;
  if (!value['sling:resourceType'] && !value[':type'] && !value.componentName) {
    // Empty modal stubs and similar — { jcr:primaryType: 'nt:unstructured' } only.
    const realKeys = Object.keys(value).filter(k => k !== 'jcr:primaryType');
    if (realKeys.length === 0) return false;
  }
  const k = (key || '').toLowerCase();
  const rt = String(value['sling:resourceType'] || value[':type'] || '').toLowerCase();

  // Per KB Modal Rule: foundation/modal is supporting functionality, not a blade.
  if (rt.includes('foundation/modal')) return false;

  // Only include keys that look structural (sections, banners, navs, footnotes, utility).
  const isStructural =
    rt.includes('section-master') ||
    rt.includes('blade/') ||
    rt.includes('utility-container') ||
    rt.includes('atomic/footnote') ||
    k.includes('section') ||
    k.includes('nav') ||
    k.includes('banner') ||
    k.includes('footnote') ||
    k.includes('utility');
  return isStructural;
}

// Walk an EXPANDABLE container (e.g. Secondary Sticky Nav) and yield the
// section-masters inside its main-slot parsys. These are the real page sections.
function expandContainerSections(containerNode) {
  // Secondary Sticky Nav v3: container.{secondary-nav-section}.{section_master_*}
  // Generic section-master: container.main-slot.{section_master_*} or container.parsys.{section_master_*}
  const candidatesParsys = [
    containerNode['secondary-nav-section'],
    containerNode['main-slot'],
    containerNode['mainSlot'],
    containerNode.parsys,
  ].filter(isObject);

  const sections = [];
  for (const parsys of candidatesParsys) {
    for (const [k, v] of Object.entries(parsys)) {
      if (!isObject(v)) continue;
      const rt = String(v['sling:resourceType'] || v[':type'] || '').toLowerCase();
      if (rt.includes('section-master') || rt.includes('blade/')) {
        sections.push([k, v]);
      }
    }
  }
  return sections;
}

// Grid-root node names that should be expanded, not treated as a single blade.
// Secondary Sticky Nav contains a parsys of section-masters that are the real blades.
// We surface the nav itself as one blade entry AND walk its children separately.
const EXPANDABLE_CONTAINER_KEY_PATTERNS = ['secondary_sticky_nav', 'secondary-sticky-nav'];

function isExpandableContainerKey(key) {
  if (!key) return false;
  const k = key.toLowerCase();
  return EXPANDABLE_CONTAINER_KEY_PATTERNS.some(p => k.includes(p));
}

// Wrapper resource types that are layout chrome, not blades.
// Foundation-only types come from the KB at runtime.
const ALWAYS_WRAPPER_TYPES = [
  'utility-container/v1/utility-container',
  'wcm/foundation/components/parsys',
  'wcm/foundation/components/responsivegrid',
  'experiencefragment/v1/experiencefragment',
];

function isWrapperResourceType(rt) {
  if (!rt) return false;
  const lower = rt.toLowerCase();
  if (ALWAYS_WRAPPER_TYPES.some(w => lower.includes(w))) return true;
  // section-master is special: it's a wrapper but the inventory still classifies
  // it via section-master rules. We do NOT want isWrapperResourceType to skip it.
  return false;
}

function buildBladeInventory(aemJson, pageUrl) {
  const content = getPageContent(aemJson);
  const contentPath = getAemContentPath(pageUrl);
  const grid = getMainResponsiveGrid(content);
  const items = [];

  if (!grid) return items;

  // Build the flat ordered list of (nodeName, node, parentPath) we want to inventory.
  // Pass 1: top-level grid children, but DESCEND into expandable containers (Secondary Sticky Nav).
  const orderedNodes = [];
  const gridEntries = Object.entries(grid).filter(([k, v]) => isViableGridChild(v, k));

  for (const [key, node] of gridEntries) {
    // Always surface the container itself as one entry (so the agent sees the nav).
    orderedNodes.push({
      key,
      node,
      aemPath: `${contentPath}/jcr:content/root/layout_container/responsivegrid/${key}`,
      parentKey: null,
    });

    // If this is an expandable container (Secondary Sticky Nav), descend and add
    // each child section-master as its own inventory entry. Without this, all
    // page sections were being absorbed into a single nav entry.
    if (isExpandableContainerKey(key)) {
      const innerSections = expandContainerSections(node);
      for (const [innerKey, innerNode] of innerSections) {
        orderedNodes.push({
          key: innerKey,
          node: innerNode,
          aemPath: `${contentPath}/jcr:content/root/layout_container/responsivegrid/${key}/secondary-nav-section/${innerKey}`,
          parentKey: key,
        });
      }
    }
  }

  // Pass 2: classify each entry, skipping wrapper-only entries (utility_container)
  // unless they expose a real blade as their primary identity.
  orderedNodes.forEach((entry, index) => {
    const { key, node, aemPath, parentKey } = entry;
    const rt = String(node['sling:resourceType'] || node[':type'] || '');

    // Suppress pure layout wrappers — utility_container is the footer chrome,
    // not a blade. Empty modal stubs are similarly suppressed by the viable check above.
    if (isWrapperResourceType(rt)) {
      // utility-container, parsys, etc. — skip silently.
      return;
    }

    const signals = collectChildSignals(node);
    const candidates = classifyBladeCandidate(node, signals, index, { parentKey });

    items.push({
      order: items.length + 1,
      nodeName: key,
      parentNodeName: parentKey,
      aemPath,
      resourceType: rt,
      componentName: node.componentName || '',
      id: node.id || '',
      sectionVariant: node.variant || '',
      candidateBlades: candidates,
      evidence: {
        headings: signals.headings,
        ctas: signals.ctas,
        componentNames: signals.componentNames,
        keyChildResourceTypes: signals.resourceTypes,
        flags: {
          hasMedia: signals.hasMedia,
          hasImage: signals.hasImage,
          hasVideo: signals.hasVideo,
          hasActionGroup: signals.hasActionGroup,
          hasTabs: signals.hasTabs,
          hasTabsPillBar: signals.hasTabsPillBar,
          hasAccordion: signals.hasAccordion,
          hasAccordionVerticalItem: signals.hasAccordionVerticalItem,
          hasInteractiveDemo: signals.hasInteractiveDemo,
          hasPricing: signals.hasPricing,
          hasCardPlanDetail: signals.hasCardPlanDetail,
          hasCards: signals.hasCards,
          hasCarousel: signals.hasCarousel,
          carouselVariant: signals.carouselVariant,
          hasStats: signals.hasStats,
          hasStatsBlade: signals.hasStatsBlade,
          hasBannerFeatures: signals.hasBannerFeatures,
          hasProductHighlight: signals.hasProductHighlight,
          hasFilterGrid: signals.hasFilterGrid,
          hasLogoWall: signals.hasLogoWall,
          hasFaq: signals.hasFaq,
          hasFaqsBlade: signals.hasFaqsBlade,
          hasModal: signals.hasModal,
          hasFootnote: signals.hasFootnote,
          hasCtaStacked: signals.hasCtaStacked,
          hasTestimonialCard: signals.hasTestimonialCard,
          hasH1: signals.hasH1,
          hasH2: signals.hasH2,
        },
        qaFields: signals.qaFields,
      },
    });
  });

  return items;
}

function buildPageAnalysisPayload(pageUrl, aemJson) {
  const content = getPageContent(aemJson);
  const templatePath = extractTemplatePath(aemJson);
  const inventory = buildBladeInventory(aemJson, pageUrl);

  const payload = {
    pageUrl,
    aemContentPath: getAemContentPath(pageUrl),
    cqTemplate: templatePath,
    templateName: templatePath ? templatePath.split('/').pop() : 'Unknown Template',
    pageType: content?.pageType || '',
    pageTitle: content?.pageTitle || content?.['jcr:title'] || '',
    jcrDescription: content?.['jcr:description'] || '',
    detectedBladeInventory: inventory,
    inventoryNotes: [
      'Inventory is deterministic. officialBladeName values are KB-canonical — derived from AEM_Component_Mapping.md and validated against the KB known-blades list.',
      'Visual template is inferred from the detected blade composition first. cqTemplate is fallback/tiebreaker context only because PDP3 can be a catch-all AEM chassis.',
      'Section-master wrappers are classified by inspecting child structure per the KB section-master rule, never by surface signals alone.',
    ],
  };

  if (window.AEMTemplateInferrer) {
    payload.templateInference = window.AEMTemplateInferrer.inferTemplate(payload);
  }

  if (window.AEMVisualTemplateReferences) {
    payload.visualTemplateReferences = {
      source: window.AEMVisualTemplateReferences.source,
      coreTemplates: window.AEMVisualTemplateReferences.getCoreReferenceSummary(),
    };
  }

  if (window.AEMBladeValidator) {
    payload.deterministicValidation = window.AEMBladeValidator.validateInventory(payload);
  }

  // Surface the KB metadata so the agent knows what version of the KB the
  // extension was built against.
  if (window.AEMKBData) {
    payload.kbInfo = {
      source: window.AEMKBData.source,
      generatedAt: window.AEMKBData.generatedAt,
      knownBladeCount: (window.AEMKBData.knownBladeNames || []).length,
    };
  }

  return payload;
}

// ── Build opening context message ──
function buildAgentPayload(payload) {
  const clone = JSON.parse(JSON.stringify(payload));

  if (clone.templateInference) {
    delete clone.templateInference.scores;
    delete clone.templateInference.anchorsByTemplate;
  }
  if (clone.deterministicValidation?.templateResolution) {
    delete clone.deterministicValidation.templateResolution.scores;
    delete clone.deterministicValidation.templateResolution.anchorsByTemplate;
  }

  return clone;
}

function buildOpeningMessage(pageUrl, aemJson, templateName) {
  const payload = buildPageAnalysisPayload(pageUrl, aemJson);
  const agentPayload = buildAgentPayload(payload);
  return `I'm reviewing this AEM page. The extension has already done deterministic KB matching. Use the payload below as the starting point and apply the uploaded KB rules for nuance.

How to read the payload:
1. Template detection is based on blade composition first. cqTemplate is fallback/tiebreaker context only because PDP3 can be a catch-all AEM chassis. If deterministicValidation.unableToConfirmTemplate is true, follow the KB rule and respond: "? Unable to Confirm — Template cannot be confidently identified from the provided JSON summary."
2. detectedBladeInventory contains officialBladeName values that are KB-canonical (matched against AEM_Component_Mapping.md and validated against the KB blade list). Use them verbatim. Do NOT paraphrase or pluralize.
3. visualTemplateReferences contains the core PNG-backed Frontify templates and label mappings. Use those names when reconciling visual template anatomy.
4. deterministicValidation.present / possibleQaIssues / missing / ruleViolations / optionalAvailable / extras / unableToConfirm are already classified by template. Build your output sections from these.
5. For Optional Blades Available, use deterministicValidation.optionalAvailable exactly. If it is empty, say there are no optional blades available from the selected template.
6. Do not recommend blades from non-selected templates, visualTemplateReferences, or alternate inference candidates as optional enhancements.

Reporting rules (from KB Author_Output_Style and QA_Governance):
- Use the four KB statuses verbatim: ✓ Present, ⚠ Possible QA Issue, ✕ Missing, ? Unable to Confirm.
- For Possible QA Issue items, format: "⚠ Possible QA Issue — Closely resembles [Official Blade Name]" and recommend QA review, not duplication.
- Do not expose raw AEM node names, sling:resourceType, or component names in author output unless the user asks for technical detail.
- Per KB anti-hallucination rules: do not invent blade names, templates, or rules not in the validation output or knownBladeNames.
- If validation.extras contains a blade that isn't in any template list, mention it but do not flag as an error — it may be intentional optional content.
- Apply ruleViolations entries verbatim under "Violations / Possible QA Issues".

Page analysis payload:
${JSON.stringify(agentPayload, null, 2)}

Respond with this structure (from KB Author_Output_Style):
1. Template Detected (with confidence)
2. Required Blades Status (table: Required Blade | Status | Notes)
3. Optional Blades Present
4. Optional Blades Available
5. Violations / Possible QA Issues
6. Recommended Actions`;
}

// ── Legacy summary fallback, not used for primary agent prompt ──
function summarizeAemJson(json) {
  if (!json) return 'No JSON available';
  try {
    return JSON.stringify(buildPageAnalysisPayload(currentPageUrl || location.href, json), null, 2);
  } catch (e) {
    return JSON.stringify(json).slice(0, 6000);
  }
}

// ── Main analyze flow ──
analyzeBtn.addEventListener('click', async () => {
  if (!currentPageUrl) return;
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = '…';
  try {
    setStatus('Fetching page JSON…');
    currentAemJson = await fetchAemJson(currentPageUrl);
    setStatus(`✓ JSON loaded — ${Object.keys(currentAemJson).length} nodes`);
    fetchBladeLibrary().catch(e => console.warn('Blade library fetch failed:', e));
    setStatus('Connecting to Copilot…');
    if (!chatStarted) await startChat(currentAemJson, currentPageUrl);
    setStatus(null);
  } catch (e) {
    setStatus(`Error: ${e.message}`, true);
    console.error('Analyze error:', e);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze';
  }
});

// ── Refresh ──
refreshBtn.addEventListener('click', async () => {
  currentAemJson = null;
  chatStarted = false;
  bladeLibrary = [];
  webchatEl.innerHTML = '';
  libraryList.innerHTML = '';
  libraryStatus.textContent = 'Not loaded — click Analyze first';
  chatPlaceholder.style.display = 'flex';
  chatPlaceholder.querySelector('#placeholder-text').innerHTML =
    'Click <strong>Analyze</strong> to load this page\'s context and start a conversation with your AEM Copilot.';
  setStatus(null);
  await detectPage();
});

// ── Init ──
loadSavedSecret().finally(() => detectPage());
chrome.tabs.onActivated.addListener(() => detectPage());
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') detectPage();
});
