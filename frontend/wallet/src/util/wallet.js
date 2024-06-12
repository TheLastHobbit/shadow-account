import { ethers } from 'ethers';

let provider = new ethers.BrowserProvider(window.ethereum);
const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const contract = new ethers.Contract(contractAddress, ABI, await provider.getSigner());

// 创建账户
export async function createWallet() {
    var privateKey = ethers.utils.randomBytes(32);
    var wallet = new ethers.Wallet(privateKey);
    console.log("账号地址: " + wallet.address);
}

// 创建钱包所需要的initcode
export async function createAccount(owner, salt) {
    let initCode =
        FACTORY_ADDRESS +
        AccountFactory.interface
            .encodeFunctionData("createAccount", owner,salt,emailhash)
            .slice(2);
    return initCode;
}

// 前端获取钱包地址
export async function getWalletAddress(owner, salt, emailHash) {
    return contract.getAddress(owner, salt, emailHash);
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

export async function getWalletBalance(address) {
    return contract.getBalance(address);
}

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







