// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./ShadowWallet.sol";

contract ShadowWalletFactory {
    address public immutable shadowWalletImpl;
    address public immutable entryPoint;
    address public immutable keyImageRegistry;

    event WalletCreated(address indexed wallet, bytes32 indexed ringId);

    constructor(address _entryPoint, address _keyImageRegistry) {
        shadowWalletImpl = address(new ShadowWallet(_entryPoint, _keyImageRegistry));
        entryPoint = _entryPoint;
        keyImageRegistry = _keyImageRegistry;
    }

    function createWallet(
        uint256 salt,
        bytes memory ring,
        bytes32 initKeyImage
    ) external returns (address payable) {
        require(ring.length >= 2 * 64, "Invalid ring size");

        bytes32 ringId = keccak256(ring);
        bytes32 saltHash = keccak256(abi.encodePacked(salt));
        address payable wallet = payable(Clones.cloneDeterministic(shadowWalletImpl, saltHash));

        IShadowWallet(wallet).initialize(ring, initKeyImage);

        emit WalletCreated(wallet, ringId);
        return wallet;
    }

    function getAddress(
        uint256 salt
    ) external view returns (address payable) {
        bytes32 saltHash = keccak256(abi.encodePacked(salt));
        return payable(Clones.predictDeterministicAddress(shadowWalletImpl, saltHash));
    }
}

interface IShadowWallet {
    function initialize(bytes memory ring, bytes32 initKeyImage) external;
    function entryPoint() external view returns (address);
    function keyImageRegistry() external view returns (address);
}