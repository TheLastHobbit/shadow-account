// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract PedersenCommitment {
    uint256 private constant g = 2;
    uint256 private constant h = 3;
    uint256 private constant p = 6277101735386680763835789423207666416083908700390324961279;

    struct Commitment {
        string m; 
        uint256 r;
    }

    function generateCommitments(uint256[] memory values) public view returns (Commitment[] memory) {
        uint256 numParticipants = values.length;
        Commitment[] memory commitments = new Commitment[](numParticipants);

        for (uint256 i = 0; i < numParticipants; i++) {
            uint256 r = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, i))) % p;
            uint256 gm = expMod(g, values[i], p);
            uint256 hr = expMod(h, r, p);
            uint256 c = gm * hr % p;
            commitments[i] = Commitment(uintToString(c), r);
        }

        return commitments;
    }


    function verify(uint256[] memory values, Commitment[] memory commitments) public pure returns (bool) {
        uint256 combinedValue;
        for (uint256 i = 0; i < values.length; i++) {
            combinedValue += values[i];
        }

        uint256 gm = expMod(g, combinedValue, p);
        uint256 product = 1;
        uint256 hr = 0;

        for (uint256 i = 0; i < commitments.length; i++) {
            hr += commitments[i].r;
            uint256 mAsUint = stringToUint(commitments[i].m); 
            product = product * mAsUint % p;
        }

        uint256 C = gm * expMod(h, hr, p) % p;

        return C == product;
    }

    function uintToString(uint256 _value) private pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + _value % 10));
            _value /= 10;
        }
        return string(buffer);
    }

    // Helper function to convert string to uint256
    function stringToUint(string memory s) private pure returns (uint256 result) {
        bytes memory b = bytes(s);
        uint256 i;
        result = 0;
        for (i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
    }

    function expMod(uint256 base, uint256 exp, uint256 mod) private pure returns (uint256) {
        return base**exp % mod;
    }
}