import { Router } from 'express';
import {fetchLatestNews } from '../services/rssIngestor.js';

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