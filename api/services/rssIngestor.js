import Parser from 'rss-parser';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

const parser = new Parser({
    // rss-parser will pick up media: content, content:encoded, etc. when present
    timeout: 10000,

    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
            ['content:encoded', 'contentEncoded'],
        ],
    },
});

// --- category/region inference helpers ---
const CONTINENT_MAP = {
  usa:'North America', america:'North America', 'u.s.':'North America', canada:'North America', mexico:'North America',
  uk:'Europe', britain:'Europe', england:'Europe', france:'Europe', germany:'Europe', italy:'Europe', spain:'Europe',
  russia:'Europe', ukraine:'Europe', poland:'Europe', sweden:'Europe',
  china:'Asia', india:'Asia', japan:'Asia', korea:'Asia', pakistan:'Asia', taiwan:'Asia', indonesia:'Asia', philippines:'Asia',
  israel:'Middle East', iran:'Middle East', iraq:'Middle East', syria:'Middle East', lebanon:'Middle East', saudi:'Middle East',
  egypt:'Africa', nigeria:'Africa', kenya:'Africa', ethiopia:'Africa',
  brazil:'South America', argentina:'South America', chile:'South America', colombia:'South America', peru:'South America',
  australia:'Oceania', nz:'Oceania', 'new zealand':'Oceania'
};

