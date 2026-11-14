const fs = require('fs');
const https = require('https');

// Note: To run this script, you will need to install cheerio:
// npm install cheerio axios firebase-admin

async function scrapeChristLyricz() {
  console.log("Starting Web Scraper for christlyricz.com...");
  console.log("Please install 'axios', 'cheerio', and 'firebase-admin' to run this script fully.");
  console.log("Example: npm install axios cheerio firebase-admin");
  
  const axios = require('axios');
  const cheerio = require('cheerio');
  const fs = require('fs');

  let masterSongs = [];
  
  try {
    console.log("Fetching song list from teluguchurch.in sitemap...");
    const { data } = await axios.get('https://teluguchurch.in/page-sitemap.xml');
    
    const regex = /<loc>(.*?)<\/loc>/g;
    const songLinks = [];
    let match;
    while ((match = regex.exec(data)) !== null) {
      const href = match[1];
      // Filter out root or generic pages, only get songs (which have long URLs)
      if (href && href.includes('teluguchurch.in') && href.length > 40) {
        songLinks.push(href);
      }
    }
    
    // Deduplicate links
    const uniqueLinks = [...new Set(songLinks)];
    
    console.log(`Found ${uniqueLinks.length} songs. Starting extraction (this will take a few minutes)...`);
    
    // 3. Visit each song page and extract data
    const limit = uniqueLinks.length;
    for (let i = 0; i < limit; i++) {
      let link = uniqueLinks[i];
      try {
        const { data: songHtml } = await axios.get(link);
        const $$ = cheerio.load(songHtml);
        
        // teluguchurch.in usually puts title in H1
        const fullTitle = $$('h1').first().text().trim();
        
        // Attempt to split "Telugu Title - English Title" or just use it
        let titleEn = fullTitle;
        let titleTe = fullTitle;
        if (fullTitle.includes('||')) {
           const parts = fullTitle.split('||');
           titleTe = parts[0].trim();
           titleEn = parts[1].trim();
        } else if (fullTitle.includes('-')) {
           const parts = fullTitle.split('-');
           titleTe = parts[0].trim();
           titleEn = parts.slice(1).join('-').trim();
        }
        
        // Lyrics are usually in entry-content paragraphs
        let lyrics = '';
        $$('.entry-content p').each((idx, pEl) => {
           lyrics += $$(pEl).text().trim() + '\n\n';
        });
        
        if (!lyrics.trim()) {
           lyrics = "Lyrics currently being updated.";
        }
        
        const songData = {
          title: titleEn || "Unknown Title",
          titleTe: titleTe,
          lyrics: lyrics.trim(),
          category: 'Stuthi Songs', // Default
          isDefault: true,
          createdAt: new Date().toISOString()
        };
        
        masterSongs.push(songData);
        console.log(`[${i+1}/${limit}] Extracted: ${titleEn}`);
        
        // Wait 300ms to avoid overloading the server
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Failed to scrape ${link}:`, err.message);
      }
    }
    
    fs.writeFileSync('master_songs.json', JSON.stringify(masterSongs, null, 2));
    console.log(`\n✅ Successfully scraped and saved ${masterSongs.length} songs to 'master_songs.json'!`);
    console.log(`Next Step: We will add a temporary button in your Admin app to upload this JSON file!`);
  } catch (error) {
    console.error("Scraping failed:", error.message);
  }
}

scrapeChristLyricz();
