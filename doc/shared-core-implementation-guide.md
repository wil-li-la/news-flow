# Shared Core 實作指南

## 目標

將 Express (`api/`) 與 Lambda (`lambda/`) 的重複商業邏輯抽取到共享核心 (`shared/`)，實現：
- **單一邏輯來源**：功能改一次，兩端生效
- **降低維護成本**：測試、Bug 修復只需一次
- **提升開發速度**：新功能只需實作核心邏輯

---

## 架構設計

### 目標架構

```
┌─────────────┐         ┌─────────────┐
│   Express   │         │   Lambda    │
│   (api/)    │         │  (lambda/)  │
├─────────────┤         ├─────────────┤
│ 路由        │         │ 路由        │
│ 驗證        │         │ 驗證        │
│ 序列化      │         │ 序列化      │
└──────┬──────┘         └──────┬──────┘
       │                       │
       └───────┬───────────────┘
               ↓
       ┌───────────────┐
       │ Shared Core   │
       │ (shared/)     │
       ├───────────────┤
       │ 商業邏輯      │
       │ - 取新聞      │
       │ - 個人化      │
       │ - 搜尋        │
       │ - 使用者偏好  │
       └───────┬───────┘
               ↓
       ┌───────────────┐
       │ Data Adapters │
       │ (adapters/)   │
       ├───────────────┤
       │ Dynamo        │
       └───────┬───────┘
               ↓
           DynamoDB
```

### 目錄結構

```
news-flow/
├── shared/
│   ├── engine/              # 商業邏輯層
│   │   ├── news.js          # 新聞相關邏輯
│   │   ├── personalization.js  # 個人化邏輯
│   │   ├── search.js        # 搜尋邏輯
│   │   └── user.js          # 使用者邏輯
│   ├── adapters/            # 資料存取層
│   │   └── dynamo/
│   │       ├── index.js     # 統一匯出
│   │       ├── newsRepository.js
│   │       └── userRepository.js
│   └── types/               # 共享型別定義
│       └── index.js
├── api/                     # Express 薄介面
│   └── routes/
│       ├── news.js
│       ├── search.js
│       └── user.js
└── lambda/                  # Lambda 薄介面
    ├── news-api.js
    ├── search-api.js
    └── user-api.js
```

---

## 實作步驟

### Phase 1: 建立基礎結構（1-2 小時）

#### 1.1 建立目錄
```bash
mkdir -p shared/engine
mkdir -p shared/adapters/dynamo
mkdir -p shared/types
```

#### 1.2 建立型別定義 (`shared/types/index.js`)
```javascript
/**
 * @typedef {Object} NewsArticle
 * @property {string} id
 * @property {string} title
 * @property {string} [summary]
 * @property {string} [structuredSummary]
 * @property {string} [description]
 * @property {string} url
 * @property {string} [imageUrl]
 * @property {string} source
 * @property {string} [category]
 * @property {string} [publishedAt]
 * @property {string[]} [bullets]
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} userId
 * @property {string[]} categories
 * @property {string[]} sources
 * @property {Object} interactions
 */

export {};
```

---

### Phase 2: 實作資料存取層（2-3 小時）

