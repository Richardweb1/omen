// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
}

/// @title OmenAuditGateway
/// @notice Phase 4 — Deep wallet audit powered by LLM precompile (0x0802)
contract OmenAuditGateway {

    address constant LLM_PRECOMPILE = 0x0000000000000000000000000000000000000802;
    address constant RITUAL_WALLET  = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;

    address public executor;
    address public owner;
    uint256 public auditFee = 0.01 ether;
    uint256 public totalAudits;

    struct AuditRequest {
        address requester;
        address subject;
        string  domain;
        uint256 requestedAt;
        bool    completed;
        string  report;
    }

    mapping(uint256 => AuditRequest) public audits;
    mapping(address => uint256[]) public auditsByRequester;

    event AuditRequested(uint256 indexed auditId, address indexed requester, address indexed subject);
    event AuditCompleted(uint256 indexed auditId, string report);

    modifier onlyOwner() {
        require(msg.sender == owner, "OmenAudit: not owner");
        _;
    }

    constructor(address _executor) {
        owner    = msg.sender;
        executor = _executor;
    }

    function depositFees() external payable {
        IRitualWallet(RITUAL_WALLET).deposit{value: msg.value}(10000);
    }

    function requestAudit(
        address subject,
        string calldata domain,
        uint256[] calldata features
    ) external payable returns (uint256 auditId) {
        require(msg.value >= auditFee, "OmenAudit: insufficient fee");

        auditId = totalAudits++;
        audits[auditId] = AuditRequest({
            requester:   msg.sender,
            subject:     subject,
            domain:      domain,
            requestedAt: block.timestamp,
            completed:   false,
            report:      ""
        });
        auditsByRequester[msg.sender].push(auditId);

        string memory prompt = _buildAuditPrompt(subject, domain, features);
        _callLLM(auditId, prompt);

        emit AuditRequested(auditId, msg.sender, subject);
    }

    function _buildAuditPrompt(
        address subject,
        string memory domain,
        uint256[] memory features
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "You are a blockchain security analyst. Analyze this wallet on Ritual chain.\n\n",
            "Wallet: ", _addressToString(subject), "\n",
            "Domain: ", domain, "\n\n",
            "Evidence:\n",
            "- tx_count: ", _uintToString(features.length > 0 ? features[0] : 0), "\n",
            "- failed_tx: ", _uintToString(features.length > 1 ? features[1] : 0), "\n",
            "- unique_counterparties: ", _uintToString(features.length > 2 ? features[2] : 0), "\n",
            "- unbounded_approvals: ", _uintToString(features.length > 3 ? features[3] : 0), "\n",
            "- flagged_interactions: ", _uintToString(features.length > 4 ? features[4] : 0), "\n\n",
            "Provide a security assessment with:\n",
            "1. Overall trust signal: SEALED, PENDING, or REVOKED\n",
            "2. Key risk factors identified\n",
            "3. Specific recommendations\n",
            "4. Confidence level (low/medium/high)\n\n",
            "Be concise and technical."
        ));
    }

    function _callLLM(uint256 auditId, string memory prompt) internal {
        string memory messagesJson = string(abi.encodePacked(
            '[{"role":"user","content":"', prompt, '"}]'
        ));

        bytes memory input = abi.encode(
            executor,
            new bytes[](0),
            uint256(300),
            new bytes[](0),
            bytes(""),
            messagesJson,
            "zai-org/GLM-4.7-FP8",
            int256(0), "", false, int256(4096), "", "",
            uint256(1), true, int256(0), "medium", bytes(""), int256(-1), "auto", "",
            false,
            int256(700), bytes(""), bytes(""), int256(-1), int256(1000), "",
            false,
            abi.encode(string(""), string(""), string(""))
        );

        (bool success, bytes memory result) = LLM_PRECOMPILE.call(input);

        if (success && result.length > 0) {
            try this._decodeReport(result) returns (string memory report) {
                audits[auditId].report    = report;
                audits[auditId].completed = true;
                emit AuditCompleted(auditId, report);
            } catch {
                audits[auditId].report    = "LLM evaluation completed - decode pending";
                audits[auditId].completed = true;
            }
        }
    }

    function _decodeReport(bytes calldata result) external pure returns (string memory report) {
        (, bytes memory actualOutput) = abi.decode(result, (bytes, bytes));
        bytes memory modelMeta;
        string memory errorMsg;
        bytes memory completionData;
        bool hasError;
        (hasError, completionData, modelMeta, errorMsg,) =
            abi.decode(actualOutput, (bool, bytes, bytes, string, bytes));
        if (!hasError && completionData.length > 0) {
            (, , , , , , , bytes[] memory choicesData,) =
                abi.decode(completionData, (string, string, uint256, string, string, string, uint256, bytes[], bytes));
            if (choicesData.length > 0) {
                (, , bytes memory messageData) = abi.decode(choicesData[0], (uint256, string, bytes));
                (, report,,,) = abi.decode(messageData, (string, string, string, uint256, bytes[]));
            }
        }
    }

    function getAudit(uint256 auditId) external view returns (
        address requester, address subject, string memory domain,
        uint256 requestedAt, bool completed, string memory report
    ) {
        AuditRequest memory a = audits[auditId];
        return (a.requester, a.subject, a.domain, a.requestedAt, a.completed, a.report);
    }

    function getMyAudits(address user) external view returns (uint256[] memory) {
        return auditsByRequester[user];
    }

    function setAuditFee(uint256 fee) external onlyOwner { auditFee = fee; }
    function setExecutor(address _executor) external onlyOwner { executor = _executor; }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
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

    receive() external payable {}
}
