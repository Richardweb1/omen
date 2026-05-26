// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract OmenAgentDirect {

    address public owner;

    struct ActionRecord {
        address subject;
        string  domain;
        string  action;
        uint256 timestamp;
    }

    ActionRecord[] public history;
    uint256 public totalActions;

    event ActionExecuted(address indexed subject, string domain, string action);

    constructor() {
        owner = msg.sender;
    }

    function executeAction(
        address subject,
        string  calldata domain,
        string  calldata action
    ) external {
        history.push(ActionRecord({
            subject:   subject,
            domain:    domain,
            action:    action,
            timestamp: block.timestamp
        }));

        totalActions++;
        emit ActionExecuted(subject, domain, action);
    }

    function getHistory() external view returns (ActionRecord[] memory) {
        return history;
    }
}