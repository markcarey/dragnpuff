// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IERC721 {
    function safeMint(address _to) external;
    function safeMintBatch(address _to, uint256 _count) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract Airdrop is AccessControl {
    IERC721 public nftContract;
    uint256 public airdropMaxTokenId;
    mapping(uint256 => bool) public airdropped;

    constructor(IERC721 _nftContract, uint256 _airdropMaxTokenId) {
        nftContract = _nftContract;
        airdropMaxTokenId = _airdropMaxTokenId;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function claimAirdrop(uint256 tokenId) public {
        require (tokenId > 200, "Airdrop: tokenId must be greater than 200");
        require(!airdropped[tokenId], "Airdrop: already claimed");
        airdropped[tokenId] = true;
        // require that they own the tokenId already
        require(nftContract.ownerOf(tokenId) == msg.sender, "Airdrop: must own tokenId to claim airdrop");
        require(tokenId <= airdropMaxTokenId, "Airdrop: tokenId must be less than max airdrop tokenId");
        nftContract.safeMint(msg.sender);
    }

    
}