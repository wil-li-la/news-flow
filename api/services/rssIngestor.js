import Parser from 'rss-parser';

const parser = new Parser({
    // rss-parser will pick up media: content, content:encoded, etc. when present
    timeout: 10000
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

function pickImage(entry) {
    const media = entry.enclosure?.url || entry['media: content']?.url;
    const thumb = entry['media: thumbnail']?.url;
    return media || thumb || null;
}

function normalizeEntry(entry, sourceTitle) {
    return {
        id: entry.guid || entry.id || entry.link,
        title: entry.title?.trim() || '(unlisted)',
        url: entry.link,
        source: sourceTitle || new URL(entry.link).hostname,
        description: (entry.contentSnippet || entry.summary || '').trim(),
        imageUrl: pickImage(entry),
        publishedAt: entry.isoDate || entry.pubDate || null
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