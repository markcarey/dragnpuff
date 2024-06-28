# House of the DragNs
![Cover](https://dragnpuff.xyz/img/dragnpuff-cover.png)
House of the DragNs is a Farcaster-first social game on Base, featuring generative artwork by @nomadicframe. Players join teams by pledging their allegience to Houses of the DragN focused on the top communities on Farcaster. Specific traits of DragN'Puff NFTs unlock access to the various Houses. The game unfolds gradually on the decentralized social landscape of Farcaster, through frames, cast actions, and other social engagement touchpoints. Gameplay stages and quests are revealed gradually to players. All must choose.

# Try it Now: All Must Choose

- Mint: https://warpcast.com/markcarey/0x119a419a (mint via web page at https://dragnpuff.xyz/web)
- Choose: https://warpcast.com/nomadicframe/0xc9895511
- Leaderboard: https://warpcast.com/markcarey/0xe5071a30
- Breath Fire: https://warpcast.com/markcarey/0xf6664e07

# About
House of the DragNs provides a social gaming experience on Farcaster and Base. Onchain assets include the ERC20 token $NOM and the ERC721 NFT collection DragN'Puff. The NFT collection was deployed to Base Mainnet in June 2024, during the **Onchain Summer Buildathon** hackathon. The high-resolution generative art was created by @nomadicframe and features 111 uniques trait with varying rarities spanning 7 categories. While DragNs can be used as PFPs, they act primarily as a game asset for House of the DragNs, a social game on Farcaster. Players pledge their DragNs to community-themes Houses (teams). Houses compete with each other through social engagement actions, including Farcaster frames, cast actions, casts, and reactions. A Leaderboard frame shows the current strength of the 7 Houses.

## Farcaster Platform
The House of the DragNs game takes place on the Farcaster decentralized social platform, using social interactions including frames, cast actions, and more.

### Frames
- *Mint Frame*. Join the game by using this frame to mint DragN'Puff game assets.
![MInt](https://dragnpuff.xyz/img/screen-mint.png)
- *Flex Frame*. Used to flex (share) a player's DragN.
![Flex](https://dragnpuff.xyz/img/screen-flex.png)
- *Choose Frame*. Players pledge allegiance to one of the 7 Houses of the DragN using this frame. All must choose.
![Choose](https://dragnpuff.xyz/img/screen-choose.png)
- *Leaderboard Frame*. Lists the 7 Houses of the DragN with the strength scores for each.
![Flex](https://dragnpuff.xyz/img/screen-leaderboard.png)
- *Houses Frames*. Enable the players to flex/share their pledged House.
![Flex](https://dragnpuff.xyz/img/screen-house.png)
- *Dragn x Pixel Frame*. A limited time frame and mini affiliate program that rewarded DragN mint referrals with Pixel Nouns NFTs on Degen chain.
![Pixel](https://dragnpuff.xyz/img/screen-pixel.png)
- *Breathed Fire Frame*. Players can flex/share when they "breathe fire" on another house (see cast action below)
![Fire](https://dragnpuff.xyz/img/screen-fire.png)

### Cast Actions
- *Breath Fire*. After installing this cast action, Farcaster users can use it on any cast of other players from opposing Houses, to "breathe fire" on the target house.

Action:
![Breathe](https://dragnpuff.xyz/img/screen-breath.png)

Result:
![Fired](https://dragnpuff.xyz/img/f.gif)


# How it was built
All code for DragN'Puff and House of the DragNs was written duing the **Onchain Summer Buildathon** hackathon in June 2024. Artwork for the DragN'Puff NFT collection was mostly completed before the hackathon.

## Onchain - Contracts Deployed to Base
Two contracts were deployed to Base Mainnet during June 2024:

- `DragNPuff.sol` - ERC721 contract for the DragN'Puff NFT collection. Supports functions permission-gated functions `safeMint()` and `safeMintBatch()` and ERC721 votes to support future goverance voting. The contract is setup in a modular that relies on AccessControl to enabling minting via other contracts or trusted users.
- `ERC721Minter.sol` - This contract was written as the primary minting interface, supporting two price points and a pre-sale mechanism. Open for 24 hours, the presale was available to holders of 100,000+ $NOM. Now in the opublic mint phase, minters pay different prices in ETH based on their $NOM holdings.

The above structure was chosen for flexibility, as the minter contract can be replaced at any time, or a second minter contract could be added, possibly employing different mechanisms for minting (auctions, airdrops, token streaming, etc.)

## Server
Server-side elements include:

- *Firebase Functions*. Powering Farcaster frames, api endpoints, and rendering NFT metadata and images
- *Google Firestore*. Data store for gameplay scores and actions.
- *Google Cloud Storage*. Storage of high-resolution (4000px x 4000px) NFT images, thumbnails, and JSON metadata.

### 3rd Party APIs
The following were used by the Frame and Cast Action functions:

- *Airstack*. APIs for frame validation and querying for all of the DragNs owned by a speific Farcaster user.
- *Neynar*. APIs for get Farcaster user data, and to send casts of behalf of a bot user

# Summary and Stats So Far
House of the DragNs is social gaming experience built on Base and Farcaster. Gameplay happens via frames and other social interactions (cast actions, casts, reactions). Social sharing is facilitated and encouraged: launched only 2 weeks ago, almost 20,000 frames have been shared to date, attracting 20,000 likes, 13,000 replies, and 12,000 recasts (see Airstack Frame Analytics image attached to this submission). Beginning imminently, a campaign to attract players from other social networks will aim to use the NFT collection as a stepping stone to pull more users into the Farcaster social ecosystem, where the gameplay happens.

# Team

The Houses of the DragN team consists of [nomadicframe](https://warpcast.com/nomadicframe), [markcarey](https://warpcast.com/markcarey), [milibooo](https://warpcast.com/milibooo), and [midnite-marauder](https://warpcast.com/midnite-marauder)




