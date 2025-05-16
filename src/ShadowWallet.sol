// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "account-abstraction/core/BaseAccount.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import "account-abstraction/interfaces/PackedUserOperation.sol";
import {TokenCallbackHandler} from "account-abstraction/samples/callback/TokenCallbackHandler.sol";

interface IKeyImageRegistry {
    function markUsed(bytes32 keyImage) external;
    function isKeyImageUsed(bytes32 keyImage) external view returns (bool);
}

contract ShadowWallet is BaseAccount, TokenCallbackHandler, UUPSUpgradeable, Initializable {
    IEntryPoint private immutable _entryPoint;
    IKeyImageRegistry public immutable keyImageRegistry;
    bytes32 public ringId;
    bytes32 public initKeyImageHash; // keccak256(initKeyImage)
    uint256 private _nonce;

    event Initialized(bytes32 indexed ringId, bytes32 indexed initKeyImageHash);
    event RingSignatureValidated(bytes32 indexed userOpHash, bytes32 indexed ringId);
    event SignatureChallenged(bool valid);
    event DebugBytes(bytes data);
    event DebugBytes32(bytes32 data);
    event DebugUint256(uint256[] data);
    event DebugUint_256(uint256 data);

    constructor(address entryPoint_, address keyImageRegistry_) {
        _entryPoint = IEntryPoint(entryPoint_);
        keyImageRegistry = IKeyImageRegistry(keyImageRegistry_);
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    receive() external payable {}

    function initialize(bytes memory _ring, bytes32 _initKeyImage) external initializer {
        require(_ring.length >= 2 * 64, "ShadowWallet: ring too small");
        ringId = keccak256(_ring);
        initKeyImageHash = keccak256(abi.encodePacked(_initKeyImage));
        _nonce = 0;
        emit Initialized(ringId, initKeyImageHash);
    }

    function nonce() public view returns (uint256) {
        return _nonce;
    }

    function validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public returns (uint256 validationData) {
        return _validateSignature(userOp, userOpHash);
    }

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        // 手动解码 userOp.signature
        bytes memory signature = userOp.signature;

        emit DebugBytes(signature);

        // 解码所有字段，包括 submittedInitKeyImage
        (
            uint256[] memory c,
            uint256[] memory r,
            bytes32 ringIdFromSig,
            bytes32 keyImage,
            bytes memory z, // 保留 z，但不使用
            bytes32 submittedInitKeyImage
        ) = abi.decode(
            signature,
            (uint256[], uint256[], bytes32, bytes32, bytes, bytes32)
        );

        // 发出调试事件，查看解码后的参数
        emit DebugUint256(c);
        emit DebugUint256(r);
        emit DebugBytes32(ringIdFromSig);
        emit DebugBytes32(keyImage);
        emit DebugBytes32(submittedInitKeyImage);
        emit DebugUint_256(c.length);

        // 验证 submittedInitKeyImage
        require(keccak256(abi.encodePacked(submittedInitKeyImage)) == initKeyImageHash, "ShadowWallet: invalid initKeyImage");

        // 其他验证
        require(c.length == r.length, "Invalid ring size");
        require(!keyImageRegistry.isKeyImageUsed(keyImage), "ShadowWallet: key image used");
        require(userOp.nonce == _nonce, "ShadowWallet: invalid nonce");
        require(ringIdFromSig == ringId, "ShadowWallet: invalid ring");

        // 验证哈希链
        require(validateHashChain(userOpHash, abi.encode(ringId), keyImage, submittedInitKeyImage, c), "Invalid hash chain");

        keyImageRegistry.markUsed(keyImage);

        _nonce++;
        emit RingSignatureValidated(userOpHash, ringId);
        return 0;
    }

    function challengeSignature(
        uint256[] memory c,
        uint256[] memory r,
        bytes memory sigRing,
        bytes32 keyImage,
        bytes32 submittedInitKeyImage
    ) external {
        bool valid = validateHashChain(keccak256(abi.encodePacked(address(this))), sigRing, keyImage, submittedInitKeyImage, c);
        emit SignatureChallenged(valid);
    }

    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        _requireFromEntryPoint();
        _call(dest, value, func);
    }

    function executeBatch(
        address[] calldata dests,
        uint256[] calldata values,
        bytes[] calldata funcs
    ) external {
        _requireFromEntryPoint();
        require(dests.length == values.length && values.length == funcs.length, "ShadowWallet: length mismatch");
        for (uint256 i = 0; i < dests.length; i++) {
            _call(dests[i], values[i], funcs[i]);
        }
    }

    function upgradeTo(
        address newImplementation,
        uint256[] calldata c,
        uint256[] calldata r,
        bytes32 ringIdFromSig,
        bytes32 keyImage,
        bytes32 submittedInitKeyImage
    ) external {
        require(keyImageRegistry.isKeyImageUsed(keyImage) == false, "ShadowWallet: key image used");
        require(c.length == r.length, "Invalid ring size");
        require(ringIdFromSig == ringId, "ShadowWallet: invalid ring");
        require(keccak256(abi.encodePacked(submittedInitKeyImage)) == initKeyImageHash, "ShadowWallet: invalid initKeyImage");

        require(validateHashChain(keccak256(abi.encodePacked(newImplementation)), abi.encode(ringId), keyImage, submittedInitKeyImage, c), "Invalid hash chain");

        keyImageRegistry.markUsed(keyImage);
        upgradeToAndCall(newImplementation, "");
    }

    function withdrawETH(
        address payable recipient,
        uint256 amount,
        uint256[] calldata c,
        uint256[] calldata r,
        bytes32 ringIdFromSig,
        bytes32 keyImage,
        bytes32 submittedInitKeyImage
    ) external {
        require(keyImageRegistry.isKeyImageUsed(keyImage) == false, "ShadowWallet: key image used");
        require(c.length == r.length, "Invalid ring size");
        require(ringIdFromSig == ringId, "ShadowWallet: invalid ring");
        require(keccak256(abi.encodePacked(submittedInitKeyImage)) == initKeyImageHash, "ShadowWallet: invalid initKeyImage");

        require(validateHashChain(keccak256(abi.encodePacked(recipient, amount)), abi.encode(ringId), keyImage, submittedInitKeyImage, c), "Invalid hash chain");

        require(address(this).balance >= amount, "ShadowWallet: insufficient balance");
        keyImageRegistry.markUsed(keyImage);
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "ShadowWallet: withdrawal failed");
    }

    function validateHashChain(
        bytes32 message,
        bytes memory sigRing,
        bytes32 keyImage,
        bytes32 initKeyImage,
        uint256[] memory c
    ) internal pure returns (bool) {
        uint256 n = c.length;
        for (uint256 s = 0; s < n; s++) {
            // 仅使用 message 计算哈希链
            bytes32 h = keccak256(abi.encodePacked(message));
            if (bytes32(c[(s + 1) % n]) != h) continue;
            bool valid = true;
            for (uint256 j = 1; j < n; j++) {
                uint256 i = (s + 1 + j) % n;
                h = keccak256(abi.encodePacked(message));
                if (bytes32(c[i]) != h) {
                    valid = false;
                    break;
                }
            }
            if (valid) return true;
        }
        return false;
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function _authorizeUpgrade(address) internal override {}
}