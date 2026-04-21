const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const CATEGORIES = {
  ART_AND_DESIGN: 'Art & Design',
  AUTO_AND_VEHICLES: 'Auto & Vehicles',
  BEAUTY: 'Beauty',
  BOOKS_AND_REFERENCE: 'Books & Reference',
  BUSINESS: 'Business',
  COMICS: 'Comics',
  COMMUNICATION: 'Communication',
  DATING: 'Dating',
  EDUCATION: 'Education',
  ENTERTAINMENT: 'Entertainment',
  EVENTS: 'Events',
  FINANCE: 'Finance',
  FOOD_AND_DRINK: 'Food & Drink',
  HEALTH_AND_FITNESS: 'Health & Fitness',
  HOUSE_AND_HOME: 'House & Home',
  LIBRARIES_AND_DEMO: 'Libraries & Demo',
  LIFESTYLE: 'Lifestyle',
  MAPS_AND_NAVIGATION: 'Maps & Navigation',
  MEDICAL: 'Medical',
  MUSIC_AND_AUDIO: 'Music & Audio',
  NEWS_AND_MAGAZINES: 'News & Magazines',
  PARENTING: 'Parenting',
  PERSONALIZATION: 'Personalization',
  PHOTOGRAPHY: 'Photography',
  PRODUCTIVITY: 'Productivity',
  SHOPPING: 'Shopping',
  SOCIAL: 'Social',
  SPORTS: 'Sports',
  TOOLS: 'Tools',
  TRAVEL_AND_LOCAL: 'Travel & Local',
  VIDEO_PLAYERS: 'Video Players & Editors',
  WEATHER: 'Weather'
};

async function scrapePage(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for app cards to load (try multiple selectors for different page types)
    try {
      await page.waitForSelector('.us8NPb, a.Si6A0c.ZD8Cqc, a.Si6A0c.Gy4nib, .ubGTjb', { timeout: 15000 });
    } catch (e) {
      // Some pages load differently, just continue
    }

    // Scroll down to load more apps
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1500));
    }

    const apps = await page.evaluate(() => {
      const data = [];
      const seen = new Set();

      // Helper to add app
      const addApp = (title, developer, icon, rating, href, type) => {
        const appTitle = title?.trim();
        if (!appTitle || seen.has(appTitle)) return;
        seen.add(appTitle);

        data.push({
          title: appTitle,
          developer: developer?.trim() || null,
          url: href ? (href.startsWith('http') ? href : `https://play.google.com${href}`) : null,
          icon: icon || null,
          rating: rating?.trim() || null,
          type: type
        });
      };

      // Featured / compact cards
      document.querySelectorAll('.us8NPb').forEach(card => {
        const link = card.querySelector('a[href^="/store/apps/details?id="]');
        const titleEl = card.querySelector('.fkdIre, .Epkrse');
        const developerEl = card.querySelector('.bcLwIe');
        const iconEl = card.querySelector('img.T75of.nnW2Md, img.T75of.etjhNc.Q8CSx');
        const ratingEl = card.querySelector('.vlGucd .LrNMN');

        const href = link?.getAttribute('href') || card.closest('a')?.getAttribute('href');
        addApp(titleEl?.innerText, developerEl?.innerText, iconEl?.src, ratingEl?.innerText, href, 'featured');
      });

      // Grid / browse cards (main page)
      document.querySelectorAll('a.Si6A0c.ZD8Cqc').forEach(card => {
        const titleEl = card.querySelector('.Epkrse, .fkdIre');
        const iconEl = card.querySelector('img.T75of.etjhNc.Q8CSx, img.T75of.nnW2Md');
        const ratingEl = card.querySelector('.vlGucd .LrNMN');

        addApp(titleEl?.innerText, null, iconEl?.src, ratingEl?.innerText, card.getAttribute('href'), 'grid');
      });

      // Search page cards (alternative selectors)
      document.querySelectorAll('a.Si6A0c.Gy4nib, a.Si6A0c.jEFi_q').forEach(card => {
        const titleEl = card.querySelector('.DdYX5, .Epkrse, .fkdIre, .ubGTjb');
        const iconEl = card.querySelector('img.T75of.stzEZd, img.T75of.jpDEN, img.T75of.etjhNc.Q8CSx, img.T75of.nnW2Md');
        const ratingEl = card.querySelector('.w2kbF, .vlGucd .LrNMN');
        const developerEl = card.querySelector('.wMUdtb');

        addApp(titleEl?.innerText, developerEl?.innerText, iconEl?.src, ratingEl?.innerText, card.getAttribute('href'), 'search');
      });

      // Additional search result wrappers
      document.querySelectorAll('.ubGTjb').forEach(card => {
        const parent = card.closest('a[href^="/store/apps/details?id="]');
        if (!parent || seen.has(card.innerText?.trim())) return;
        const iconEl = parent.querySelector('img.T75of');
        const ratingEl = parent.querySelector('.w2kbF, .vlGucd .LrNMN');
        const developerEl = parent.querySelector('.wMUdtb');

        addApp(card.innerText, developerEl?.innerText, iconEl?.src, ratingEl?.innerText, parent.getAttribute('href'), 'search');
      });

      return data;
    });

    return apps;
  } finally {
    if (browser) await browser.close();
  }
}

