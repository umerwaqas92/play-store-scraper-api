# CodeCanyon Scraper API

A Node.js API to scrape items from CodeCanyon using Axios + Cheerio.

## Installation

```bash
cd codecanyon-scraper-api
npm install
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Working Endpoints (No Anti-Bot)

| Endpoint | Description | Status |
|----------|-------------|--------|
| `GET /featured` | Featured items | ✅ Works |
| `GET /categories` | List all categories | ✅ Works |
| `GET /popular` | Top sellers | ✅ Works |

### Limited Endpoints (May be blocked)

| Endpoint | Description | Status |
|----------|-------------|--------|
| `GET /search?term=chat` | Search items | ⚠️ May return 403 |
| `GET /category/wordpress` | Items by category | ⚠️ May return 403 |
| `GET /item/61857601` | Item details | ⚠️ May return 403 |
| `GET /author/TitanSystems` | Author items | ⚠️ May return 403 |

## Why Some Endpoints Fail

CodeCanyon uses **Cloudflare anti-bot protection** on search, category, and item detail pages. The `/featured`, `/categories`, and `/popular` pages are not protected and work reliably.

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

## Fields

| Field | Description |
|-------|-------------|
| `itemId` | CodeCanyon item ID |
| `title` | Item name |
| `url` | Item page URL |
| `author` | Author name |
| `authorUrl` | Author profile URL |
| `category` | Item category |
| `categoryUrl` | Category URL |
| `price` | Current price |
| `rating` | Star rating (1-5) |
| `reviewCount` | Number of reviews |
| `sales` | Sales count |
| `image` | Preview image URL |

## Tech Stack

- **Express.js** — Web framework
- **Axios** — HTTP requests
- **Cheerio** — Server-side HTML parsing

## Note

There is **no dedicated npm package** for CodeCanyon scraping (unlike `google-play-scraper` for Play Store). This API uses direct HTTP scraping.

## Author

**Waqas Khan** — um.waqas.khan@gmail.com
