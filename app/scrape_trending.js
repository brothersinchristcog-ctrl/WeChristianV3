const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = 'https://teluguchristiansongs.in';
const output = [];

async function getLinksFromCategory(url, maxPages) {
    const links = [];
    for(let i = 1; i <= maxPages; i++) {
        try {
            const pageUrl = i === 1 ? url : `${url}page/${i}/`;
            const res = await axios.get(pageUrl);
            const $ = cheerio.load(res.data);
            $('h2.entry-title a').each((_, el) => {
                const href = $(el).attr('href');
                if (href) links.push(href);
            });
            console.log(`Fetched page ${i} from ${url}. Found ${links.length} total links.`);
        } catch(e) {
            console.log(`No more pages at ${i} for ${url}`);
            break;
        }
    }
    return links;
}

async function scrapeSong(url) {
    try {
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        
        let titleEn = '';
        let titleTe = '';
        const titleFull = $('h1.entry-title').text().trim(); // e.g. "Krupaamayuda | కృపామయుడా | Telugu Christian Song Lyrics"
        const parts = titleFull.split('|').map(s => s.trim());
        if (parts.length >= 2) {
            titleEn = parts[0];
            titleTe = parts[1];
        } else {
            const dashParts = titleFull.split('-').map(s => s.trim());
            if (dashParts.length >= 2) {
                titleEn = dashParts[0];
                titleTe = dashParts[1];
            } else {
                titleEn = titleFull;
                titleTe = titleFull;
            }
        }
        
        // Remove known suffixes
        titleEn = titleEn.replace(/Telugu Christian Song Lyrics/gi, '').replace(/Telugu Lyrics/gi, '').trim();
        titleTe = titleTe.replace(/Telugu Christian Song Lyrics/gi, '').replace(/Telugu Lyrics/gi, '').trim();
        
        let lyrics = '';
        $('.entry-content p').each((_, el) => {
            const text = $(el).text().trim();
            if (text && !text.toLowerCase().includes('song lyrics') && !text.toLowerCase().includes('hosanna')) {
                lyrics += text + '\n\n';
            }
        });
        lyrics = lyrics.trim();
        
        if (lyrics && titleEn) {
            return {
                title: titleEn,
                titleTe: titleTe,
                lyrics: lyrics,
                category: "Trending Songs", // Default
                isDefault: true,
                createdAt: new Date().toISOString()
            };
        }
    } catch(e) {
        console.error(`Error scraping ${url}: ${e.message}`);
    }
    return null;
}

async function main() {
    console.log('Fetching Hosanna Songs...');
    const hosannaLinks = await getLinksFromCategory(`${BASE_URL}/category/hosanna-ministries-songs/`, 5);
    
    console.log('Fetching Trending Songs...');
    const trendingLinks = await getLinksFromCategory(`${BASE_URL}/category/top-hit-songs/`, 15);
    
    const allLinks = [...new Set([...hosannaLinks, ...trendingLinks])];
    console.log(`Total unique links to scrape: ${allLinks.length}`);
    
    for (let i = 0; i < allLinks.length; i++) {
        const song = await scrapeSong(allLinks[i]);
        if (song) {
            output.push(song);
        }
        if (i % 20 === 0) console.log(`Scraped ${i}/${allLinks.length}...`);
        
        if (output.length >= 250) break; // Limit to 250 to ensure we hit 1000
    }
    
    fs.writeFileSync('C:\\Users\\yraje\\WeChristian2\\app\\trending_songs.json', JSON.stringify(output, null, 2));
    console.log(`Done! Scraped ${output.length} songs and saved to trending_songs.json`);
}

main();
