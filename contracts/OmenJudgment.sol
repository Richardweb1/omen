// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOmenRegistry {
    function updateVerdict(
        address subject,
        string calldata domain,
        uint8 verdict,
        uint256 timestamp,
        string calldata reasoning
    ) external;
}

contract OmenJudgment {

    enum Verdict { UNSEEN, SEALED, PENDING, REVOKED, LAPSED }

    struct SignalObject {
        bytes32 merkleRoot;
        uint256 startBlock;
        uint256 endBlock;
        string  domain;
        uint256 submittedAt;
        address submitter;
    }

    struct VerdictObject {
        Verdict  verdict;
        string   domain;
        uint256  evaluatedAt;
        uint256  revision;
        bytes32  signalRoot;
        string   attestation;
        string   reasoning;
    }

    mapping(address => mapping(string => SignalObject)) public signals;
    mapping(address => mapping(string => VerdictObject)) public verdicts;
    mapping(address => mapping(string => mapping(uint256 => VerdictObject))) public verdictHistory;
    mapping(address => mapping(string => uint256)) public revisionCount;

    address public registry;
    address public owner;

    event SignalSubmitted(address indexed subject, string domain, bytes32 merkleRoot, uint256 startBlock, uint256 endBlock);
    event VerdictIssued(address indexed subject, string domain, Verdict verdict, uint256 revision, string attestation);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Omen: not owner');
        _;
    }

    constructor(address _registry) {
        owner    = msg.sender;
        registry = _registry;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), 'Omen: zero address');
        owner = newOwner;
    }

    function submitSignal(
        address subject,
        string  calldata domain,
        bytes32 merkleRoot,
        uint256 startBlock,
        uint256 endBlock
    ) external {
        require(endBlock > startBlock, 'Omen: invalid block window');
        signals[subject][domain] = SignalObject({
            merkleRoot:  merkleRoot,
            startBlock:  startBlock,
            endBlock:    endBlock,
            domain:      domain,
            submittedAt: block.timestamp,
            submitter:   msg.sender
        });
        emit SignalSubmitted(subject, domain, merkleRoot, startBlock, endBlock);
    }

    function evaluateDeterministic(
        address  subject,
        string   calldata domain,
        uint256[] calldata features,
        string   calldata reasoning
    ) external {
        require(signals[subject][domain].submittedAt > 0, 'Omen: no signal found');
        Verdict v = _evaluateFeatures(domain, features);
        _issueVerdict(subject, domain, v, '', reasoning);
    }

    function issueVerdict(
        address subject,
        string  calldata domain,
        uint8   verdict,
        string  calldata attestation,
        string  calldata reasoning
    ) external onlyOwner {
        require(verdict <= 4, 'Omen: invalid verdict');
        _issueVerdict(subject, domain, Verdict(verdict), attestation, reasoning);
    }

    function _evaluateFeatures(string memory domain, uint256[] memory features) internal pure returns (Verdict) {
        bytes32 d = keccak256(bytes(domain));

        if (d == keccak256(bytes('counterparty_trust.ritual_trade_v1'))) {
            if (features.length < 5) return Verdict.UNSEEN;
            uint256 txCount   = features[0];
            uint256 failedTx  = features[1];
            uint256 unbounded = features[3];
            uint256 flagged   = features[4];
            if (txCount < 3)                                  return Verdict.UNSEEN;
            if (flagged > 0 || unbounded > 5)                 return Verdict.REVOKED;
            if (failedTx > 0 && failedTx >= txCount / 3)     return Verdict.PENDING;
            if (txCount >= 10)                                return Verdict.SEALED;
            return Verdict.PENDING;
        }

        if (d == keccak256(bytes('agent_safety.ritual_infernet_v1'))) {
            if (features.length < 5) return Verdict.UNSEEN;
            uint256 unauthorized = features[2];
            uint256 anomaly      = features[4];
            if (unauthorized > 0 || anomaly >= 70) return Verdict.REVOKED;
            if (anomaly >= 30)                     return Verdict.PENDING;
            return Verdict.SEALED;
        }

        return Verdict.UNSEEN;
    }

    function _issueVerdict(
        address subject,
        string  memory domain,
        Verdict verdict,
        string  memory attestation,
        string  memory reasoning
    ) internal {
        uint256 revision = revisionCount[subject][domain] + 1;
        revisionCount[subject][domain] = revision;

        VerdictObject memory v = VerdictObject({
            verdict:     verdict,
            domain:      domain,
            evaluatedAt: block.timestamp,
            revision:    revision,
            signalRoot:  signals[subject][domain].merkleRoot,
            attestation: attestation,
            reasoning:   reasoning
        });

        verdicts[subject][domain]                = v;
        verdictHistory[subject][domain][revision] = v;

        if (registry != address(0)) {
            IOmenRegistry(registry).updateVerdict(subject, domain, uint8(verdict), block.timestamp, reasoning);
        }

        emit VerdictIssued(subject, domain, verdict, revision, attestation);
    }

    function getVerdict(address subject, string calldata domain) external view returns (
        uint8 verdict, uint256 evaluatedAt, uint256 revision, bytes32 signalRoot, string memory reasoning, string memory attestation
    ) {
        VerdictObject memory v = verdicts[subject][domain];
        return (uint8(v.verdict), v.evaluatedAt, v.revision, v.signalRoot, v.reasoning, v.attestation);
    }

    function getSignal(address subject, string calldata domain) external view returns (
        bytes32 merkleRoot, uint256 startBlock, uint256 endBlock, uint256 submittedAt, address submitter
    ) {
        SignalObject memory s = signals[subject][domain];
        return (s.merkleRoot, s.startBlock, s.endBlock, s.submittedAt, s.submitter);
    }

    function getRevisionCount(address subject, string calldata domain) external view returns (uint256) {
        return revisionCount[subject][domain];
    }
}
