// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/EntryPoint.sol";

contract MyScript is Script {
    // forge script --chain sepolia script/entrypoint.s.sol:MyScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv --legacy
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        MyEntryPoint entrypoint = new MyEntryPoint();
        console.log("MyEntryPoint deployed at address:", address(entrypoint));
        vm.stopBroadcast();
    }
}