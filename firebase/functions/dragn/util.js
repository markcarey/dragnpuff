const {getStorage} = require("firebase-admin/storage");
const {getFirestore} = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const fetch = require("node-fetch");
const ethers = require("ethers");

const DragNPuffJSON = require("./abis/DragNPuff.json");
const MinterJSON = require("./abis/ERC721Minter.json");
const erc20JSON = require("./abis/IERC20.json");

// TODO: change these for production
const MIN_HOLDINGS = ethers.BigNumber.from("100000000000000000000000"); // 100,000 NOM
const HOLDER_PRICE = ethers.utils.parseEther("0.000042");
const PUBLIC_PRICE = ethers.utils.parseEther("0.000069");
const PUBLIC_MINT = false;


module.exports = {

    "constants": {  
        "MIN_HOLDINGS": MIN_HOLDINGS,
        "HOLDER_PRICE": HOLDER_PRICE,
        "PUBLIC_PRICE": PUBLIC_PRICE,
        "PUBLIC_MINT": PUBLIC_MINT
    }, // constants

    "isHODLer": async function(address) {
        const util = module.exports;
        return new Promise(async (resolve, reject) => {
            var hodler = false;
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

    "farcasterVerifiedAddress": async function(user) {
        var address;
        if ("verified_addresses" in user) {
            if ("eth_addresses" in user.verified_addresses) {
            address = user.verified_addresses.eth_addresses[user.verified_addresses.eth_addresses.length-1];
            }
        } // if verified_addresses
        return address;
    }, // farcasterVerifiedAddress

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

