const {getStorage} = require("firebase-admin/storage");
const {getFirestore} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const fetch = require("node-fetch");    
const { ethers } = require("hardhat");
const e = require("express");

module.exports = {

    "mint": async function(req) {
        return new Promise(async function(resolve, reject) {
            await util.validateAirstackREST(req);
            var frame = {};
            frame.id = "mint";
            frame.square = true;
            frame.postUrl = `https://api.dragnpuff.xyz/api/frames/mint`;
            var state;
            if ("state" in req.body.untrustedData) {
                state = JSON.parse(decodeURIComponent(req.body.untrustedData.state));
            } else {
                state = {
                "method": "quantity"
                };
            }
            // get fid:
            const fid = req.body.untrustedData.fid;
            // get cast author fid
            const castFid = req.body.untrustedData.castId.fid;
            console.log("mint: referral castFid", castFid);
            const frameResult = await util.validate(req);
            console.log("mint: frameResult", JSON.stringify(frameResult));
            if (frameResult.valid == false) {
                frame.imageText = "I'm sorry, I couldn't validate this frame.";
                frame.image = `https://api.dragnpuff.xyz/api/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            var address = util.farcasterVerifiedAddress(frameResult.action.interactor);
            if (!address) {
                frame.imageText = "I'm sorry, I couldn't find your verified eth address.";
                return resolve(frame);
            }
            state.address = address;
            if (state.method == "quantity") {
                var priceEth;
                var canMint = false;
                if ( util.isHODLer(address) ) {
                    priceEth = ethers.utils.parseEther(util.constants.HOLDER_PRICE);
                    frame.imageText = `You have 100K $NOM: Mint or ${priceEth.tofixed(6)} ETH each`;
                    canMint = true;
                } else {
                    priceEth = ethers.utils.parseEther(util.constants.PUBLIC_PRICE);
                    if (util.constants.PUBLIC_MINT) {
                        frame.imageText = `Mint for ${priceEth.tofixed(6)} ETH each`;
                        canMint = true;
                    } else {
                        frame.imageText = `Minting is open for 100K $NOM holders only`;
                    }
                }
                if (canMint) {
                    frame.textField = "Enter a quantity to mint";
                    frame.buttons = [
                        {
                            "label": "Next",
                            "action": "post"
                        }
                    ];
                } else {
                    frame.buttons = [
                        {
                            "label": "Buy $NOM",
                            "action": "post",
                            "postUrl": "https://api.dragnpuff.xyz/api/frames/nom"
                        }
                    ];
                }
            } // if state.method
            frame.state = state;
            frame.image = `https://api.dragnpuff.xyz/api/frimg/${encodeURIComponent(frame.imageText)}.png`;
            return resolve(frame);
        }); // return new Promise
    }, // mint

    "mintTxn": async function(req) {
        return new Promise(async function(resolve, reject) {
            // TODO: return mint txn json

        }); // return new Promise
    }, // mintTxn

}; // module.exports