// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

contract KeyImageRegistry {
    mapping(bytes32 => bool) public usedKeyImages;

    event KeyImageUsed(bytes32 indexed keyImage);

    function markUsed(bytes32 keyImage) external {
        require(!usedKeyImages[keyImage], "Key image already used");
        usedKeyImages[keyImage] = true;
        emit KeyImageUsed(keyImage);
    }

    function isKeyImageUsed(bytes32 keyImage) external view returns (bool) {
        return usedKeyImages[keyImage];
    }
}