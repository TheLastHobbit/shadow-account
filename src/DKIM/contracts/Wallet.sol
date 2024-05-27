// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/access/Ownable.sol";

import "./PluginRegistry.sol";
import "./interfaces/ISocialRecovery.sol";
import "./InitialInterfaces.sol";

contract Wallet is PluginRegistry, InitialInterfaces {
    ISocialRecovery public socialRecovery;
    uint public nonce;
    uint public recoveryNonce;
    uint256 public emailHash;

    modifier checkNonce(uint256 _nonce) {
        require(nonce + 1 == _nonce, "Invalid nonce");
        _;
        nonce++;
    }

    function initialize(address _socialRecovery, address owner, uint256 _emailHash) public {
        socialRecovery = ISocialRecovery(_socialRecovery);
        super._transferOwnership(owner);
        emailHash = _emailHash;
    }

    receive() external payable {}

    // fallback() external payable {
    //     bytes calldata data = msg.data;
    //     bytes4 interfaceId = getMethodId(data);
    //     if (supportsInterface(interfaceId)) {
    //         delegateCall(data);
    //     }
    // }

    function generalCall(
        address to,
        uint256 amount,
        bytes calldata payload,
        uint256 _nonce,
        bytes calldata sign
    ) external payable checkNonce(_nonce) returns (bytes memory) {
        auth(to, amount, _nonce, payload, sign);
        return proxyCall(to, amount, payload);
    }

    function proxyCall(
        address to,
        uint256 amount,
        bytes calldata payload
    ) private returns (bytes memory) {
        (bool success, bytes memory rtn) = payable(to).call{value: amount}(
            payload
        );
        require(success, "");
        return rtn;
    }

    function auth(
        address to,
        uint256 amount,
        uint256 _nonce,
        bytes calldata payload,
        bytes calldata sign
    ) internal view {
        bytes memory data = abi.encode(to, _nonce, payload, amount);
        bytes32 hash = keccak256(data);

        address addr = ecrecovery(hash, sign);
        require(addr == owner(), "Auth failed: Only owner!");
    }

    function ecrecovery(bytes32 hash, bytes memory signature)
        public
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) {
            v += 27;
        }
        require(v == 27 || v == 28, "ECDSA signature incorrect");
        return ecrecover(hash, v, r, s);
    }

    function setSocialRecoveryAddress(uint256 _nonce, address _socialRecovery, bytes calldata sign) external payable checkNonce(_nonce) {
        bytes memory data = abi.encode(_nonce, _socialRecovery);
        bytes32 hash = keccak256(data);
        address addr = ecrecovery(hash, sign);
        require(addr == owner(), "Auth failed: Only owner!");

        socialRecovery = ISocialRecovery(_socialRecovery);
    }

    function verify(string memory toSign, string memory body, string memory sign, address newOwner, bool base64Encoded) external returns(bool) {
        (bool success, string memory from) = socialRecovery.verify(toSign, body, sign, recoveryNonce, newOwner, base64Encoded);
        bytes32 h = keccak256(abi.encode(from));
        require(uint256(h) == emailHash, "Wallet Recovery: wrong email address!");
        require(success, "Wallet Recovery: DKIM verify failed.");
        transferOwnership(newOwner);
        return true;
    }

    function getRecoveryBody(address newOwner)
        public
        view
        returns (bytes memory)
    {
        return abi.encode(recoveryNonce + 1, newOwner);
    }

    function splitbody(bytes memory body)
        internal
        pure
        returns (
            bytes memory owner,
            bytes memory contractaddr,
            uint _nonce
        )
    {
        (owner, contractaddr, _nonce) = abi.decode(body, (bytes, bytes, uint));
        return (owner, contractaddr, _nonce);
    }

    function setEmail(uint256 _emailHash) external onlyOwner {
        emailHash = _emailHash;
    }
}
