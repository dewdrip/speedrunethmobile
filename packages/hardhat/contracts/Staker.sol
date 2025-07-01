// SPDX-License-Identifier: MIT
pragma solidity 0.8.20; //Do not change the solidity version as it negatively impacts submission grading

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";

error Staker__ZeroValue();
error Staker__DeadlineNotExceeded();
error Staker__NotOpenForWithdraw();
error Staker__TransferFailed();
error Staker__DeadlineExceeded();
error Staker__StakingCompleted();

contract Staker {
    uint256 public constant threshold = 1 ether;
    ExampleExternalContract public exampleExternalContract;
    uint256 public deadline = block.timestamp + 3 minutes;
    bool public openForWithdraw = false;

    mapping(address => uint256) public balances;

    event Stake(address indexed user, uint256 indexed amount);

    constructor(address exampleExternalContractAddress) {
        exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
    }

    modifier notCompleted() {
        if (exampleExternalContract.completed()) revert Staker__StakingCompleted();

        _;
    }

    // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
    // (Make sure to add a `Stake(address,uint256)` event and emit it for the frontend `All Stakings` tab to display)

    function stake() public payable {
        if (msg.value == 0) revert Staker__ZeroValue();
        if (timeLeft() == 0) revert Staker__DeadlineExceeded();

        balances[msg.sender] += msg.value;
        emit Stake(msg.sender, msg.value);
    }

    // After some `deadline` allow anyone to call an `execute()` function
    // If the deadline has passed and the threshold is met, it should call `exampleExternalContract.complete{value: address(this).balance}()`
    // If the `threshold` was not met, allow everyone to call a `withdraw()` function to withdraw their balance
    function execute() external notCompleted {
        if (timeLeft() > 0) revert Staker__DeadlineNotExceeded();

        if (address(this).balance >= threshold) {
            exampleExternalContract.complete{ value: address(this).balance }();
        } else {
            openForWithdraw = true;
        }
    }

    function withdraw() external notCompleted {
        if (!openForWithdraw) revert Staker__NotOpenForWithdraw();

        uint256 _balance = balances[msg.sender];

        delete balances[msg.sender];

        (bool success, ) = msg.sender.call{ value: _balance }("");
        if (!success) revert Staker__TransferFailed();
    }

    // Add a `timeLeft()` view function that returns the time left before the deadline for the frontend
    function timeLeft() public view returns (uint256) {
        if (block.timestamp >= deadline) return 0;

        return deadline - block.timestamp;
    }

    // Add the `receive()` special function that receives eth and calls stake()
    receive() external payable {
        stake();
    }
}