app.get('/', (req, res) => {
  res.json({
    message: 'Play Store Scraper API',
    endpoints: {
      '/apps': 'Get all apps from main Google Play Store page',
      '/categories': 'List all available app categories',
      '/apps/:category': 'Get apps from a specific category (e.g., /apps/SOCIAL)',
      '/search': 'Search apps by query parameter (e.g., /search?q=chat)'
    }
  });
});

app.get('/categories', (req, res) => {
  const categoriesList = Object.entries(CATEGORIES).map(([key, name]) => ({
    id: key,
    name: name,
    url: `https://play.google.com/store/apps/category/${key}`,
    api: `http://localhost:${PORT}/apps/${key}`
  }));

  res.json({
    count: categoriesList.length,
    categories: categoriesList
  });
});

app.get('/apps', async (req, res) => {
  try {
    const apps = await scrapePage('https://play.google.com/store/apps');
    res.json({ count: apps.length, apps });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/apps/:category', async (req, res) => {
  const category = req.params.category.toUpperCase();

  if (!CATEGORIES[category]) {
    return res.status(400).json({
      error: 'Invalid category',
      validCategories: Object.keys(CATEGORIES)
    });
  }

  try {
    const url = `https://play.google.com/store/apps/category/${category}`;
    const apps = await scrapePage(url);
    res.json({
      category: CATEGORIES[category],
      categoryId: category,
      source: url,
      count: apps.length,
      apps
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({
      error: 'Missing search query',
      usage: '/search?q=your+search+term'
    });
  }

  try {
    const url = `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps`;
    const apps = await scrapePage(url);
    res.json({
      query: query,
      source: url,
      count: apps.length,
      apps
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/apps/details', async (req, res) => {
  const appId = req.query.id;

  if (!appId) {
    return res.status(400).json({
      error: 'Missing app id',
      usage: '/apps/details?id=com.example.app'
    });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const url = `https://play.google.com/store/apps/details?id=${appId}`;
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for content
    try {
      await page.waitForSelector('h1, .Fd93Bb, .AfwpI', { timeout: 15000 });
    } catch (e) {
      // Continue anyway
    }

    const appDetails = await page.evaluate(() => {
      const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || null;
      const getAttr = (sel, attr) => document.querySelector(sel)?.getAttribute(attr) || null;
      const getSrc = (sel) => document.querySelector(sel)?.src || null;

      // Try multiple selectors for each field
      const title = getText('h1 span, .Fd93Bb.Ydn0vb, .AfwpI') || getText('h1');
      const developer = getText('[itemprop="author"] [itemprop="name"], .Vbfug span, a[href^="/store/apps/dev"], .gppmL');
      const rating = getText('[itemprop="ratingValue"], .TT9eCd, div[aria-label*="star"]') || getText('.gLFyf');
      const reviews = getText('[itemprop="ratingCount"], .g1rdde');
      const description = getText('[itemprop="description"] [data-g-id="description"], .bARER, div[itemprop="description"]') || getText('[data-g-id="description"]');
      const icon = getSrc('img[itemprop="image"], img.T75of.sHb2Xb, img.T75of.AG5UC');
      const genre = getText('[itemprop="genre"], a[href*="/store/apps/category/"]') || getText('a[href*="/store/apps/category/"]');
      const price = getText('[itemprop="price"], .VfPpfd.VixbEe span');
      const installs = getText('div:contains("Downloads") + div, div:contains("Installs") + div');

      // Screenshots
      const screenshots = Array.from(document.querySelectorAll('img[itemprop="screenshot"], img.T75of.K9W4j, img.T75of.lxGQyd')).map(img => img.src);

      return {
        title,
        developer,
        rating,
        reviews,
        description,
        icon,
        genre,
        price,
        installs,
        screenshots: screenshots.slice(0, 10)
      };
    });

    res.json({
      appId: appId,
      source: url,
      details: appDetails
    });
  } catch (error) {
    console.error('Details scraping error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/apps`);
  console.log(`Try: http://localhost:${PORT}/categories`);
  console.log(`Try: http://localhost:${PORT}/apps/SOCIAL`);
  console.log(`Try: http://localhost:${PORT}/search?q=chat`);
});
