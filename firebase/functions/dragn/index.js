const {getStorage} = require("firebase-admin/storage");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {
  log,
  info,
  debug,
  warn,
  error,
  write,
} = require("firebase-functions/logger");

const express = require("express");
const api = express();
const cors = require("cors");
const sharp = require("sharp");

const util = require("./util");
const actions = require("./actions");

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

module.exports.processMint = async function(message) {
  return new Promise(async function(resolve, reject) {
      log("PS: processMint message", message.json);
      const state = message.json;
      // get user from contractAddress
      var text = `DragN'Puff #${state.tokenId} was minted by @${state.username}`;
      const quoteCast =             {
        "cast_id": {
          "fid": 309710,
          "hash": "0x1d6df6f73f53635cf53f33d5c53d8feeb66edc4c",
        }
      };
      var frameURL = `https://dragnpuff.xyz/token/${state.tokenId}`;
      const cast = {
          "embeds": [
            {
              "url": frameURL,
            }
          ],
          "text": text,
          "signer_uuid": process.env.MINBOT_UUID,
          "channel_id": "nomadicframe"
      };
      log("cast", cast);
      // save it to firestore
      const db = getFirestore();
      const castRef = db.collection('casts').doc(state.contractAddress + state.tokenId);
      // does it exist?
      const doc = await castRef.get();
      if (doc.exists) {
          return 1;
      } else {
          await castRef.set(cast);
          await util.sendCast(cast);
      }
      return 1;
  }); // return promise
};

module.exports.processReferral = async function(message) {
  return new Promise(async function(resolve, reject) {
      log("PS: processReferral message", message.json);
      const state = message.json;
      // get user from contractAddress
      // fecth https://frm.lol/api/dragns/:castFid/:round/:fid
      const castFid = state.castFid;
      const round = state.round;
      const fid = state.fid;
      const tokenId = state.tokenId;
      // get User from fid
      const user = await util.getFCUserbyFid(castFid);
      // get firestore docRef for /referrals/:castFid
      const db = getFirestore();
      const docRef = db.collection("referrals").doc(castFid.toString());
      // set with merge true
      await docRef.set(
          {
            username: user.username,
            count: FieldValue.increment(1),
            tokenIds: FieldValue.arrayUnion(tokenId)
          },
          { merge: true }
      );
      const response = await fetch(`https://frm.lol/api/dragns/${castFid}/${round}/${fid}`);
      const referral = await response.json();
      log("referral", referral);
      return 1;
  }); // return promise
}; // processReferral

api.use(cors({ origin: true })); // enable origin cors

api.get(['/testing'], async function (req, res) {
  console.log("start GET /testing path", req.path);
  //res.set('Cache-Control', 'public, max-age=60, s-maxage=120');
  //res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.json({ message: 'Hello DragNs' });
  //}
}); // GET /testing

api.get(['/api/frames/top', '/api/frames/top/:fid'], async function (req, res) {
  console.log("start GET /api/frames/top path", req.path);
  const fid = req.params.fid;
  var frame = {};
  frame.id = "Top DragNs";
  frame.square = true;
  frame.postUrl = `https://api.dragnpuff.xyz/api/frames/top`;
  if (fid) {
    frame.postUrl = `https://api.dragnpuff.xyz/api/frames/top/${fid}`;
  }
  // get top dragns from firestore referrals collection by count descending
  const db = getFirestore();
  const query = db.collection("referrals").orderBy("count", "desc").limit(5);
  const querySnapshot = await query.get();
  var frameText = "Top DragNs\n";
  var rank = 1;
  querySnapshot.forEach((doc) => {
    frameText += `#${rank} - ${doc.data().username} (${doc.data().count})\n`;
    rank++;
  });
  frame.imageText = frameText;
  frame.image = `https://frm.lol/api/dragnpuff/frimg/bg2/${encodeURIComponent(frame.imageText)}.png`;
  delete frame.imageText;
  const html = await util.frameHTML(frame);
  res.send(html);
}); // GET /api/frames/top

api.post(['/api/frames/mint'], async function (req, res) {
  console.log("start POST /api/frames/mint path", req.path);
  const frame = await actions.mint(req);
  const html = await util.frameHTML(frame);
  res.send(html);
}); // POST /api/frames/mint

