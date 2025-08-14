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

router.get('/search', async (req, res) => {
    try {
        const { q: query = '', limit = '20' } = req.query;
        
        if (!query.trim()) {
            return res.json([]);
        }

        const all = await fetchLatestNews();
        const searchTerms = String(query).toLowerCase().split(' ').filter(term => term.length > 1);
        
        const results = all
            .map(article => ({
                ...article,
                relevanceScore: calculateRelevanceScore(article, searchTerms)
            }))
            .filter(article => article.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, Number(limit) || 20);

        res.json(results);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to search news' });
    }
});

function calculateRelevanceScore(article, searchTerms) {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const source = (article.source || '').toLowerCase();
    
    // Search in title (highest weight)
    searchTerms.forEach(term => {
        if (title.includes(term)) {
            score += 3;
        }
    });
    
    // Search in description (medium weight)
    searchTerms.forEach(term => {
        if (description.includes(term)) {
            score += 2;
        }
    });
    
    // Search in source (lower weight)
    searchTerms.forEach(term => {
        if (source.includes(term)) {
            score += 1;
        }
    });
    
    // Exact phrase matching (bonus points)
    const fullQuery = searchTerms.join(' ');
    if (title.includes(fullQuery)) {
        score += 5;
    }
    if (description.includes(fullQuery)) {
        score += 3;
    }
    
    return score;
}
export default router;