// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "account-abstraction/core/BasePaymaster.sol";
import {Test, console} from "forge-std/Test.sol";

contract SimplePaymaster is Base {
    constructor(IEntryPoint _entryPoint) Base(_entryPoint) {}

    // 允许 Paymaster 接收 ETH
    receive() external payable {}

    // 实现 _validatePaymasterUserOp
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        console.log("Paymaster: Validating userOp, maxCost =", maxCost);
        console.log("Paymaster: Current deposit =", entryPoint.balanceOf(address(this)));

        // 检查 Paymaster 在 EntryPoint 中的存款是否足够
        require(entryPoint.balanceOf(address(this)) >= maxCost, "Paymaster: insufficient deposit");

        // 返回上下文（这里为空）和验证数据
        // validationData 包含 sigFailed, validAfter, validUntil
        // 这里我们简单地返回 0，表示验证通过
        return ("", 0);
    }

    // 实现 _postOp
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal override {
        console.log("Paymaster: PostOp called, mode =", uint256(mode));
        console.log("Paymaster: Actual gas cost =", actualGasCost);
        // 本例中无需额外操作
        // 如果需要，可以在这里添加日志或退款逻辑
    }
}