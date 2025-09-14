import { KeywordCluster, KnowledgeSeries, NewsArticle, SwipeAction, TimelineEvent } from '../types';

export const extractKeywords = (text: string): string[] => {
  const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during','before','after','above','below','between','among','this','that','these','those','new','news','today','now']);
  const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stop.has(w) && !/^\d+$/.test(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([w])=>w);
};

export const extractEntities = (text: string): string[] => {
  const entities = new Set<string>();
  const companyRe = /\b(?:Apple|Google|Microsoft|Amazon|Meta|Tesla|NVIDIA|OpenAI|ChatGPT|SpaceX|Netflix|Uber|Airbnb|Bitcoin|Ethereum)\b/gi;
  const personRe = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
  const regionRe = /\b(?:United\s+States|China|Japan|Germany|France|United\s+Kingdom|India|Brazil|Russia|Canada|Australia|Europe|Asia|Africa|Middle\s+East)\b/gi;
  const matches = (re: RegExp) => {
    const m = text.match(re);
    if (m) m.forEach(x => entities.add(x.trim()));
  };
  matches(companyRe); matches(personRe); matches(regionRe);
  return Array.from(entities);
};

export const generateKeywordClusters = (swipes: SwipeAction[]): KeywordCluster[] => {
  const keywordMap: Record<string, { articles: NewsArticle[]; sentiment: ('positive'|'negative')[] }> = {};
  for (const s of swipes) {
    const article = s.article;
    const sentiment = s.direction === 'right' ? 'positive' : 'negative';
    const text = `${article.title} ${article.summary ?? article.description ?? ''}`;
    const keywords = [...extractKeywords(text), ...extractEntities(text)];
    for (const k of keywords) {
      if (!keywordMap[k]) keywordMap[k] = { articles: [], sentiment: [] };
      if (!keywordMap[k].articles.find(a => a.id === article.id)) {
        keywordMap[k].articles.push(article);
        keywordMap[k].sentiment.push(sentiment);
      }
    }
  }
  const clusters: KeywordCluster[] = Object.entries(keywordMap)
    .filter(([,v]) => v.articles.length >= 2)
    .map(([keyword, v]) => {
      const pos = v.sentiment.filter(s => s === 'positive').length;
      const neg = v.sentiment.filter(s => s === 'negative').length;
      const sentiment: 'positive'|'negative'|'mixed' = pos > neg * 1.5 ? 'positive' : neg > pos * 1.5 ? 'negative' : 'mixed';
      return {
        id: `cluster-${keyword}`,
        keyword,
        articles: v.articles,
        sentiment,
        frequency: v.articles.length,
        lastUpdated: new Date().toISOString(),
        relatedKeywords: findRelatedKeywords(keyword, keywordMap)
      };
    });
  return clusters;
};

function findRelatedKeywords(target: string, map: Record<string, { articles: NewsArticle[]; sentiment: ('positive'|'negative')[] }>) {
  const targetIds = new Set(map[target].articles.map(a => a.id));
  const rel: { k: string; o: number }[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (k === target) continue;
    const overlap = v.articles.filter(a => targetIds.has(a.id)).length;
    if (overlap > 0) rel.push({ k, o: overlap });
  }
  return rel.sort((a,b)=>b.o-a.o).slice(0,5).map(x=>x.k);
}

export const generateKnowledgeSeries = (clusters: KeywordCluster[]): KnowledgeSeries[] => {
  const series: KnowledgeSeries[] = [];
  const potentials = clusters.filter(c => c.frequency >= 3 && (c.sentiment === 'positive' || c.sentiment === 'mixed'));
  for (const c of potentials) {
    const timeline: TimelineEvent[] = c.articles
      .filter(a => !!a.publishedAt)
      .sort((a,b)=> new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime())
      .map(a => ({ id: `event-${a.id}`, date: a.publishedAt, title: a.title, summary: a.summary, articleId: a.id, importance: calculateImportance(a, c.articles) }));
    series.push({
      id: `series-${c.id}`,
      title: generateSeriesTitle(c.keyword, c.articles),
      description: generateSeriesDescription(c),
      keywords: [c.keyword, ...c.relatedKeywords],
      articles: c.articles,
      timeline,
      category: getMostCommonCategory(c.articles),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return series.sort((a,b)=> b.articles.length - a.articles.length);
};

function calculateImportance(a: NewsArticle, all: NewsArticle[]) {
  let imp = 0.5;
  const dates = all.map(x => new Date(x.publishedAt || 0).getTime());
  const latest = Math.max(...dates, 1);
  const recency = new Date(a.publishedAt || 0).getTime() / latest;
  if (Number.isFinite(recency)) imp += recency * 0.3;
  const words = a.title.split(' ').length;
  const avg = all.reduce((s,x)=> s + x.title.split(' ').length, 0) / Math.max(all.length,1);
  if (words > avg) imp += 0.2;
  return Math.min(1, imp);
}

function generateSeriesTitle(keyword: string, articles: NewsArticle[]) {
  const caps = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  const cats = Array.from(new Set(articles.map(a => a.category))).filter(Boolean) as string[];
  const main = cats[0];
  if (articles.length >= 5) return `The ${caps} Chronicles`;
  if (main === 'Technology') return `${caps} Tech Evolution`;
  if (main === 'Politics') return `${caps} Political Timeline`;
  if (main === 'Finance') return `${caps} Market Journey`;
  return `${caps} Story`;
}

function generateSeriesDescription(c: KeywordCluster) {
  const { keyword, articles, sentiment } = c;
  const timeSpan = getTimeSpan(articles);
  const cats = Array.from(new Set(articles.map(a => a.category))).filter(Boolean) as string[];
  let d = `A collection of ${articles.length} articles about ${keyword} spanning ${timeSpan}. `;
  d += cats.length === 1 ? `Focused on ${cats[0].toLowerCase()} developments. ` : `Covering ${cats.join(', ').toLowerCase()} topics. `;
  d += sentiment === 'positive' ? 'Generally positive coverage and developments.' : sentiment === 'negative' ? 'Highlighting challenges and concerns.' : 'Mixed perspectives and balanced coverage.';
  return d;
}

function getTimeSpan(articles: NewsArticle[]) {
  if (articles.length < 2) return 'recent time';
  const dates = articles.map(a => new Date(a.publishedAt || 0).getTime()).sort((a,b)=>a-b);
  const earliest = new Date(dates[0]);
  const latest = new Date(dates[dates.length - 1]);
  const diffDays = Math.ceil((latest.getTime() - earliest.getTime()) / (1000*60*60*24));
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays/7)} weeks`;
  return `${Math.ceil(diffDays/30)} months`;
}

function getMostCommonCategory(articles: NewsArticle[]) {
  const count: Record<string, number> = {};
  for (const a of articles) {
    const c = a.category || 'General';
    count[c] = (count[c] || 0) + 1;
  }
  return Object.entries(count).sort((a,b)=>b[1]-a[1])[0][0];
}

