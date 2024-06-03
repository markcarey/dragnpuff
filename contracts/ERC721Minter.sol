// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IERC721 {
    function safeMint(address _to) external;
    function safeMintBatch(address _to, uint256 _count) external;
}

contract ERC721Minter is AccessControl {
    address payable public feeRecipient;
    uint256 public mintFee;
    IERC721 public nftContract;

    constructor(IERC721 _nftContract, address payable _feeRecipient, uint256 _mintFee) {
        nftContract = _nftContract;
        feeRecipient = _feeRecipient;
        mintFee = _mintFee;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address _to) public payable {
        require(msg.value >= mintFee, "ERC721Minter: insufficient value");
        nftContract.safeMint(_to);
        _distributeFees();
    }

    function mintBatch(address _to, uint256 _count) public payable {
        require(msg.value >= mintFee * _count, "ERC721Minter: insufficient value");
        nftContract.safeMintBatch(_to, _count);
        _distributeFees();
    }

    function setFeeRecipient(address payable _FeeRecipient) public onlyRole(DEFAULT_ADMIN_ROLE) {
        feeRecipient = _FeeRecipient;
    }

    function setMintFee(uint256 _mintFee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        mintFee = _mintFee;
    }

    function _distributeFees() internal {
        // TODO: split between multiple team members??
        feeRecipient.transfer(address(this).balance);
    }
}