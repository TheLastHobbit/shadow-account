import { ethers } from 'ethers';
import FACTORY_ABI from '../contracts/walletfactory.json';
import WALLET_ABI from '../contracts/wallet.json';
import ZKTool_ABI from '../contracts/zkTool.json';
// 你的RPC URL（例如Infura或Alchemy的URL）
const rpcUrl = 'https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd';

// 创建provider
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// const WALLET_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const FACTORY_ADDRESS = "0x0fbb992103a9f922cf501963902ee9db23258b9e";
const ZKTOOL_ADDRESS = "0x14212D025F8da315271334741fC49bCeeE6Dcf42"

// 因为前端只调只读函数不发送交易，所以不需要signer
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
const zktool = new ethers.Contract(ZKTOOL_ADDRESS, ZKTool_ABI, provider);
// const wallet = new ethers.Contract(WALLET_ADDRESS, WALLET_ABI, provider);

// 创建账户
export async function createWallet() {
    var privateKey = ethers.utils.randomBytes(32);
    var wallet = new ethers.Wallet(privateKey, provider);
    // console.log("私钥: " + wallet.privateKey);
    // console.log("账号地址: " + wallet.address);
    return wallet;
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

export async function getCommitment(email) {
    // 验证 email 是有效字符串
    // if (typeof email !== 'string' || !email.includes('@')) {
    //     throw new Error('Invalid email format');
    // }
    // 将 email 哈希为 uint256
    console.log("zktool:",zktool)
    const code =provider.getCode(ZKTOOL_ADDRESS)
    console.log("cccc:",code)
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
        const commitment = await zktool.callStatic.generateCommitments(uint256Array);
        return commitment;
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


// 前端获取钱包地址
export async function getWalletAddress(owner, salt, emailcommitment) {
    console.log("getWalletAddress:",owner, salt, emailcommitment);
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
    // 新建 packedUserOperation 对象
    const packedUserOperation = {
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

    // 返回新建的 packedUserOperation 对象
    return packedUserOperation;
};







