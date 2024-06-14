const fs = require('node:fs');
const ethers = require('ethers');
const sharp = require('sharp');

var seen = {};
var dupeCount = 0;

var tokenId = 0;

if (false) {
    for (let i = 1; i <= 56; i++) {
        const files = fs.readdirSync(`src/${i}/metadata`);
        files.forEach(file => {
            // parse contents as json
            var meta = JSON.parse(fs.readFileSync(`src/${i}/metadata/${file}`));
            // log the metadata
            //console.log(meta);
            const attributes = meta.attributes;
            // concatenate the attribute values to form a string of values only
            const values = meta.attributes.map(attr => attr.value).join('::');
            //console.log(values);
            // hash of the values using ethers.js
            //const hash = ethers.utils.id(values);
            // if the values are not in the seen object, add them
            if (!seen[values]) {
                seen[values] = true;
                tokenId++;
                meta.name = `DragN'Puff #${tokenId}`;
                meta.edition = tokenId;
                // create a new file for the tokenId inside the assets/build/meta/ directory with meta as contents
                fs.writeFileSync(`build/meta/${tokenId}.json`, JSON.stringify(meta, null, 2));
                // copy and rename the image file to the assets/build/images/ directory
                fs.copyFileSync(`src/${i}/images/${file.replace('json', 'png')}`, `build/images/${tokenId}.png`);
                console.log(`created ${tokenId}`);
            } else {
                // if the values are already in the seen object, log the file name
                console.log(`duplicate found for /${i}/${file}`, values);
                dupeCount++;
            } // end if !seen
        });
    }
}

const top = JSON.parse(fs.readFileSync('top.json'));

if (false) {
    // top array from top.json file
    
    console.log(top.length);
    top.forEach(async (tokenId) => {
        const meta = JSON.parse(fs.readFileSync(`build/meta/${tokenId}.json`));
        meta.top = true;
        meta.oldEdition = meta.edition;
        fs.writeFileSync(`build/meta/${tokenId}.json`, JSON.stringify(meta, null, 2));
        console.log(`topped ${tokenId}`);
    });
}


// array from promoted.json file
const promoted = JSON.parse(fs.readFileSync('promoted.json'));
//console.log(promoted.length);
// array from demoted.json file
const demoted = JSON.parse(fs.readFileSync('demoted.json'));
//console.log(demoted.length);

if (false)  {
    for (let i = 0; i < promoted.length; i++) {
        // swap promoted[i] for demoted[i]
        const promoteMeta = JSON.parse(fs.readFileSync(`build/meta/${promoted[i]}.json`));
        const demoteMeta = JSON.parse(fs.readFileSync(`build/meta/${demoted[i]}.json`));
        promoteMeta.oldEdition = promoteMeta.edition;
        demoteMeta.oldEdition = demoteMeta.edition;
        promoteMeta.edition = demoted[i];
        demoteMeta.edition = promoted[i];
        promoteMeta.Status = 'Promoted';
        demoteMeta.Status = 'Demoted';
        fs.writeFileSync(`build/newmeta/${demoted[i]}.json`, JSON.stringify(promoteMeta, null, 2));
        fs.writeFileSync(`build/newmeta/${promoted[i]}.json`, JSON.stringify(demoteMeta, null, 2));
        console.log(`swapped ${promoted[i]} with ${demoted[i]}`);
        // now swap the images
        fs.copyFileSync(`build/images/${promoted[i]}.png`, `build/newimages/${demoted[i]}.png`);
        fs.copyFileSync(`build/images/${demoted[i]}.png`, `build/newimages/${promoted[i]}.png`);
    }
}

