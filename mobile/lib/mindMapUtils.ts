import { NewsArticle } from '../types';
import { MindMapLink, MindMapNode, MindMapViewMode, SwipeAction } from '../types';

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Technology: '#3B82F6',
    Science: '#10B981',
    Politics: '#EF4444',
    Health: '#F59E0B',
    Finance: '#8B5CF6',
    Sports: '#06B6D4',
    World: '#84CC16',
    Business: '#F97316',
    Other: '#6B7280',
  };
  return colors[category] || '#6B7280';
};

export const getRegionColor = (region: string): string => {
  const colors: Record<string, string> = {
    'North America': '#EF4444',
    Europe: '#3B82F6',
    Asia: '#10B981',
    'Asia Pacific': '#10B981',
    'South America': '#F59E0B',
    Africa: '#8B5CF6',
    'Middle East': '#EC4899',
    Global: '#6B7280',
  };
  return colors[region] || '#6B7280';
};

export const getLinkColor = (type: 'category' | 'region' | 'semantic'): string => {
  switch (type) {
    case 'category': return '#3B82F6';
    case 'region': return '#10B981';
    case 'semantic': return '#8B5CF6';
    default: return '#6B7280';
  }
};

const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during','before','after','above','below','between','among','this','that','these','those','new','news','today','yesterday','will','have','been','they','were','said','each','which','their','time','more','very','what','know','just','first','into','over','think','also','your','work','life','only','years','way','may','say','come','now','find','long','down','day','did','get','has','him','his','how','man','old','see','two','who','boy','let','put','she','too','use','its'
]);

const extractKeywords = (text: string): string[] => {
  const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
    .filter(w => !/^\d+$/.test(w));
  const count: Record<string, number> = {};
  for (const w of words) count[w] = (count[w] || 0) + 1;
  return Object.entries(count).sort(([,a],[,b]) => b - a).slice(0, 5).map(([w]) => w);
};

const calculateSemanticSimilarity = (a1: NewsArticle, a2: NewsArticle): number => {
  const getKw = (s: string) => extractKeywords(s);
  const k1 = getKw(`${a1.title || ''} ${a1.summary || a1.description || ''}`);
  const k2 = getKw(`${a2.title || ''} ${a2.summary || a2.description || ''}`);
  if (!k1.length || !k2.length) return 0;
  const s1 = new Set(k1);
  const s2 = new Set(k2);
  const intersection = [...s1].filter(w => s2.has(w));
  const union = new Set([...k1, ...k2]);
  return intersection.length / union.size;
};

const getMostCommonCategory = (arts: NewsArticle[]): string => {
  const c: Record<string, number> = {};
  for (const a of arts) c[a.category || 'Other'] = (c[a.category || 'Other'] || 0) + 1;
  return Object.entries(c).sort(([,a],[,b]) => b - a)[0]?.[0] || 'Other';
};
const getMostCommonRegion = (arts: NewsArticle[]): string => {
  const c: Record<string, number> = {};
  for (const a of arts) c[a.region || 'Global'] = (c[a.region || 'Global'] || 0) + 1;
  return Object.entries(c).sort(([,a],[,b]) => b - a)[0]?.[0] || 'Global';
};

export const generateMindMapData = (swipeHistory: SwipeAction[], viewMode: MindMapViewMode = 'semantic') => {
  const liked = swipeHistory.filter(s => s.direction === 'right');
  if (!liked.length) return { nodes: [] as MindMapNode[], links: [] as MindMapLink[] };
  switch (viewMode) {
    case 'category': return generateCategoryView(liked);
    case 'region': return generateRegionView(liked);
    case 'semantic':
    default: return generateSemanticView(liked);
  }
};

const generateSemanticView = (liked: SwipeAction[]) => {
  const keywordMap: Record<string, NewsArticle[]> = {};
  for (const s of liked) {
    const text = `${s.article.title} ${s.article.summary ?? s.article.description ?? ''}`;
    for (const k of extractKeywords(text).slice(0, 3)) {
      (keywordMap[k] ||= []).push(s.article);
    }
  }
  const nodes: MindMapNode[] = Object.entries(keywordMap)
    .filter(([,arts]) => arts.length >= 2)
    .map(([kw, arts]) => ({
      id: `keyword-${kw}`,
      title: kw.charAt(0).toUpperCase() + kw.slice(1),
      category: getMostCommonCategory(arts),
      region: getMostCommonRegion(arts),
      sentiment: 'liked',
      nodeType: 'keyword',
      articleCount: arts.length,
    }));
  const links: MindMapLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a1 = keywordMap[nodes[i].title.toLowerCase()] || [];
      const a2 = keywordMap[nodes[j].title.toLowerCase()] || [];
      const set2 = new Set(a2.map(a => a.id));
      const shared = a1.filter(a => set2.has(a.id)).length;
      if (shared > 0) {
        const strength = Math.min((shared / Math.max(a1.length, a2.length)) * 2, 1);
        if (strength > 0.2) links.push({ source: nodes[i].id, target: nodes[j].id, strength, type: 'semantic' });
      }
    }
  }
  return { nodes, links };
};

const generateCategoryView = (liked: SwipeAction[]) => {
  const map: Record<string, NewsArticle[]> = {};
  for (const s of liked) (map[s.article.category || 'Other'] ||= []).push(s.article);
  const nodes: MindMapNode[] = Object.entries(map).map(([cat, arts]) => ({
    id: `category-${cat}`,
    title: cat,
    category: cat,
    region: 'Global',
    sentiment: 'liked',
    nodeType: 'category',
    articleCount: arts.length,
  }));
  const links: MindMapLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a1 = map[nodes[i].title] || [];
      const a2 = map[nodes[j].title] || [];
      let total = 0, n = 0;
      for (const x of a1) for (const y of a2) { total += calculateSemanticSimilarity(x, y); n++; }
      if (!n) continue;
      const avg = total / n;
      if (avg > 0.1) links.push({ source: nodes[i].id, target: nodes[j].id, strength: Math.min(avg * 3, 1), type: 'category' });
    }
  }
  return { nodes, links };
};

const generateRegionView = (liked: SwipeAction[]) => {
  const map: Record<string, NewsArticle[]> = {};
  for (const s of liked) (map[s.article.region || 'Global'] ||= []).push(s.article);
  const nodes: MindMapNode[] = Object.entries(map).map(([region, arts]) => ({
    id: `region-${region}`,
    title: region,
    category: getMostCommonCategory(arts),
    region,
    sentiment: 'liked',
    nodeType: 'region',
    articleCount: arts.length,
  }));
  const links: MindMapLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a1 = map[nodes[i].title] || [];
      const a2 = map[nodes[j].title] || [];
      let total = 0, n = 0;
      for (const x of a1) for (const y of a2) { total += calculateSemanticSimilarity(x, y); n++; }
      if (!n) continue;
      const avg = total / n;
      if (avg > 0.1) links.push({ source: nodes[i].id, target: nodes[j].id, strength: Math.min(avg * 3, 1), type: 'region' });
    }
  }
  return { nodes, links };
};

export function layoutNodes(width: number, height: number, nodes: MindMapNode[]): Record<string, { x: number; y: number }> {
  // Simple radial layout for MVP
  const cx = width / 2, cy = height / 2;
  const r = Math.min(cx, cy) - 40;
  const pos: Record<string, { x: number; y: number }> = {};
  const n = Math.max(nodes.length, 1);
  nodes.forEach((node, i) => {
    const angle = (i / n) * Math.PI * 2;
    pos[node.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return pos;
}