function inferCategory(entry, feedTitle = '', feedUrl = '') {
  const haystack = [
    ...(Array.isArray(entry.categories) ? entry.categories : [entry.category]).filter(Boolean),
    entry.title || '',
    entry.contentSnippet || '',
    entry.summary || '',
    feedTitle || '',
    entry.link || '',
    feedUrl || ''
  ].join(' ').toLowerCase();

  // Quick keyword buckets
  const tests = [
    { cat: 'World',       re: /\b(world|international|global|ukraine|gaza|israel|europe|asia|africa|americas)\b/ },
    { cat: 'Politics',    re: /\b(politics|election|government|parliament|policy|white house|congress|downing street)\b/ },
    { cat: 'Business',    re: /\b(business|economy|market|company|industry|startup|trade|merger|acquisition)\b/ },
    { cat: 'Finance',     re: /\b(stocks?|markets?|crypto|bank|banking|interest rates?|inflation|fed|treasury|bond)\b/ },
    { cat: 'Technology',  re: /\b(tech|technology|software|hardware|gadget|ai|artificial intelligence|cyber|security|app)\b/ },
    { cat: 'Science',     re: /\b(science|research|space|nasa|astronomy|physics|biology|climate|environment)\b/ },
    { cat: 'Health',      re: /\b(health|medicine|medical|disease|covid|vaccine|drug|mental health)\b/ },
    { cat: 'Sports',      re: /\b(sport|sports|soccer|football|nba|mlb|nfl|tennis|golf|olympic|f1|formula 1)\b/ },
    { cat: 'Entertainment', re: /\b(entertainment|culture|music|movie|film|tv|celebrity)\b/ },
  ];
  for (const t of tests) if (t.re.test(haystack)) return t.cat;

  // Host/path-based routing (strong signals)
  const link = String(entry.link || '').toLowerCase();

  // BBC
  if (/bbc\./.test(link)) {
    if (/\/news\/world/.test(link))       return 'World';
    if (/\/news\/business/.test(link))    return 'Business';
    if (/\/news\/technology/.test(link))  return 'Technology';
    if (/\/news\/science|science-environment/.test(link)) return 'Science';
    if (/\/news\/health/.test(link))      return 'Health';
    if (/\/sport\//.test(link))           return 'Sports';
    if (/\/news\/politics/.test(link))    return 'Politics';
  }

  // NYTimes
  if (/nytimes\.com/.test(link)) {
    if (/\/world\//.test(link))        return 'World';
    if (/\/business\//.test(link))     return 'Business';
    if (/\/technology\//.test(link))   return 'Technology';
    if (/\/science\//.test(link))      return 'Science';
    if (/\/health\//.test(link))       return 'Health';
    if (/\/sports\//.test(link))       return 'Sports';
    if (/\/politics\//.test(link) || /\/us\//.test(link)) return 'Politics';
  }

  // NPR
  if (/npr\.org/.test(link)) {
    if (/\/sections\/(world|asia|europe|africa|americas)\//.test(link)) return 'World';
    if (/\/sections\/(technology|tech)\//.test(link))                   return 'Technology';
    if (/\/sections\/(science|space)\//.test(link))                     return 'Science';
    if (/\/sections\/(business|economy)\//.test(link))                  return 'Business';
    if (/\/sections\/health\//.test(link))                              return 'Health';
    if (/\/sections\/sports\//.test(link))                              return 'Sports';
    if (/\/sections\/politics\//.test(link))                            return 'Politics';
  }

  // The Verge (mostly tech)
  if (/theverge\.com/.test(link)) return 'Technology';

  // Feed-level hints as a last fallback
  const ft = String(feedTitle).toLowerCase();
  if (ft.includes('world'))       return 'World';
  if (ft.includes('technology'))  return 'Technology';
  if (ft.includes('science'))     return 'Science';
  if (ft.includes('business'))    return 'Business';
  if (ft.includes('health'))      return 'Health';
  if (ft.includes('sports'))      return 'Sports';
  if (ft.includes('politics'))    return 'Politics';

  return 'Other';
}


function inferRegionFromText(title = '', desc = '') {
  const text = `${title} ${desc}`.toLowerCase();
  for (const key of Object.keys(CONTINENT_MAP)) {
    if (text.includes(key)) return CONTINENT_MAP[key];
  }
  if (/\b(europe|eu)\b/.test(text)) return 'Europe';
  if (/\b(asia|asian|pacific)\b/.test(text)) return 'Asia';
  if (/\b(africa|african)\b/.test(text)) return 'Africa';
  if (/\b(middle east|gaza|west bank|yemen)\b/.test(text)) return 'Middle East';
  if (/\b(south america|latin america)\b/.test(text)) return 'South America';
  if (/\b(north america)\b/.test(text)) return 'North America';
  if (/\b(australia|oceania)\b/.test(text)) return 'Oceania';
  return 'Global';
}


// crawling the web faces legal issues
// here are some public RSS feed URLs
//    meaning each URL is a channel that publishes many items
// possibly change this later to include more feeds or use a news aggregator API
const FEEDS = [
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://www.npr.org/rss/rss.php?id=1001',
  'https://www.theverge.com/rss/index.xml'
];

let cache = { items: [], lastFetched: 0 };
const CACHE_MS = 1000 * 60 * 5; // 5 minutes

async function fetchWithTimeout(url, opts = {}, ms = 3000) {
  const headers = {
    'user-agent': 'Mozilla/5.0 (NewsFlow Bot) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...(opts.headers || {}),
  };

  const visit = (target, depth = 0) => new Promise((resolve, reject) => {
    if (depth > 3) return reject(new Error('Too many redirects'));
    const u = new URL(target);
    const isHttps = u.protocol === 'https:';
    const reqFn = isHttps ? httpsRequest : httpRequest;

    const req = reqFn({
      method: opts.method || 'GET',
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: (u.pathname || '/') + (u.search || ''),
      headers,
    }, (res) => {
      const status = res.statusCode || 0;
      const loc = res.headers.location;
      if (status >= 300 && status < 400 && loc) {
        // Follow redirect
        const next = new URL(loc, target).href;
        res.resume();
        return resolve(visit(next, depth + 1));
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({
          ok: status >= 200 && status < 300,
          status,
          text: async () => body,
        });
      });
    });
    const timer = setTimeout(() => {
      req.destroy(new Error('timeout'));
    }, ms);
    req.on('error', (err) => reject(err));
    req.on('close', () => clearTimeout(timer));
    // No body needed for GET
    req.end();
  });

  return visit(url);
}



// function pickImage(entry) {
//     const media = entry.enclosure?.url || entry['media: content']?.url;
//     const thumb = entry['media: thumbnail']?.url;
//     return media || thumb || null;
// }

function absoluteUrl(u, base) { try { return new URL(u, base).href; } catch { return null; } }

function firstImgFromHtml(html) {
    if (!html) return null;
    let m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m?.[1]) return m[1];
    m = html.match(/<img[^>]+(?:data-src|data-original)=["']([^"']+)["']/i);
    if (m?.[1]) return m[1];
    m = html.match(/<img[^>]+srcset=["']([^"']+)["']/i);
    if (m?.[1]) return m[1].split(',')[0].trim().split(' ')[0];
    return null;
}

function pickImage(entry, feedUrl) {
    if (entry.enclosure?.url) return absoluteUrl(entry.enclosure.url, feedUrl);

    const mc = Array.isArray(entry.mediaContent) ? entry.mediaContent : (entry.mediaContent ? [entry.mediaContent] : []);
    for (const item of mc) {
        const url = item?.$?.url || item?.url;
        if (url) return absoluteUrl(url, feedUrl);
    }

    const mt = Array.isArray(entry.mediaThumbnail) ? entry.mediaThumbnail : (entry.mediaThumbnail ? [entry.mediaThumbnail] : []);
    if (mt.length) {
        const best = mt
            .map(t => ({ url: t?.$?.url || t?.url, w: parseInt(t?.$?.width || t?.width || '0', 10) || 0}))
            .filter(x => x.url)
            .sort((a, b) => b.w - a.w)[0];
        if (best?.url) return absoluteUrl(best.url, feedUrl);
    }

    const htmlImg =
        firstImgFromHtml(entry.contentEncoded) ||
        firstImgFromHtml(entry['content:encoded']) ||
        firstImgFromHtml(entry.content);
    if (htmlImg) return absoluteUrl(htmlImg, feedUrl);

    return null;
}

async function fetchOgImage(pageUrl, feedUrl) {
    if (!pageUrl) return null;
    try {
        const res = await fetchWithTimeout(pageUrl, {}, 3500);
        if (!res.ok) return null;
        const html = await res.text();
        const matchMeta = (prop, attr = 'property') => {
            const re = new RegExp(`<meta[^>]+${attr}=["']${prop}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
            const m = html.match(re);
            return m?.[1] || null;
        };
        const og = matchMeta('og:image') || matchMeta('twitter:image', 'name');
        return absoluteUrl(og, pageUrl) || absoluteUrl(og, feedUrl);
    } catch (e) {
        return null;
    }
}

// normalizeEntry helpers
function stripHtml(s = '') {
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}



async function normalizeEntry(entry, sourceTitle, feedUrl) {
  const rawDesc =
    entry.contentSnippet ||
    entry.summary ||
    entry.contentEncoded ||
    entry.content ||
    '';

  const description = stripHtml(rawDesc);
  const url = entry.link || null;

  let img = pickImage(entry, feedUrl);
  if (!img && url) {
    img = await fetchOgImage(url, feedUrl);
  }

  return {
    id: entry.guid || entry.id || url || `${feedUrl}#${entry.title || 'untitled'}`,
    title: (entry.title || '(unlisted)').trim(),
    url,
    source: sourceTitle || (url ? new URL(url).hostname : new URL(feedUrl).hostname),
    description,
    imageUrl: img,
    publishedAt: entry.isoDate || entry.pubDate || null,
    category: inferCategory(entry, sourceTitle, feedUrl),
    region: inferRegionFromText(entry.title, description),
  };
}


function dedupeByUrl(items) {
    const seen = new Set();
    return items.filter(x => {
        if (!x.url) return false;
        const key = x.url.split('#')[0];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export async function fetchLatestNews() {
    const now = Date.now();
    if (now - cache.lastFetched < CACHE_MS && cache.items.length) {
        return cache.items;
    }

    const results = [];
    for (const feedUrl of FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);
            const src = feed.title || new URL(feedUrl).hostname;
            for (const item of feed.items || []) {
                results.push(await normalizeEntry(item, src, feedUrl));
            }
        } catch (e) {
            // skip failing feeds
            console.warn('RSS error:', feedUrl, e.message);
        }
    }

    const cleaned = dedupeByUrl(results).sort(
        (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
    );

    cache = { items: cleaned, lastFetched: now };
    return cleaned;
}