api.post(['/api/frames/nom'], async function (req, res) {
  console.log("start POST /api/frames/mint path", req.path);
  const html = util.nomSwapFrameHTML();
  res.send(html);
}); // POST /api/frames/mint

api.get(['/api/frames/flex'], async function (req, res) {
  console.log("start GET /api/frames/flex path", req.path);
  var frame = {};
  frame.id = "DragN Flex";
  frame.square = true;
  frame.postUrl = `https://api.dragnpuff.xyz/api/frames/flex`;
  frame.image = `https://api/dragnpuff.xyz/img/flex.png`;
  const html = await util.frameHTML(frame);
  res.send(html);
}); // GET /api/frames/flex

api.post(['/api/frames/flex'], async function (req, res) {
  console.log("start POST /api/frames/flex path", req.path);
  const frame = await actions.flex(req);
  const html = await util.frameHTML(frame);
  res.send(html);
}); // POST /api/frames/flex

api.post(['/api/txn/mint/:address/:quantity'], async function (req, res) {
  console.log("start POST /api/txn/mint/:address/:quantity path", req.path);
  var address = req.params.address;
  const quantity = parseInt(req.params.quantity);
  if ("address" in req.body.untrustedData) {
    // connected wallet address
    address = req.body.untrustedData.address;
  }
  const tx = await actions.mintTxn(address, quantity);
  res.json(tx);
}); // POST /api/txn/mint/:address/:quantity

api.get('/api/frimg/:imageText.png', async function (req, res) {
  // url decode imageText
  const imageText = decodeURIComponent(req.params.imageText);
  console.log("imageText", imageText);
  const image = await util.imageFromText(imageText)
    .catch((e) => { return res.status(404).send('Not found'); });
  //console.log("image", image);
  const img = Buffer.from(image.replace("data:image/png;base64,",""), 'base64');
  // increase cache
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86200');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  });
  return res.end(img);
}); // GET /api/frimg/:imageText.png

api.get(['/api/importmeta'], async function (req, res) {
  return res.status(404).send('Not found');
  var start = parseInt(req.query.start);
  var end = parseInt(req.query.end);
  console.log("start GET /api/importmeta path", req.path, start, end);
  const db = getFirestore();
  for (let i = start; i <= end; i++) {
    const meta = require(`./meta/${i}.json`);
    // for loop through the attributes
    // add elments for each attribute
    for (let j = 0; j < meta.attributes.length; j++) {
      meta[meta.attributes[j].trait_type] = meta.attributes[j].value;
    }
    // save meta to firestore
    const docRef = db.collection("dragns").doc(i.toString());
    await docRef.set(meta);
  }
  res.json({ message: 'Imported Meta' });
}); // GET /api/importmeta

api.get(['/api/promote/:tokenId'], async function (req, res) {
  return res.status(404).send('Not found');
  const tokenId = req.params.tokenId;
  console.log("start GET /api/promote/:tokenId path", req.path, tokenId);
  const db = getFirestore();
  const docRef = db.collection("dragns").doc(tokenId);
  if (parseInt(tokenId) <= 13579) {
    // remove Status field from doc
    await docRef.update({ "Status": "" });
  } else {
    await docRef.update({ "Status": "Promoted" });
  }
  res.json({ message: 'Promoted' });
}); // GET /api/promote/:tokenId

api.get(['/api/promote/top/:tokenId'], async function (req, res) {
  return res.status(404).send('Not found');
  const tokenId = req.params.tokenId;
  console.log("start GET /api/promote/top/:tokenId path", req.path, tokenId);
  const db = getFirestore();
  const docRef = db.collection("dragns").doc(tokenId);
  await docRef.update({ "top": true });
  res.json({ message: 'Promoted' });
}); // GET /api/promote/top/:tokenId

api.get(['/api/demote/:tokenId'], async function (req, res) {
  return res.status(404).send('Not found');
  const tokenId = req.params.tokenId;
  console.log("start GET /api/demote/:tokenId path", req.path, tokenId);
  const db = getFirestore();
  const docRef = db.collection("dragns").doc(tokenId);
  if (parseInt(tokenId) > 13579) {
    // remove Status field from doc
    await docRef.update({ "Status": "" });
  } else {
    await docRef.update({ "Status": "Demoted" });
  }
  res.json({ message: 'Demoted' });
}); // GET /api/demote/:tokenId

