import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import newsRouter from './routes/news.js';
import summarizeRouter from './routes/summarize.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/news', newsRouter);
app.use('/api/summarize', summarizeRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('API running on http://localhost:${PORT}'));