// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PluginRegistry is Ownable {

    constructor() Ownable(msg.sender){
    }

    mapping(bytes4 => address) public implementer;


    function implement(address account, bytes4[] calldata interfaceIds) external onlyOwner {
        for (uint256 i = 0; i < interfaceIds.length; i++) {
            implementer[interfaceIds[i]] = account;
        }
    }

    function removeMethod(bytes4 interfaceId) external onlyOwner {
        require(implementer[interfaceId] != address(0), "PluginRegistry: method not registered");
        delete implementer[interfaceId];
    }

    function delegateCall(bytes memory payload)
        public
        returns (bool, bytes memory)
    {
        bytes4 methodId = getMethodId(payload);
        address to = implementer[methodId];
        require(to != address(0), "PluginRegistry: method not implemented");
        (bool success, bytes memory rtn) = to.delegatecall(payload);
        return (success, rtn);
    }

    function getMethodId(bytes memory data)
        internal
        pure
        returns (bytes4 result)
    {
        require(data.length >= 4, "PluginRegistry: Data too short");
        assembly {
            let dataValue := mload(add(data, 0x20))
            result := shr(224, dataValue)
        }
    }
}
