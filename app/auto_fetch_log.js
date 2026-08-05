const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');

console.log("Fetching URL...");
const out = execSync('eas build:view 090ca949-0409-49fd-a928-dbc07d961ec7 --json').toString();
const match = out.match(/\{[\s\S]*\}/);
const url = JSON.parse(match[0]).logFiles[0];

https.get(url, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const lines = body.split('\n');
        let found = false;
        for (let i=0; i<lines.length; i++) {
             try {
                 const p = JSON.parse(lines[i]);
                 if (p.msg && (p.msg.includes('FAILURE:') || p.msg.includes('Exception:') || p.msg.includes('What went wrong') || p.msg.includes('Execution failed for task'))) {
                     console.log("ERROR FOUND:");
                     console.log(p.msg);
                     found = true;
                     for(let j=1; j<=10 && i+j < lines.length; j++){
                         try { console.log(JSON.parse(lines[i+j]).msg); } catch(e){}
                     }
                     break;
                 }
             } catch(e) {}
        }
        if (!found) {
            console.log("No explicit failure found. Printing last 30 msgs:");
            const tail = lines.slice(-40);
            for (const t of tail) {
                try { console.log(JSON.parse(t).msg); } catch(e){}
            }
        }
    });
});
