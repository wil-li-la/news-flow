import Parser from 'rss-parser';

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

function normalizeEntry(entry, sourceTitle, feedUrl) {
  return {
    id: entry.guid || entry.id || entry.link,
    title: entry.title?.trim() || '(unlisted)',
    url: entry.link || null,
    source: sourceTitle || (entry.link ? new URL(entry.link).hostname : new URL(feedUrl).hostname),
    description: (
      entry.contentSnippet ||
      entry.summary ||
      stripHtml(entry.contentEncoded || entry.content) ||
      ''
    ).trim(),
    imageUrl: pickImage(entry, feedUrl),
    publishedAt: entry.isoDate || entry.pubDate || null,
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
                results.push(normalizeEntry(item, src));
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