api.get(['/api/bullring/demote'], async function (req, res) {
  return res.status(404).send('Not found');
  const tokenId = req.params.tokenId;
  console.log("start GET /api/demote/:tokenId path", req.path, tokenId);
  const db = getFirestore();
  // query for all dragns with Piercings == Bull Ring AND Mouth == any of the following: "Normal", "Blunt", "Pipe", or "Gold Tooth"
  const query = db.collection("dragns").where("Piercings", "==", "Bull Ring").where("Mouth", "in", ["Normal", "Blunt", "Pipe", "Gold Tooth"]);
  const querySnapshot = await query.get();
  var count = 0;
  querySnapshot.forEach(async (doc) => {
    await doc.ref.update({ "Status": "Demoted" });
    count++;
  });
  res.json({ message: `Demoted ${count}` });
}); // GET /api/bullring/demote

api.get(['/api/browring/demote'], async function (req, res) {
  return res.status(404).send('Not found');
  const tokenId = req.params.tokenId;
  console.log("start GET /api/demote/:tokenId path", req.path, tokenId);
  const db = getFirestore();
  // query for all dragns with Piercings == Bull Ring AND Mouth == any of the following: "Normal", "Blunt", "Pipe", or "Gold Tooth"
  const query = db.collection("dragns").where("Piercings", "==", "Brow Rings").where("Headwear", "in", ["Mfer Cap", "Based Cap", "FC Arch Cap", "Do-Rag", "Thug Bandana", "Biker Helmet", "Headband", "Pepe Cap", "Afro"]);
  const querySnapshot = await query.get();
  var count = 0;
  querySnapshot.forEach(async (doc) => {
    await doc.ref.update({ "Status": "Demoted" });
    count++;
  });
  res.json({ message: `Demoted ${count}` });
}); // GET /api/browring/demote

api.get(['/api/top'], async function (req, res) {
  return res.status(404).send('Not found');
  console.log("start GET /api/top path", req.path);
  const db = getFirestore();
  // query for all dragns with top == true
  const query = db.collection("dragns").where("top", "==", true);
  const querySnapshot = await query.get();
  var top = [];
  querySnapshot.forEach(async (doc) => {
    top.push(doc.id);
    count++;
  });
  res.json(top);
}); // GET /api/top

api.get(['/api/demoted'], async function (req, res) {
  return res.status(404).send('Not found');
  console.log("start GET /api/top path", req.path);
  const db = getFirestore();
  // query for all dragns with top == true
  const query = db.collection("dragns").where("Status", "==", "Demoted").where("edition", "<=", 13579);
  const querySnapshot = await query.get();
  var top = [];
  querySnapshot.forEach(async (doc) => {
    top.push(doc.id);
    count++;
  });
  res.json(top);
}); // GET /api/demoted

api.get(['/api/promoted'], async function (req, res) {
  return res.status(404).send('Not found');
  console.log("start GET /api/top path", req.path);
  const db = getFirestore();
  // query for all dragns with top == true
  const query = db.collection("dragns").where("Status", "==", "Promoted");
  const querySnapshot = await query.get();
  var top = [];
  querySnapshot.forEach(async (doc) => {
    top.push(doc.id);
    count++;
  });
  res.json(top);
}); // GET /api/promoted

api.get(['/api/promotedemote/counts'], async function (req, res) {
  return res.status(404).send('Not found');
  console.log("start GET /api/promotedemote/counts path", req.path);
  var promoted = 0;
  var demoted = 0;
  var top = 0;
  const db = getFirestore();
  var query = db.collection("dragns");
  // query where Status == Promoted and edition <= 13579
  query= query.where("Status", "==", "Demoted").where("edition", "<=", 13579);
  // count the number of documents in the query
  const snapshot = await query.count().get();
  console.log(snapshot.data().count);
  demoted = snapshot.data().count;
  // query where Status == Demoted and edition > 13579
  query = db.collection("dragns").where("Status", "==", "Promoted").where("edition", ">", 13579);
  // count the number of documents in the query
  const promotedSnapshot = await query.count().get();
  console.log(promotedSnapshot.data().count);
  promoted = promotedSnapshot.data().count;
  // query where top == true
  query = db.collection("dragns").where("top", "==", true);
  // count the number of documents in the query
  const topSnapshot = await query.count().get();
  console.log(topSnapshot.data().count);
  top = topSnapshot.data().count;
  res.json({ promoted: promoted, demoted: demoted, top: top});
}); // GET /api/promotedemote/counts

