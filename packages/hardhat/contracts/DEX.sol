// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error DEX__AlreadyHasLiquidity();
error DEX__EthTransferFailed();
error DEX__TokenTransferFailed();
error DEX__InsufficientAmount();
error DEX__ZeroValue();

/**
 * @title DEX
 * @author Valentine Orga
 * @notice Empty DEX.sol that just outlines what features could be part of the challenge (up to you!)
 * @dev We want to create an automatic market where our contract will hold reserves of both ETH and 🎈 FUN. These reserves will provide liquidity that allows anyone to swap between the assets.
 * NOTE: functions outlined here are what work with the front end of this branch/repo. Also return variable names that may need to be specified exactly may be referenced (if you are confused, see solutions folder in this repo and/or cross reference with front-end code).
 */
contract DEX {
    /* ========== GLOBAL VARIABLES ========== */

    IERC20 token; //instantiates the imported contract

    uint256 public totalLiquidity;

    mapping(address => uint256) public liquidity;

    /* ========== EVENTS ========== */

    /**
     * @notice Emitted when ethToToken() swap transacted
     */
    event EthToTokenSwap(address indexed recipent, string operation, uint256 inputAmount, uint256 outputAmount);

    /**
     * @notice Emitted when tokenToEth() swap transacted
     */
    event TokenToEthSwap(address indexed recipent, string operation, uint256 inputAmount, uint256 outputAmount);

    /**
     * @notice Emitted when liquidity provided to DEX and mints LPTs.
     */
    event LiquidityProvided(
        address indexed provider,
        uint256 liquidityMinted,
        uint256 indexed ethAmount,
        uint256 indexed tokenAmount
    );

    /**
     * @notice Emitted when liquidity removed from DEX and decreases LPT count within DEX.
     */
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountWithdrawn,
        uint256 indexed ethAmount,
        uint256 indexed tokenAmount
    );

    /* ========== CONSTRUCTOR ========== */

    constructor(address token_addr) {
        token = IERC20(token_addr); //specifies the token address that will hook into the interface and be used through the variable 'token'
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice initializes amount of tokens that will be transferred to the DEX itself from the erc20 contract mintee (and only them based on how FUN.sol is written). Loads contract up with both ETH and FUN.
     * @param tokens amount to be transferred to DEX
     * @return totalLiquidity is the number of LPTs minting as a result of deposits made to DEX contract
     * NOTE: since ratio is 1:1, this is fine to initialize the totalLiquidity (wrt to fun) as equal to eth balance of contract.
     */
    function init(uint256 tokens) public payable returns (uint256) {
        if (totalLiquidity > 0) revert DEX__AlreadyHasLiquidity();
        if (msg.value == 0) revert DEX__InsufficientAmount();

        totalLiquidity = address(this).balance;
        liquidity[msg.sender] = totalLiquidity;

        if (token.transferFrom(msg.sender, address(this), tokens)) return totalLiquidity;
    }

    /**
     * @notice returns yOutput, or yDelta for xInput (or xDelta)
     * @dev Follow along with the [original tutorial](https://medium.com/@austin_48503/%EF%B8%8F-minimum-viable-exchange-d84f30bd0c90) Price section for an understanding of the DEX's pricing model and for a price function to add to your contract. You may need to update the Solidity syntax (e.g. use + instead of .add, * instead of .mul, etc). Deploy when you are done.
     */
    function price(uint256 xInput, uint256 xReserves, uint256 yReserves) public pure returns (uint256 yOutput) {
        uint256 xInputWithFee = xInput * 997;
        uint256 numerator = xInputWithFee * yReserves;
        uint256 denominator = xReserves * 1000 + xInputWithFee;
        yOutput = numerator / denominator;
    }

    /**
     * @notice returns liquidity for a user.
     * NOTE: this is not needed typically due to the `liquidity()` mapping variable being public and having a getter as a result. This is left though as it is used within the front end code (App.jsx).
     * NOTE: if you are using a mapping liquidity, then you can use `return liquidity[lp]` to get the liquidity for a user.
     * NOTE: if you will be submitting the challenge make sure to implement this function as it is used in the tests.
     */
    function getLiquidity(address lp) public view returns (uint256) {
        return liquidity[lp];
    }

    /**
     * @notice sends Ether to DEX in exchange for $FUN
     */
    function ethToToken() public payable returns (uint256 tokenOutput) {
        if (msg.value == 0) revert DEX__InsufficientAmount();

        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));
        tokenOutput = price(msg.value, ethReserve, tokenReserve);

        if (token.transfer(msg.sender, tokenOutput) == false) revert DEX__TokenTransferFailed();

        emit EthToTokenSwap(msg.sender, "Eth to FUN", msg.value, tokenOutput);
    }

    /**
     * @notice sends $FUN tokens to DEX in exchange for Ether
     */
    function tokenToEth(uint256 tokenInput) public returns (uint256 ethOutput) {
        if (tokenInput == 0) revert DEX__InsufficientAmount();

        uint256 tokenReserve = token.balanceOf(address(this));
        ethOutput = price(tokenInput, tokenReserve, address(this).balance);

        if (token.transferFrom(msg.sender, address(this), tokenInput) == false) revert DEX__TokenTransferFailed();

        (bool success, ) = msg.sender.call{ value: ethOutput }("");
        if (!success) revert DEX__EthTransferFailed();

        emit TokenToEthSwap(msg.sender, "FUN to ETH", ethOutput, tokenInput);
    }

    /**
     * @notice allows deposits of $FUN and $ETH to liquidity pool
     * NOTE: parameter is the msg.value sent with this function call. That amount is used to determine the amount of $FUN needed as well and taken from the depositor.
     * NOTE: user has to make sure to give DEX approval to spend their tokens on their behalf by calling approve function prior to this function call.
     * NOTE: Equal parts of both assets will be removed from the user's wallet with respect to the price outlined by the AMM.
     */
    function deposit() public payable returns (uint256 tokenDeposit) {
        if (msg.value == 0) revert DEX__InsufficientAmount();

        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));
        tokenDeposit = ((msg.value * tokenReserve) / ethReserve) + 1;

        uint256 liquidityMinted = (msg.value * totalLiquidity) / ethReserve;
        totalLiquidity += liquidityMinted;
        liquidity[msg.sender] += liquidityMinted;

        if (token.transferFrom(msg.sender, address(this), tokenDeposit) == false) revert DEX__TokenTransferFailed();

        emit LiquidityProvided(msg.sender, liquidityMinted, msg.value, tokenDeposit);
    }

    /**
     * @notice allows withdrawal of $FUN and $ETH from liquidity pool
     * NOTE: with this current code, the msg caller could end up getting very little back if the liquidity is super low in the pool. I guess they could see that with the UI.
     */
    function withdraw(uint256 amount) public returns (uint256 eth_amount, uint256 token_amount) {
        if (liquidity[msg.sender] < amount) revert DEX__InsufficientAmount();

        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 ethReserve = address(this).balance;
        uint256 _totalLiquidity = totalLiquidity;

        eth_amount = (amount * ethReserve) / _totalLiquidity;
        token_amount = (amount * tokenReserve) / _totalLiquidity;

        liquidity[msg.sender] -= amount;
        totalLiquidity -= amount;

        (bool success, ) = msg.sender.call{ value: eth_amount }("");
        if (!success) revert DEX__EthTransferFailed();

        if (token.transfer(msg.sender, token_amount) == false) revert DEX__TokenTransferFailed();

        emit LiquidityRemoved(msg.sender, amount, eth_amount, token_amount);
    }
}
