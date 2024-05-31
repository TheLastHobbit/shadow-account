// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;
import "account-abstraction/core/EntryPoint.sol";
import "lib/account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract MyEntryPoint is EntryPoint {
    // struct PackedUserOperation {
    //     address sender;
    //     uint256 nonce;
    //     bytes initCode;
    //     bytes callData;
    //     bytes32 accountGasLimits;
    //     uint256 preVerificationGas;
    //     bytes32 gasFees;
    //     bytes paymasterAndData;
    //     bytes signature;
    // }

    // function getUserOpHash(
    //     PackedUserOperation memory userOp
    // ) public override pure returns (bytes32) {
    //     return
    //         keccak256(abi.encode(userOp.hash(), address(this), block.chainid));
    // }

    // function handleOps(
    //     PackedUserOperation[] calldata ops,
    //     address payable beneficiary
    // ) public override nonReentrant {
    //     uint256 opslen = ops.length;
    //     UserOpInfo[] memory opInfos = new UserOpInfo[](opslen);

    //     unchecked {
    //         for (uint256 i = 0; i < opslen; i++) {
    //             UserOpInfo memory opInfo = opInfos[i];
    //             (
    //                 uint256 validationData,
    //                 uint256 pmValidationData
    //             ) = _validatePrepayment(i, ops[i], opInfo);
    //             _validateAccountAndPaymasterValidationData(
    //                 i,
    //                 validationData,
    //                 pmValidationData,
    //                 address(0)
    //             );
    //         }

    //         uint256 collected = 0;
    //         emit BeforeExecution();

    //         for (uint256 i = 0; i < opslen; i++) {
    //             collected += _executeUserOp(i, ops[i], opInfos[i]);
    //         }

    //         _compensate(beneficiary, collected);
    //     }
    // }
}