api.get(['/meta/:id'], async function (req, res) {
  console.log("start GET /meta/:id path", req.path);
  const id = req.params.id;
  const isMinted = await util.isMinted(id);
  if (!isMinted) {
    return res.status(404).send('Not found');
  }
  const storage = getStorage();
  const bucket = storage.bucket("dragn-puff.appspot.com");
  const file = bucket.file(`meta/${id}.json`);
  const exists = await file.exists();
  if (!exists[0]) {
    res.status(404).send('Not found');
    return;
  }
  // Download file into memory from bucket.
  const downloadResponse = await file.download();
  const metadata = downloadResponse[0];
  //logger.log("Image downloaded!");

  res.set('Content-Type', 'application/json');
  res.set('Content-Length', metadata.length);
  // Set cache control headers
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86200');
  res.send(metadata);
}); // GET /meta/:id   

api.get(['/images/:id.png'], async function (req, res) {
  console.log("start GET /images/:id.png path", req.path);
  const id = req.params.id;
  const isMinted = await util.isMinted(id);
  if (!isMinted) {
    return res.status(404).send('Not found');
  }
  const storage = getStorage();
  const bucket = storage.bucket("dragn-puff.appspot.com");
  const file = bucket.file(`images/${id}.png`);
  const exists = await file.exists();
  if (!exists[0]) {
    res.status(404).send('Not found');
    return;
  }
  // Download file into memory from bucket.
  const downloadResponse = await file.download();
  const imageBuffer = downloadResponse[0];
  //logger.log("Image downloaded!");

    // Send cache in the response.
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86200');
    res.set('Content-Type', 'image/png');
    // TODO: Set cache control headers
    res.send(imageBuffer);
}); // GET /images/:id   

api.get(['/thumbs/:size(1024|512|256|128|64)/:id.png'], async function (req, res) {
  console.log("start GET /thumbs/:id.png path", req.path);
  const id = req.params.id;
  const isMinted = await util.isMinted(id);
  if (!isMinted) {
    return res.status(404).send('Not found');
  }
  const size = parseInt(req.params.size);
  const storage = getStorage();
  const bucket = storage.bucket("dragn-puff.appspot.com");
  const file = bucket.file(`thumbs/${size}/${id}.png`);
  const exists = await file.exists();
  if (!exists[0]) {
    res.status(404).send('Not found');
    return;
  }
  // Download file into memory from bucket.
  const downloadResponse = await file.download();
  const imageBuffer = downloadResponse[0];
  //logger.log("Image downloaded!");

    // Send cache in the response.
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86200');
    res.set('Content-Type', 'image/png');
    // TODO: Set cache control headers
    res.send(imageBuffer);
}); // GET /thumbs/:id    

