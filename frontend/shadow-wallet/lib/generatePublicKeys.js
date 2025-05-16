const { ethers } = require("ethers");
const secp256k1 = require("elliptic").ec("secp256k1");

async function generatePublicKeys(n) {
    if (!Number.isInteger(n) || n < 1) {
        throw new Error("Invalid number of public keys");
    }
    const keys = [];
    for (let i = 0; i < n; i++) {
        const wallet = ethers.Wallet.createRandom();
        const key = secp256k1.keyFromPrivate(wallet.privateKey.slice(2), "hex");
        const pub = key.getPublic();
        const x = ethers.hexlify(pub.getX().toBuffer());
        const y = ethers.hexlify(pub.getY().toBuffer());
        keys.push({ x, y });
    }
    console.log(`Generated ${keys.length} public keys`);
    return keys;
}

module.exports = { generatePublicKeys };