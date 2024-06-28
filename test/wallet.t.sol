// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console,console2} from "forge-std/Test.sol";
import {Wallet} from "../src/wallet.sol";
import {MyEntryPoint} from "../src/entrypoint.sol";
import {WalletFactory} from "../src/WalletFactory.sol";
import {SocialRecovery} from "../src/DKIM/contracts/SocialRecovery.sol";
import {PublicKeyOracle} from "../src/DKIM/contracts/PublicKeyOracle.sol";
import {MyToken} from "./util/MyToken.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {PackedUserOperation} from "lib/account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {SenderCreator} from "lib/account-abstraction/contracts/core/SenderCreator.sol";
import {PedersenCommitment} from "../src/ZKtool.sol";

contract walletTest is Test {
    Wallet public wallet;
    WalletFactory public walletFactory;
    MyEntryPoint public entryPoint;
    SocialRecovery public socialRecovery;
    PublicKeyOracle public publicKeyOracle;
    MyToken public myToken;
    PedersenCommitment public pedersenCommitment;
    SenderCreator public senderCreator;

    address bob = makeAddr("bob");
    address admin = makeAddr("admin");
    address alice;
    uint256 alicePrivateKey;


    function setUp() public {
        (alice, alicePrivateKey) = makeAddrAndKey("alice");
        deal(alice, 100 ether);

        vm.startPrank(admin);
        {
            publicKeyOracle = new PublicKeyOracle();
            senderCreator = new SenderCreator();
            pedersenCommitment = new PedersenCommitment();
            socialRecovery = new SocialRecovery(address(publicKeyOracle));
            entryPoint = new MyEntryPoint();
            walletFactory = new WalletFactory(
                entryPoint,
                address(socialRecovery)
            );
            // uint256[] memory values = new uint256[](1);
            // values[0] = getSalt("2865755738@qq.com");
            // // values[0] = 12160266183512595673888722153253610585066875951680911826333493782620438974488;
            // console.log("uint256:", values[0]);

            // PedersenCommitment.Commitment[] memory commitments = pedersenCommitment.generateCommitments(values);
            // address addr = walletFactory.getAddress(alice,getSalt("alice"),commitments[0]);
            // console.log("wallet address:", addr);
            // address walletAddr = address(
            //     walletFactory.createAccount(
            //         alice,
            //         getSalt("alice"),
            //         commitments[0]
            //     )
            // );
            
            // wallet = Wallet(payable(walletAddr));
            // console.log("wallet:",address(wallet));
            myToken = new MyToken(admin);
        }
        vm.stopPrank();
    }

    function getSalt(string memory _name) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_name)));
    }

    // function test_depositToEntrypoint() public {
    //     vm.startPrank(alice);
    //     {
    //         wallet.addDeposit{value: 1 ether}();
    //         uint256 amount = wallet.getDeposit();
    //         console.log("amount: ", amount);
    //     }
    //     vm.stopPrank();
    // }

    // function test_excuteUO() public {
    //     uint256 verificationGasLimit = 1000000; // 示例值
    //     uint256 callGasLimit = 2000000; // 示例值
    //     bytes32 _accountGasLimits = (bytes32(verificationGasLimit) << 128) |
    //     bytes32(callGasLimit);

    //     uint256 maxPriorityFeePerGas = 1000000; // 示例值
    //     uint256 maxFeePerGas = 2000000; // 示例值
    //     bytes32 _gasFees = (bytes32(maxPriorityFeePerGas) << 128) |
    //     bytes32(maxFeePerGas);
    //     bytes memory _calldata = abi.encodeWithSignature(
    //             "transfer(address,uint256)",
    //             bob,
    //             10 ether
    //         );

    //     PackedUserOperation memory puo = PackedUserOperation({
    //         sender: address(wallet),
    //         nonce: wallet.nonce(),
    //         initCode: "",
    //         callData: abi.encodeWithSignature("execute(address,uint256,bytes)",address(myToken),0,_calldata),
    //         // callData:abi.encodeWithSignature("execute()"),
    //         accountGasLimits: _accountGasLimits,
    //         preVerificationGas: 10000000000,
    //         gasFees: _gasFees,
    //         paymasterAndData: "",
    //         signature: "0x"
    //     });

    //     bytes32 puohash = entryPoint.getUserOpHash(puo);
    //     console.log("puohash:",uint(puohash));
    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", puohash)));
    //     bytes memory sig = abi.encodePacked(r, s, v);
    //     puo.signature = sig;

    //     vm.startPrank(alice);
    //     {
    //         myToken.mint(alice, 200 ether);
    //         wallet.addDeposit{value: 1 ether}();
    //         myToken.transfer(address(wallet), 20 ether);

    //         // myToken.approve(address(wallet), 20 ether);
    //         PackedUserOperation[] memory ops = new PackedUserOperation[](1);
    //         ops[0] = puo;
    //         // console.log("ops:",ops);
    //         console.log("wallet:",address(wallet));
    //         // wallet.execute();
    //         entryPoint.handleOps(ops, payable(admin));
    //         console.log("count:",wallet.getCount());
            
    //         console.log("bob_balance: ", myToken.balanceOf(bob));
    //         console.log("alice_balance: ", myToken.balanceOf(alice));
    //     }
    //     vm.stopPrank();
    // }

     function bytesToHexString(bytes memory data) public pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = hexChars[uint(uint8(data[i] >> 4))];
            str[3+i*2] = hexChars[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    function encodeCommitment(PedersenCommitment.Commitment memory commitment) internal pure returns (bytes memory) {
        return abi.encode(commitment.m, commitment.r);
    }

    // function deposit(address addr) external payable {
    //     // 构建函数签名和参数
    //     bytes memory payload = abi.encodeWithSignature("depositTo(address)", addr);
        
    //     // 使用 call 方法调用目标合约
    //     (bool success, ) = entryPoint.call{value: msg.value}(payload);
        
    //     // 检查调用是否成功
    //     require(success, "Call to depositTo failed");
    // }

    function test_createsender() public {
        vm.startPrank(alice);
        {
            uint256[] memory values = new uint256[](1);
            values[0] = getSalt("alice");
            // values[0] = 12160266183512595673888722153253610585066875951680911826333493782620438974488;
            console.log("uint256:", values[0]);

            PedersenCommitment.Commitment[] memory commitments = pedersenCommitment.generateCommitments(values);
            bytes memory commitment = encodeCommitment(commitments[0]);
            bytes memory encodedFunctionData = abi.encodeWithSignature(
               "createAccount(address,uint256,bytes)", 
                alice,
                values[0],
                commitment
            );

            address addr = walletFactory.getAddress(alice,getSalt("alice"),commitment);
            console.log("wallet address:", addr);
            bytes memory payload = abi.encodeWithSignature("depositTo(address)", addr);
        
            // 使用 call 方法调用目标合约
            (bool callsuccess, ) = address(entryPoint).call{value:1 ether}(payload);
            console.log("call success:",callsuccess);

            // (bool success, bytes memory result) = address(walletFactory).call{gas:10000000}(encodedFunctionData);
            // console.log("success:",success);
            address term = 0xB71aa8d44E43D8a28E64fcBd6b651e0dbc0bdb4E;

        // 将地址和编码函数数据拼接成一个字节数组
        bytes memory initCode = abi.encodePacked(address(walletFactory), encodedFunctionData);
        // bytes memory initCode = 0xb71aa8d44e43d8a28e64fcbd6b651e0dbc0bdb4eef67dc6900000000000000000000000042fab67fa18cb0c162e0854f530c18e3969277cd60a73bfb121a98fb6b52dfb29eb0defd76b60065b8cf07902baf28c167d24daf000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000004000000000000000005594b4dd80bc701f45daaf98250091fd2b648641431631af000000000000000000000000000000000000000000000000000000000000003a31303632393333323339393638333233393530313631393831393136373039363931313730383432343534373733363538343535323038383131000000000000;
        console.log("initCode:",bytesToHexString(initCode));

        uint256 verificationGasLimit = 1000000; // 示例值
        uint256 callGasLimit = 2000000; // 示例值
        bytes32 _accountGasLimits = (bytes32(verificationGasLimit) << 128) |
        bytes32(callGasLimit);

        uint256 maxPriorityFeePerGas = 1000000; // 示例值
        uint256 maxFeePerGas = 2000000; // 示例值
        bytes32 _gasFees = (bytes32(maxPriorityFeePerGas) << 128) |
        bytes32(maxFeePerGas);

        PackedUserOperation memory puo = PackedUserOperation({
            sender: address(addr),
            nonce: 0,
            initCode: initCode,
            callData: "",
            // callData:abi.encodeWithSignature("execute()"),
            accountGasLimits: _accountGasLimits,
            preVerificationGas: 10000000000,
            gasFees: _gasFees,
            paymasterAndData: "",
            signature: "0x"
        });

        bytes32 puohash = entryPoint.getUserOpHash(puo);
        console.log("puohash:",uint(puohash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", puohash)));
        bytes memory sig = abi.encodePacked(r, s, v);
        puo.signature = sig;

        PackedUserOperation[] memory ops = new PackedUserOperation[](1);
        ops[0] = puo;

        entryPoint.handleOps(ops, payable(admin));

        // entryPoint.getSenderAddress(initCode);
        // console.log("sender:",sender);
        }
        vm.stopPrank();
    }


}
