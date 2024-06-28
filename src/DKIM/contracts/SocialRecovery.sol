// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./utils/Strings.sol";
import "./Algorithm.sol";
import "./interfaces/IDKIMPublicKeyOracle.sol";

contract SocialRecovery {
    using strings for *;
    IDKIMPublicKeyOracle oracle;

    constructor(address _oracle) {
        oracle = IDKIMPublicKeyOracle(_oracle);
    }

    struct Headers {
        strings.slice dkim;
        string from;
    }

    struct SigTags {
        strings.slice d;
        strings.slice i;
        strings.slice s;
        strings.slice b;
        strings.slice bh;
        strings.slice cHeader;
        strings.slice cBody;
        strings.slice aHash;
        strings.slice aKey;
        strings.slice[] h;
        uint l;
    }

    // function stringToUint(string memory s) public pure returns (uint256) {
    //     bytes memory b = bytes(s);
    //     uint256 number;
    //     for(uint i = 0; i < b.length; i++) {
    //         require(b[i] >= 0x30 && b[i] <= 0x39, "Invalid character");
    //         number = number * 10 + (uint256(uint8(b[i])) - 0x30);
    //     }
    //     return number;
    // }

    function verify(
        string memory toSign,
        string memory body,
        string memory sign,
        uint recoveryNonce,
        address newOwner,
        bool base64Encoded
    )
        public
        view
        returns (
            bool,
            uint256 
        )
    {
        SigTags memory sigTags;
        Headers memory headers;
        bool success;

        headers = parse(toSign.toSlice());

        uint256 from = stringToUint(parseFrom(headers.from));
        strings.slice memory dkimSig = headers.dkim;

        (sigTags, success) = parseSigTags(dkimSig.copy());
        require(success, "parse sig tags failed");
        success = verifyBodyHash(body, sigTags);
        require(success, "verify body hash failed");

        success = verifySignature(sigTags, toSign, sign);
        if (!success) {
            return (false, from);
        }

        if (!verifyBody(body, recoveryNonce, newOwner, base64Encoded)) {
            return (false, from);
        }

        return (success, uint256(from));
    }

    function verifyBody(
        string memory body,
        uint recoveryNonce,
        address newOwner,
        bool base64Encoded) public pure returns (bool) {
        if (base64Encoded) {
            body = removeCarriageReturnAndNewLine(body);
            body = string(Algorithm.base64decode(body));
        }
        body = trim(body.toSlice()).toString();
        bytes memory correct = abi.encode(recoveryNonce + 1, newOwner);
        string memory hexString = bytesToHexString(correct);
        hexString = string(abi.encodePacked("0x", hexString));

        return (keccak256(bytes(hexString)) == keccak256(bytes(body)));
    }

    function bytesToHexString(bytes memory data) public pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory hexString = new bytes(2 * data.length);

        for (uint256 i = 0; i < data.length; i++) {
            uint256 value = uint256(uint8(data[i]));
            hexString[2 * i] = hexChars[value >> 4];
            hexString[2 * i + 1] = hexChars[value & 0x0f];
        }

        return string(hexString);
    }

    function parseFrom(
        string memory from
    ) public pure returns (string memory) {
        strings.slice memory fromValue = from.toSlice();
        fromValue.split("<".toSlice());
        fromValue = fromValue.split(">".toSlice());
        return fromValue.toString();
    }

    function verifyBodyHash(
        string memory body,
        SigTags memory sigTags
    ) internal pure returns (bool) {
        if (sigTags.l > 0 && body.toSlice()._len > sigTags.l) {
            strings.slice memory b =  body.toSlice();
            b._len = sigTags.l;
            body = b.toString();
        }
        bool check = false;
        if (sigTags.aHash.equals("sha256".toSlice())) {
            check = Algorithm.checkSHA256(
                bytes(body),
                sigTags.bh.toString()
            );
        } else {
            check = Algorithm.checkSHA1(
                bytes(body),
                sigTags.bh.toString()
            );
        }
        return check;
    }

    function verifySignature(
        SigTags memory sigTags,
        string memory toSign,
        string memory sign
    ) internal view returns (bool) {
        (bytes memory modulus, bytes memory exponent) = oracle.getRSAKey(
            sigTags.d.toString(),
            sigTags.s.toString()
        );

        require(modulus.length != 0 && exponent.length != 0, "query public key failed");

        bool check = false;
        if (sigTags.aHash.equals("sha256".toSlice())) {
            check = Algorithm.verifyRSASHA256(
                modulus,
                exponent,
                bytes(toSign),
                sign
            );
        } else {
            check = Algorithm.verifyRSASHA1(
                modulus,
                exponent,
                bytes(toSign),
                sign
            );
        }
        return check;
    }

    function parse(
        strings.slice memory all
    )
        internal
        pure
        returns (Headers memory)
    {
        strings.slice memory crlf = "\r\n".toSlice();
        strings.slice memory colon = ":".toSlice();
        strings.slice memory sigName = "dkim-signature".toSlice();
        strings.slice memory fromName = "from".toSlice();

        Headers memory headers = Headers(
            strings.slice(0, 0),
            ""
        );

        strings.slice memory headerName = strings.slice(0, 0);
        strings.slice memory headerValue = strings.slice(0, 0);
        while (!all.empty()) {
            strings.slice memory part = all.split(crlf);
            headerName = part.copy().split(colon).toString().toSlice();
            headerValue = part;
            if (headerName.equals(sigName)) {
                headers.dkim = headerValue;
            } else if (headerName.equals(fromName)) {
                headers.from = headerValue.toString();
            }
        }
        return headers;
    }

    // @dev https://tools.ietf.org/html/rfc6376#section-3.5
    function parseSigTags(
        strings.slice memory signature
    ) internal pure returns (SigTags memory sigTags, bool success) {
        strings.slice memory sc = ";".toSlice();
        strings.slice memory eq = "=".toSlice();

        signature.split(":".toSlice());
        while (!signature.empty()) {
            strings.slice memory value = signature.split(sc);
            strings.slice memory name = trim(value.split(eq));
            value = trim(value);

            if (name.equals("v".toSlice()) && !value.equals("1".toSlice())) {
                return (sigTags, false);
            } else if (name.equals("d".toSlice())) {
                sigTags.d = value;
            } else if (name.equals("i".toSlice())) {
                sigTags.i = value;
            } else if (name.equals("s".toSlice())) {
                sigTags.s = value;
            } else if (name.equals("c".toSlice())) {
                if (value.empty()) {
                    sigTags.cHeader = "simple".toSlice();
                    sigTags.cBody = "simple".toSlice();
                } else {
                    sigTags.cHeader = value.split("/".toSlice());
                    sigTags.cBody = value;
                    if (sigTags.cBody.empty()) {
                        sigTags.cBody = "simple".toSlice();
                    }
                }
            } else if (name.equals("a".toSlice())) {
                sigTags.aKey = value.split("-".toSlice());
                sigTags.aHash = value;
                if (sigTags.aHash.empty()) {
                    return (sigTags, false);
                }
                if (
                    !sigTags.aHash.equals("sha256".toSlice()) &&
                    !sigTags.aHash.equals("sha1".toSlice())
                ) {
                    return (sigTags, false);
                }
                if (!sigTags.aKey.equals("rsa".toSlice())) {
                    return (sigTags, false);
                }
            } else if (name.equals("bh".toSlice())) {
                sigTags.bh = value;
            } else if (name.equals("h".toSlice())) {
                bool signedFrom;
                (sigTags.h, signedFrom) = parseSigHTag(value);
                if (!signedFrom) {
                    return (sigTags, false);
                }
            } else if (name.equals("l".toSlice())) {
                sigTags.l = stringToUint(value.toString());
            }
        }

        if (
            sigTags.aKey.empty() ||
            sigTags.bh.empty() ||
            sigTags.d.empty() ||
            sigTags.s.empty() ||
            sigTags.h.length == 0
        ) {
            return (sigTags, false);
        }
        if (sigTags.i.empty()) {
            // behave as though the value of i tag were "@d"
        } else if (!sigTags.i.endsWith(sigTags.d)) {
            return (sigTags, false);
        }
        return (sigTags, true);
    }

    function parseSigHTag(
        strings.slice memory value
    ) internal pure returns (strings.slice[] memory, bool) {
        strings.slice memory colon = ":".toSlice();
        strings.slice memory from = "from".toSlice();
        strings.slice[] memory list = new strings.slice[](
            value.count(colon) + 1
        );
        bool signedFrom = false;

        for (uint i = 0; i < list.length; i++) {
            strings.slice memory h = trim(value.split(colon)).toString().toSlice();
            uint j = 0;
            for (; j < i; j++) if (list[j].equals(h)) break;
            if (j == i) list[i] = h;
            if (h.equals(from)) signedFrom = true;
        }
        return (list, signedFrom);
    }

    function trim(
        strings.slice memory self
    ) internal pure returns (strings.slice memory) {
        strings.slice memory sp = "\x20".toSlice();
        strings.slice memory tab = "\x09".toSlice();
        strings.slice memory crlf = "\r\n".toSlice();
        if (self.startsWith(crlf)) {
            self._len -= 2;
            self._ptr += 2;
        }
        while (self.startsWith(sp) || self.startsWith(tab)) {
            self._len -= 1;
            self._ptr += 1;
        }
        if (self.endsWith(crlf)) {
            self._len -= 2;
        }
        while (self.endsWith(sp) || self.endsWith(tab)) {
            self._len -= 1;
        }
        return self;
    }

    function unfoldContinuationLines(
        strings.slice memory value,
        bool isTrim
    ) internal pure returns (strings.slice memory) {
        strings.slice memory crlf = "\r\n".toSlice();
        uint count = value.count(crlf);
        if (count == 0) return value;
        strings.slice[] memory parts = new strings.slice[](count + 1);
        for (uint i = 0; i < parts.length; i++) {
            parts[i] = value.split(crlf);
            if (isTrim) parts[i] = trim(parts[i]);
        }
        return "".toSlice().join(parts).toSlice();
    }

    function stringToUint(string memory s) internal pure returns (uint result) {
        bytes memory b = bytes(s);
        uint i;
        result = 0;
        for (i = 0; i < b.length; i++) {
            uint c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
    }

    function joinNoEmpty(
        strings.slice memory self,
        strings.slice[] memory parts
    ) internal pure returns (string memory) {
        if (parts.length == 0) return "";
        uint length = 0;
        uint i;
        for (i = 0; i < parts.length; i++)
            if (parts[i]._len > 0) {
                length += self._len + parts[i]._len;
            }
        length -= self._len;

        string memory ret = new string(length);
        uint retptr;
        assembly {
            retptr := add(ret, 32)
        }

        for (i = 0; i < parts.length; i++) {
            if (parts[i]._len == 0) continue;
            memcpy(retptr, parts[i]._ptr, parts[i]._len);
            retptr += parts[i]._len;
            if (i < parts.length - 1) {
                memcpy(retptr, self._ptr, self._len);
                retptr += self._len;
            }
        }

        return ret;
    }

    function memcpy(uint dest, uint src, uint len) private pure {
        for (; len >= 32; len -= 32) {
            assembly {
                mstore(dest, mload(src))
            }
            dest += 32;
            src += 32;
        }

        // Copy remaining bytes
        uint mask = 256 ** (32 - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }
    }

    function removeCarriageReturnAndNewLine(string memory input) public pure returns (string memory) {
        bytes memory inputBytes = bytes(input);
        uint256 length = inputBytes.length;
        bytes memory result = new bytes(length);
        uint256 resultLength = 0;

        for (uint256 i = 0; i < length; i++) {
            if (inputBytes[i] != bytes1('\r') && inputBytes[i] != bytes1('\n')) {
                result[resultLength] = inputBytes[i];
                resultLength++;
            }
        }

        bytes memory finalResult = new bytes(resultLength);
        for (uint256 j = 0; j < resultLength; j++) {
            finalResult[j] = result[j];
        }

        return string(finalResult);
    }
}
