const ethers = require('ethers');
const { ec: EC } = require('elliptic');
const fs = require('fs');

// 配置
const privateKey = process.env.PRIVATE_KEY || '0xYour64CharacterHexPrivateKey';
const wallet = new ethers.Wallet(privateKey);
const aaAddress = wallet.address;
const secp256k1 = new EC('secp256k1');

async function generateParameters() {
    // 生成随机私钥和公钥
    const randomWallet = ethers.Wallet.createRandom();
    const key = secp256k1.keyFromPrivate(randomWallet.privateKey.slice(2), 'hex');
    const pub = key.getPublic();
    const x = ethers.utils.hexZeroPad(ethers.utils.hexlify(pub.getX().toBuffer()), 32);
    const y = ethers.utils.hexZeroPad(ethers.utils.hexlify(pub.getY().toBuffer()), 32);

    // 计算消息哈希：keccak256(abi.encodePacked(x, y))
    const messageHash = ethers.utils.keccak256(
        ethers.utils.concat([x, y])
    );

    // 直接签名消息哈希
    const signingKey = wallet._signingKey();
    const sig = signingKey.signDigest(messageHash);
    const signature = ethers.utils.hexlify(
        ethers.utils.concat([
            sig.r,
            sig.s,
            ethers.utils.hexlify(sig.recoveryParam + 27) // v = 27 或 28
        ])
    );

    // 验证签名
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
    const isValid = recoveredAddress !== ethers.constants.AddressZero && recoveredAddress.toLowerCase() === wallet.address.toLowerCase();

    // 输出参数
    console.log('Parameters for registerPublicKey:');
    console.log('x:', x);
    console.log('y:', y);
    console.log('signature:', signature);
    console.log('aaAddress:', aaAddress);
    console.log('Recovered signer:', recoveredAddress);
    console.log('Valid signature:', isValid);

    // 保存到文件
    const params = { x, y, signature, aaAddress };
    fs.writeFileSync('publicKey.json', JSON.stringify(params, null, 2));
    console.log('Parameters saved to publicKey.json');
}

generateParameters().catch(console.error);