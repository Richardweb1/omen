// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OmenRegistry {

    struct CompactVerdict {
        uint8   verdict;
        uint256 timestamp;
        string  domain;
        string  reasoning;
    }

    uint256 public constant FRESHNESS_BLOCKS = 50000;
    uint256 public constant BLOCK_TIME       = 12;

    mapping(address => mapping(string => CompactVerdict)) public verdicts;

    address public judgment;
    address public owner;

    event VerdictMirrored(address indexed subject, string domain, uint8 verdict, uint256 timestamp);

    modifier onlyAuthorized() {
        require(msg.sender == judgment || msg.sender == owner, 'OmenRegistry: not authorized');
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setJudgment(address _judgment) external {
        require(msg.sender == owner, 'OmenRegistry: not owner');
        judgment = _judgment;
    }

    function updateVerdict(
        address subject,
        string  calldata domain,
        uint8   verdict,
        uint256 timestamp,
        string  calldata reasoning
    ) external onlyAuthorized {
        verdicts[subject][domain] = CompactVerdict({
            verdict:   verdict,
            timestamp: timestamp,
            domain:    domain,
            reasoning: reasoning
        });
        emit VerdictMirrored(subject, domain, verdict, timestamp);
    }

    function readVerdict(address subject, string calldata domain) external view returns (
        uint8 verdict, uint256 timestamp, bool isSealed, bool isRevoked, bool isFresh
    ) {
        CompactVerdict memory v = verdicts[subject][domain];
        bool fresh = v.timestamp > 0 && (block.timestamp - v.timestamp) < FRESHNESS_BLOCKS * BLOCK_TIME;
        return (v.verdict, v.timestamp, v.verdict == 1, v.verdict == 3, fresh);
    }

    function previewHandshake(
        address subject,
        string  calldata domain,
        string  calldata
    ) external view returns (bool allowed, string memory reason) {
        CompactVerdict memory v = verdicts[subject][domain];
        if (v.timestamp == 0)
            return (false, 'UNSEEN: no verdict exists, build signal first');
        bool fresh = (block.timestamp - v.timestamp) < FRESHNESS_BLOCKS * BLOCK_TIME;
        if (!fresh)
            return (false, 'LAPSED: verdict too old, re-evaluate subject');
        if (v.verdict == 1) return (true,  'SEALED: subject trusted, allow');
        if (v.verdict == 3) return (false, 'REVOKED: subject unsafe, deny');
        if (v.verdict == 2) return (false, 'PENDING: inconclusive, review first');
        return (false, 'UNSEEN: no usable verdict');
    }

    function batchRead(address[] calldata subjects, string calldata domain) external view returns (
        uint8[] memory verdictList, uint256[] memory timestamps
    ) {
        verdictList = new uint8[](subjects.length);
        timestamps  = new uint256[](subjects.length);
        for (uint256 i = 0; i < subjects.length; i++) {
            CompactVerdict memory v = verdicts[subjects[i]][domain];
            verdictList[i] = v.verdict;
            timestamps[i]  = v.timestamp;
        }
    }
}