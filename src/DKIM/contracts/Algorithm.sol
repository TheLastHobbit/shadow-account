// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@ensdomains/solsha1/contracts/SHA1.sol";
import "@ensdomains/buffer/contracts/Buffer.sol";

library Algorithm {
    using Buffer for *;

    function checkSHA256(bytes memory data, string memory bodyHash) internal pure returns (bool) {
        bytes32 digest = sha256(data);
        return readBytes32(base64decode(bodyHash), 0) == digest;
    }

    function checkSHA1(bytes memory data, string memory bodyHash) internal pure returns (bool) {
        bytes20 digest = SHA1.sha1(data);
        return readBytes20(base64decode(bodyHash), 0) == digest;
    }

    function verifyRSASHA256(bytes memory modulus, bytes memory exponent, bytes memory data, string memory sig) internal view returns (bool) {
        // Recover the message from the signature
        bool ok;
        bytes memory result;
        (ok, result) = modexp(base64decode(sig), exponent, modulus);

        // Verify it ends with the hash of our data
        return ok && sha256(data) == readBytes32(result, result.length - 32);
    }

    function verifyRSASHA1(bytes memory modulus, bytes memory exponent, bytes memory data, string memory sig) internal view returns (bool) {
        // Recover the message from the signature
        bool ok;
        bytes memory result;
        (ok, result) = modexp(base64decode(sig), exponent, modulus);

        // Verify it ends with the hash of our data
        return ok && SHA1.sha1(data) == readBytes20(result, result.length - 20);
    }


    /**
    * @dev Computes (base ^ exponent) % modulus over big numbers.
    */
    function modexp(bytes memory base, bytes memory exponent, bytes memory modulus) internal view returns (bool success, bytes memory output) {
        uint size = (32 * 3) + base.length + exponent.length + modulus.length;

        Buffer.buffer memory input;
        input.init(size);

        input.appendBytes32(bytes32(base.length));
        input.appendBytes32(bytes32(exponent.length));
        input.appendBytes32(bytes32(modulus.length));
        input.append(base);
        input.append(exponent);
        input.append(modulus);

        output = new bytes(modulus.length);

        assembly {
            success := staticcall(gas(), 5, add(mload(input), 32), size, add(output, 32), mload(modulus))
        }
    }

    /*
    * @dev Returns the 32 byte value at the specified index of self.
    * @param self The byte string.
    * @param idx The index into the bytes
    * @return The specified 32 bytes of the string.
    */
    function readBytes32(bytes memory self, uint idx) internal pure returns (bytes32 ret) {
        // require(self.length >= 32, "Input data length should be at least 32 bytes");
        // bytes32 result;
        // assembly {
        //     result := mload(add(self, 32))
        // }

        // return result;
        require(idx + 32 <= self.length);
        assembly {
            ret := mload(add(add(self, 32), idx))
        }
    }

    /*
    * @dev Returns the 32 byte value at the specified index of self.
    * @param self The byte string.
    * @param idx The index into the bytes
    * @return The specified 32 bytes of the string.
    */
    function readBytes20(bytes memory self, uint idx) internal pure returns (bytes20 ret) {
        require(idx + 20 <= self.length);
        assembly {
            ret := and(mload(add(add(self, 32), idx)), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000000)
        }
    }

    function base64decode(string memory base64String) public pure returns (bytes memory) {
        bytes memory data = bytes(base64String);
        uint256 length = data.length;
        require(length % 4 == 0, "Invalid base64 string length");

        uint256 decodedLength = (length / 4) * 3;
        if (data[length - 1] == "=") {
            decodedLength--;
        }
        if (data[length - 2] == "=") {
            decodedLength--;
        }

        bytes memory decodedData = new bytes(decodedLength);

        uint256 dataIndex = 0;
        uint256 decodedIndex = 0;

        while (dataIndex < length) {
            uint256 chunk = 0;
            for (uint256 i = 0; i < 4; i++) {
                chunk = chunk << 6;
                if (uint8(data[dataIndex]) >= 65 && uint8(data[dataIndex]) <= 90) {
                    chunk |= uint256(uint8(data[dataIndex])) - 65;
                } else if (uint8(data[dataIndex]) >= 97 && uint8(data[dataIndex]) <= 122) {
                    chunk |= uint256(uint8(data[dataIndex])) - 71;
                } else if (uint8(data[dataIndex]) >= 48 && uint8(data[dataIndex]) <= 57) {
                    chunk |= uint256(uint8(data[dataIndex])) + 4;
                } else if (data[dataIndex] == '+') {
                    chunk |= 62;
                } else if (data[dataIndex] == '/') {
                    chunk |= 63;
                } else if (data[dataIndex] == '=') {
                    chunk |= 0;
                } else {
                    revert("Invalid base64 character");
                }
                dataIndex++;
            }

            for (uint256 i = 0; i < 3; i++) {
                if (decodedIndex < decodedLength) {
                    decodedData[decodedIndex] = bytes1(uint8(chunk >> (16 - i * 8)));
                    decodedIndex++;
                }
            }
        }

        return decodedData;
    }
}