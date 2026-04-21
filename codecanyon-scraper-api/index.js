const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3001;

async function scrapeFeaturedItems() {
  const { data } = await axios.get('https://codecanyon.net/feature', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    },
    timeout: 30000
  });

  const $ = cheerio.load(data);
  const items = [];

  // Find all item cards
  $('.shared-item_cards-card_component__root').each((i, el) => {
    const card = $(el);
    
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
    const url = titleEl.attr('href') || null;
    const itemId = cardRoot.attr('data-item-id') || card.attr('data-item-id') || null;
    const price = promoPriceEl.text().trim() || priceEl.text().trim() || null;
    const author = authorEls.first().text().trim() || null;
    const authorUrl = authorEls.first().attr('href') || null;
    const category = authorEls.eq(1).text().trim() || null;
    const categoryUrl = authorEls.eq(1).attr('href') || null;
    const sales = salesEl.text().trim() || null;
    const image = imgEl.attr('src') || null;

    // Parse rating from aria-label
    let rating = null;
    let reviewCount = null;
    const ratingAria = ratingEl.attr('aria-label') || '';
    const ratingMatch = ratingAria.match(/Rated\s+([\d.]+)\s+out\s+of\s+5/);
    const reviewMatch = ratingAria.match(/(\d+)\s+reviews?/);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);
    if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);

    if (title) {
      items.push({
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
      });
    }
  });

  return items;
}

app.get('/', (req, res) => {
  res.json({
    message: 'CodeCanyon Featured Items Scraper API',
    endpoints: {
      '/featured': 'Get all featured items from CodeCanyon'
    }
  });
});

app.get('/featured', async (req, res) => {
  try {
    const items = await scrapeFeaturedItems();
    res.json({
      source: 'https://codecanyon.net/feature',
      count: items.length,
      items
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`CodeCanyon Scraper running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/featured`);
});
