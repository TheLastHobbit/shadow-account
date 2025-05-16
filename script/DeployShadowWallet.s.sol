pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/KeyImageRegistry.sol";
import "../src/ShadowWalletFactory.sol";

contract DeployShadowWallet is Script {
    function run() external {
        vm.startBroadcast();

        // 部署 KeyImageRegistry
        KeyImageRegistry keyImageRegistry = new KeyImageRegistry();

        // 部署 ShadowWalletFactory（使用测试用的 entryPoint 地址）
        address entryPoint = 0x1A5C9969F47Ef041c3A359ae4ae9fd9E70eA5653; // Sepolia 测试网 entryPoint
        ShadowWalletFactory factory = new ShadowWalletFactory(entryPoint, address(keyImageRegistry));

        vm.stopBroadcast();

        console.log("KeyImageRegistry deployed at:", address(keyImageRegistry));
        console.log("ShadowWalletFactory deployed at:", address(factory));
    }
}