const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DragNPuffModule", (m) => {
  const erc721 = {
    "name": "DragN'Puff",
    "symbol": "DRAGN",
    "baseURI": "https://dragnpuff.xyz/meta/"
  }; // change these for production deployment
  const fees = {
    "holder": ethers.parseEther("0.0042"),
    "public": ethers.parseEther("0.0069"),
  }; // change these for production deployment
  const nft = m.contract("DragNPuff", [erc721.name, erc721.symbol, erc721.baseURI, process.env.DRAGNPUFF_OWNER]);
  const minter = m.contract("ERC721Minter", [nft, process.env.NOM_CONTRACT, fees.holder, fees.public], {
    after: [nft]
  });
  return { nft, minter};
});
