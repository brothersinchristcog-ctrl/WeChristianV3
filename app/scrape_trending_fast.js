const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeFast() {
  let currentMaster = JSON.parse(fs.readFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', 'utf-8'));
  
  const { data } = await axios.get('https://christianlyricz.com/sitemap.xml');
  const matches = data.match(/<loc>(.*?)<\/loc>/g) || [];
  let links = [];
  for (let m of matches) {
    let url = m.replace('<loc>', '').replace('</loc>', '');
    if (url.includes('/lyrics/') || url.split('/').length > 4) {
      links.push(url);
    }
  }
  
  links = [...new Set(links)].slice(0, 250); // Get top 250
  
  const promises = links.map(url => axios.get(url).then(res => {
      const $ = cheerio.load(res.data);
      const title = $('h1').first().text().trim();
      if (!title) return null;
      
      let lyrics = '';
      $('p').each((idx, el) => {
         const p = $(el).text().trim();
         if (p && p.length > 20 && !p.toLowerCase().includes('copyright')) {
           lyrics += p + '\n\n';
         }
      });
      lyrics = lyrics.trim();
      if (!lyrics) return null;
      
      return {
          title: title,
          titleTe: title, 
          lyrics: lyrics,
          category: 'Trending Songs',
          isDefault: true,
          createdAt: new Date().toISOString()
      };
  }).catch(() => null));
  
  const results = await Promise.all(promises);
  
  for(const s of results) {
     if(s) {
        // Simple dedupe
        const exists = currentMaster.find(m => m.title === s.title);
        if(!exists) currentMaster.push(s);
     }
  }
  
  fs.writeFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', JSON.stringify(currentMaster, null, 2));
  console.log('Successfully saved to master_songs.json! Total songs:', currentMaster.length);
}

scrapeFast();
