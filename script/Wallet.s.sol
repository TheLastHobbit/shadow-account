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
        // MyEntryPoint entryPoint = new MyEntryPoint();
        address entrypointAddress = 0x1A5C9969F47Ef041c3A359ae4ae9fd9E70eA5653; // 替换为你的 EntryPoint 地址
        IEntryPoint entrypoint = IEntryPoint(entrypointAddress);
        address pubKeyOracleAddress = 0x4D4bDD8A52E46496ff7D82d781C2aa132EEDa9Af;
        PublicKeyOracle pubKeyOracle = PublicKeyOracle(pubKeyOracleAddress);
        SocialRecovery dkim = new SocialRecovery(address(pubKeyOracle));
        WalletFactory factory = new WalletFactory((entrypoint),address(dkim));
        // console.log("EntryPoint: ", address(entryPoint));
        console.log("Factory: ", address(factory));
        console.log("DKIM: ", address(dkim));
        console.log("PubKeyOracle: ", address(pubKeyOracle));
        vm.stopBroadcast();
    }
}