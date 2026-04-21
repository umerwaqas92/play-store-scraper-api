# CodeCanyon Scraper API

A Node.js API to scrape items from CodeCanyon using Axios + Cheerio.

## Installation

```bash
cd codecanyon-scraper-api
npm install
npm start
```

Server runs on `http://localhost:3001`

## Working Endpoints (No Cloudflare)

| Endpoint | Description | Status |
|----------|-------------|--------|
| `GET /featured` | Featured items | ✅ 31 items |
| `GET /categories` | List all categories | ✅ 107 categories |
| `GET /popular` | Top sellers | ✅ 30 items |
| `GET /popular/javascript` | Popular by category | ✅ 25 items |

## Limited Endpoints (Cloudflare Protected)

| Endpoint | Description | Status |
|----------|-------------|--------|
| `GET /search/ai` | Search items | ❌ 403 |
| `GET /category/wordpress` | Category items | ❌ 403 |

## What We Discovered from HAR

The HAR file revealed that CodeCanyon uses `/popular_item/by_category?category=xxx` for popular items by category, which **works without Cloudflare**.

However, search (`/search/xxx`) and category (`/category/xxx`) pages are protected by Cloudflare and cannot be scraped with simple HTTP requests.

## Response Format

```json
{
  "source": "https://codecanyon.net/feature",
  "count": 31,
  "items": [
    {
      "itemId": "61857601",
      "title": "Webby – AI-Powered No-Code Website Builder SaaS Platform",
      "url": "https://codecanyon.net/item/...",
      "author": "TitanSystems",
      "authorUrl": "https://codecanyon.net/user/titansystems",
      "category": "PHP Scripts",
      "categoryUrl": "/category/php-scripts",
      "price": "$79",
      "rating": 3.11,
      "reviewCount": 9,
      "sales": "127 Sales",
      "image": "https://market-resized.envatousercontent.com/..."
    }
  ]
}
```

## Tech Stack

- **Express.js** — Web framework
- **Axios** — HTTP requests
- **Cheerio** — Server-side HTML parsing

## Note

There is **no dedicated npm package** for CodeCanyon scraping. This API uses direct HTTP scraping.

## Author

**Waqas Khan** — um.waqas.khan@gmail.com
