const {getStorage} = require("firebase-admin/storage");
const {getFirestore} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const express = require("express");
const api = express();
const cors = require("cors");
const sharp = require("sharp");

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

api.use(cors({ origin: true })); // enable origin cors

api.get(['/testing'], async function (req, res) {
  console.log("start GET /testing path", req.path);
  //res.set('Cache-Control', 'public, max-age=60, s-maxage=120');
  //res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.json({ message: 'Hello DragNs' });
  //}
}); // GET /testing

api.get(['/api/importmeta'], async function (req, res) {
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
  const tokenId = req.params.tokenId;
  console.log("start GET /api/promote/top/:tokenId path", req.path, tokenId);
  const db = getFirestore();
  const docRef = db.collection("dragns").doc(tokenId);
  await docRef.update({ "top": true });
  res.json({ message: 'Promoted' });
}); // GET /api/promote/top/:tokenId

api.get(['/api/demote/:tokenId'], async function (req, res) {
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


api.get(['/thumbs/:size(1024|512|256|128|64)/:id.png'], async function (req, res) {
  console.log("start GET /thumbs/:id.png path", req.path);
  const id = req.params.id;
  const size = parseInt(req.params.size);
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
  logger.log("Image downloaded!");

  // Generate a thumbnail using sharp.
  const thumbnailBuffer = await sharp(imageBuffer).resize({
    "width": size,
    "height": size
  }).toBuffer();
  logger.log("Thumbnail created");

    // Send the thumbnail in the response.
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86200');
    res.set('Content-Type', 'image/png');
    // TODO: Set cache control headers
    res.send(thumbnailBuffer);
}); // GET /thumbs/:id    

api.get(['/random.png'], async function (req, res) {
    console.log("start GET /random.png path", req.path);
    // random id between 1 and 18957
    const id = Math.floor(Math.random() * 18957) + 1;
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
    logger.log("Image downloaded!");
  
    // Generate a thumbnail using sharp.
    const thumbnailBuffer = await sharp(imageBuffer).resize({
      width: 512,
      height: 512
    }).toBuffer();
    logger.log("Thumbnail created");
  
      // Send the thumbnail in the response.
      res.set('Content-Type', 'image/png');
      // TODO: Set cache control headers
      res.send(thumbnailBuffer);
  }); // GET /random.png    

module.exports.api = api;