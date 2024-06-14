/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
//const {initializeApp} = require("firebase-admin/app");
const { getApps, initializeApp } = require("firebase-admin/app");
if (!getApps().length) initializeApp();
global.__base = __dirname + '/';
const {onRequest} = require("firebase-functions/v2/https");
const {onMessagePublished} = require("firebase-functions/v2/pubsub");
const logger = require("firebase-functions/logger");

var dragn = require(__base + 'dragn');

exports.api = onRequest({
    timeoutSeconds: 60,
    memory: "1GiB",
  },
  (req, res) => {
    return dragn.api(req, res);
}); // api

// pubsub trigger:
exports.processMint = onMessagePublished("dragn-mint", (event) => {
  return dragn.processMint(event.data.message);
}); // processMint

