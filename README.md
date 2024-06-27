# DragN'Puff

DragN'Puff is a Farcaster-first social game on Base, featuring generative artwork by @nomadicframe. Players join teams by pledging their allegience to Houses of the DragN focused on the top communities on Farcaster. Specific traits of DragN'Puff NFTs unlock access to the various Houses. The game unfolds gradually on the decentralized social landscape of Farcaster, through frames, cast actions, and other social engagement touchpoints. Gameplay stages and quests are revealed gradually to players. All must choose.

# About

DragN'Puff aims to provide community and social gaming experiences built on Farcaster and Base. Onchain assets powering these experiences include the ERC20 token $NOM and the ERC721 NFT collection DragN'Puff. The DragN'Puff NFT collection was deployed to Base Mainnet in June 2024, during the **Onchain Summer Buildathon** hackathon. The high-resolution generative art was created by @nomadicframe and features 111 uniques trait with varying rarities spanning 7 categories. While DragNs can be used as PFPs, they act primarily as a game asset for House of DragNs, a social game on Farcaster. Players pledge their DragNs to community-themes Houses (teams). Houses compete with either other through social engagement actions, including Farcaster frames, cast actions, casts, and reactions. A Leaderboard frame shows the current strength of the 7 Houses.

# How it was built

All code for DragN'Puff and House of DragNs was written duing the **Onchain Summer Buildathon** hackathon in June 2024. Artwork for the DragN'Puff NFT collection was mostly completed before the hackathon.

## Onchain - Contracts Deployed to Base

Two contracts were deployed to Base Mainnet during June 2024:

- `DragNPuff.sol` - ERC721 contract for the DragN'Puff NFT collection. Supports functions permission-gated functions `safeMint()` and `safeMintBatch()` and ERC721 votes to support future goverance voting. The contract is setup in a modular that relies on AccessControl to enabling minting via other contracts or trusted users.
- `ERC721Minter.sol` - This contract was written as the primary minting interface, supporting two price points and a pre-sale mechanism. Open for 24 hours, the presale was available to holders of 100,000+ $NOM. Now in the opublic mint phase, minters pay different prices in ETH based on their $NOM holdings.

The above structure was chosen for flexibility, as the minter contract can be replaced at any time, or a second minter contract could be added, possibly employing different mechanisms for minting (auctions, airdrops, token streaming, etc.)


# Summary

House of DragNs is social gaming experience built on Base and Farcaster. Gameplay happens via frames and other social interactions (cast actions, casts, reactions). Social sharing is facilitated and encouraged: launched only 2 weeks ago, almost 20,000 frames have been shared to date, attracting 20,000 likes, 13,000 replies, and 12,000 recasts (see Airstack Frame Analytics image attached to this submission). Beginning imminently, a campaign to attract players from other social networks will aim to use the NFT collection as a stepping stone to pull more users into the Farcaster social ecosystem, where the gameplay happens.
