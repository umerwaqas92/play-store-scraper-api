# Play Store Scraper API

A Node.js API to scrape app data from the Google Play Store using a hybrid approach (Puppeteer + google-play-scraper).

## Features

- **All 32 App Categories** — Browse apps by any Play Store category
- **App Search** — Search apps by keyword
- **App Details** — Get comprehensive app metadata (version, downloads, ratings, screenshots, etc.)
- **Reviews** — Fetch up to 500 reviews per app with rating breakdown
- **Max Resolution Screenshots** — Get screenshots in 5120x2880 resolution
- **Fast & Lightweight** — Uses google-play-scraper for API calls (10-20x faster than browser scraping)

## Installation

```bash
# Clone the repo
git clone https://github.com/umerwaqas92/play-store-scraper-api.git
cd play-store-scraper-api

# Install dependencies
npm install

# Start server
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Get API Info
```bash
GET /
```

### List All Categories
```bash
GET /categories
```

**Response:**
```json
{
  "count": 32,
  "categories": [
    { "id": "SOCIAL", "name": "Social", "url": "...", "api": "..." }
  ]
}
```

### Get Apps from Main Page
```bash
GET /apps
```

### Get Apps by Category
```bash
GET /apps/:category
```
**Example:** `GET /apps/SOCIAL`

### Search Apps
```bash
GET /search?q=your+search+term
```
**Example:** `GET /search?q=chat`

### Get App Details
```bash
GET /apps/details?id=com.openai.chatgpt
```

**Response:**
```json
{
  "appId": "com.openai.chatgpt",
  "details": {
    "title": "ChatGPT",
    "developer": "OpenAI",
    "rating": "4.5",
    "reviews": "44.3M reviews",
    "description": "Introducing ChatGPT for Android...",
    "icon": "https://play-lh.googleusercontent.com/...",
    "genre": "Productivity",
    "downloads": "1,000,000,000+ downloads (1B+)",
    "version": "1.2026.104",
    "updatedOn": "Apr 19, 2026",
    "requiresAndroid": "7.1 and up",
    "inAppPurchases": "Rs 1,400 - Rs 49,900 per item",
    "contentRating": "Rated for 12+",
    "releasedOn": "Jul 28, 2023",
    "screenshots": [
      "https://play-lh.googleusercontent.com/...=w5120-h2880-rw"
    ]
  }
}
```

### Get App Reviews
```bash
GET /apps/reviews?id=com.openai.chatgpt&num=100
```

| Query Param | Default | Description |
|-------------|---------|-------------|
| `id` | required | App package name |
| `num` | 100 | Number of reviews (max 500) |

**Response:**
```json
{
  "appId": "com.openai.chatgpt",
  "overallRating": 4.6707053,
  "totalReviews": 160960,
  "ratingBreakdown": {
    "5": 38001867,
    "4": 2907377,
    "3": 826098,
    "2": 259966,
    "1": 2312718
  },
  "count": 100,
  "reviews": [
    {
      "reviewer": "John Doe",
      "avatar": "https://play-lh.googleusercontent.com/...",
      "date": "2026-04-21T10:25:43.243Z",
      "stars": 5,
      "text": "Great app!",
      "helpful": 42,
      "reply": "Thanks for your feedback!",
      "version": "1.2026.104"
    }
  ]
}
```

## All 32 Categories

```
ART_AND_DESIGN, AUTO_AND_VEHICLES, BEAUTY, BOOKS_AND_REFERENCE, BUSINESS,
COMICS, COMMUNICATION, DATING, EDUCATION, ENTERTAINMENT, EVENTS, FINANCE,
FOOD_AND_DRINK, HEALTH_AND_FITNESS, HOUSE_AND_HOME, LIBRARIES_AND_DEMO,
LIFESTYLE, MAPS_AND_NAVIGATION, MEDICAL, MUSIC_AND_AUDIO, NEWS_AND_MAGAZINES,
PARENTING, PERSONALIZATION, PHOTOGRAPHY, PRODUCTIVITY, SHOPPING, SOCIAL,
SPORTS, TOOLS, TRAVEL_AND_LOCAL, VIDEO_PLAYERS, WEATHER
```

## Tech Stack

- **Express.js** — Web framework
- **Puppeteer** — Browser scraping for visual pages
- **google-play-scraper** — Direct API access for structured data
- **Node.js** — Runtime

## Why Hybrid Approach?

| Method | Speed | Data Volume | Reliability |
|--------|-------|-------------|-------------|
| Puppeteer only | Slow | ~3 reviews | Fragile |
| google-play-scraper only | Fast | Up to 500 reviews | Stable |
| **Hybrid (our approach)** | **Fast** | **Up to 500 reviews** | **Best of both** |

## License

MIT

## Author

**Waqas Khan** — um.waqas.khan@gmail.com
