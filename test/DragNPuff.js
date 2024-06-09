const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
// ethers constants
const { ethers } = require("hardhat");

const erc721 = {
  "name": "PuffN'Drag",
  "symbol": "PUFFN",
}; // change these for production deployment
const fees = {
  "holder": ethers.parseEther("0.0042"),
  "public": ethers.parseEther("0.0069"),
}; // confirm / change these for production deployment
const erc20Mock = {
  "name": "Mock Nomad",
  "symbol": "mockNOM",
  "supply": 1000000000000000000000000000n,
};
console.log(fees);


describe("DragNPuff NFT", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployNFTandMinterFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, holder] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("FairToken");
    const token = await Token.deploy(erc20Mock.supply, erc20Mock.name, erc20Mock.symbol);

    const NFT = await ethers.getContractFactory("DragNPuff");
    const nft = await NFT.deploy(erc721.name, erc721.symbol, process.env.DRAGNPUFF_OWNER);

    const Minter = await ethers.getContractFactory("ERC721Minter");
    const minter = await Minter.deploy(nft.target, token.target, fees.holder, fees.public);

    // send total supply to holder
    await token.transfer(owner, 1n);
    await token.transfer(holder.address, erc20Mock.supply - 1n);

    // grant MINTER role to minter contract
    await nft.grantRole(await nft.MINTER_ROLE(), minter.target);

    return { nft, minter, token, owner, holder};

  }

  describe("Deployment", function () {
    it("Should deploy NFT and Minter", async function () {
      const { nft, minter, token, owner, otherAccount } = await loadFixture(deployNFTandMinterFixture);

      expect(await nft.owner()).to.equal(process.env.DRAGNPUFF_OWNER);
    });
  }); // end describe Deployment

  describe("Minter", function () {

    

    it("should revert trying to mint one NFT because public mint not open", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      expect(await minter.mint(process.env.DRAGNPUFF_OWNER,  { value: fees.public }))
        .to.be.revertedWith("you are too early");
    }); // end it

    it("holder should be holding token", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      expect(await token.balanceOf(holder.address)).to.be.gt(0);
    }); // end it

    it("should mint one NFT via allowlist mint", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      // send txn from holder account
      expect(await minter.connect(holder).mint(process.env.DRAGNPUFF_OWNER,  { value: fees.holder }))
        .to.emit(nft, "Transfer");
    }); // end it

    it("should start Public mint", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      const tx = await minter.startPublicMint();
      await tx.wait();
      expect(await minter.publicMintingEnabled()).to.equal(true);
    }); // end it

    it("should revert trying to mint one NFT because not holding token", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      const tx = await minter.startPublicMint();
      await tx.wait();
      // send only the holder price, but not holding
      expect(await minter.mint(process.env.DRAGNPUFF_OWNER,  { value: fees.holder }))
        .to.be.revertedWith("ERC721Minter: insufficient value");
    }); // end it

    it("should mint one NFT at public mint price", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      const tx = await minter.startPublicMint();
      await tx.wait();
      expect(await minter.mint(process.env.DRAGNPUFF_OWNER,  { value: fees.public }))
        .to.emit(nft, "Transfer");
    }); // end it

    it("should mint one NFT at holder mint price", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      const tx = await minter.startPublicMint();
      await tx.wait();
      expect(await minter.connect(holder).mint(process.env.DRAGNPUFF_OWNER,  { value: fees.holder }))
        .to.emit(nft, "Transfer");
    }); // end it

    it("should mint ten NFTs at public mint price", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      const tx = await minter.startPublicMint();
      await tx.wait();
      const count = 10n;
      const total = fees.public * count;
      expect(await minter.mintBatch(process.env.DRAGNPUFF_OWNER, count,  { value: total }))
        .to.emit(nft, "Transfer");
    }); // end it

    it("should mint eleven NFTs at holder mint price", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      const tx = await minter.startPublicMint();
      await tx.wait();
      const count = 11n;
      const total = fees.holder * count;
      expect(await minter.connect(holder).mintBatch(process.env.DRAGNPUFF_OWNER, count,  { value: total }))
        .to.emit(nft, "Transfer");
    }); // end it

    it("should distribute fees", async function () {
      const { nft, minter, token, owner, holder } = await loadFixture(deployNFTandMinterFixture);
      const tx = await minter.startPublicMint();
      await tx.wait();
      const count = 10n;
      const total = fees.public * count;
      const provider = ethers.provider;
      var balances = {
        "0x940D162F72BbA2BFB9B88bC80a2Cd42e9819D39F": await provider.getBalance("0x940D162F72BbA2BFB9B88bC80a2Cd42e9819D39F"),
        "0x152d26e87155F56E5f686287690E33df9c23AEfc": await provider.getBalance("0x152d26e87155F56E5f686287690E33df9c23AEfc"),
        "0x51660a105B84fc9C9DFDeA1285f6649F2d482c45": await provider.getBalance("0x51660a105B84fc9C9DFDeA1285f6649F2d482c45"),
        "0xA9a3266f73D629C19189F461ac8cA42801B2288c": await provider.getBalance("0xA9a3266f73D629C19189F461ac8cA42801B2288c"),
      };
      const mint = await minter.mintBatch(process.env.DRAGNPUFF_OWNER, count,  { value: total });
      await mint.wait();
      var balancesIncreaseCount = 0;
      for (const [address, balance] of Object.entries(balances)) {
        const newBalance = await provider.getBalance(address);
        if (newBalance > balance) {
          balancesIncreaseCount++;
        }
      }
      expect(balancesIncreaseCount).to.equal(4);
    }); // end it

  }); // end describe Minter

}); // end describe DragNPuff NFT
