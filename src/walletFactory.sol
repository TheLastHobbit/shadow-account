// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;
import {Test, console} from "forge-std/Test.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {Wallet} from "./Wallet.sol";
import {PedersenCommitment} from "./ZKtool.sol";

contract WalletFactory {
    Wallet public immutable walletImplementation;
    address public dkim;
    struct Commitment {
        string m; 
        uint256 r;
    }

    constructor(IEntryPoint entryPoint, address _dkim) {
        walletImplementation = new Wallet(address(entryPoint));
        dkim = _dkim;
    }

    function getAddress(
        address owner,
        uint256 salt,
        bytes memory commitment
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(walletImplementation),
                            abi.encodeCall(
                                Wallet.initialize,
                                (dkim, owner, commitment)
                            )
                        )
                    )
                )
            );
    }

    function createAccount(
        address owner,
        uint256 salt,
        bytes memory commitment
    ) external returns (Wallet) {
        // Get the counterfactual address
        address addr = getAddress(owner, salt, commitment);
        // Check if the code at the counterfactual address is non-empty
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            // If the code is non-empty, i.e. account already deployed, return the Wallet at the counterfactual address
            return Wallet(payable(addr));
        }
        console.log("qqqq");

        // If the code is empty, deploy a new Wallet
        bytes memory walletInit = abi.encodeCall(
            Wallet.initialize,
            (dkim, owner, commitment)
        );

        console.log("qqqq");
        ERC1967Proxy proxy = new ERC1967Proxy{salt: bytes32(salt)}(
            address(walletImplementation),
            walletInit
        );
        // Return the newly deployed Wallet
        console.log("wallet:");

        return Wallet(payable(address(proxy)));
    }

    function create(
        address owner,
        uint256 salt
    ) external returns (Wallet) {
        console.log("create");
        console.log("owner:", owner);
        console.log("salt:", salt);

        return walletImplementation;
    }
}
