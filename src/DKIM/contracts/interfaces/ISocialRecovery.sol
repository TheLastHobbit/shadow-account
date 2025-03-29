// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ISocialRecovery {
    function verify(
        string memory toSign,
        string memory body,
        string memory sign,
        uint recoveryNonce,
        address newOwner,
        bool base64Encoded
    )
        external
        view
        returns (
            bool success,
            uint256 from
        );
}