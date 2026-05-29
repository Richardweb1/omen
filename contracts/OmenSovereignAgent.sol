// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOmenJudgment {
    function submitSignal(
        address subject,
        string calldata domain,
        bytes32 merkleRoot,
        uint256 startBlock,
        uint256 endBlock
    ) external;

    function evaluateDeterministic(
        address subject,
        string calldata domain,
        uint256[] calldata features,
        string calldata reasoning
    ) external;
}

interface IOmenRegistry {
    function readVerdict(address subject, string calldata domain) external view returns (
        uint8 verdict,
        uint256 timestamp,
        bool isSealed,
        bool isRevoked,
        bool isFresh
    );
}

interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
}

interface IScheduler {
    function schedule(
        bytes calldata data,
        uint32 gas,
        uint32 startBlock,
        uint32 numCalls,
        uint32 frequency,
        uint32 ttl,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas,
        uint256 value,
        address payer
    ) external returns (uint256 callId);

    function cancel(uint256 callId) external;
    function approveScheduler(address schedulerContract) external;
}

/// @title OmenSovereignAgent
/// @notice Autonomous agent that refreshes trust signals on Ritual chain
/// @dev Uses Ritual Scheduler precompile to wake itself up every N blocks
contract OmenSovereignAgent {

    address constant RITUAL_WALLET = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    address constant SCHEDULER     = 0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;

    IOmenJudgment public judgment;
    IOmenRegistry public registry;
    address        public owner;

    uint256 public activeScheduleId;
    uint256 public executionCount;
    uint256 public lastExecutionBlock;

    struct Subject {
        address addr;
        string  domain;
        uint256[] features;
        bool    active;
    }

    Subject[] public subjects;

    event AgentStarted(uint256 indexed callId, uint32 frequency, uint32 numCalls);
    event AgentExecuted(uint256 indexed executionIndex, uint256 subjectsRefreshed);
    event SubjectAdded(address indexed subject, string domain);
    event AgentStopped(uint256 indexed callId);

    modifier onlyOwner() {
        require(msg.sender == owner, "OmenAgent: not owner");
        _;
    }

    modifier onlyScheduler() {
        require(msg.sender == SCHEDULER, "OmenAgent: not scheduler");
        _;
    }

    constructor(address _judgment, address _registry) {
        owner    = msg.sender;
        judgment = IOmenJudgment(_judgment);
        registry = IOmenRegistry(_registry);
    }

    /// @notice Deposit RITUAL to cover execution fees
    function depositFees() external payable {
        IRitualWallet(RITUAL_WALLET).deposit{value: msg.value}(100000);
    }

    /// @notice Add a subject to watch
    function addSubject(
        address subject,
        string calldata domain,
        uint256[] calldata features
    ) external onlyOwner {
        subjects.push(Subject({
            addr:     subject,
            domain:   domain,
            features: features,
            active:   true
        }));
        emit SubjectAdded(subject, domain);
    }

    /// @notice Start the sovereign agent
    /// @param frequency How many blocks between each refresh
    /// @param numCalls  How many times to execute total
    /// @param gasLimit  Gas per execution
    function startAgent(
        uint32 frequency,
        uint32 numCalls,
        uint32 gasLimit
    ) external onlyOwner {
        require(activeScheduleId == 0, "OmenAgent: already running");
        require(subjects.length > 0, "OmenAgent: no subjects to watch");

        // Approve scheduler to call back this contract
        IScheduler(SCHEDULER).approveScheduler(SCHEDULER);

        bytes memory data = abi.encodeWithSelector(
            this.refresh.selector,
            uint256(0)  // dummy executionIndex — Scheduler overwrites
        );

        activeScheduleId = IScheduler(SCHEDULER).schedule(
            data,
            gasLimit,
            uint32(block.number) + frequency,
            numCalls,
            frequency,
            200,
            block.basefee * 2,
            0,
            0,
            address(this)
        );

        emit AgentStarted(activeScheduleId, frequency, numCalls);
    }

    /// @notice Called by Scheduler every N blocks — refreshes all subjects
    /// @param executionIndex Injected by Scheduler
    function refresh(uint256 executionIndex) external onlyScheduler {
        lastExecutionBlock = block.number;
        executionCount++;

        uint256 refreshed = 0;

        for (uint256 i = 0; i < subjects.length; i++) {
            if (!subjects[i].active) continue;

            try judgment.submitSignal(
                subjects[i].addr,
                subjects[i].domain,
                keccak256(abi.encodePacked(subjects[i].addr, subjects[i].domain, block.number)),
                block.number - 1000,
                block.number
            ) {} catch {}

            try judgment.evaluateDeterministic(
                subjects[i].addr,
                subjects[i].domain,
                subjects[i].features,
                "auto-refresh by OmenSovereignAgent"
            ) {
                refreshed++;
            } catch {}
        }

        emit AgentExecuted(executionIndex, refreshed);
    }

    /// @notice Stop the agent
    function stopAgent() external onlyOwner {
        require(activeScheduleId != 0, "OmenAgent: not running");
        IScheduler(SCHEDULER).cancel(activeScheduleId);
        emit AgentStopped(activeScheduleId);
        activeScheduleId = 0;
    }

    /// @notice Get number of subjects being watched
    function getSubjectCount() external view returns (uint256) {
        return subjects.length;
    }

    /// @notice Check if agent is running
    function isRunning() external view returns (bool) {
        return activeScheduleId != 0;
    }

    receive() external payable {}
}