#### 2.1 DynamoDB News Repository (`shared/adapters/dynamo/newsRepository.js`)

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoNewsRepository {
  constructor(tableName = 'NewsArticles', region = 'ap-southeast-2') {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  /**
   * 取得最新新聞
   * @param {Object} params
   * @param {number} [params.limit=20]
   * @param {string} [params.category]
   * @returns {Promise<import('../../types').NewsArticle[]>}
   */
  async getLatest({ limit = 20, category } = {}) {
    const params = {
      TableName: this.tableName,
      Limit: limit,
    };

    if (category) {
      params.FilterExpression = 'category = :cat';
      params.ExpressionAttributeValues = { ':cat': category };
    }

    const result = await this.docClient.send(new ScanCommand(params));
    
    // 按發布時間排序
    return (result.Items || []).sort((a, b) => 
      new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
    );
  }

  /**
   * 搜尋新聞
   * @param {string} query
   * @param {number} [limit=20]
   * @returns {Promise<import('../../types').NewsArticle[]>}
   */
  async search(query, limit = 20) {
    const params = {
      TableName: this.tableName,
      Limit: limit * 2, // 多取一些以便過濾
    };

    const result = await this.docClient.send(new ScanCommand(params));
    const items = result.Items || [];

    // 簡單的關鍵字搜尋（未來可改用 OpenSearch）
    const lowerQuery = query.toLowerCase();
    const filtered = items.filter(item => 
      (item.title || '').toLowerCase().includes(lowerQuery) ||
      (item.summary || '').toLowerCase().includes(lowerQuery) ||
      (item.description || '').toLowerCase().includes(lowerQuery)
    );

    return filtered.slice(0, limit);
  }

  /**
   * 根據 ID 取得新聞
   * @param {string} id
   * @returns {Promise<import('../../types').NewsArticle | null>}
   */
  async getById(id) {
    const params = {
      TableName: this.tableName,
      Key: { id },
    };

    const result = await this.docClient.send(new GetCommand(params));
    return result.Item || null;
  }
}
```

#### 2.2 DynamoDB User Repository (`shared/adapters/dynamo/userRepository.js`)

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

export class DynamoUserRepository {
  constructor(tableName = 'UserData', region = 'ap-southeast-2') {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  /**
   * 取得使用者偏好
   * @param {string} userId
   * @returns {Promise<import('../../types').UserPreferences | null>}
   */
  async getPreferences(userId) {
    const params = {
      TableName: this.tableName,
      Key: { userId },
    };

    const result = await this.docClient.send(new GetCommand(params));
    return result.Item || null;
  }

  /**
   * 更新使用者偏好
   * @param {string} userId
   * @param {Partial<import('../../types').UserPreferences>} preferences
   * @returns {Promise<void>}
   */
  async updatePreferences(userId, preferences) {
    const params = {
      TableName: this.tableName,
      Item: {
        userId,
        ...preferences,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.docClient.send(new PutCommand(params));
  }

  /**
   * 記錄使用者互動
   * @param {string} userId
   * @param {string} articleId
   * @param {'like' | 'pass' | 'read'} action
   * @returns {Promise<void>}
   */
  async recordInteraction(userId, articleId, action) {
    const prefs = await this.getPreferences(userId) || { userId, interactions: {} };
    
    if (!prefs.interactions) {
      prefs.interactions = {};
    }

    prefs.interactions[articleId] = {
      action,
      timestamp: new Date().toISOString(),
    };

    await this.updatePreferences(userId, prefs);
  }
}
```

#### 2.3 統一匯出 (`shared/adapters/dynamo/index.js`)

```javascript
import { DynamoNewsRepository } from './newsRepository.js';
import { DynamoUserRepository } from './userRepository.js';

// 單例實例（可依環境變數調整）
export const newsRepo = new DynamoNewsRepository(
  process.env.DYNAMO_NEWS_TABLE || 'NewsArticles',
  process.env.AWS_REGION || 'ap-southeast-2'
);

export const userRepo = new DynamoUserRepository(
  process.env.DYNAMO_USER_TABLE || 'UserData',
  process.env.AWS_REGION || 'ap-southeast-2'
);

export { DynamoNewsRepository, DynamoUserRepository };
```

---

### Phase 3: 實作商業邏輯層（3-4 小時）

#### 3.1 新聞邏輯 (`shared/engine/news.js`)

```javascript
/**
 * 取得新聞列表
 * @param {Object} params
 * @param {number} [params.limit=20]
 * @param {string} [params.category]
 * @param {string} [params.userId]
 * @param {Object} deps - 依賴注入
 * @param {import('../adapters/dynamo/newsRepository').DynamoNewsRepository} deps.newsRepo
 * @param {import('../adapters/dynamo/userRepository').DynamoUserRepository} [deps.userRepo]
 * @returns {Promise<{articles: import('../types').NewsArticle[]}>}
 */
export async function getNews({ limit = 20, category, userId }, { newsRepo, userRepo }) {
  // 取得新聞
  let articles = await newsRepo.getLatest({ limit, category });

  // 個人化（如果有 userId 且有 userRepo）
  if (userId && userRepo) {
    const preferences = await userRepo.getPreferences(userId);
    if (preferences) {
      articles = personalizeArticles(articles, preferences);
    }
  }

  return { articles };
}

/**
 * 個人化新聞排序
 * @param {import('../types').NewsArticle[]} articles
 * @param {import('../types').UserPreferences} preferences
 * @returns {import('../types').NewsArticle[]}
 */
function personalizeArticles(articles, preferences) {
  if (!preferences.categories || preferences.categories.length === 0) {
    return articles;
  }

  // 優先顯示使用者偏好的分類
  const preferred = articles.filter(a => 
    preferences.categories.includes(a.category)
  );
  const others = articles.filter(a => 
    !preferences.categories.includes(a.category)
  );

  return [...preferred, ...others];
}

/**
 * 取得單篇新聞
 * @param {string} articleId
 * @param {Object} deps
 * @param {import('../adapters/dynamo/newsRepository').DynamoNewsRepository} deps.newsRepo
 * @returns {Promise<{article: import('../types').NewsArticle | null}>}
 */
export async function getArticleById(articleId, { newsRepo }) {
  const article = await newsRepo.getById(articleId);
  return { article };
}
```

#### 3.2 搜尋邏輯 (`shared/engine/search.js`)

```javascript
/**
 * 搜尋新聞
 * @param {Object} params
 * @param {string} params.query
 * @param {number} [params.limit=20]
 * @param {Object} deps
 * @param {import('../adapters/dynamo/newsRepository').DynamoNewsRepository} deps.newsRepo
 * @returns {Promise<{articles: import('../types').NewsArticle[], query: string}>}
 */
export async function searchNews({ query, limit = 20 }, { newsRepo }) {
  if (!query || query.trim().length < 2) {
    return { articles: [], query };
  }

  const articles = await newsRepo.search(query.trim(), limit);
  
  return { articles, query: query.trim() };
}
```

#### 3.3 使用者邏輯 (`shared/engine/user.js`)

```javascript
/**
 * 取得使用者偏好
 * @param {string} userId
 * @param {Object} deps
 * @param {import('../adapters/dynamo/userRepository').DynamoUserRepository} deps.userRepo
 * @returns {Promise<{preferences: import('../types').UserPreferences | null}>}
 */
export async function getUserPreferences(userId, { userRepo }) {
  const preferences = await userRepo.getPreferences(userId);
  return { preferences };
}

/**
 * 更新使用者偏好
 * @param {string} userId
 * @param {Partial<import('../types').UserPreferences>} updates
 * @param {Object} deps
 * @param {import('../adapters/dynamo/userRepository').DynamoUserRepository} deps.userRepo
 * @returns {Promise<{success: boolean}>}
 */
export async function updateUserPreferences(userId, updates, { userRepo }) {
  await userRepo.updatePreferences(userId, updates);
  return { success: true };
}

/**
 * 記錄使用者互動（喜歡/略過/閱讀）
 * @param {string} userId
 * @param {string} articleId
 * @param {'like' | 'pass' | 'read'} action
 * @param {Object} deps
 * @param {import('../adapters/dynamo/userRepository').DynamoUserRepository} deps.userRepo
 * @returns {Promise<{success: boolean}>}
 */
export async function recordUserInteraction(userId, articleId, action, { userRepo }) {
  await userRepo.recordInteraction(userId, articleId, action);
  return { success: true };
}
```

---

### Phase 4: 改造 Express 路由（2-3 小時）

#### 4.1 新聞路由 (`api/routes/news.js`)

**Before** (厚介面):
```javascript
// ❌ 商業邏輯與路由混在一起
router.get('/news', async (req, res) => {
  const { limit = 20, category } = req.query;
  
  const params = {
    TableName: 'NewsArticles',
    Limit: limit,
  };
  if (category) {
    params.FilterExpression = 'category = :cat';
    params.ExpressionAttributeValues = { ':cat': category };
  }
  
  const result = await dynamodb.scan(params);
  const articles = result.Items.sort((a, b) => 
    new Date(b.publishedAt) - new Date(a.publishedAt)
  );
  
  res.json({ articles });
});
```

**After** (薄介面):
```javascript
import { Router } from 'express';
import { getNews, getArticleById } from '../../shared/engine/news.js';
import { newsRepo, userRepo } from '../../shared/adapters/dynamo/index.js';

const router = Router();

// 取得新聞列表
router.get('/news', async (req, res, next) => {
  try {
    const { limit, category } = req.query;
    const userId = req.user?.id; // 從驗證中介層取得

    const result = await getNews(
      { 
        limit: limit ? parseInt(limit, 10) : undefined, 
        category,
        userId 
      },
      { newsRepo, userRepo }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 取得單篇新聞
router.get('/news/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getArticleById(id, { newsRepo });

    if (!result.article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
```

#### 4.2 搜尋路由 (`api/routes/search.js`)

```javascript
import { Router } from 'express';
import { searchNews } from '../../shared/engine/search.js';
import { newsRepo } from '../../shared/adapters/dynamo/index.js';

const router = Router();

router.get('/search', async (req, res, next) => {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const result = await searchNews(
      { 
        query: q, 
        limit: limit ? parseInt(limit, 10) : undefined 
      },
      { newsRepo }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
```

---

### Phase 5: 改造 Lambda 函式（2-3 小時）

#### 5.1 新聞 Lambda (`lambda/news-api.js`)

**Before** (厚介面):
```javascript
// ❌ 重複的商業邏輯
export async function handler(event) {
  const { limit = 20, category } = JSON.parse(event.body || '{}');
  
  const params = {
    TableName: 'NewsArticles',
    Limit: limit,
  };
  if (category) {
    params.FilterExpression = 'category = :cat';
    params.ExpressionAttributeValues = { ':cat': category };
  }
  
  const result = await dynamodb.scan(params);
  const articles = result.Items.sort((a, b) => 
    new Date(b.publishedAt) - new Date(a.publishedAt)
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify({ articles }),
  };
}
```

**After** (薄介面):
```javascript
import { getNews, getArticleById } from '../shared/engine/news.js';
import { newsRepo, userRepo } from '../shared/adapters/dynamo/index.js';

export async function handler(event) {
  try {
    const path = event.path || event.rawPath;
    const method = event.httpMethod || event.requestContext?.http?.method;

    // 路由分發
    if (method === 'GET' && path === '/news') {
      return await handleGetNews(event);
    }

    if (method === 'GET' && path.startsWith('/news/')) {
      return await handleGetArticleById(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleGetNews(event) {
  const params = event.queryStringParameters || {};
  const userId = event.requestContext?.authorizer?.claims?.sub;

  const result = await getNews(
    {
      limit: params.limit ? parseInt(params.limit, 10) : undefined,
      category: params.category,
      userId,
    },
    { newsRepo, userRepo }
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}

async function handleGetArticleById(event) {
  const id = event.pathParameters?.id || event.path.split('/').pop();

  const result = await getArticleById(id, { newsRepo });

  if (!result.article) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Article not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
}
```

---

## 測試策略

### 單元測試（核心邏輯）

```javascript
// shared/engine/news.test.js
import { describe, it, expect, jest } from '@jest/globals';
import { getNews } from './news.js';

describe('getNews', () => {
  it('should return latest articles', async () => {
    const mockNewsRepo = {
      getLatest: jest.fn().mockResolvedValue([
        { id: '1', title: 'News 1', publishedAt: '2024-01-01' },
        { id: '2', title: 'News 2', publishedAt: '2024-01-02' },
      ]),
    };

    const result = await getNews(
      { limit: 10 },
      { newsRepo: mockNewsRepo, userRepo: null }
    );

    expect(result.articles).toHaveLength(2);
    expect(mockNewsRepo.getLatest).toHaveBeenCalledWith({ limit: 10 });
  });

  it('should personalize articles when userId provided', async () => {
    const mockNewsRepo = {
      getLatest: jest.fn().mockResolvedValue([
        { id: '1', title: 'Tech News', category: 'technology' },
        { id: '2', title: 'Sports News', category: 'sports' },
      ]),
    };

    const mockUserRepo = {
      getPreferences: jest.fn().mockResolvedValue({
        userId: 'user1',
        categories: ['technology'],
      }),
    };

    const result = await getNews(
      { limit: 10, userId: 'user1' },
      { newsRepo: mockNewsRepo, userRepo: mockUserRepo }
    );

    expect(result.articles[0].category).toBe('technology');
  });
});
```

### 整合測試（端到端）

```javascript
// api/routes/news.test.js
import request from 'supertest';
import app from '../index.js';

describe('GET /news', () => {
  it('should return news articles', async () => {
    const response = await request(app)
      .get('/news')
      .query({ limit: 5 })
      .expect(200);

    expect(response.body).toHaveProperty('articles');
    expect(Array.isArray(response.body.articles)).toBe(true);
  });

  it('should filter by category', async () => {
    const response = await request(app)
      .get('/news')
      .query({ category: 'technology' })
      .expect(200);

    const articles = response.body.articles;
    articles.forEach(article => {
      expect(article.category).toBe('technology');
    });
  });
});
```

---

## 遷移檢查清單

### Phase 1: 基礎結構
- [ ] 建立 `shared/engine/` 目錄
- [ ] 建立 `shared/adapters/dynamo/` 目錄
- [ ] 建立 `shared/types/index.js`

### Phase 2: 資料存取層
- [ ] 實作 `DynamoNewsRepository`
- [ ] 實作 `DynamoUserRepository`
- [ ] 建立統一匯出 `shared/adapters/dynamo/index.js`
- [ ] 測試 repositories（可選）

### Phase 3: 商業邏輯層
- [ ] 實作 `shared/engine/news.js`
- [ ] 實作 `shared/engine/search.js`
- [ ] 實作 `shared/engine/user.js`
- [ ] 撰寫單元測試

### Phase 4: Express 改造
- [ ] 改造 `api/routes/news.js`
- [ ] 改造 `api/routes/search.js`
- [ ] 改造 `api/routes/user.js`
- [ ] 測試 Express 端點

### Phase 5: Lambda 改造
- [ ] 改造 `lambda/news-api.js`
- [ ] 改造 `lambda/search-api.js`（如有）
- [ ] 改造 `lambda/user-api.js`
- [ ] 測試 Lambda 函式

### Phase 6: 清理
- [ ] 移除或標記過時檔案（`newsApi-dynamo.js`）
- [ ] 更新文件
- [ ] 執行完整測試套件
- [ ] 部署到測試環境驗證

---

## 注意事項

### 1. 依賴注入
- 所有商業邏輯函式都應接受 repositories 作為參數
- 避免在核心邏輯中直接 import repositories
- 便於測試與替換實作

### 2. 錯誤處理
- 核心邏輯拋出錯誤，由介面層捕捉並轉換為 HTTP 回應
- 統一錯誤格式：`{ error: string, details?: any }`

### 3. 環境變數
- 所有設定（table 名稱、region）應可透過環境變數覆寫
- 使用 `.env.example` 記錄所需變數

### 4. 向後相容
- 遷移期間保留舊程式碼，以 feature flag 或路由版本控制
- 逐步切換流量，確保穩定後再移除舊程式碼

### 5. 效能考量
- Repository 可加入快取層（decorator pattern）
- 批次操作應使用 DynamoDB BatchGet/BatchWrite

---

## 後續優化方向

### 短期（1-2 週）
- 加入結構化日誌（requestId、userId、操作類型）
- 實作基本的快取層（記憶體或 Redis）
- 補充整合測試覆蓋率

### 中期（1-2 個月）
- 改用 Query + GSI 取代 Scan（階段 2）
- 實作分頁協定
- 加入 OpenSearch 做全文搜尋

### 長期（3-6 個月）
- 實作 CQRS 模式（讀寫分離）
- 加入事件驅動架構（EventBridge）
- 實作 A/B 測試框架

---

## 參考資源

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Dependency Injection in JavaScript](https://www.freecodecamp.org/news/a-quick-intro-to-dependency-injection-what-it-is-and-when-to-use-it-7578c84fa88f/)
