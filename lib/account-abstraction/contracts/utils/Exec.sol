// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.23;
import {Test, console, console2} from "forge-std/Test.sol";
// solhint-disable no-inline-assembly

/**
 * Utility functions helpful when making different kinds of contract calls in Solidity.
 */
library Exec {
    function call(
        address to,
        uint256 value,
        bytes memory data,
        uint256 txGas
    ) internal returns (bool success) {
        console.log("calling to", to);
        console.log("value", value);
        console.log("txGas", txGas);
        console.logBytes(data);

        uint256 returnDataSize;

        assembly ("memory-safe") {
            success := call(
                txGas,
                to,
                value,
                add(data, 0x20),
                mload(data),
                0,
                0
            )
            returnDataSize := returndatasize()
            returndatacopy(0x0, 0x0, returnDataSize)
        }

        console.log("call success:", success);
        if (!success) {
            bytes memory returnData = new bytes(returnDataSize);
            assembly {
                returndatacopy(add(returnData, 0x20), 0, returnDataSize)
            }
            console.logBytes(returnData);
        }
        bytes4 methodSig;
        assembly {
            if gt(mload(data), 3) {
                methodSig := mload(add(data, 0x20))
            }
        }

        // Convert bytes4 to bytes for logging
        bytes memory methodSigBytes = new bytes(4);
        assembly {
            mstore(add(methodSigBytes, 0x20), methodSig)
        }
        console.logBytes(methodSigBytes);
    }

    function staticcall(
        address to,
        bytes memory data,
        uint256 txGas
    ) internal view returns (bool success) {
        assembly ("memory-safe") {
            success := staticcall(txGas, to, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function delegateCall(
        address to,
        bytes memory data,
        uint256 txGas
    ) internal returns (bool success) {
        assembly ("memory-safe") {
            success := delegatecall(
                txGas,
                to,
                add(data, 0x20),
                mload(data),
                0,
                0
            )
        }
    }

    // get returned data from last call or calldelegate
    function getReturnData(
        uint256 maxLen
    ) internal pure returns (bytes memory returnData) {
        assembly ("memory-safe") {
            let len := returndatasize()
            if gt(len, maxLen) {
                len := maxLen
            }
            let ptr := mload(0x40)
            mstore(0x40, add(ptr, add(len, 0x20)))
            mstore(ptr, len)
            returndatacopy(add(ptr, 0x20), 0, len)
            returnData := ptr
        }
    }

    // revert with explicit byte array (probably reverted info from call)
    function revertWithData(bytes memory returnData) internal pure {
        assembly ("memory-safe") {
            revert(add(returnData, 32), mload(returnData))
        }
    }

    function callAndRevert(
        address to,
        bytes memory data,
        uint256 maxLen
    ) internal {
        bool success = call(to, 0, data, gasleft());
        if (!success) {
            revertWithData(getReturnData(maxLen));
        }
    }
}
