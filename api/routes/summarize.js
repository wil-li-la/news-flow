// this file mounts the summarize route

import { Router } from 'express';
import { summarizeNews } from '../services/aiSummary.js';

const router = Router();
router.post('/', async (req, res) => {
    try {
        const { title, text, maxWords = 120 } = req.body || {};
        const out = await summarizeNews({ title, text, maxWords });
        res.json(out);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;
