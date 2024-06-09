const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DragNPuffModule", (m) => {
  const token = {
    "name": "PuffN'Drag",
    "symbol": "PUFFN",
  }; // change these for production deployment
  const fees = {
    "holder": 0.0042 * 10**18,
    "public": 0.0069 * 10**18,
  }; // confirm / change these for production deployment
  const nft = m.contract("DragNPuff", [token.name, token.symbol, process.env.DRAGNPUFF_OWNER]);
  const minter = m.contract("ERC721Minter", [nft, process.env.NOM_CONTRACT, fees.holder, fees.public], {
    after: [nft]
  });
  return { nft, minter};
});
