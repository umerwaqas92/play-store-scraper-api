# CodeCanyon Featured Items Scraper API

A Node.js API to scrape featured items from CodeCanyon using Axios + Cheerio.

## Installation

```bash
cd codecanyon-scraper-api
npm install
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Get Featured Items
```bash
GET /featured
```

**Response:**
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

## Author

**Waqas Khan** — um.waqas.khan@gmail.com
