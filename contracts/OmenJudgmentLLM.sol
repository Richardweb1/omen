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

/// @title OmenJudgmentLLM
/// @notice Evaluates trust verdicts using Ritual's LLM precompile (0x0802)
contract OmenJudgmentLLM {

    enum Verdict { UNSEEN, SEALED, PENDING, REVOKED, LAPSED }

    address constant LLM_PRECOMPILE  = 0x0000000000000000000000000000000000000802;
    address constant RITUAL_WALLET   = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;

    struct VerdictObject {
        Verdict  verdict;
        string   domain;
        uint256  evaluatedAt;
        uint256  revision;
        string   reasoning;
        string   attestation;
        bool     llmEvaluated;
    }

    mapping(address => mapping(string => VerdictObject)) public verdicts;
    mapping(address => mapping(string => uint256)) public revisionCount;

    address public executor;
    address public registry;
    address public owner;

    event VerdictIssued(address indexed subject, string domain, Verdict verdict, uint256 revision, bool llmEvaluated);

    modifier onlyOwner() {
        require(msg.sender == owner, "OmenLLM: not owner");
        _;
    }

    constructor(address _registry, address _executor) {
        owner    = msg.sender;
        registry = _registry;
        executor = _executor;
    }

    function depositFees() external payable {
        (bool ok,) = RITUAL_WALLET.call{value: msg.value}(
            abi.encodeWithSignature("deposit(uint256)", 5000)
        );
        require(ok, "Deposit failed");
    }

    function evaluateWithLLM(
        address   subject,
        string    calldata domain,
        uint256[] calldata features,
        string    calldata reasoning
    ) external {
        string memory prompt = _buildPrompt(subject, domain, features);
        string memory messagesJson = string(abi.encodePacked(
            '[{"role":"system","content":"You are a trust evaluator for onchain agents on Ritual chain. Respond with exactly one word: SEALED, PENDING, or REVOKED. Then a newline and one sentence of reasoning."},',
            '{"role":"user","content":"', prompt, '"}]'
        ));

        bytes memory input = abi.encode(
            executor,
            new bytes[](0),
            uint256(300),
            new bytes[](0),
            bytes(""),
            messagesJson,
            "zai-org/GLM-4.7-FP8",
            int256(0),
            "",
            false,
            int256(4096),
            "",
            "",
            uint256(1),
            true,
            int256(0),
            "medium",
            bytes(""),
            int256(-1),
            "auto",
            "",
            false,
            int256(700),
            bytes(""),
            bytes(""),
            int256(-1),
            int256(1000),
            "",
            false,
            abi.encode("", "", "")
        );

        (bool success, bytes memory result) = LLM_PRECOMPILE.call(input);

        Verdict v;
        string memory llmReasoning = reasoning;
        bool llmEvaluated = false;

        if (success && result.length > 0) {
            try this._decodeAndParse(result) returns (string memory completion, bool hasError) {
                if (!hasError && bytes(completion).length > 0) {
                    v = _parseVerdict(completion);
                    llmReasoning = completion;
                    llmEvaluated = true;
                } else {
                    v = _evaluateDeterministic(domain, features);
                }
            } catch {
                v = _evaluateDeterministic(domain, features);
            }
        } else {
            v = _evaluateDeterministic(domain, features);
        }

        _issueVerdict(subject, domain, v, llmReasoning, llmEvaluated);
    }

    function _decodeAndParse(bytes calldata result) external pure returns (string memory completion, bool hasError) {
        (, bytes memory actualOutput) = abi.decode(result, (bytes, bytes));
        bytes memory modelMeta;
        string memory errorMsg;
        bytes memory completionData;
        bytes memory convoHistoryBytes;
        (hasError, completionData, modelMeta, errorMsg, convoHistoryBytes) =
            abi.decode(actualOutput, (bool, bytes, bytes, string, bytes));
        if (!hasError && completionData.length > 0) {
            (, , , , , , , bytes[] memory choicesData,) =
                abi.decode(completionData, (string, string, uint256, string, string, string, uint256, bytes[], bytes));
            if (choicesData.length > 0) {
                (, , bytes memory messageData) = abi.decode(choicesData[0], (uint256, string, bytes));
                (,completion,,,) = abi.decode(messageData, (string, string, string, uint256, bytes[]));
            }
        }
    }

    function evaluateDeterministic(
        address   subject,
        string    calldata domain,
        uint256[] calldata features,
        string    calldata reasoning
    ) external {
        Verdict v = _evaluateDeterministic(domain, features);
        _issueVerdict(subject, domain, v, reasoning, false);
    }

    function _buildPrompt(address subject, string memory domain, uint256[] memory features)
        internal pure returns (string memory)
    {
        if (keccak256(bytes(domain)) == keccak256(bytes("counterparty_trust.ritual_trade_v1"))) {
            return string(abi.encodePacked(
                "Wallet ", _addressToString(subject), " on Ritual chain. ",
                "tx_count:", _uintToString(features[0]),
                " failed_tx:", _uintToString(features[1]),
                " unbounded_approvals:", _uintToString(features[3]),
                " flagged:", _uintToString(features[4]),
                ". Should agents trust this wallet for trading? Reply SEALED, PENDING, or REVOKED."
            ));
        }
        return string(abi.encodePacked(
            "Agent ", _addressToString(subject), " on Ritual chain. ",
            "unauthorized_attempts:", _uintToString(features[2]),
            " anomaly_score:", _uintToString(features[4]),
            ". Should this agent act autonomously? Reply SEALED, PENDING, or REVOKED."
        ));
    }

    function _parseVerdict(string memory response) internal pure returns (Verdict) {
        bytes memory r = bytes(response);
        if (r.length >= 6) {
            if (r[0] == 'S' && r[1] == 'E' && r[2] == 'A') return Verdict.SEALED;
            if (r[0] == 'R' && r[1] == 'E' && r[2] == 'V') return Verdict.REVOKED;
            if (r[0] == 'P' && r[1] == 'E' && r[2] == 'N') return Verdict.PENDING;
        }
        return Verdict.UNSEEN;
    }

    function _evaluateDeterministic(string memory domain, uint256[] memory features)
        internal pure returns (Verdict)
    {
        bytes32 d = keccak256(bytes(domain));
        if (d == keccak256(bytes("counterparty_trust.ritual_trade_v1"))) {
            if (features.length < 5) return Verdict.UNSEEN;
            if (features[4] > 0 || features[3] > 5)              return Verdict.REVOKED;
            if (features[1] > 0 && features[1] >= features[0]/3) return Verdict.PENDING;
            if (features[0] >= 10)                                return Verdict.SEALED;
            return Verdict.PENDING;
        }
        if (d == keccak256(bytes("agent_safety.ritual_infernet_v1"))) {
            if (features.length < 5) return Verdict.UNSEEN;
            if (features[2] > 0 || features[4] >= 70) return Verdict.REVOKED;
            if (features[4] >= 30)                    return Verdict.PENDING;
            return Verdict.SEALED;
        }
        return Verdict.UNSEEN;
    }

    function _issueVerdict(address subject, string memory domain, Verdict verdict, string memory reasoning, bool llmEvaluated) internal {
        uint256 revision = revisionCount[subject][domain] + 1;
        revisionCount[subject][domain] = revision;
        verdicts[subject][domain] = VerdictObject({
            verdict: verdict, domain: domain,
            evaluatedAt: block.timestamp, revision: revision,
            reasoning: reasoning,
            attestation: llmEvaluated ? "llm:zai-org/GLM-4.7-FP8:ritual-tee" : "deterministic",
            llmEvaluated: llmEvaluated
        });
        if (registry != address(0)) {
            IOmenRegistry(registry).updateVerdict(subject, domain, uint8(verdict), block.timestamp, reasoning);
        }
        emit VerdictIssued(subject, domain, verdict, revision, llmEvaluated);
    }

    function getVerdict(address subject, string calldata domain) external view returns (
        uint8 verdict, uint256 evaluatedAt, uint256 revision,
        string memory reasoning, string memory attestation, bool llmEvaluated
    ) {
        VerdictObject memory v = verdicts[subject][domain];
        return (uint8(v.verdict), v.evaluatedAt, v.revision, v.reasoning, v.attestation, v.llmEvaluated);
    }

    function setExecutor(address _executor) external onlyOwner { executor = _executor; }
    function setRegistry(address _registry) external onlyOwner { registry = _registry; }
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0));
        owner = newOwner;
    }

    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0'; str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2]   = alphabet[uint8(uint160(addr) >> (4*(19-i))) & 0xf];
            str[3+i*2]   = alphabet[uint8(uint160(addr) >> (4*(19-i)-4+4)) & 0xf];
        }
        return string(str);
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value; uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) { digits--; buffer[digits] = bytes1(uint8(48 + value % 10)); value /= 10; }
        return string(buffer);
    }
}