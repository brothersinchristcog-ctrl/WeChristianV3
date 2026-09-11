const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeGospelLyrics() {
  let currentMaster = JSON.parse(fs.readFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', 'utf-8'));
  
  try {
      const { data } = await axios.get('https://www.telugugospellyrics.com/sitemap.xml');
      const matches = data.match(/<loc>(.*?)<\/loc>/g) || [];
      let links = [];
      for (let m of matches) {
        let url = m.replace('<loc>', '').replace('</loc>', '');
        if (url.includes('.html')) {
          links.push(url);
        }
      }
      
      links = [...new Set(links)]; 
      if (links.length === 0) throw new Error("No links in sitemap.xml");
      console.log('Found links:', links.length);
      
      const promises = links.slice(0, 300).map(url => axios.get(url).then(res => {
          const $ = cheerio.load(res.data);
          const title = $('h1, h2, h3').first().text().trim();
          if (!title) return null;
          
          let lyrics = '';
          $('div, p').each((idx, el) => {
             const t = $(el).text().trim();
             if (t && t.length > 30 && t.split('\n').length > 3) {
               lyrics = t;
               return false; // break
             }
          });
          
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
      let added = 0;
      for(const s of results) {
         if(s && s.lyrics) {
            const exists = currentMaster.find(m => m.title === s.title);
            if(!exists) {
               currentMaster.push(s);
               added++;
            }
         }
      }
      
      fs.writeFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', JSON.stringify(currentMaster, null, 2));
      console.log(`Successfully added ${added} songs! Total is now ${currentMaster.length}`);
  } catch(e) {
      console.error(e.message);
  }
}

scrapeGospelLyrics();
