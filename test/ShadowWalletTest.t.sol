// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/EntryPoint.sol";
import "../src/ShadowWalletFactory.sol";
import "../src/ShadowWallet.sol";
import "../src/KeyImageRegistry.sol";

contract ShadowWalletTest is Test {
    EntryPoint entryPoint;
    ShadowWalletFactory factory;
    ShadowWallet walletImpl;
    KeyImageRegistry keyImageRegistry;

    address owner = address(0x123);
    address beneficiary = payable(address(0x456));

    function setUp() public {
        keyImageRegistry = new KeyImageRegistry();
        entryPoint = new EntryPoint();
        walletImpl = new ShadowWallet(address(entryPoint), address(keyImageRegistry));
        factory = new ShadowWalletFactory(address(entryPoint), address(keyImageRegistry));
        vm.deal(owner, 100 ether);
    }

    function testCreateShadowWalletWithSimulatedData() public {
        vm.startPrank(owner);

        // 1. 模拟 ring 数据（10 个公钥，20 个坐标）
        bytes memory ringBytes = new bytes(640); // 10 个公钥，20 个 32 字节坐标
        for (uint256 i = 0; i < 20; i++) {
            bytes32 coord = bytes32(uint256(i + 1));
            for (uint256 j = 0; j < 32; j++) {
                ringBytes[i * 32 + j] = coord[j];
            }
        }
        bytes32 ringId = keccak256(ringBytes);

        // 2. 模拟 initKeyImage
        uint256 salt = 123456; // 模拟 salt
        bytes32 initKeyImage = bytes32(hex"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

        // 3. 构造 initCode
        bytes memory initCode = abi.encodeWithSignature(
            "createWallet(uint256,bytes,bytes32)",
            salt,
            ringBytes,
            initKeyImage
        );
        initCode = abi.encodePacked(address(factory), initCode);

        // 4. 预测 walletAddress
        address walletAddress = factory.getAddress(salt);
        console.log("Predicted walletAddress:", walletAddress);

        // 5. 构造 UserOperation
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: walletAddress,
            nonce: 0,
            initCode: initCode,
            callData: "0x",
            accountGasLimits: bytes32(uint256(2000000) << 128 | 2000000),
            preVerificationGas: 50000,
            gasFees: bytes32(uint256(1000000) << 128 | 2000000),
            paymasterAndData: bytes(""),
            signature: ""
        });

        // 6. 计算 userOpHash
        bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
        console.logBytes32(userOpHash);

        // 7. 模拟环签名数据
        uint256[] memory c = new uint256[](10);
        uint256[] memory r = new uint256[](10);
        for (uint256 i = 0; i < 10; i++) {
            c[i] = uint256(keccak256(abi.encode(i)));
            r[i] = uint256(keccak256(abi.encode(i + 10)));
        }
        bytes memory z = new bytes(640); // 10 个公钥，模拟 z 数据
        for (uint256 i = 0; i < 640; i++) {
            z[i] = bytes1(uint8(i));
        }
        bytes32 keyImage = keccak256(abi.encode(userOpHash));
        bytes32 submittedInitKeyImage = initKeyImage; // 保持与 initCode 中一致

        // 8. 设置 userOp.signature
        userOp.signature = abi.encode(
            c,
            r,
            ringId, // 确保与 initCode 中的 ringId 一致
            keyImage,
            z,
            submittedInitKeyImage
        );

        // 9. 调用 handleOps
        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = userOp;
        entryPoint.handleOps(ops, payable(beneficiary));
    }
}