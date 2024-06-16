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

//const fetch = require("node-fetch");
const fetch = require("node-fetch");
const ethers = require("ethers");
const {PubSub} = require("@google-cloud/pubsub");
const pubsub = new PubSub();

const DragNPuffJSON = require("./abis/DragNPuff.json");
const MinterJSON = require("./abis/ERC721Minter.json");
const erc20JSON = require("./abis/IERC20.json");

const MIN_HOLDINGS = ethers.BigNumber.from("100000000000000000000000"); // 100,000 NOM
const HOLDER_PRICE_STRING = "0.0042";
const HOLDER_PRICE = ethers.utils.parseEther(HOLDER_PRICE_STRING);
const PUBLIC_PRICE_STRING = "0.0069"
const PUBLIC_PRICE = ethers.utils.parseEther(PUBLIC_PRICE_STRING);
const PUBLIC_MINT = true;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

function hexStringToUint8Array(hexstring) {
    return new Uint8Array(
        hexstring.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
}

module.exports = {

    "constants": {  
        "MIN_HOLDINGS": MIN_HOLDINGS,
        "HOLDER_PRICE": HOLDER_PRICE,
        "HOLDER_PRICE_STRING": HOLDER_PRICE_STRING,
        "PUBLIC_PRICE": PUBLIC_PRICE,
        "PUBLIC_PRICE_STRING": PUBLIC_PRICE_STRING,
        "PUBLIC_MINT": PUBLIC_MINT
    }, // constants

    "isHODLing": async function(user) {
        const util = module.exports;
        return new Promise(async function(resolve, reject) {
            var hodling = false;
            var addresses = [];
            if ("verified_addresses" in user) {
                if ("eth_addresses" in user.verified_addresses) {
                    addresses = user.verified_addresses.eth_addresses;
                }
            } // if verified_addresses
            for (let i = 0; i < addresses.length; i++) {
                if (await util.isHODLer(addresses[i])) {
                    hodling = true;
                    break;
                } // if isHODLer
            } // for
            return resolve(hodling);
        }); // return new Promise
    }, // isHODLing

    "isHODLer": async function(address) {
        const util = module.exports;
        return new Promise(async (resolve, reject) => {
            var hodler = false;
            log("isHODLer?", address);
            if (!address) {
                return resolve(hodler);
            }
            // nom contract
            const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL_BASE);
            const nom = new ethers.Contract(process.env.NOM_CONTRACT, erc20JSON.abi, provider);
            var balance = await nom.balanceOf(address);
            // if balance greater or equal to 100,000 NOM (18 decimals):
            if (balance.gte(MIN_HOLDINGS)) {
                hodler = true;
            }
            return resolve(hodler);
        });
    }, // isHODLer

    "mintTxnJSON": async function(address, quantity) {
        const util = module.exports;
        return new Promise(async function(resolve, reject) {
            const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL_BASE);
            const minter = new ethers.Contract(process.env.DRAGNPUFF_MINTER, MinterJSON.abi, provider);
            var value = PUBLIC_PRICE.mul(quantity);
            if (await util.isHODLer(address)) {
                value = HOLDER_PRICE.mul(quantity);
            }
            var calldata;
            if (quantity == 1) {
                calldata = minter.interface.encodeFunctionData("mint", [address]);
            } else {
                calldata = minter.interface.encodeFunctionData("mintBatch", [address, quantity]);
            }
            const tx = {
                "chainId": "eip155:8453", // Base chainId
                "method": "eth_sendTransaction",
                "attribution": false,
                "params": {
                    "to": process.env.DRAGNPUFF_MINTER,
                    "abi": MinterJSON.abi,
                    "data": calldata,
                    "value": value._hex
                }
            };
            return resolve(tx);
        }); // return new Promise
    }, // mintTxnJSON

    "isMinted": async function(tokenId) {
        const util = module.exports;
        return new Promise(async function(resolve, reject) {
            const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL_BASE);
            const nft = new ethers.Contract(process.env.DRAGNPUFF_CONTRACT, DragNPuffJSON.abi, provider);
            var minted = false;
            try {
                minted = await nft.exists(tokenId);
            } catch (err) {
                console.error(err);
            }
            return resolve(minted);
        }); // return new Promise
    }, // isMinted

    "getTokenIdFromTransactionId": async function(transactionId) {
        const util = module.exports;
        return new Promise(async function(resolve, reject) {
            // get the transaction id
            var tokenId = 0;
            const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL_BASE);
            const tx = await provider.getTransaction(transactionId);
            const recipient = tx.from;
            const contract = new ethers.Contract(process.env.DRAGNPUFF_CONTRACT, DragNPuffJSON.abi, provider);
            let minted = contract.filters.Transfer(null, recipient);
            var start = 15664844;
            if (tx.blockNumber) {
                start = tx.blockNumber;
            }
            let mintedLogs = await contract.queryFilter(minted, start, "latest");
            console.log(JSON.stringify(mintedLogs));
            for (let m = 0; m < mintedLogs.length; m++) {
                console.log("minted", JSON.stringify(mintedLogs[m]));
                tokenId = parseInt(mintedLogs[m].args[2]);
                console.log("tokenId from logs is " + parseInt(tokenId));
            }
            return resolve(parseInt(tokenId));
        }); // return new Promise
    }, // getTokenIdFromTransactionId

    "sendCast": async function(cast) {
        const util = module.exports;
        return new Promise(async function(resolve, reject) {
            var response = await fetch(`https://api.neynar.com/v2/farcaster/cast`, { 
                method: 'POST', 
                headers: {
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'Api_key': process.env.NEYNAR_API_KEY
                },
                body: JSON.stringify(cast)
            });
            var castResult = await response.json();
            console.log("neynar POST cast", JSON.stringify(castResult));
            return resolve(castResult);
        }); // return new Promise
    }, // sendCast

    "pubMint": async function(data) {
        return new Promise(async function(resolve, reject) {
            const topic = pubsub.topic('dragn-mint');
            const messageBody = JSON.stringify(data);
            const buffer = Buffer.from(messageBody);
            topic.publishMessage({"data": buffer});
            return resolve(1);
        }); // return new Promise
    }, // pubMint

    "referral": async function(data) {
        return new Promise(async function(resolve, reject) {
            log("referral", data);
            const topic = pubsub.topic('dragn-referral');
            const messageBody = JSON.stringify(data);
            const buffer = Buffer.from(messageBody);
            topic.publishMessage({"data": buffer});
            return resolve(1);
        }); // return new Promise
    }, // referral

    "getFCUserbyFid": async function(fid) {
        return new Promise(async function(resolve, reject) {
            var response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}&viewer_fid=8685`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Api_key': process.env.NEYNAR_API_KEY
                }
            });
            var userResult = await response.json();
            console.log("neynar user/bulk", JSON.stringify(userResult));
            var user;
            if ("users" in userResult) {
                user = userResult.users[0];
            }
            return resolve(user);
        }); // return new Promise
    }, // getFCUserbyFid

    "frameHTML": async function(frame) {
        //console.log("build html for frame", JSON.stringify(frame));
        log("frame", frame);
        const util = module.exports;
        return new Promise(async function(resolve, reject) { 
            var html = '';
            var h1 = frame.id;
            if ("h1" in frame) {
                h1 = frame.h1;
            }
            var buttons = '';
            var textField = '';
            // for loop through frame.buttons array
            if ("buttons" in frame) {
                for (let i = 0; i < frame.buttons.length; i++) {
                  buttons += `<meta name="fc:frame:button:${i+1}" content="${frame.buttons[i].label}" />`;
                  buttons += `<meta name="fc:frame:button:${i+1}:action" content="${frame.buttons[i].action}" />`;
                  if (frame.buttons[i].action == "link" || frame.buttons[i].action == "tx") {
                    buttons += `<meta name="fc:frame:button:${i+1}:target" content="${frame.buttons[i].target}" />`;
                  }
                  if ("postUrl" in frame.buttons[i]) {
                    buttons += `<meta name="fc:frame:button:${i+1}:post_url" content="${frame.buttons[i].postUrl}" />`;
                  }
                }
            }
            var square = "";
            if ("image" in frame) {
                // do nothing, assumes image is already a data URI or URL
            } else {
                frame.square = true;
                if ("imageText" in frame) {
                    frame.image = await util.imageFromText(frame.imageText);
                } else {
                    frame.image = await util.imageFromText("404 - Image not found");
                } // if imageText
            } // if image
            if ("inputText" in frame) {
                textField = `<meta name="fc:frame:input:text" content="${frame.inputText}" />`;
            } else if ("textField" in frame) {
                textField = `<meta name="fc:frame:input:text" content="${frame.textField}" />`;
            } // if textField
            log("frame.image", frame.image);
            if ("square" in frame) {
                if (frame.square == true) {
                    square = `<meta name="fc:frame:image:aspect_ratio" content="1:1" />`;
                } // if square
            } // if square
            var state = "";
            if ("state" in frame) {
                const encodedState = encodeURIComponent(JSON.stringify(frame.state));
                state = `<meta name="fc:frame:state" content="${encodedState}" />`;
            }
            html = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <title>${frame.id}</title>
                    <meta charSet="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="fc:frame" content="vNext" />
                    <meta name="fc:frame:image" content="${frame.image}" />
                    <meta name="fc:frame:post_url" content="${frame.postUrl}" />
                    ${buttons}
                    ${square}
                    ${textField}
                    ${state}
                    <meta name="og:image" content="${frame.image}" />
                    <meta name="og:title" content="${frame.id}" />
                </head>

                <body>
                    <h1>${h1}</h1>
                    <div>
                    <img src="${frame.image}" width="400" />
                    </div>
                    <script>
                        // redirect to wc after 2 seconds
                        setTimeout(function() {
                            window.location.href = 'https://warpcast.com/~/channel/nomadicframe';
                        }
                        , 2000);
                    </script>
                </body>

                </html>`;
            log("buttons", buttons);
            return resolve(html);
        }); // return new Promise
    }, // frameHTML

    "farcasterVerifiedAddress": function(user) {
        var address;
        if ("verified_addresses" in user) {
            if ("eth_addresses" in user.verified_addresses) {
                if (user.verified_addresses.eth_addresses.length > 0) {
                    address = user.verified_addresses.eth_addresses[user.verified_addresses.eth_addresses.length-1];
                }
            }
        } // if verified_addresses
        return address;
    }, // farcasterVerifiedAddress

    "imageFromText": async function(text) {
        return new Promise(async function(resolve, reject) { 
            const bgImage = await getCanvasImage({"url": `https://api.dragnpuff.xyz/img/bg.png`});
            const textToImage = new UltimateTextToImage(text, {
                width: 1024,
                height: 1024,
                fontSize: 72,
                lineHeight: 96,
                bold: 400,
                fontWeight: 700,
                marginTop: 210,
                borderSize: 0,
                fontColor: "#ffffff",
                borderColor: "#A36EFD",
                fontFamily: "GeistMono",
                backgroundColor: "#000000",
                align: "center",
                valign: "top",
                images: [
                    { canvasImage: bgImage, layer: 0, repeat: "fit", x: 0, y: 0, width: 1024, height: 1024}
                ]
            }).render().toBuffer("image/png").toString("base64");
            console.log(textToImage);
            return resolve(`data:image/png;base64,${textToImage}`);
        }); // return new Promise
    }, // imageFromText

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
        return new Promise(async function(resolve, reject) {
            if (!req.body.trustedData || !req.body.trustedData.messageBytes) {
                console.log("validateAirstackREST: no messageBytes", JSON.stringify(req.body));
                return resolve({error: "no messageBytes"});
            }
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

    "nomSwapFrameHTML": function() {
        return `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Swap Bot</title>
            <meta name="description" content="swap in your social feed" />
            <meta name="fc:frame" content="vNext" />
            <meta name="fc:frame:image"
                content="https://swap.paycaster.co/api/images/tokens/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <meta name="fc:frame:input:text" content="Buy custom $NOM amount" />
            <meta name="fc:frame:image:aspect_ratio" content="1.91:1" />
            <meta name="fc:frame:button:1" content="Share &amp; Earn" />
            <meta name="fc:frame:button:1:action" content="post_redirect" />
            <meta name="fc:frame:button:1:target"
                content="https://swap.paycaster.co/api/shares/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <meta name="fc:frame:button:2" content="Buy" />
            <meta name="fc:frame:button:2:action" content="tx" />
            <meta name="fc:frame:button:2:target"
                content="https://swap.paycaster.co/api/transactions/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <meta name="fc:frame:button:2:post_url"
                content="https://swap.paycaster.co/api/watchTxs/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <meta name="fc:frame:button:3" content="0.05 ETH" />
            <meta name="fc:frame:button:3:action" content="tx" />
            <meta name="fc:frame:button:3:target"
                content="https://swap.paycaster.co/api/transactions/fe58da59-f354-4460-9f68-17135f4bc72a/0.05" />
            <meta name="fc:frame:button:3:post_url"
                content="https://swap.paycaster.co/api/watchTxs/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <meta name="fc:frame:button:4" content="0.25 ETH" />
            <meta name="fc:frame:button:4:action" content="tx" />
            <meta name="fc:frame:button:4:target"
                content="https://swap.paycaster.co/api/transactions/fe58da59-f354-4460-9f68-17135f4bc72a/0.25" />
            <meta name="fc:frame:button:4:post_url"
                content="https://swap.paycaster.co/api/watchTxs/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <meta property="og:title" content="Swap Bot" />
            <meta property="og:description" content="swap in your social feed" />
            <meta property="og:image"
                content="https://swap.paycaster.co/api/images/tokens/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Swap Bot" />
            <meta name="twitter:description" content="swap in your social feed" />
            <meta name="twitter:image"
                content="https://swap.paycaster.co/api/images/tokens/fe58da59-f354-4460-9f68-17135f4bc72a" />
            <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
            <meta name="next-size-adjust" />
        </head>
        
        <body class="__className_aaf875"><a href="https://paycaster.co/">Go to Main Page</a>
        
        </body>
        
        </html>`;
    }, // nomSwapFrameHTML

}; // module.exports

