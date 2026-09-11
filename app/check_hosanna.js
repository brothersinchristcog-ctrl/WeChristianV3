const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://hosannaministries.co/hosanna-songs').then(r => {
    const $ = cheerio.load(r.data);
    const links = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if(href && href.includes('song')) links.push({ text: $(el).text().trim(), href });
    });
    console.log(links.slice(0, 50));
}).catch(console.error);
