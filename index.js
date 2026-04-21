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

    try {
      await page.waitForSelector('.us8NPb, a.Si6A0c.ZD8Cqc, a.Si6A0c.Gy4nib, .ubGTjb', { timeout: 15000 });
    } catch (e) {}

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1500));
    }

    const apps = await page.evaluate(() => {
      const data = [];
      const seen = new Set();

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

      document.querySelectorAll('.us8NPb').forEach(card => {
        const link = card.querySelector('a[href^="/store/apps/details?id="]');
        const titleEl = card.querySelector('.fkdIre, .Epkrse');
        const developerEl = card.querySelector('.bcLwIe');
        const iconEl = card.querySelector('img.T75of.nnW2Md, img.T75of.etjhNc.Q8CSx');
        const ratingEl = card.querySelector('.vlGucd .LrNMN');
        const href = link?.getAttribute('href') || card.closest('a')?.getAttribute('href');
        addApp(titleEl?.innerText, developerEl?.innerText, iconEl?.src, ratingEl?.innerText, href, 'featured');
      });

      document.querySelectorAll('a.Si6A0c.ZD8Cqc').forEach(card => {
        const titleEl = card.querySelector('.Epkrse, .fkdIre');
        const iconEl = card.querySelector('img.T75of.etjhNc.Q8CSx, img.T75of.nnW2Md');
        const ratingEl = card.querySelector('.vlGucd .LrNMN');
        addApp(titleEl?.innerText, null, iconEl?.src, ratingEl?.innerText, card.getAttribute('href'), 'grid');
      });

      document.querySelectorAll('a.Si6A0c.Gy4nib, a.Si6A0c.jEFi_q').forEach(card => {
        const titleEl = card.querySelector('.DdYX5, .Epkrse, .fkdIre, .ubGTjb');
        const iconEl = card.querySelector('img.T75of.stzEZd, img.T75of.jpDEN, img.T75of.etjhNc.Q8CSx, img.T75of.nnW2Md');
        const ratingEl = card.querySelector('.w2kbF, .vlGucd .LrNMN');
        const developerEl = card.querySelector('.wMUdtb');
        addApp(titleEl?.innerText, developerEl?.innerText, iconEl?.src, ratingEl?.innerText, card.getAttribute('href'), 'search');
      });

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
      '/search': 'Search apps by query parameter (e.g., /search?q=chat)',
      '/apps/details?id=PACKAGE_NAME': 'Get details for a specific app (e.g., /apps/details?id=com.openai.chatgpt)',
      '/apps/reviews?id=PACKAGE_NAME': 'Get ratings breakdown and reviews (e.g., /apps/reviews?id=com.openai.chatgpt)'
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
  res.json({ count: categoriesList.length, categories: categoriesList });
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

app.get('/apps/details', async (req, res) => {
  const appId = req.query.id;
  if (!appId) {
    return res.status(400).json({ error: 'Missing app id', usage: '/apps/details?id=com.example.app' });
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
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
      await page.waitForSelector('h1, .Fd93Bb, .AfwpI', { timeout: 15000 });
    } catch (e) {}

    // Scroll to load additional info section
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1000));
    }

    // Get raw HTML to parse embedded JavaScript data
    const rawHtml = await page.content();

    // Parse metadata from raw HTML (Google embeds this in script tags)
    // First, find the data block for this specific app by looking for the app ID or version block
    let appDataBlock = rawHtml;

    // Try to isolate the correct app's data by finding version block context
    const versionIdx = rawHtml.search(/\[\[\["[0-9.]+"\]\],\[\[\[/);
    if (versionIdx > 0) {
      // IAP and other metadata can be before or after version, so use a wide window
      appDataBlock = rawHtml.substring(Math.max(0, versionIdx - 15000), versionIdx + 15000);
    }

    const rawMeta = {};

    // Version pattern: [[["1.2026.104"]],[[[36]],[[[25,"7.1"]]]]]
    const versionMatch = rawHtml.match(/\[\[\["([0-9.]+)"\]\],\[\[\[/);
    if (versionMatch) rawMeta.version = versionMatch[1];

    // Requires Android pattern: [[[36]],[[[25,"7.1"]]]] -> "7.1"
    const androidMatch = rawHtml.match(/\[\[\[\d+\]\],\[\[\[\d+,\s*"([^"]+)"\]\]\]\]/);
    if (androidMatch) rawMeta.requiresAndroid = androidMatch[1] + ' and up';

    // Updated on: [["Apr 19, 2026",[1776569764,871000000]]]
    const updatedMatch = rawHtml.match(/\[\["([A-Za-z]{3}\s+\d{1,2},\s+\d{4})"\s*,\s*\[\d+,\d+\]\]\]/);
    if (updatedMatch) rawMeta.updatedOn = updatedMatch[1];

    // Released on date: ["Jul 28, 2023",[1690585517,688000000]]
    const releasedMatch = rawHtml.match(/\[\"([A-Za-z]{3}\s+\d{1,2},\s+\d{4})\"\s*,\s*\[(\d+),\d+\]\]/);
    if (releasedMatch && releasedMatch[1] !== rawMeta.updatedOn) {
      rawMeta.releasedOn = releasedMatch[1];
    }

    // In-app purchases price range (handle non-breaking spaces)
    const iapMatch = appDataBlock.match(/\["Rs\s+([\d,\s\u00a0]+-\s+Rs\s+[\d,\s\u00a0]+)\s+per\s+item"/);
    if (iapMatch) rawMeta.inAppPurchases = 'Rs ' + iapMatch[1].replace(/\u00a0/g, ' ').trim() + ' per item';

    // Content rating: "Rated for 12+"
    const contentMatch = rawHtml.match(/"Rated for (\d+\+)"/);
    if (contentMatch) rawMeta.contentRating = 'Rated for ' + contentMatch[1];

    // Downloads count: ["1,000,000,000+",1000000000,1187793083,"1B+"]
    const downloadsMatch = rawHtml.match(/\["([\d,]+\+)",\d+,\d+,\"([^\"]+)\"\]/);
    if (downloadsMatch) rawMeta.downloads = downloadsMatch[1] + ' downloads (' + downloadsMatch[2] + ')';

    // Download size: not always in server HTML, skip

    const appDetails = await page.evaluate(() => {
      const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || null;
      const getSrc = (sel) => document.querySelector(sel)?.src || null;

      // Robust label-value extractor
      const getByLabel = (label) => {
        const allEls = Array.from(document.querySelectorAll('div, span, dt, dd'));
        for (const el of allEls) {
          if (el.innerText?.trim().toLowerCase() === label.toLowerCase()) {
            const sib = el.nextElementSibling;
            if (sib && sib.innerText?.trim()) return sib.innerText.trim();
            const parentSib = el.parentElement?.nextElementSibling;
            if (parentSib && parentSib.innerText?.trim()) return parentSib.innerText.trim();
            const siblings = Array.from(el.parentElement?.children || []);
            for (const s of siblings) {
              if (s !== el && s.innerText?.trim()) return s.innerText.trim();
            }
          }
        }
        return null;
      };

      const title = getText('h1 span, .Fd93Bb.Ydn0vb, .AfwpI') || getText('h1');
      const developer = getText('[itemprop="author"] [itemprop="name"], .Vbfug span, a[href^="/store/apps/dev"]') || getByLabel('Offered by');

      const ratingEl = document.querySelector('.TT9eCd');
      const rating = ratingEl ? (ratingEl.childNodes[0]?.textContent?.trim() || ratingEl.innerText.split('\n')[0].trim()) : null;

      const reviews = getText('.wVqUob .g1rdde') || getText('[itemprop="ratingCount"]');
      const description = getText('[itemprop="description"]') || getText('[data-g-id="description"]') || getText('.bARER');
      const icon = getSrc('img[itemprop="image"], img.T75of.sHb2Xb, img.T75of.AG5UC');
      const genre = getText('[itemprop="genre"]') || getText('a[href*="/store/apps/category/"]');
      const price = getText('[itemprop="price"]') || getText('.VfPpfd.VixbEe span');

      let downloads = null;
      const downloadLabel = document.evaluate(
        "//div[contains(text(), 'Downloads') or contains(text(), 'downloads')]",
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
      ).singleNodeValue;
      if (downloadLabel) {
        const prev = downloadLabel.previousElementSibling;
        downloads = prev?.innerText?.trim() || downloadLabel.parentElement?.firstElementChild?.innerText?.trim() || null;
      }

      const screenshots = Array.from(
        document.querySelectorAll('img.T75of.B5GQxf[alt="Screenshot image"], img[data-screenshot-index]')
      )
        .map(img => {
          let url = null;
          if (img.srcset) {
            const sources = img.srcset.split(',').map(s => s.trim());
            url = sources[sources.length - 1].split(' ')[0];
          } else if (img.src) {
            url = img.src;
          }
          if (url) return url.replace(/=w\d+-h\d+-rw$/, '=w5120-h2880-rw');
          return null;
        })
        .filter(Boolean);

      return {
        title,
        developer,
        rating,
        reviews,
        description,
        icon,
        genre,
        price,
        downloads,
        screenshots
      };
    });

    // Merge raw HTML metadata with DOM data
    const merged = {
      ...appDetails,
      version: rawMeta.version || appDetails.version || null,
      updatedOn: rawMeta.updatedOn || appDetails.updatedOn || null,
      requiresAndroid: rawMeta.requiresAndroid || appDetails.requiresAndroid || null,
      inAppPurchases: rawMeta.inAppPurchases || appDetails.inAppPurchases || null,
      contentRating: rawMeta.contentRating || appDetails.contentRating || null,
      permissions: appDetails.permissions || null,
      interactiveElements: appDetails.interactiveElements || null,
      releasedOn: rawMeta.releasedOn || appDetails.releasedOn || null,
      downloadSize: rawMeta.downloadSize || appDetails.downloadSize || null,
      downloads: rawMeta.downloads || appDetails.downloads || null
    };

    res.json({ appId, source: url, details: merged });
  } catch (error) {
    console.error('Details scraping error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/apps/reviews', async (req, res) => {
  const appId = req.query.id;
  if (!appId) {
    return res.status(400).json({ error: 'Missing app id', usage: '/apps/reviews?id=com.example.app' });
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
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    try {
      await page.waitForSelector('.JzwBgb, .EGFGHd', { timeout: 15000 });
    } catch (e) {}

    // Click "See all reviews" if present
    try {
      const seeAllBtn = await page.$('button span.VfPpkd-vQzf8d');
      if (seeAllBtn) {
        const btnText = await seeAllBtn.evaluate(el => el.innerText);
        if (btnText && btnText.toLowerCase().includes('see all reviews')) {
          await seeAllBtn.click();
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } catch (e) {}

    // Scroll to load more reviews
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1500));
    }

    const reviewsData = await page.evaluate(() => {
      const result = {
        overallRating: null,
        totalReviews: null,
        ratingBreakdown: {},
        reviews: []
      };

      // Overall rating
      const ratingEl = document.querySelector('.jILTFe, .TT9eCd');
      if (ratingEl) {
        result.overallRating = ratingEl.innerText.split('\n')[0].trim();
      }

      // Total reviews
      const totalEl = document.querySelector('.EHUI5b, .g1rdde');
      if (totalEl) {
        result.totalReviews = totalEl.innerText.trim();
      }

      // Rating breakdown
      document.querySelectorAll('.JzwBgb').forEach(row => {
        const starLabel = row.querySelector('.Qjdn7d');
        const bar = row.querySelector('.RutFAf.wcB8se');
        if (starLabel && bar) {
          const stars = starLabel.innerText.trim();
          const count = bar.getAttribute('title') || bar.getAttribute('aria-label');
          const percentage = bar.style.width;
          result.ratingBreakdown[stars] = { count, percentage };
        }
      });

      // Individual reviews
      document.querySelectorAll('.EGFGHd').forEach(card => {
        const nameEl = card.querySelector('.X5PpBb');
        const dateEl = card.querySelector('.bp9Aid');
        const starsEl = card.querySelector('.iXRFPc');
        const textEl = card.querySelector('.h3YV2d');
        const helpfulEl = card.querySelector('.AJTPZc[jsname="J0d7Yd"]');
        const avatarEl = card.querySelector('.T75of.abYEib');

        const starsAria = starsEl?.getAttribute('aria-label') || '';
        const starsMatch = starsAria.match(/Rated\s+(\d)/);
        const starsGiven = starsMatch ? parseInt(starsMatch[1]) : null;

        result.reviews.push({
          reviewer: nameEl?.innerText?.trim() || null,
          avatar: avatarEl?.src || null,
          date: dateEl?.innerText?.trim() || null,
          stars: starsGiven,
          text: textEl?.innerText?.trim() || null,
          helpful: helpfulEl?.innerText?.trim() || null
        });
      });

      return result;
    });

    res.json({ appId, source: url, ...reviewsData });
  } catch (error) {
    console.error('Reviews scraping error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/apps/:category', async (req, res) => {
  const category = req.params.category.toUpperCase();
  if (!CATEGORIES[category]) {
    return res.status(400).json({ error: 'Invalid category', validCategories: Object.keys(CATEGORIES) });
  }
  try {
    const url = `https://play.google.com/store/apps/category/${category}`;
    const apps = await scrapePage(url);
    res.json({ category: CATEGORIES[category], categoryId: category, source: url, count: apps.length, apps });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing search query', usage: '/search?q=your+search+term' });
  }
  try {
    const url = `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps`;
    const apps = await scrapePage(url);
    res.json({ query, source: url, count: apps.length, apps });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/apps`);
  console.log(`Try: http://localhost:${PORT}/categories`);
  console.log(`Try: http://localhost:${PORT}/apps/SOCIAL`);
  console.log(`Try: http://localhost:${PORT}/search?q=chat`);
  console.log(`Try: http://localhost:${PORT}/apps/details?id=com.openai.chatgpt`);
});
