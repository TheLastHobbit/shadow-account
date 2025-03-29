// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/ZKtool.sol";

contract MyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        PedersenCommitment pedersenCommitment = new PedersenCommitment();
        console.log("PedersenCommitment deployed at address:", address(pedersenCommitment));
        vm.stopBroadcast();
    }
}