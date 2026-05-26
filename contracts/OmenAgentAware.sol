// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOmenRegistry {
    function previewHandshake(
        address subject,
        string calldata domain,
        string calldata action
    ) external view returns (bool allowed, string memory reason);
}

contract OmenAgentAware {

    IOmenRegistry public registry;
    address public owner;

    struct HandshakeRecord {
        address subject;
        string  domain;
        string  action;
        bool    allowed;
        string  reason;
        uint256 timestamp;
    }

    HandshakeRecord[] public history;

    uint256 public allowCount;
    uint256 public denyCount;
    uint256 public totalHandshakes;

    event HandshakeExecuted(address indexed subject, string domain, string action, bool allowed, string reason);

    constructor(address _registry) {
        registry = IOmenRegistry(_registry);
        owner    = msg.sender;
    }

    function executeHandshake(
        address subject,
        string  calldata domain,
        string  calldata action
    ) external returns (bool allowed, string memory reason) {
        (allowed, reason) = registry.previewHandshake(subject, domain, action);

        history.push(HandshakeRecord({
            subject:   subject,
            domain:    domain,
            action:    action,
            allowed:   allowed,
            reason:    reason,
            timestamp: block.timestamp
        }));

        totalHandshakes++;
        if (allowed) allowCount++;
        else         denyCount++;

        emit HandshakeExecuted(subject, domain, action, allowed, reason);
    }

    function getHistory() external view returns (HandshakeRecord[] memory) {
        return history;
    }

    function getStats() external view returns (uint256 total, uint256 allowed, uint256 denied) {
        return (totalHandshakes, allowCount, denyCount);
    }
}