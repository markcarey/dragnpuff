// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IERC721 {
    function safeMint(address _to) external;
    function safeMintBatch(address _to, uint256 _count) external;
}
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract ERC721Minter is AccessControl {
    uint256 public mintFeeHolder;
    uint256 public mintFeePublic;
    IERC721 public nftContract;
    IERC20 public tokenContract;
    uint256 public minHoldings = 100000 ether; // erc20 token, not ETH
    bool public publicMintingEnabled;

    constructor(IERC721 _nftContract, IERC20 _tokenContract, uint256 _mintFeeHolder, uint256 _mintFeePublic) {
        nftContract = _nftContract;
        mintFeeHolder = _mintFeeHolder;
        mintFeePublic = _mintFeePublic;
        tokenContract = _tokenContract;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address _to) public payable {
        require(msg.value >= _mintFee(), "ERC721Minter: insufficient value");
        nftContract.safeMint(_to);
        _distributeFees();
    }

    function mintBatch(address _to, uint256 _count) public payable {
        require(msg.value >= _mintFee() * _count, "ERC721Minter: insufficient value");
        nftContract.safeMintBatch(_to, _count);
        _distributeFees();
    }

    function setMintFeeHolder(uint256 _mintFeeHolder) public onlyRole(DEFAULT_ADMIN_ROLE) {
        mintFeeHolder = _mintFeeHolder;
    }
    function setMintFeePublic(uint256 _mintFeePublic) public onlyRole(DEFAULT_ADMIN_ROLE) {
        mintFeePublic = _mintFeePublic;
    }
    function setMinHoldings(uint256 _minHoldings) public onlyRole(DEFAULT_ADMIN_ROLE) {
        minHoldings = _minHoldings;
    }

    function startPublicMint() public onlyRole(DEFAULT_ADMIN_ROLE) {
        publicMintingEnabled = true;
    }

    function _mintFee() internal view returns (uint256) {
        if (tokenContract.balanceOf(msg.sender) >= minHoldings) {
            return mintFeeHolder;
        } else {
            require(publicMintingEnabled, "you are too early");
            return mintFeePublic;
        }
    }

    function _distributeFees() internal {
        uint256 balance = address(this).balance;
        payable(0x940D162F72BbA2BFB9B88bC80a2Cd42e9819D39F).transfer(balance * 70 / 100);
        payable(0x152d26e87155F56E5f686287690E33df9c23AEfc).transfer(balance * 20 / 100);
        payable(0x51660a105B84fc9C9DFDeA1285f6649F2d482c45).transfer(balance * 5 / 100);
        payable(0xA9a3266f73D629C19189F461ac8cA42801B2288c).transfer(balance * 5 / 100);
    }
}