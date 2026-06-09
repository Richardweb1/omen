// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IOmenReceiptRegistry {
    function readVerdict(address subject, string calldata domain) external view returns (
        uint8 verdict,
        uint256 timestamp,
        bool isSealed,
        bool isRevoked,
        bool isFresh
    );
}

contract OmenTrustReceipt is ERC721 {
    using Strings for uint256;
    using Strings for address;

    struct Receipt {
        address subject;
        string domain;
        uint8 status;
        address registry;
        uint256 chainId;
        uint256 mintBlockNumber;
        uint256 registryTimestamp;
        uint256 mintedAt;
        bool freshAtMint;
        address minter;
    }

    IOmenReceiptRegistry public immutable registry;
    address public immutable registryAddress;
    uint256 public immutable expectedChainId;
    uint256 public nextTokenId = 1;

    mapping(uint256 => Receipt) public receipts;

    event TrustReceiptMinted(
        uint256 indexed tokenId,
        address indexed subject,
        address indexed minter,
        string domain,
        uint8 status,
        bool freshAtMint,
        uint256 registryTimestamp
    );

    constructor(address _registry, uint256 _expectedChainId) ERC721("Omen Trust Receipt", "OMENR") {
        require(_registry != address(0), "OmenReceipt: registry required");
        registry = IOmenReceiptRegistry(_registry);
        registryAddress = _registry;
        expectedChainId = _expectedChainId;
    }

    function mint(address subject, string calldata domain) external returns (uint256 tokenId) {
        require(block.chainid == expectedChainId, "OmenReceipt: wrong chain");
        require(subject != address(0), "OmenReceipt: subject required");
        require(bytes(domain).length > 0, "OmenReceipt: domain required");

        (uint8 status, uint256 registryTimestamp,, , bool isFresh) = registry.readVerdict(subject, domain);
        require(registryTimestamp > 0, "OmenReceipt: no registry record");

        tokenId = nextTokenId++;
        receipts[tokenId] = Receipt({
            subject: subject,
            domain: domain,
            status: status,
            registry: registryAddress,
            chainId: block.chainid,
            mintBlockNumber: block.number,
            registryTimestamp: registryTimestamp,
            mintedAt: block.timestamp,
            freshAtMint: isFresh,
            minter: msg.sender
        });

        _safeMint(msg.sender, tokenId);

        emit TrustReceiptMinted(tokenId, subject, msg.sender, domain, status, isFresh, registryTimestamp);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Receipt memory receipt = receipts[tokenId];

        string memory json = string.concat(
            '{"name":"Omen Trust Receipt #',
            tokenId.toString(),
            '","description":"A registry-backed trust snapshot minted through Omen on Ritual.",',
            '"attributes":[',
            _trait("Subject", receipt.subject.toHexString()),
            ",",
            _trait("Domain", receipt.domain),
            ",",
            _trait("Trust Status", _statusName(receipt.status)),
            ",",
            _trait("Fresh At Mint", receipt.freshAtMint ? "Yes" : "No"),
            ",",
            _trait("Source", "OmenRegistry"),
            ",",
            _trait("Registry Address", receipt.registry.toHexString()),
            ",",
            _trait("Chain", "Ritual 1979"),
            ",",
            _trait("Registry Timestamp", receipt.registryTimestamp.toString()),
            ",",
            _trait("Mint Block", receipt.mintBlockNumber.toString()),
            ",",
            _trait("Minter", receipt.minter.toHexString()),
            "]}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _trait(string memory traitType, string memory value) internal pure returns (string memory) {
        return string.concat('{"trait_type":"', traitType, '","value":"', value, '"}');
    }

    function _statusName(uint8 status) internal pure returns (string memory) {
        if (status == 1) return "TRUSTED";
        if (status == 2) return "PENDING";
        if (status == 3) return "REVOKED";
        if (status == 4) return "LAPSED";
        return "UNSEEN";
    }
}
