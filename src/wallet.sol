// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;
import "account-abstraction/core/BaseAccount.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "account-abstraction/interfaces/PackedUserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {TokenCallbackHandler} from "account-abstraction/samples/callback/TokenCallbackHandler.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import "./DKIM/contracts/PluginRegistry.sol";
import "./DKIM/contracts//interfaces/ISocialRecovery.sol";

contract Wallet is
    BaseAccount,
    TokenCallbackHandler,
    UUPSUpgradeable,
    Initializable,
    PluginRegistry
{
    IEntryPoint private immutable _entryPoint;
    ISocialRecovery public socialRecovery;
    using ECDSA for bytes32;
    uint public nonce;
    uint public recoveryNonce;
    uint256 public emailHash;

    event SimpleAccountInitialized(
        IEntryPoint indexed entryPoint,
        address indexed owner,
        uint256 indexed emailHash
    );

    modifier _requireFromEntryPointOrOwner() {
        require(
            msg.sender == address(_entryPoint) || msg.sender == owner(),
            "only entry point or wallet factory can call"
        );
        _;
    }

    modifier checkNonce(uint256 _nonce) {
        require(nonce + 1 == _nonce, "Invalid nonce");
        _;
        nonce++;
    }

    constructor(address entryPoint_) {
        _entryPoint = IEntryPoint(entryPoint_);
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    receive() external payable {}

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        if (owner() != ECDSA.recover(hash, userOp.signature)) return 1;
        return 0;
    }

    function initialize(
        address _socialRecovery,
        address anOwner,
        uint256 _emailHash
    ) public virtual initializer {
        socialRecovery = ISocialRecovery(_socialRecovery);
        emailHash = _emailHash;
        _initialize(anOwner);
    }

    function _initialize(address anOwner) internal virtual {
        super._transferOwnership(anOwner);
        emit SimpleAccountInitialized(_entryPoint, anOwner,emailHash);
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external _requireFromEntryPointOrOwner {
        _call(dest, value, func);
    }

    function executeBatch(
        address[] calldata dests,
        uint256[] calldata values,
        bytes[] calldata funcs
    ) external _requireFromEntryPointOrOwner {
        require(dests.length == funcs.length, "wrong dests lengths");
        require(values.length == funcs.length, "wrong values lengths");
        for (uint256 i = 0; i < dests.length; i++) {
            _call(dests[i], values[i], funcs[i]);
        }
    }

    function _onlyOwner() internal view {
        //directly from EOA owner, or through the account itself (which gets redirected through execute())
        require(
            msg.sender == owner() || msg.sender == address(this),
            "only owner"
        );
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        (newImplementation);
        _onlyOwner();
    }

    function encodeSignatures(
        bytes[] memory signatures
    ) public pure returns (bytes memory) {
        return abi.encode(signatures);
    }

    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    function setSocialRecoveryAddress(
        uint256 _nonce,
        address _socialRecovery,
        bytes calldata sign
    ) external payable checkNonce(_nonce) {
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
}
