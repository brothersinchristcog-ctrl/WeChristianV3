const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeUecf() {
  let currentMaster = JSON.parse(fs.readFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', 'utf-8'));
  
  try {
      const { data } = await axios.get('https://www.uecf.net/telugusongs.html');
      const $ = cheerio.load(data);
      let links = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('lyrics/')) {
          links.push('https://www.uecf.net/' + href.replace('../', ''));
        }
      });
      
      links = [...new Set(links)]; 
      console.log('Found links:', links.length);
      
      const promises = links.slice(0, 300).map(url => axios.get(url).then(res => {
          const $$ = cheerio.load(res.data);
          const title = $$('b').first().text().trim() || $$('strong').first().text().trim() || $$('title').text().replace('Telugu Christian Songs Lyrics','').trim();
          if (!title) return null;
          
          let lyrics = '';
          $$('p').each((idx, el) => {
             const t = $$(el).text().trim();
             if (t && t.length > 30) {
               lyrics += t + '\n\n';
             }
          });
          
          if (!lyrics) return null;
          
          return {
              title: title,
              titleTe: title, 
              lyrics: lyrics.trim(),
              category: 'Hosanna Songs',
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

scrapeUecf();
