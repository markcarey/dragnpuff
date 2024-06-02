const logger = require("firebase-functions/logger");

const express = require("express");
const api = express();
const cors = require("cors");

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

module.exports.api = api;