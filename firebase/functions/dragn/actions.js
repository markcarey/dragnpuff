const {getStorage} = require("firebase-admin/storage");
const {getFirestore} = require("firebase-admin/firestore");
const {
    log,
    info,
    debug,
    warn,
    error,
    write,
} = require("firebase-functions/logger");
  

const ethers = require("ethers");

const util = require("./util");

module.exports = {

    "mint": async function(req) {
        return new Promise(async function(resolve, reject) {
            await util.validateAirstackREST(req);
            var frame = {};
            frame.id = "mint";
            frame.square = true;
            frame.postUrl = `https://api.dragnpuff.xyz/api/frames/mint`;

            // TEMP: TODO: remove this later for launch
            frame.imageText = "Hold yer DragN fire!!\nYou are too early!";
            frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
            delete frame.imageText;
            return resolve(frame);
            // end TEMP

            var state;
            if ("state" in req.body.untrustedData) {
                state = JSON.parse(decodeURIComponent(req.body.untrustedData.state));
            } else {
                state = {
                    "method": "quantity"
                };
            }
            //console.log("mint: state", JSON.stringify(state));
            log("mint: state", state);
            // get fid:
            const fid = req.body.untrustedData.fid;
            // get cast author fid
            const castFid = req.body.untrustedData.castId.fid;
            console.log("mint: referral castFid", castFid);
            const frameResult = await util.validate(req);
            console.log("mint: frameResult", JSON.stringify(frameResult));
            if (frameResult.valid == false) {
                frame.imageText = "I'm sorry, I couldn't validate this frame.";
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            state.username = frameResult.action.interactor.username;
            var address = util.farcasterVerifiedAddress(frameResult.action.interactor);
            log("mint: address", address);
            if (!address) {
                frame.imageText = "I'm sorry, I couldn't find your verified ETH address.";
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            state.address = address;
            if (state.method == "quantity") {
                var priceEth;
                var canMint = false;
                if ( await util.isHODLer(address) ) {
                    priceEth = util.constants.HOLDER_PRICE_STRING;
                    //priceEth = ethers.utils.parseEther(util.constants.HOLDER_PRICE);
                    frame.imageText = `You have 100K $NOM: Mint for ${priceEth} ETH each`;
                    canMint = true;
                } else {
                    priceEth = util.constants.PUBLIC_PRICE_STRING;
                    if (util.constants.PUBLIC_MINT) {
                        frame.imageText = `Mint for ${priceEth} ETH each`;
                        canMint = true;
                    } else {
                        frame.imageText = `Minting is open for 100K $NOM holders only\nFOMO? Buy $NOM!`;
                    }
                }
                state.priceEth = priceEth;
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
                state.method = "mint";
            } else if(state.method == "mint") {
                // quanity is in req.body.untrustedData.input
                state.quantity = parseInt(req.body.untrustedData.inputText);
                frame.imageText = `Minting ${state.quantity} for ${state.priceEth} ETH each`;
                frame.buttons = [
                    {
                        "label": "Mint",
                        "action": "tx",
                        "target": `https://api.dragnpuff.xyz/api/txn/mint/${state.address}/${state.quantity}`
                    }
                ];
                state.method = "minted";
            } else if (state.method == "minted") {
                

                if ("transactionId" in state) {
                    // they minted
                    if ("tokenId" in state) {
                      // no-op
                    } else {
                      // get tokenId from transactionId
                      state.tokenId = await util.getTokenIdFromTransactionId(state.transactionId);
                      console.log("mint: state.tokenId", state.tokenId);
                    } // if tokenId
                    if (state.tokenId > 0) {
                      // get the metadata
                      try {
                        frame.image = `https://api.dragnpuff.xyz/thumbs/1024/${state.tokenId}.png`;
                        frame.buttons = [
                          {
                            "label": "Cast It!",
                            "action": "link",
                            "target": `https://warpcast.com/~/compose?text=${encodeURIComponent(`I just minted DragN'Puff #${state.tokenId}`)}&embeds[]=https://dragnpuff.xyz/token/${state.tokenId}`
                          }
                        ];
                        state.method = "done";
                        var referralFid;
                        if (castFid != 8685) {
                            // cast not authored by @markcarey or TODO: update this later from referral credit
                            referralFid = castFid;
                        } // if castFid
                        await util.pubMint({
                            "contractAddress": process.env.DRAGNPUFF_CONTRACT,
                            "quantity": state.quantity,
                            "transactionId": state.transactionId,
                            "referralFid": referralFid,
                            "fid": fid,
                            "username": state.username,
                            "tokenId": state.tokenId
                        });
                      } catch (e) {
                        frame.imageText = `Mint in progress...`;
                        frame.buttons = [
                          {
                            "label": "Refresh",
                            "action": "post",
                          }
                        ];
                        state.method = "minted";
                      } // try
                    } else {
                      frame.imageText = `Mint in progress...`;
                      frame.buttons = [
                        {
                          "label": "Refresh",
                          "action": "post",
                        }
                      ];
                      state.method = "minted";
                    } // if transactionId
                  } else {
                    if ("transactionId" in req.body.untrustedData) {
                      state.transactionId = req.body.untrustedData.transactionId;
                      frame.imageText = `Mint in progress...`;
                      frame.buttons = [
                        {
                          "label": "Refresh",
                          "action": "post",
                        }
                      ];
                      state.method = "minted";
          
                      var referralFid;
                      if (castFid != 8685) {
                        // cast not authored by @markcarey or TODO: update this later from referral credit
                        referralFid = castFid;
                      } // if castFid
                    } // if transactionId
                } // if transactionId
            } // if state.method
            frame.state = state;
            if ("image" in frame) {
                // no-op
              } else {
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
            } // if image
            return resolve(frame);
        }); // return new Promise
    }, // mint

    "mintTxn": async function(address, quantity) {
        return new Promise(async function(resolve, reject) {
            const txn = await util.mintTxnJSON(address, quantity);  
            return resolve(txn);
        }); // return new Promise
    }, // mintTxn

}; // module.exports