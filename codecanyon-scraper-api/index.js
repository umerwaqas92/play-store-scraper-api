const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3001;

// Reusable HTTP client
const client = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  }
});

// Parse item card (reusable for featured, search, category, etc.)
function parseItemCard($, card) {
  const titleEl = card.find('.shared-item_cards-item_name_component__itemNameLink').first();
  const authorEls = card.find('.shared-item_cards-author_category_component__link');
  const priceEl = card.find('.shared-item_cards-price_component__root').first();
  const promoPriceEl = card.find('.shared-item_cards-price_component__promoPrice').first();
  const ratingEl = card.find('.shared-stars_rating_component__starRating').first();
  const reviewsEl = card.find('.shared-stars_rating_component__starRatingCount').first();
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

  return {
    itemId,
    title,
    url,
    author,
    authorUrl,
    category,
    categoryUrl,
    price,
    rating,
    reviewCount,
    sales,
    image
  };
}

// Scrape items from any page with cards
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

// ============ ENDPOINTS ============

app.get('/', (req, res) => {
  res.json({
    message: 'CodeCanyon Scraper API',
    endpoints: {
      '/featured': 'Featured items',
      '/search?term=keyword': 'Search items by keyword',
      '/categories': 'List all categories',
      '/category/:slug': 'Items by category (e.g., /category/wordpress)',
      '/popular': 'Top sellers / popular items',
      '/top-new': 'Top new items this month',
      '/item/:id': 'Item details (e.g., /item/61857601)',
      '/author/:username': 'Items by author (e.g., /author/TitanSystems)'
    }
  });
});

// Featured Items
app.get('/featured', async (req, res) => {
  try {
    const items = await scrapeItemsFromUrl('https://codecanyon.net/feature');
    res.json({ source: 'https://codecanyon.net/feature', count: items.length, items });
  } catch (error) {
    console.error('Scraping error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search Items
app.get('/search', async (req, res) => {
  const term = req.query.term || req.query.q;
  if (!term) {
    return res.status(400).json({ error: 'Missing search term', usage: '/search?term=chat' });
  }

  try {
    const url = `https://codecanyon.net/search?term=${encodeURIComponent(term)}`;
    const items = await scrapeItemsFromUrl(url);
    res.json({ query: term, source: url, count: items.length, items });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// All Categories
app.get('/categories', async (req, res) => {
  try {
    const { data } = await client.get('https://codecanyon.net/category');
    const $ = cheerio.load(data);
    const categories = [];

    // Primary categories
    $('.shared-categories-index_categories_list_component__category').each((i, el) => {
      const link = $(el).find('.shared-categories-index_categories_list_component__categoryLink').first();
      const name = link.text().trim();
      const url = link.attr('href');
      const slug = url?.split('/').pop();
      const countEl = $(el).find('.shared-categories-index_categories_list_component__count');
      const count = countEl.text().trim() || null;

      if (name && url) {
        categories.push({ name, slug, url, count });
      }
    });

    // Alternative selector
    if (categories.length === 0) {
      $('a[href^="/category/"]').each((i, el) => {
        const name = $(el).text().trim();
        const url = $(el).attr('href');
        const slug = url?.split('/').pop();
        if (name && url && !categories.find(c => c.slug === slug)) {
          categories.push({ name, slug, url, count: null });
        }
      });
    }

    res.json({ source: 'https://codecanyon.net/category', count: categories.length, categories });
  } catch (error) {
    console.error('Categories error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Items by Category
app.get('/category/:slug', async (req, res) => {
  const slug = req.params.slug;
  const page = req.query.page || 1;

  try {
    const url = `https://codecanyon.net/category/${slug}?page=${page}`;
    const items = await scrapeItemsFromUrl(url);
    res.json({ category: slug, page: parseInt(page), source: url, count: items.length, items });
  } catch (error) {
    console.error('Category error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Popular / Top Sellers
app.get('/popular', async (req, res) => {
  try {
    const url = 'https://codecanyon.net/top-sellers';
    const items = await scrapeItemsFromUrl(url);
    res.json({ source: url, count: items.length, items });
  } catch (error) {
    console.error('Popular error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Top New Items
app.get('/top-new', async (req, res) => {
  try {
    const url = 'https://codecanyon.net/search?date=this-month&sort=sales';
    const items = await scrapeItemsFromUrl(url);
    res.json({ source: url, count: items.length, items });
  } catch (error) {
    console.error('Top new error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Item Details
app.get('/item/:id', async (req, res) => {
  const itemId = req.params.id;

  try {
    const url = `https://codecanyon.net/item/x/${itemId}`;
    const { data } = await client.get(url, { maxRedirects: 5 });
    const $ = cheerio.load(data);

    const title = $('h1').first().text().trim() || null;
    const description = $('[data-testid="item-description"]').text().trim() || $('.item-description').text().trim() || null;
    const price = $('.shared-item_cards-price_component__root, .item-header__price').first().text().trim() || null;
    const author = $('a[href^="/user/"]').first().text().trim() || null;
    const authorUrl = $('a[href^="/user/"]').first().attr('href');
    const ratingText = $('.shared-stars_rating_component__starRating').first().attr('aria-label') || '';
    const image = $('.shared-item_cards-preview_image_component__image, .item-header__preview img').first().attr('src');
    const sales = $('.shared-item_cards-sales_component__root').first().text().trim() || null;

    let rating = null;
    let reviewCount = null;
    const ratingMatch = ratingText.match(/Rated\s+([\d.]+)\s+out\s+of\s+5/);
    const reviewMatch = ratingText.match(/(\d+)\s+reviews?/);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);
    if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);

    res.json({
      itemId,
      source: url,
      details: {
        title,
        description: description?.substring(0, 500),
        author,
        authorUrl: authorUrl ? `https://codecanyon.net${authorUrl}` : null,
        price,
        rating,
        reviewCount,
        sales,
        image
      }
    });
  } catch (error) {
    console.error('Item details error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Author Items
app.get('/author/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const url = `https://codecanyon.net/user/${username}`;
    const items = await scrapeItemsFromUrl(url);
    res.json({ author: username, source: url, count: items.length, items });
  } catch (error) {
    console.error('Author error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`CodeCanyon Scraper running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/featured`);
  console.log(`Try: http://localhost:${PORT}/search?term=chat`);
  console.log(`Try: http://localhost:${PORT}/categories`);
  console.log(`Try: http://localhost:${PORT}/category/wordpress`);
  console.log(`Try: http://localhost:${PORT}/popular`);
  console.log(`Try: http://localhost:${PORT}/top-new`);
  console.log(`Try: http://localhost:${PORT}/item/61857601`);
  console.log(`Try: http://localhost:${PORT}/author/TitanSystems`);
});
