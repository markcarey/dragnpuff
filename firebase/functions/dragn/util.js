const {getStorage} = require("firebase-admin/storage");
const {getFirestore} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const fetch = require("node-fetch");

module.exports = {

    "sampleUtilFunction": async function(nftContract, tokenId) {
        const util = module.exports;
        return new Promise(async (resolve, reject) => {
            try {
                // do something
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }, // sampleUtilFunction

    "validate": async function(req) {
        return new Promise(async function(resolve, reject) { 
            var body = {
                "message_bytes_in_hex": req.body.trustedData.messageBytes,
                "cast_reaction_context": true,
                "follow_context": true
              };
              var response = await fetch('https://api.neynar.com/v2/farcaster/frame/validate', { 
                method: 'POST', 
                headers: {
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'Api_key': process.env.NEYNAR_API_KEY
                },
                body: JSON.stringify(body)
              });
              var frameResult = await response.json();
              console.log(JSON.stringify(frameResult));
              return resolve(frameResult);
        }); // return new Promise
    }, // validate

    "validateAirstackREST": async function(req) {
        const util = module.exports;
        //console.log("validateAirstackREST", JSON.stringify(req.body));
        if (!req.body.trustedData || !req.body.trustedData.messageBytes) {
            console.log("validateAirstackREST: no messageBytes", JSON.stringify(req.body));
            return resolve({error: "no messageBytes"});
        }
        return new Promise(async function(resolve, reject) {
            var response = await fetch('https://hubs.airstack.xyz/v1/validateMessage', { 
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                    "x-airstack-hubs": process.env.AIRSTACK_API_KEY,
                },
                body: hexStringToUint8Array(req.body.trustedData.messageBytes),
            });
            var frameResult = await response.json();
            console.log("airstack validator", JSON.stringify(frameResult));
            return resolve(frameResult);
        }); // return new Promise
    }, // validateAirstackREST

}; // module.exports

