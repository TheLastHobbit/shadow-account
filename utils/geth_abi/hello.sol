// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;
contract HelloWeb3{
    string public _string = "Hello Web3!";
    uint256 public number = 5;

    function add() external{
        number = number + 1;
    }
}