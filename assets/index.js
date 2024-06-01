const fs = require('node:fs');
const ethers = require('ethers');

var seen = {};
var dupeCount = 0;

var tokenId = 0;

// loop through first 3 directoiries inside assets/src named 1 2 and 3
for (let i = 1; i <= 40; i++) {
    const files = fs.readdirSync(`assets/src/${i}/metadata`);
    files.forEach(file => {
        // parse contents as json
        var meta = JSON.parse(fs.readFileSync(`assets/src/${i}/metadata/${file}`));
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
            fs.writeFileSync(`assets/build/meta/${tokenId}.json`, JSON.stringify(meta, null, 2));
            // copy and rename the image file to the assets/build/images/ directory
            fs.copyFileSync(`assets/src/${i}/images/${file.replace('json', 'png')}`, `assets/build/images/${tokenId}.png`);
            console.log(`created ${tokenId}`);
        } else {
            // if the values are already in the seen object, log the file name
            console.log(`duplicate found for /${i}/${file}`, values);
            dupeCount++;
        } // end if !seen
    });
}

console.log('dupeCount', dupeCount);