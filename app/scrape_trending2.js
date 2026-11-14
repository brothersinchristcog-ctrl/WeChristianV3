const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeChristLyricz() {
  console.log("Fetching sitemap...");
  let links = [];
  try {
    const { data } = await axios.get('https://christianlyricz.com/sitemap.xml');
    const matches = data.match(/<loc>(.*?)<\/loc>/g) || [];
    for (let m of matches) {
      let url = m.replace('<loc>', '').replace('</loc>', '');
      if (url.includes('/lyrics/') || url.split('/').length > 4) { // typical song urls
        links.push(url);
      }
    }
  } catch(e) {
    console.error("Sitemap fail", e.message);
  }

  links = [...new Set(links)];
  console.log(`Found ${links.length} potential song links.`);
  
  let currentMaster = JSON.parse(fs.readFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', 'utf-8'));
  let newCount = 0;
  
  for (let i = 0; i < Math.min(250, links.length); i++) {
    try {
      const url = links[i];
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      
      const title = $('h1').first().text().trim();
      if (!title) continue;
      
      let lyrics = '';
      $('p').each((idx, el) => {
         const p = $(el).text().trim();
         if (p && p.length > 20 && !p.toLowerCase().includes('copyright') && !p.toLowerCase().includes('christianlyricz')) {
           lyrics += p + '\n\n';
         }
      });
      lyrics = lyrics.trim();
      if (!lyrics) continue;
      
      currentMaster.push({
          title: title,
          titleTe: title, // We can refine later
          lyrics: lyrics,
          category: 'Trending Songs',
          isDefault: true,
          createdAt: new Date().toISOString()
      });
      newCount++;
      if (newCount % 20 === 0) console.log(`Scraped ${newCount} songs...`);
      if (currentMaster.length >= 1000) break;
    } catch(e) {}
  }
  
  fs.writeFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', JSON.stringify(currentMaster, null, 2));
  console.log(`Done! Total songs is now: ${currentMaster.length}`);
}

scrapeChristLyricz();
