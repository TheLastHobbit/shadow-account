import { ethers } from 'ethers';
import FACTORY_ABI from '../contracts/walletfactory.json';
import WALLET_ABI from '../contracts/wallet.json';
import ZKTool_ABI from '../contracts/zkTool.json';
import ENTRYPOINT_ABI from '../contracts/entrypoint.json';
// 你的RPC URL（例如Infura或Alchemy的URL）
const rpcUrl = 'https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd';

// 创建provider
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// const WALLET_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const FACTORY_ADDRESS = "0xB71aa8d44E43D8a28E64fcBd6b651e0dbc0bdb4E";
const ZKTOOL_ADDRESS = "0xCBa2Be4eCEa8c15F6FC4fd31C5fa85Bf0377291e"
const ENTRYPOINT_ADDRESS = "0x1A5C9969F47Ef041c3A359ae4ae9fd9E70eA5653";

// 因为前端只调只读函数不发送交易，所以不需要signer
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
const zktool = new ethers.Contract(ZKTOOL_ADDRESS, ZKTool_ABI, provider);
// const wallet = new ethers.Contract(WALLET_ADDRESS, WALLET_ABI, provider);
const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);

// 创建账户
export async function createWallet() {
    var privateKey = ethers.utils.randomBytes(32);
    var wallet = new ethers.Wallet(privateKey, provider);
    // console.log("私钥: " + wallet.privateKey);
    // console.log("账号地址: " + wallet.address);
    return wallet;
}

// 创建钱包所需要的initcode
export async function createAccount(owner, salt, emailcommitment) {
    let initCode =
        FACTORY_ADDRESS +
        factory.interface
            .encodeFunctionData("createAccount", [
                owner,
                salt,
                emailcommitment
            ])
            .slice(2);
    console.log("initCode: " + initCode);
    return initCode;
}

export function encodeCommitment(commitment) {
    // 使用 ethers.js 的 defaultAbiCoder 进行编码
    console.log("commitment: " + commitment);
    const abiCoder = ethers.utils.defaultAbiCoder;
    console.log("2222");
    return abiCoder.encode(
        ["string", "uint256"],
        [commitment.m, commitment.r]
    );
}

export async function getCommitment(email) {
    // 验证 email 是有效字符串
    // if (typeof email !== 'string' || !email.includes('@')) {
    //     throw new Error('Invalid email format');
    // }

    // 打印 zktool 合约实例以确认其已正确初始化
    console.log("zktool:", zktool);

    // 将 email 哈希为 keccak256
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));

    // 将哈希转换为字节数组
    const hashBytes = ethers.utils.arrayify(hash);

    // 将字节数组转换为 uint256
    const uint256Value = ethers.BigNumber.from(hashBytes);

    // 将 uint256Value 转换为十进制字符串
    const decimalValue = uint256Value.toString();

    // 将 decimalValue 包装在数组中
    const uint256Array = [decimalValue];

    // 打印 uint256Array 确认内容
    console.log('uint256Array:', uint256Array);

    try {
        // 调用合约的 generateCommitments 函数
        const commitments = await zktool.callStatic.generateCommitments(uint256Array);

        // 将 commitments 转换为可读格式
        const readableCommitments = commitments.map(commitment => ({
            m: commitment.m,
            r: commitment.r.toString()
        }));

        // 返回可读格式的 commitments
        return readableCommitments;
    } catch (error) {
        console.error('Error generating commitment:', error);
        throw error;
    }
}

export async function getSalt(email) {
    // 使用ethers.utils来进行keccak256哈希计算
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
    // 将哈希值转换为uint256
    const uint256Hash = ethers.BigNumber.from(hash);
    return uint256Hash;
}

export async function getHash(uop) {
    // 确保 uop 参数格式正确
    if (!uop || typeof uop !== 'object') {
        throw new Error('Invalid uop parameter');
    }

    // 处理空字符串
    uop.callData = uop.callData || '0x';
    uop.paymasterAndData = uop.paymasterAndData || '0x';
    uop.signature = uop.signature || '0x';
    try {
        // 调用合约的 getUserOpHash 函数
        const hash = await entrypoint.callStatic.getUserOpHash(uop);
        return hash;
    } catch (error) {
        console.error('Error getting user operation hash:', error);
        throw error;
    }
}


// 前端获取钱包地址
export async function getWalletAddress(owner, salt, emailcommitment) {
    console.log("getWalletAddress:", owner, salt, emailcommitment);
    const walletAddress = await factory.callStatic.getAddress(owner, salt, emailcommitment);
    return walletAddress;
}

export async function signUOP(wallet, uopHash) {
    let signature = await wallet.signMessage(ethers.utils.arrayify(uopHash));
    return signature;
}

const packedUserOperation = {
    sender: '',                  // 发送地址
    nonce: 0,                    // nonce值
    initCode: '',                // initCode
    callData: '',                // callData
    accountGasLimits: '',        // gas限制
    preVerificationGas: 0,       // 预验证gas
    gasFees: '',                 // gas费用
    paymasterAndData: '',        // paymaster数据
    signature: ''                // 签名
};

// export async function getWalletBalance(wallet,address) {
//     return wallet.getBalance(address);
// }



export const createPackedUserOperation = async (sender, initCode, callData, accountGasLimits, preVerificationGas, gasFees, paymasterAndData, signature) => {
    const currentNonce = await provider.getTransactionCount(sender, 'latest');
    console.log('Current nonce:', currentNonce);

    // 新建 packedUserOperation 对象
    const packedUserOperation = {
        sender: sender,                                  // 发送地址
        nonce: currentNonce,                                    // nonce值
        initCode: initCode,                              // initCode
        callData: callData,                              // callData
        accountGasLimits: accountGasLimits, // gas限制
        preVerificationGas: preVerificationGas,          // 预验证gas
        gasFees: gasFees,          // gas费用
        paymasterAndData: paymasterAndData,              // paymaster数据
        signature: signature                             // 签名
    };

    // 返回新建的 packedUserOperation 对象
    return packedUserOperation;
};







