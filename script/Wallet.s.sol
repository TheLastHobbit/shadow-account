// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/EntryPoint.sol";
import "../src/walletFactory.sol";
import "../src/DKIM/contracts/SocialRecovery.sol";
import "../src/DKIM/contracts/PublicKeyOracle.sol";

// forge script --chain sepolia script/entrypoint.s.sol:MyScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv --legacy

contract MyScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        MyEntryPoint entryPoint = new MyEntryPoint();
        PublicKeyOracle pubKeyOracle = new PublicKeyOracle();
        SocialRecovery dkim = new SocialRecovery(address(pubKeyOracle));
        WalletFactory factory = new WalletFactory((entryPoint),address(dkim));
        console.log("EntryPoint: ", address(entryPoint));
        console.log("Factory: ", address(factory));
        console.log("DKIM: ", address(dkim));
        console.log("PubKeyOracle: ", address(pubKeyOracle));
        vm.stopBroadcast();
    }
}