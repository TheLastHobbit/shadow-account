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
import {PedersenCommitment} from "../src/ZKtool.sol";

contract walletTest is Test {
    Wallet public wallet;
    WalletFactory public walletFactory;
    MyEntryPoint public entryPoint;
    SocialRecovery public socialRecovery;
    PublicKeyOracle public publicKeyOracle;
    MyToken public myToken;
    PedersenCommitment public pedersenCommitment;

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
            pedersenCommitment = new PedersenCommitment();
            socialRecovery = new SocialRecovery(address(publicKeyOracle));
            entryPoint = new MyEntryPoint();
            walletFactory = new WalletFactory(
                entryPoint,
                address(socialRecovery)
            );
            uint256[] memory values = new uint256[](1);
            // values[0] = getSalt("2865755738@qq.com");
            values[0] = 12160266183512595673888722153253610585066875951680911826333493782620438974488;
            console.log("uint256:", values[0]);

            PedersenCommitment.Commitment[] memory commitments = pedersenCommitment.generateCommitments(values);
            address addr = walletFactory.getAddress(alice,getSalt("alice"),commitments[0]);
            console.log("wallet address:", addr);
            address walletAddr = address(
                walletFactory.createAccount(
                    alice,
                    getSalt("alice"),
                    commitments[0]
                )
            );
            
            wallet = Wallet(payable(walletAddr));
            console.log("wallet:",address(wallet));
            myToken = new MyToken(admin);
        }
        vm.stopPrank();
    }

    function getSalt(string memory _name) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_name)));
    }

    function test_depositToEntrypoint() public {
        vm.startPrank(alice);
        {
            wallet.addDeposit{value: 1 ether}();
            uint256 amount = wallet.getDeposit();
            console.log("amount: ", amount);
        }
        vm.stopPrank();
    }

    function test_excuteUO() public {
        uint256 verificationGasLimit = 1000000; // 示例值
        uint256 callGasLimit = 2000000; // 示例值
        bytes32 _accountGasLimits = (bytes32(verificationGasLimit) << 128) |
        bytes32(callGasLimit);

        uint256 maxPriorityFeePerGas = 1000000; // 示例值
        uint256 maxFeePerGas = 2000000; // 示例值
        bytes32 _gasFees = (bytes32(maxPriorityFeePerGas) << 128) |
        bytes32(maxFeePerGas);
        bytes memory _calldata = abi.encodeWithSignature(
                "transfer(address,uint256)",
                bob,
                10 ether
            );

        PackedUserOperation memory puo = PackedUserOperation({
            sender: address(wallet),
            nonce: wallet.nonce(),
            initCode: "",
            callData: abi.encodeWithSignature("execute(address,uint256,bytes)",address(myToken),0,_calldata),
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

        vm.startPrank(alice);
        {
            myToken.mint(alice, 200 ether);
            wallet.addDeposit{value: 1 ether}();
            myToken.transfer(address(wallet), 20 ether);
            // myToken.approve(address(wallet), 20 ether);
            PackedUserOperation[] memory ops = new PackedUserOperation[](1);
            ops[0] = puo;
            // console.log("ops:",ops);
            console.log("wallet:",address(wallet));
            // wallet.execute();
            entryPoint.handleOps(ops, payable(admin));
            console.log("count:",wallet.getCount());
            
            console.log("bob_balance: ", myToken.balanceOf(bob));
            console.log("alice_balance: ", myToken.balanceOf(alice));
        }
        vm.stopPrank();
    }

    


}