api.get(['/token/:id'], async function (req, res) {
  console.log("start GET /token/:id path", req.path);
  const id = req.params.id;
  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DragN'Puff #${id}</title>
    <link rel="stylesheet" href="/css/style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="DragN'Puff #${id}">
    <link rel="icon" type="image/png" href="/img/favicon.png">

    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="https://api.dragnpuff.xyz/thumbs/1024/${id}.png" />
    <meta name="fc:frame:post_url" content="https://api.dragnpuff.xyz/api/frames/mint" />
    <meta name="fc:frame:button:1" content="Mint Yours" />
    <meta name="fc:frame:button:1:action" content="post" />
    <meta name="fc:frame:image:aspect_ratio" content="1:1" />
    <meta name="og:image" content="https://api.dragnpuff.xyz/thumbs/1024/${id}.png">
    <meta name="og:title" content="DragN'Puff #${id}" />

    <style>
        @font-face {
            font-family: SartoshiScript;
            src: url(/css/SartoshiScript-Regular.otf);
        }
        body {
            font-family: SartoshiScript;
            text-align: center;
        }
        h1 {
            font-size: 3em;
            margin: 0;
            font-weight: 800;
        }
        h3 {
            font-size: 1.5em;
            margin: 0;
            font-weight: 400;
        }
        img {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
        }   
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DragN'Puff #${id}</h1>
        </div>
        <div>
            <a href="https://warpcast.com/~/channel/nomadicframe"><img src="https://api.dragnpuff.xyz/thumbs/1024/${id}.png" alt="DragN'Puff #${id}" /></a>
        </div>
        <div class="footer">
            <p><span style="letter-spacing:0px">@~</span> 2024 DragN'Puff</p>
        </div>
    </div>
</html>
  `;
  // TODO: set cache
  //res.set('Cache-Control', 'public, max-age=60, s-maxage=120');
  res.send(html);
});

api.get(['/mint/:image', '/mint/:image/:extra'], async function (req, res) {
  console.log("start GET /mint/:image path", req.path);
  const image = req.params.image;
  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DragN'Puff</title>
    <link rel="stylesheet" href="/css/style.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="DragN'Puff">
    <link rel="icon" type="image/png" href="/img/favicon.png">

    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="https://api.dragnpuff.xyz/img/${image}" />
    <meta name="fc:frame:post_url" content="https://api.dragnpuff.xyz/api/frames/mint" />
    <meta name="fc:frame:button:1" content="Get Started" />
    <meta name="fc:frame:button:1:action" content="post" />
    <meta name="fc:frame:image:aspect_ratio" content="1:1" />
    <meta name="og:image" content="https://api.dragnpuff.xyz/img/${image}">
    <meta name="og:title" content="DragN'Puff" />

    <style>
        @font-face {
            font-family: SartoshiScript;
            src: url(/css/SartoshiScript-Regular.otf);
        }
        body {
            font-family: SartoshiScript;
            text-align: center;
        }
        h1 {
            font-size: 3em;
            margin: 0;
            font-weight: 800;
        }
        h3 {
            font-size: 1.5em;
            margin: 0;
            font-weight: 400;
        }
        img {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
        }   
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DragN'Puff</h1>
        </div>
        <div>
            <a href="https://warpcast.com/~/channel/nomadicframe"><img src="https://api.dragnpuff.xyz/img/${image}" alt="DragN'Puff" /></a>
        </div>
        <div class="footer">
            <p><span style="letter-spacing:0px">@~</span> 2024 DragN'Puff</p>
        </div>
    </div>
</html>
  `;
  // set content type
  res.set('Content-Type', 'text/html');
  return res.send(html);
}); // GET /mint/:image

api.get(['/random.png'], async function (req, res) {
    console.log("start GET /random.png path", req.path);
    // random id between 1 and 18957
    const id = Math.floor(Math.random() * 21180) + 1;
    const storage = getStorage();
    const bucket = storage.bucket("dragn-puff.appspot.com");
    const file = bucket.file(`thumbs/1024/${id}.png`);
    const exists = await file.exists();
    if (!exists[0]) {
      res.status(404).send('Not found');
      return;
    }
    // Download file into memory from bucket.
    const downloadResponse = await file.download();
    const imageBuffer = downloadResponse[0];
    //logger.log("Image downloaded!");
  
      // Send the thumbnail in the response.
      res.set('Content-Type', 'image/png');
      // TODO: Set cache control headers
      res.send(imageBuffer);
  }); // GET /random.png    

  api.get(['/api/frame/urls'], async function (req, res) {
    // return plaint text
    res.set('Content-Type', 'text/plain');
    res.send(`
    https://dragnpuff.xyz\n
    https://dragnpuff.xyz/mint/degen.gif/\n
    https://dragnpuff.xyz/mint/nom.gif/\n
    https://dragnpuff.xyz/mint/farcards.gif/\n
    https://dragnpuff.xyz/mint/perl.gif/\n
    https://dragnpuff.xyz/mint/drakula.gif/\n
    https://dragnpuff.xyz/mint/mfers.gif/\n
    https://dragnpuff.xyz/mint/nouns.gif/\n
    https://dragnpuff.xyz/mint/shitters.gif/\n
    https://dragnpuff.xyz/mint/ham.gif/\n
    https://dragnpuff.xyz/mint/based.gif/\n
    https://dragnpuff.xyz/mint/degen-gm.png/\n
    https://dragnpuff.xyz/mint/pepehat.gif/\n
    https://dragnpuff.xyz/mint/alfafrens.gif/\n
    `);
  }); // GET /api/frame/urls

module.exports.api = api;