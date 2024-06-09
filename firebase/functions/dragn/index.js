const {getStorage} = require("firebase-admin/storage");
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