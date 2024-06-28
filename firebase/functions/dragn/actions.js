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
  

const ethers = require("ethers");

const util = require("./util");

module.exports = {

    "fire": async function(req) {
        return new Promise(async function(resolve, reject) {
            await util.validateAirstackREST(req);
            var frame = {};
            frame.id = "Breathe Fire";
            frame.square = true;
            frame.postUrl = `https://api.dragnpuff.xyz/api/frames/house/fire`;
            var state;
            if ("state" in req.body.untrustedData) {
                state = JSON.parse(decodeURIComponent(req.body.untrustedData.state));
            } else {
                state = {
                    "method": "start"
                };
            }
            log("fire: state", state);
            log("fire: req.body.untrustedData", req.body.untrustedData);
            // get fid:
            const breatherFid = req.body.untrustedData.fid;
            log("fire: breatherFid", breatherFid);
            // get target fid
            const targetFid = parseInt(req.params.fid);
            log("fire: targetFid", targetFid);
            // if no targetFid
            if (!targetFid) {
                frame.imageText = "Install Breathe Fire cast action";
                frame.buttons = [
                    {
                        "label": "Install",
                        "action": "link",
                        "target": "https://warpcast.com/~/add-cast-action?url=https%3A%2F%2Fdragnpuff.xyz%2Fapi%2Factions%2Ffire"
                    }
                ];
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }   
            // check if breatherFid is in a house
            const breatherHouse = await util.houseForFid(breatherFid);
            log("fire: breatherHouse", breatherHouse);
            if (!breatherHouse) {
                frame.imageText = "You are not in a House.\n\nAll must choose.";
                frame.postUrl = `https://api.dragnpuff.xyz/api/frames/choose`;
                frame.buttons = [
                    {
                        "label": "Choose",
                        "action": "post"
                    }
                ];
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            // check if targetFid is in a house
            const targetHouse = await util.houseForFid(targetFid);
            log("fire: targetHouse", targetHouse);
            if (!targetHouse) {
                frame.imageText = "Target is not in a House.\n\nAll must choose.";
                frame.postUrl = `https://api.dragnpuff.xyz/api/frames/choose`;
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            } else {
                if (breatherHouse.id == targetHouse.id) {
                    frame.imageText = "You can't breathe fire on your own House!";
                    frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                    delete frame.imageText;
                    return resolve(frame);
                } else {
                    frame.image = `https://dragnpuff.xyz/img/house-of-${targetHouse.id}-fire.gif`;
                    // cast it button
                    frame.buttons = [
                        {
                            "label": "Cast It!",
                            "action": "link",
                            "target": `https://warpcast.com/~/compose?text=${encodeURIComponent(`I just breathed fire on ${targetHouse.name}!`)}&embeds[]=https://dragnpuff.xyz/house/fire/${targetHouse.id}`
                        }
                    ];
                } // if breatherHouse
            } // if targetHouse
            frame.state = state;
            return resolve(frame);
        }); // return new Promise
    }, // fire

    "mint": async function(req) {
        return new Promise(async function(resolve, reject) {
            await util.validateAirstackREST(req);
            var frame = {};
            frame.id = "mint";
            frame.square = true;
            frame.postUrl = `https://api.dragnpuff.xyz/api/frames/mint`;

            // TEMP: remove this later for launch
            //frame.imageText = "Hold yer DragN fire!!\nYou are too early!";
            //frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
            //delete frame.imageText;
            //return resolve(frame);
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
            log("mint: req.body.untrustedData", req.body.untrustedData);
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
                var holding = false;
                holding = await util.isHODLing(frameResult.action.interactor);
                if ( holding || (fid == 403090) ) {
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
                state.quantity = parseInt(req.body.untrustedData.inputText ? req.body.untrustedData.inputText : 1);
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
                        //if (castFid != 8685 && castFid != 309710) {
                        if (castFid != 1 && castFid != 0) {
                            // cast not authored by @markcarey or TODO: update this later from referral credit
                            log("mint: valid referralFid", castFid);
                            referralFid = castFid;
                            await util.referral({
                                "castFid": castFid,
                                "round": 13,
                                "fid": fid,
                                "tokenId": state.tokenId
                            });
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

    "flex": async function(req) {
        return new Promise(async function(resolve, reject) {
          await util.validateAirstackREST(req);
          var frame = {};
          frame.id = `DragNPuffFlex`;
          frame.square = true;
          frame.postUrl = `https://dragnpuff.xyz/api/frames/flex`;
          var state;
          if ("state" in req.body.untrustedData) {
            state = JSON.parse(decodeURIComponent(req.body.untrustedData.state));
          } else {
            state = {
              "index": 0
            };
          }
          state.index = parseInt(state.index);
          var fid = req.body.untrustedData.fid;
          if (req.params.session) {
            fid = req.params.session;
          }
          if ("tokenIds" in state) {
            // no-op
          } else {
            const tokens = await util.dragnsForFid(fid);
            // for loop through tokens array
            var tokenIds = [];
            for (var i = 0; i < tokens.length; i++) {
              tokenIds.push(tokens[i].tokenId);
            }
            state.tokenIds = tokenIds;
          }
          console.log("state", JSON.stringify(state));
          // if zero tokens
          if (state.tokenIds.length == 0) {
            frame.imageText = "You do not own any DragNs. Sad face.";
            frame.postUrl = `https://dragnpuff.xyz/api/frames/mint`;
            frame.buttons = [
              {
                "label": "Get Yours",
                "action": "post"
              },
              {
                "label": "Cast It!",
                "action": "link",
                "target": `https://warpcast.com/~/compose?text=${encodeURIComponent('The DragNs have arrived. Have you minted yours?')}&embeds[]=https://dragnpuff.xyz` 
              }
            ];
            return resolve(frame);
          }
          const tokenId = state.tokenIds[state.index];
    
          frame.image = `https://dragnpuff.xyz/thumbs/1024/${tokenId}.png`;
          frame.buttons = [
            {
              "label": `Flex #${state.tokenIds[state.index]}`,
              "action": "link",
              "target": `https://warpcast.com/~/compose?text=${encodeURIComponent(`Behold my DragN #${state.tokenIds[state.index]}!`)}&embeds[]=https://dragnpuff.xyz/token/${state.tokenIds[state.index]}`
            }
          ];
          // add First button if not first token
          if (state.index == state.tokenIds.length - 1) {
            frame.buttons.push(
              {
                "label": "First",
                "action": "post"
              }
            );
            state.index = 0;
          } else {
            // add next button if not last token
            if (state.index < state.tokenIds.length - 1) {
              frame.buttons.push(
                {
                  "label": "Next",
                  "action": "post"
                }
              );
              state.index += 1;
            }
          }
          frame.state = state;
          return resolve(frame);
        }); // return new Promise
      }, // flex

    "choose": async function(req) {
        return new Promise(async function(resolve, reject) {
            await util.validateAirstackREST(req);
            const firestore = getFirestore();
            var frame = {};
            frame.id = "All Must Choose";
            frame.square = true;
            frame.postUrl = `https://api.dragnpuff.xyz/api/frames/choose`;
            var state;
            if ("state" in req.body.untrustedData) {
                state = JSON.parse(decodeURIComponent(req.body.untrustedData.state));
            } else {
                state = {
                    "method": "check"
                };
            }
            log("choose: state", state);
            const fid = req.body.untrustedData.fid;
            const frameResult = await util.validate(req);
            log("choose: frameResult", frameResult);
            if (frameResult.valid == false) {
                frame.imageText = "I'm sorry, I couldn't validate this frame.";
                frame.image = `https://frm.lol/api/dragnpuff/frimg/choose/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            state.username = frameResult.action.interactor.username;
            const choicesDocRef = firestore.collection("choices").doc(fid.toString());
            const choiceDoc = await choicesDocRef.get();
            if (choiceDoc.exists) {
                state.house = choiceDoc.data().choice;
                frame.imageText = `You have chosen ${state.house}!\n\nCast your choice!`;
                frame.buttons = [
                    {
                        "label": "Cast It!",
                        "action": "link",
                        "target": `https://warpcast.com/~/compose?text=${encodeURIComponent(`I choose ${state.house}! All must choose.`)}&embeds[]=https://dragnpuff.xyz/house/${state.house}`
                    }
                ];
                frame.image = `https://frm.lol/api/dragnpuff/frimg/choose/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            const stats = await util.pledgeStats(fid);
            log("choose: stats", stats);
            if (stats.dragns == 0) {
                frame.imageText = "I'm sorry, you don't own any DragNs.";
                frame.buttons = [
                    {
                        "label": "Mint",
                        "action": "post",
                        "postUrl": "https://api.dragnpuff.xyz/api/frames/mint"
                    }
                ];
                frame.image = `https://frm.lol/api/dragnpuff/frimg/choose/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            state.nomBalance = await util.nomBalance(frameResult.action.interactor);
            log("choose: nomBalance", state.nomBalance);
            if (state.method == "check") {
                frame.imageText = `Choose wisely, ${state.username}!\nYou have ${stats.dragns} DragN`;
                if (stats.dragns > 1) {
                    frame.imageText += "s";
                }
                // if stats.houses.length <= 4 then one button for each house
                if ( (stats.houses.length > 0) && (stats.houses.length <= 4) ) {
                    state.chooseType = "buttons";
                    frame.buttons = [];
                    for (var i = 0; i < stats.houses.length; i++) {
                        frame.buttons.push({
                            "label": stats.houses[i],
                            "action": "post"
                        });
                    }
                } else {
                    state.chooseType = "input";
                    frame.imageText += `\nChoose one of `;
                    if (stats.houses.length == 0) {
                        // create an arrays of the values of the pledge object
                        stats.houses = Object.values(util.houses.pledge);
                    }
                    for (var i = 0; i < stats.houses.length; i++) {
                        frame.imageText += `${stats.houses[i]}`;
                        if (i < stats.houses.length - 1) {
                            frame.imageText += ", ";
                        }
                    } // for i
                    frame.textField = "Enter the house you choose";
                    frame.buttons = [
                        {
                            "label": "Choose",
                            "action": "post"
                        }
                    ];
                }
                state.method = "chosen";
            } else if (state.method == "chosen") {
                if (state.chooseType == "input") {
                    state.house = req.body.untrustedData.inputText;
                } else {
                    // button index chosen
                    state.house = stats.houses[req.body.untrustedData.buttonIndex - 1];
                }
                log("choose: state.house", state.house);
                // get house doc from firestore in collection houses
                const houseRef = firestore.collection("houses").doc(state.house);
                const houseDoc = await houseRef.get();
                if (!houseDoc.exists) {
                    frame.imageText = `I'm sorry, I couldn't find the house ${state.house}`;
                    frame.image = `https://frm.lol/api/dragnpuff/frimg/choose/${encodeURIComponent(frame.imageText)}.png`;
                    delete frame.imageText;
                    return resolve(frame);
                }
                const houseData = houseDoc.data();
                log("choose: houseData", houseData);
                // update house doc in firestore
                var nomPoints = 0;
                // 1 nomPoint for every 100,000 in nomBalance:
                //nomPoints = Math.floor(state.nomBalance / 100000);
                const houseUpdate = {
                    "dragns": FieldValue.increment(stats.dragns),
                    "rarity": FieldValue.increment(stats.rare),
                    "nom": FieldValue.increment(state.nomBalance),
                    "total": FieldValue.increment(stats.dragns + stats.rare + nomPoints),
                    "fids": FieldValue.arrayUnion(fid)
                };
                await houseRef.update(houseUpdate);
                // add choices doc in firestore
                stats.choice = state.house;
                await choicesDocRef.set(stats);
                frame.imageText = `You have chosen ${state.house}!\n\nCast your choice!`;
                frame.buttons = [
                    {
                        "label": "Cast It!",
                        "action": "link",
                        "target": `https://warpcast.com/~/compose?text=${encodeURIComponent(`I choose ${state.house}! All must choose.`)}&embeds[]=https://dragnpuff.xyz/house/${state.house}`
                    }
                ];
                state.method = "cast";
            } // if state.method
            frame.state = state;
            frame.image = `https://frm.lol/api/dragnpuff/frimg/choose/${encodeURIComponent(frame.imageText)}.png`;
            delete frame.imageText;
            return resolve(frame);
        }); // return new Promise
    }, // choose

    "pixelnounsAirdrop": async function(req) {
        return new Promise(async function(resolve, reject) {
            await util.validateAirstackREST(req);
            var frame = {};
            frame.id = "pixelnounsAirdrop";
            frame.square = true;
            frame.postUrl = `https://api.dragnpuff.xyz/api/frames/pixelnounsAirdrop`;
            var state;
            if ("state" in req.body.untrustedData) {
                state = JSON.parse(decodeURIComponent(req.body.untrustedData.state));
            } else {
                state = {
                    "method": "check"
                };
            }
            //console.log("mint: state", JSON.stringify(state));
            log("drop: state", state);
            log("drop: req.body.untrustedData", req.body.untrustedData);
            // get fid:
            const fid = req.body.untrustedData.fid;
            const frameResult = await util.validate(req);
            console.log("mint: frameResult", JSON.stringify(frameResult));
            if (frameResult.valid == false) {
                frame.imageText = "I'm sorry, I couldn't validate this frame.";
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            state.username = frameResult.action.interactor.username;
            const ownsDragN = await util.ownsDragN(frameResult.action.interactor);
            if (!ownsDragN) {
                frame.imageText = "I'm sorry, you don't own a DragN.";
                frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
                delete frame.imageText;
                return resolve(frame);
            }
            await util.referral({
                "castFid": fid,
                "round": 13,
                "fid": 69420,
                "tokenId": 0
            });
            frame.buttons = [
                {
                    "label": "Cast It!",
                    "action": "link",
                    "target": `https://warpcast.com/~/compose?text=${encodeURIComponent(`I just claimed the DragN x Pixel Nouns airdrop! All DragN'Puff owners are eligible. No snapshot, it's not too late to mint a DragN.`)}&embeds[]=https://dragnpuff.xyz/pixel`
                }
            ];
            frame.imageText = `Boom!\nYour Pixel Noun\nwill be dropped on\nDegen Chain`;
            frame.image = `https://frm.lol/api/dragnpuff/frimg/${encodeURIComponent(frame.imageText)}.png`;
            delete frame.imageText;
            return resolve(frame);
        }); // return new Promise
    }, // pixelnounsAirdrop


}; // module.exports