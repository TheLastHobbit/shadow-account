// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Wallet.sol";

contract WalletFactory {
    event WalletCreated(address indexed owner, address contractAddress);

    address public dkim;

    constructor(address _dkim) {
        dkim = _dkim;
    }

    function createWallet(uint256 salt, address owner, uint256 emailHash) external returns (address) {
        address addr = deploy(salt, owner, emailHash);
        emit WalletCreated(owner, addr);
        return addr;
    }

    function getBytecode() public pure returns (bytes memory) {
        bytes memory bytecode = type(Wallet).creationCode;
        return abi.encodePacked(bytecode);
    }

    function getAddress(uint256 _salt)
        public
        view
        returns (address)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(getBytecode())
            )
        );
        return address(uint160(uint256(hash)));
    }

    function deploy(uint256 _salt, address owner, uint256 emailHash)
        public
        payable
        returns (address)
    {
        bytes memory bytecode = getBytecode();
        address payable addr;
        /*
          how to call create
          create2(v,p,n,s)
          v amount of eth to send
          p pointer to start of code in memory
          n size of code
          s salt
         */
        assembly {
            addr := create2(
                // weisent with current call
                callvalue(),
                add(bytecode, 0x20),
                mload(bytecode),
                _salt
            )
        }
        Wallet(addr).initialize(dkim, owner, emailHash);
        return addr;
    }
}