const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3001;

const client = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  }
});

function parseItemCard($, card) {
  const titleEl = card.find('.shared-item_cards-item_name_component__itemNameLink').first();
  const authorEls = card.find('.shared-item_cards-author_category_component__link');
  const priceEl = card.find('.shared-item_cards-price_component__root').first();
  const promoPriceEl = card.find('.shared-item_cards-price_component__promoPrice').first();
  const ratingEl = card.find('.shared-stars_rating_component__starRating').first();
  const salesEl = card.find('.shared-item_cards-sales_component__root').first();
  const imgEl = card.find('.shared-item_cards-preview_image_component__image').first();
  const cardRoot = card.find('.shared-item_cards-grid-image_card_component__root, .shared-item_cards-list-image_card_component__root').first();

  const title = titleEl.text().trim() || null;
  if (!title) return null;

  const url = titleEl.attr('href') || null;
  const itemId = cardRoot.attr('data-item-id') || card.attr('data-item-id') || null;
  const price = promoPriceEl.text().trim() || priceEl.text().trim() || null;
  const author = authorEls.first().text().trim() || null;
  const authorUrl = authorEls.first().attr('href') || null;
  const category = authorEls.eq(1).text().trim() || null;
  const categoryUrl = authorEls.eq(1).attr('href') || null;
  const sales = salesEl.text().trim() || null;
  const image = imgEl.attr('src') || null;

  let rating = null;
  let reviewCount = null;
  const ratingAria = ratingEl.attr('aria-label') || '';
  const ratingMatch = ratingAria.match(/Rated\s+([\d.]+)\s+out\s+of\s+5/);
  const reviewMatch = ratingAria.match(/(\d+)\s+reviews?/);
  if (ratingMatch) rating = parseFloat(ratingMatch[1]);
  if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);

  return { itemId, title, url, author, authorUrl, category, categoryUrl, price, rating, reviewCount, sales, image };
}

async function scrapeItemsFromUrl(url) {
  const { data } = await client.get(url);
  const $ = cheerio.load(data);
  const items = [];
  $('.shared-item_cards-card_component__root').each((i, el) => {
    const item = parseItemCard($, $(el));
    if (item) items.push(item);
  });
  return items;
}

app.get('/', (req, res) => {
  res.json({
    message: 'CodeCanyon Scraper API',
    note: 'CodeCanyon uses Cloudflare on some pages. Only unprotected pages work.',
    working_endpoints: {
      '/featured': 'Featured items',
      '/categories': 'List all categories',
      '/popular': 'Top sellers',
      '/popular/:category': 'Popular by category (e.g., /popular/javascript)'
    },
    limited_endpoints: {
      '/search/:term': 'Search (may be blocked by Cloudflare)',
      '/category/:slug': 'Category items (may be blocked by Cloudflare)'
    }
  });
});

// WORKING ENDPOINTS (no Cloudflare)

app.get('/featured', async (req, res) => {
  try {
    const items = await scrapeItemsFromUrl('https://codecanyon.net/feature');
    res.json({ source: 'https://codecanyon.net/feature', count: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/categories', async (req, res) => {
  try {
    const { data } = await client.get('https://codecanyon.net/category');
    const $ = cheerio.load(data);
    const categories = [];

    $('.shared-categories-index_categories_list_component__category').each((i, el) => {
      const link = $(el).find('.shared-categories-index_categories_list_component__categoryLink').first();
      const name = link.text().trim();
      const url = link.attr('href');
      const slug = url?.split('/').pop();
      if (name && url) categories.push({ name, slug, url });
    });

    res.json({ source: 'https://codecanyon.net/category', count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/popular', async (req, res) => {
  try {
    const items = await scrapeItemsFromUrl('https://codecanyon.net/top-sellers');
    res.json({ source: 'https://codecanyon.net/top-sellers', count: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Popular by category - discovered from HAR file
app.get('/popular/:category', async (req, res) => {
  try {
    const url = `https://codecanyon.net/popular_item/by_category?category=${encodeURIComponent(req.params.category)}`;
    const items = await scrapeItemsFromUrl(url);
    res.json({ category: req.params.category, source: url, count: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LIMITED ENDPOINTS (Cloudflare protected)

app.get('/search/:term', async (req, res) => {
  try {
    const url = `https://codecanyon.net/search/${encodeURIComponent(req.params.term)}`;
    const items = await scrapeItemsFromUrl(url);
    res.json({ query: req.params.term, source: url, count: items.length, items });
  } catch (error) {
    res.status(403).json({ 
      error: 'CodeCanyon blocked this request (Cloudflare anti-bot protection)',
      message: error.message,
      note: 'Search pages are protected. Try /featured, /popular, or /popular/:category instead'
    });
  }
});

app.get('/category/:slug', async (req, res) => {
  try {
    const url = `https://codecanyon.net/category/${req.params.slug}`;
    const items = await scrapeItemsFromUrl(url);
    res.json({ category: req.params.slug, source: url, count: items.length, items });
  } catch (error) {
    res.status(403).json({ 
      error: 'CodeCanyon blocked this request (Cloudflare anti-bot protection)',
      message: error.message,
      note: 'Category pages are protected. Try /popular/:category instead (e.g., /popular/javascript)'
    });
  }
});

app.listen(PORT, () => {
  console.log(`CodeCanyon Scraper running on http://localhost:${PORT}`);
});
