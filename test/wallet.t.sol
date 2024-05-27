// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Wallet} from "../src/wallet.sol";
import {MyEntryPoint} from "../src/entrypoint.sol";
import {WalletFactory} from "../src/WalletFactory.sol";
import {SocialRecovery} from "../src/DKIM/contracts/SocialRecovery.sol";
import {PublicKeyOracle} from "../src/DKIM/contracts/PublicKeyOracle.sol";

contract walletTest is Test {
    Wallet public wallet;
    WalletFactory public walletFactory;
    MyEntryPoint public entryPoint;
    SocialRecovery public socialRecovery;
    PublicKeyOracle public publicKeyOracle;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address admin = makeAddr("admin");

    function setUp() public {
        vm.startPrank(admin);
        {
            publicKeyOracle = new PublicKeyOracle();
            socialRecovery = new SocialRecovery(address(publicKeyOracle));
            entryPoint = new MyEntryPoint();
            walletFactory = new WalletFactory(
                entryPoint,
                address(socialRecovery)
            );
            address walletAddr = address(walletFactory.createAccount(
                alice,
                getSalt("alice"),
                getSalt("2865755738@qq.com")
            ));
            wallet = Wallet(payable(walletAddr));
        }
        vm.stopPrank();
    }

    function getSalt(string memory _name) public returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_name)));
    }

    function test_depositToEntrypoint() public {
        vm.startPrank(alice);
        wallet.addDeposit{value: 1 ether};
        

    }
}