// loop through the assets/build/newmeta/ directory
if (false) {
    const files = fs.readdirSync('build/newmeta');
    var topCount = 0;
    var countInTop = 0;
    var oldMetaCount = 0;
    files.forEach(file => {
        // parse the contents as json
        console.log(file);

        // if filename ends in .json
        if (!file.endsWith('.json')) {
            return;
        }


        const meta = JSON.parse(fs.readFileSync(`build/newmeta/${file}`));
        if (meta.top) {
            topCount++;
            // if meta.top included in top array
            if (top.includes(meta.oldEdition.toString())) {
                countInTop++;
            }
            // read oldEdition.json from build/meta
            const oldMeta = JSON.parse(fs.readFileSync(`build/meta/${meta.oldEdition}.json`));
            if (oldMeta.top) {
                oldMetaCount++;
                delete oldMeta.top;
                //fs.writeFileSync(`build/meta/${meta.oldEdition}.json`, JSON.stringify(oldMeta, null, 2));
            }
        }
    });
    console.log('topCount', topCount);
    console.log('countInTop', countInTop);
    console.log('oldMetaCount', oldMetaCount);
}

if (false) {

    var count = 0;

    var newTop = [];

    for (let i = 1; i <= 21182; i++) {
        // read meta file from build/meta/i.json
        const meta = JSON.parse(fs.readFileSync(`build/meta/${i}.json`));
        // if meta.top is true
        if (meta.top) {
            // if meta.top is included in top array
            count++;
            console.log(i);
            newTop.push(i);
        }
    }

    for (let i = 0; i < newTop.length; i++) {
            const promoteMeta = JSON.parse(fs.readFileSync(`build/meta/${newTop[i]}.json`));
            const demoteMeta = JSON.parse(fs.readFileSync(`build/meta/${i+2}.json`));
            promoteMeta.oldEdition = promoteMeta.edition;
            demoteMeta.oldEdition = demoteMeta.edition;
            promoteMeta.edition = i+2;
            demoteMeta.edition = newTop[i];
            promoteMeta.Status = 'Promoted';
            demoteMeta.Status = 'Demoted';
            fs.writeFileSync(`build/newmeta/${i+2}.json`, JSON.stringify(promoteMeta, null, 2));
            fs.writeFileSync(`build/newmeta/${newTop[i]}.json`, JSON.stringify(demoteMeta, null, 2));
            console.log(`swapped ${newTop[i]} with ${i+2}`);
            // now swap the images
            fs.copyFileSync(`build/images/${i+2}.png`, `build/newimages/${newTop[i]}.png`);
            fs.copyFileSync(`build/images/${newTop[i]}.png`, `build/newimages/${i+2}.png`);
    }

} // end if false

if (false) {
    var count = 0;
    for (let i = 1; i <= 21182; i++) {
        // read meta file from build/meta/i.json
        const meta = JSON.parse(fs.readFileSync(`build/meta/${i}.json`));
        // if meta.top is true
        if (meta.top) {
            // if meta.top is included in top array
            delete meta.top;
        }
        if ("Status" in meta) {
            delete meta.Status;
        }
        if ("oldEdition" in meta) {
            delete meta.oldEdition;
        }
        // set name to DragN'Puff #i
        meta.name = `DragN'Puff #${i}`;
        // write meta to build/meta/i.json
        fs.writeFileSync(`build/meta/${i}.json`, JSON.stringify(meta, null, 2));
        count++;
        console.log(i);
    } // end for        
} // end if true

if (false) {
    const sizes = [1024, 512, 256, 128, 64];
    for (let i = 20000; i <= 21182; i++) {
        const image = fs.readFileSync(`build/images/${i}.png`);
        for (let size of sizes) {
            sharp(image)
                .resize(size, size)
                .toFile(`build/thumbs/${size}/${i}.png`, (err, info) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log(info);
                });
        }
    }
}

if (true) {
    var count = 0;
    for (let i = 1; i <= 21182; i++) {
        // read meta file from build/meta/i.json
        const meta = JSON.parse(fs.readFileSync(`build/meta/${i}.json`));
        // set image to DragN'Puff #i
        meta.image = `https://api.dragnpuff.xyz/images/${i}.png`;
        // write meta to build/meta/i.json
        fs.writeFileSync(`build/meta/${i}.json`, JSON.stringify(meta, null, 2));
        count++;
        console.log(i);
    } // end for        
} // end if true



//console.log('count', count);