import { Router } from 'express';
import { fetchLatestNews } from '../services/rssIngestor.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { limit = '10', seen = '' } = req.query;
        const seenSet = new Set(
            String(seen).split(',').map(s => s.trim()).filter(Boolean)
        );

        const all = await fetchLatestNews()
        const filtered = all.filter(a => !seenSet.has(a.id)).slice(0, Number(limit) || 10);
        res.json(filtered);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

export default router;

// Search endpoint: /api/news/search?q=...&limit=20
router.get('/search', async (req, res) => {
    try {
        const { q = '', limit = '20' } = req.query;
        const query = String(q).trim();
        if (!query) return res.json([]);

        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
        const all = await fetchLatestNews();

        const scored = all.map(a => {
            const hay = `${a.title || ''} ${a.description || ''} ${a.category || ''} ${a.region || ''}`.toLowerCase();
            const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
            return { a, score };
        });

        const out = scored
            .filter(x => x.score > 0)
            .sort((x, y) => y.score - x.score)
            .slice(0, Number(limit) || 20)
            .map(x => x.a);

        res.json(out);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Search failed' });
    }
});
