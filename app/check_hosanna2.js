const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://emmanuel-collection.mailchimpsites.com/songs_index').then(r => {
    const $ = cheerio.load(r.data);
    const links = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if(href && href.includes('song')) links.push({ text: $(el).text().trim(), href });
    });
    console.log(links.slice(0, 10));
}).catch(console.error);
