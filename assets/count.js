const fs = require('node:fs');

var missingCount = 0;

// loop through first 3 directoiries inside assets/src named 1 2 and 3
for (let i = 1; i <= 18957; i++) {
    console.log(i);
    // does file exist at `assets/build/meta/${i}.json`?
    if (!fs.existsSync(`assets/build/meta/${i}.json`)) {
        console.log(`missing ${i}.json`);
        missingCount++;
    }
    if (!fs.existsSync(`assets/build/images/${i}.png`)) {
        console.log(`missing ${i}.png`);
        missingCount++;
    }

}

console.log('missingCount', missingCount);