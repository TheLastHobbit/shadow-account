// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {SimplePaymaster} from "../src/paymaster.sol";
// import "account-abstraction/interfaces/IEntryPoint.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

contract DeployPaymaster is Script {
    function run() external {
        // 获取部署者的私钥（从环境变量或 foundry.toml 加载）
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // 开始广播交易
        vm.startBroadcast(deployerPrivateKey);

        // EntryPoint 地址（替换为实际地址）
        address entrypointAddress = 0x1A5C9969F47Ef041c3A359ae4ae9fd9E70eA5653; // 替换为你的 EntryPoint 地址
        IEntryPoint entrypoint = IEntryPoint(entrypointAddress);

        // 部署 SimplePaymaster
        SimplePaymaster paymaster = new SimplePaymaster(entrypoint);
        console.log("SimplePaymaster deployed to:", address(paymaster));

        // 为 Paymaster 存入资金（0.1 ETH）
        uint256 depositAmount = 0.1 ether;
        paymaster.deposit{value: depositAmount}();
        console.log("Paymaster deposit successful, amount (ETH):", depositAmount / 1e18);

        // 检查 Paymaster 在 EntryPoint 中的存款
        uint256 depositBalance = entrypoint.balanceOf(address(paymaster));
        console.log("Paymaster deposit balance (ETH):", depositBalance / 1e18);

        // 停止广播
        vm.stopBroadcast();
    }
}