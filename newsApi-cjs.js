const Parser = require('rss-parser');
const { request: httpsRequest } = require('https');
const { request: httpRequest } = require('http');

// Simplified RSS ingestor for Lambda
const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  'https://feeds.bbci.co.uk/news/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://www.npr.org/rss/rss.php?id=1001',
  'https://www.theverge.com/rss/index.xml'
];

let cache = { items: [], lastFetched: 0 };
const CACHE_MS = 1000 * 60 * 5; // 5 minutes

async function fetchLatestNews() {
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
                results.push({
                    id: item.guid || item.id || item.link || `${feedUrl}#${item.title || 'untitled'}`,
                    title: (item.title || '(unlisted)').trim(),
                    url: item.link || null,
                    source: src,
                    description: item.contentSnippet || item.summary || '',
                    imageUrl: item.enclosure?.url || null,
                    publishedAt: item.isoDate || item.pubDate || null,
                    category: 'News',
                    region: 'Global'
                });
            }
        } catch (e) {
            console.warn('RSS error:', feedUrl, e.message);
        }
    }

    const cleaned = results
        .filter(x => x.url)
        .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    cache = { items: cleaned, lastFetched: now };
    return cleaned;
}

exports.handler = async (event) => {
    console.log('Lambda event:', JSON.stringify(event, null, 2));
    console.log('Received path:', event.path, 'method:', event.httpMethod);
    
    try {
        // Handle both API Gateway v1 and v2 event formats
        const httpMethod = event.httpMethod || event.requestContext?.http?.method;
        const path = event.path || event.rawPath || event.requestContext?.http?.path;
        const query = event.queryStringParameters || {};
        
        console.log('Parsed - method:', httpMethod, 'path:', path);
        
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        };
        
        if (httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }
        
        if (httpMethod === 'GET' && (path === '/items' || path === '/prod/items')) {
            const { limit = '10', seen = '' } = query;
            const seenSet = new Set(String(seen).split(',').map(s => s.trim()).filter(Boolean));
            
            console.log('Fetching news with limit:', limit, 'seen:', seenSet.size);
            const all = await fetchLatestNews();
            const filtered = all.filter(a => !seenSet.has(a.id)).slice(0, Number(limit) || 10);
            
            console.log('Returning', filtered.length, 'articles');
            return { statusCode: 200, headers, body: JSON.stringify(filtered) };
        }
        
        if (httpMethod === 'GET' && (path === '/search' || path === '/prod/search')) {
            const { q = '', limit = '20' } = query;
            const searchQuery = String(q).trim();
            
            if (!searchQuery) {
                return { statusCode: 200, headers, body: JSON.stringify([]) };
            }
            
            const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);
            const all = await fetchLatestNews();
            
            const scored = all.map(a => {
                const hay = `${a.title || ''} ${a.description || ''} ${a.category || ''} ${a.region || ''}`.toLowerCase();
                const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
                return { a, score };
            });
            
            const results = scored
                .filter(x => x.score > 0)
                .sort((x, y) => y.score - x.score)
                .slice(0, Number(limit) || 20)
                .map(x => x.a);
            
            return { statusCode: 200, headers, body: JSON.stringify(results) };
        }
        
        return { statusCode: 404, headers, body: JSON.stringify({ message: 'Route not found' }) };
        
    } catch (error) {
        console.error('Lambda error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};