import { ethers } from 'ethers';
import FACTORY_ABI from '../contracts/walletfactory.json';
import {WALLET_ABI} from '../contracts/wallet.json';
// 你的RPC URL（例如Infura或Alchemy的URL）
const rpcUrl = 'https://sepolia.infura.io/v3/';

// 创建provider
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// const WALLET_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const FACTORY_ADDRESS = "0x0fbb992103a9f922cf501963902ee9db23258b9e";

// 因为前端只调只读函数不发送交易，所以不需要signer
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
// const wallet = new ethers.Contract(WALLET_ADDRESS, WALLET_ABI, provider);

// 创建账户
export async function createWallet() {
    var privateKey = ethers.utils.randomBytes(32);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("私钥: " + privateKey);
    console.log("账号地址: " + wallet.address);
}

// 创建钱包所需要的initcode
export async function createAccount(owner,salt,emailcommitment) {
    let initCode =
        FACTORY_ADDRESS +
        factory.interface
            .encodeFunctionData("createAccount", owner,salt,emailcommitment)
            .slice(2);
    return initCode;
}

export async function getSalt(email) {
      // 使用ethers.utils来进行keccak256哈希计算
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
      // 将哈希值转换为uint256
      const uint256Hash = ethers.BigNumber.from(hash);
      return uint256Hash;
}


// 前端获取钱包地址
export async function getWalletAddress(owner, salt, emailcommitment) {
    return factory.getAddress(owner, salt, emailcommitment);
}

export async function signUOP(wallet,uop) {
   let signature = wallet.sign(uop);
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

// export async function getWalletBalance(address) {
//     return wallet.getBalance(address);
// }

export const createPackedUserOperation = (sender, nonce, initCode, callData, accountGasLimits, preVerificationGas, gasFees, paymasterAndData, signature) => {
    return {
        sender: sender,                                  // 发送地址
        nonce: nonce,                                    // nonce值
        initCode: initCode,                              // initCode
        callData: callData,                              // callData
        accountGasLimits: ethers.utils.hexlify(accountGasLimits), // gas限制
        preVerificationGas: preVerificationGas,          // 预验证gas
        gasFees: ethers.utils.hexlify(gasFees),          // gas费用
        paymasterAndData: paymasterAndData,              // paymaster数据
        signature: signature                             // 签名
    };
};







