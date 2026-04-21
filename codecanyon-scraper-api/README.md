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

### Get API Info
```bash
GET /
```

### Featured Items
```bash
GET /featured
```
Returns featured items from CodeCanyon homepage.

### Search Items
```bash
GET /search?term=chat
```
Search items by keyword.

### List Categories
```bash
GET /categories
```
Returns all CodeCanyon categories.

### Items by Category
```bash
GET /category/wordpress
```
Returns items in a specific category.

### Top Sellers / Popular
```bash
GET /popular
```
Returns top selling items.

### Top New Items
```bash
GET /top-new
```
Returns top new items this month.

### Item Details
```bash
GET /item/61857601
```
Returns details for a specific item by ID.

### Author Items
```bash
GET /author/TitanSystems
```
Returns items by a specific author.

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

## Author

**Waqas Khan** — um.waqas.khan@gmail.com
