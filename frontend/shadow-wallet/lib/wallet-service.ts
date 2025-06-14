"use client";

import { useEffect, useCallback } from "react";
import { ethers } from "ethers";
import memoryUtil from "./utils/memoryUtil";
import storageUtils from "./utils/storageUtils";
import { encrypt,decrypt } from "./utils/shamir";
import { useWallet } from '../contexts/WalletContext';
import { H2 } from './crypto';
import { useSocialRecovery } from '../hooks/useSocialRecovery';

// 导入合约 ABI
import WALLET_FACTORY_ABI from "../contracts/walletFactory.json";
import SHADOW_WALLET_FACTORY_ABI from "../contracts/shadowWalletFactory.json";
import WALLET_ABI from "../contracts/wallet.json";
import SHADOW_WALLET_ABI from "../contracts/shadowWallet.json";
import ENTRYPOINT_ABI from "../contracts/entrypoint.json";
import ZKTool_ABI from "../contracts/zkTool.json";
import { Share } from "lucide-react";

// 常量
const rpcUrl = "https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd";
// const rpcUrl = "https://sepolia.infura.io/v3/7cbaf46a5d5e4e7e9d4bcaf436516aa2";
const WALLET_FACTORY_ADDRESS = "0x66ECFfbf718ED2Cabe1d37FD4434d6d11069fB9d";
const SHADOW_WALLET_FACTORY_ADDRESS = "0x712aD73aE120b2d468D02AB3B61e7317cA2CfD51";
const ENTRYPOINT_ADDRESS = "0x1A5C9969F47Ef041c3A359ae4ae9fd9E70eA5653";
const ZKTOOL_ADDRESS = "0xCBa2Be4eCEa8c15F6FC4fd31C5fa85Bf0377291e";
const API_BASE_URL = "http://127.0.0.1:8000";
const { ec: EC } = require('elliptic');
const secp256k1 = new EC('secp256k1');

// 错误日志辅助函数
const logError = (error: any, functionName: string) => {
  console.error(`wallet-service.ts (${functionName}) 中的错误:`, error);
  console.error("堆栈跟踪:", error.stack);
  return error;
};

// 将 BigInt 转换为字符串以便 JSON 序列化
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint" || ethers.BigNumber.isBigNumber(obj)) return obj.toString();
  if (obj instanceof Uint8Array) return ethers.utils.hexlify(obj); // 处理字节数组
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  const result: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = convertBigIntToString(obj[key]);
    }
  }
  return result;
};

export const createNewWallet = async (
  provider: ethers.providers.JsonRpcProvider
): Promise<{ wallet: any;}> => {
  try {
    if (!provider) throw new Error("提供者未初始化");

    // 生成随机钱包
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey.slice(2); // 移除 0x
    const publicKey = ethers.utils.computePublicKey(wallet.publicKey, false).slice(2); // 未压缩，移除 0x04

    // 使用 SSS 分割私钥（2-of-3）
    // const shares = encrypt(privateKey, 2, 3); // 3 份，阈值 2
    // console.log("SSS 股份:", shares);
    

    return {
      wallet
    };
  } catch (error) {
    throw logError(error, "createNewWallet");
  }
};

// 创建新钱包
export const createNewRootWallet = async (provider: ethers.providers.JsonRpcProvider): Promise<{ address: string, privateKey: string, publicKey: string }> => {
  try {
    console.log("もの 创建新钱包...");
    console.log("もの Ethers.js version:", ethers.version); // 验证版本

    // 生成随机私钥
    const privateKey = ethers.utils.hexlify(ethers.utils.randomBytes(32)); // 32字节私钥
    if (!ethers.utils.isHexString(privateKey) || privateKey.length !== 66) {
      throw new Error(`もの 无效的私钥: ${privateKey}, length: ${privateKey.length}`);
    }
    console.log("もの 私钥:", privateKey);

    const tempPublicKey = secp256k1.g.mul(BigInt(privateKey));
    console.log("tempPublicKey:", tempPublicKey);
    const calculatedPkFromSk_x = tempPublicKey.getX().toString('hex');
    const calculatedPkFromSk_y = tempPublicKey.getY().toString('hex');
    // 构建未压缩公钥（去掉 04 前缀）
    const uncompressedPk = `${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_x, 32).slice(2)}${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_y, 32).slice(2)}`;

    // 计算 Keccak256 哈希
    const publicKeyBytes = ethers.utils.arrayify(`0x${uncompressedPk}`);
    const hash = ethers.utils.keccak256(publicKeyBytes);

    // 取哈希的后 20 字节，添加 0x 前缀
    const address = `0x${hash.slice(-40)}`;
    console.log("もの elliptic 原始公钥:", uncompressedPk, "length:", uncompressedPk.length);
    console.log("address:", address);

    if (!ethers.utils.isAddress(address)) {
      throw new Error(`もの 无效的地址: ${address}`);
    }
    console.log("address success");

    // 创建钱包以支持签名
    if (!provider) throw new Error("もの 提供者未初始化");
    const wallet = new ethers.Wallet(privateKey);
    const connectedWallet = wallet.connect(provider);

    console.log("もの 私钥:", privateKey, "length:", privateKey.length);

    // 返回自定义钱包对象
    return {
      address,
      privateKey,
      publicKey: uncompressedPk,
      signTransaction: connectedWallet.signTransaction.bind(connectedWallet),
      signMessage: connectedWallet.signMessage.bind(connectedWallet),
    };
  } catch (error) {
    throw logError(error, "createNewWallet");
  }
};

// 获取公钥池（链下，从后端接口）
const getPublicKeyPool = async (): Promise<{ x: string, y: string }[]> => {
  console.log("getPublicKeyPoolgetPublicKeyPoolgetPublicKeyPool");
  try {
    const response = await fetch(`http://127.0.0.1:3001/wallet/public-keys`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("获取公钥池失败");
    const data = await response.json();
    return data.keys || [];
  } catch (error) {
    throw logError(error, "getPublicKeyPool");
  }
};

// 构造环成员
const constructRing = async (userPubKey: { x: string, y: string }, size: number = 10): Promise<string[]> => {
  console.log("constructRing start");
  try {
    const pool = await getPublicKeyPool(size - 1);
    console.log("pool:", pool);
    const selected: { x: string, y: string }[] = [];
    const indices = new Set<number>();
    while (indices.size < size - 1 && indices.size < pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      indices.add(index);
    }
    indices.forEach(index => selected.push(pool[index]));
    selected.push(userPubKey);
    const flatKeys = selected.flatMap(key => [key.x, key.y]);
    console.log("constructRing finished");
    return flatKeys;
  } catch (error) {
    throw logError(error, "constructRing");
  }
};

// 获取用户操作的哈希
const getHash = async (uop: any, provider: ethers.providers.JsonRpcProvider): Promise<string> => {
  try {
    if (!provider) throw new Error("提供者未初始化");
    const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
    if (!uop || typeof uop !== "object") throw new Error("无效的 uop 参数");
    uop.callData = uop.callData || "0x";
    uop.paymasterAndData = uop.paymasterAndData || "0x";
    uop.signature = uop.signature || "0x";
    const hash = await entrypoint.getUserOpHash(uop);
    return hash;
  } catch (error) {
    throw logError(error, "getHash");
  }
};

// 从邮箱获取承诺
const getCommitment = async (email: string, provider: ethers.providers.JsonRpcProvider): Promise<{ m: string, r: string }[]> => {
  try {
    console.log("为邮箱获取承诺:", email);
    const zktool = new ethers.Contract(ZKTOOL_ADDRESS, ZKTool_ABI, provider);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
    const hashBytes = ethers.utils.arrayify(hash);
    const uint256Value = ethers.BigNumber.from(hashBytes);
    const decimalValue = uint256Value.toString();
    const uint256Array = [decimalValue];
    console.log("调用 zktool.generateCommitments，参数:", uint256Array);
    const commitments = await zktool.generateCommitments(uint256Array);
    const readableCommitments = commitments.map((commitment: any) => ({
      m: commitment.m,
      r: commitment.r.toString(),
    }));
    console.log("生成的承诺:", readableCommitments);
    return readableCommitments;
  } catch (error) {
    throw logError(error, "getCommitment");
  }
};

// 编码承诺
const encodeCommitment = (commitment: { m: string, r: string }): string => {
  try {
    console.log("编码承诺:", commitment);
    const abiCoder = new ethers.utils.AbiCoder();
    return abiCoder.encode(["string", "uint256"], [commitment.m, commitment.r]);
  } catch (error) {
    throw logError(error, "encodeCommitment");
  }
};

// 获取钱包地址（直接调用合约）
const getWalletAddress = async (
  owner: string,
  salt: number,
  emailcommitment: string,
  provider: ethers.providers.JsonRpcProvider
): Promise<string> => {
  try {
    console.log("为所有者获取钱包地址，参数:");
    console.log("  owner:", owner);
    console.log("  salt:", salt.toString());
    console.log("  emailcommitment:", emailcommitment);

    if (!provider) throw new Error("提供者未初始化");

    // 直接调用合约
    const iface = new ethers.utils.Interface(WALLET_FACTORY_ABI);
    const data = iface.encodeFunctionData("getAddress", [owner, ethers.BigNumber.from(salt), emailcommitment]);
    console.log("编码的调用数据:", data);

    const result = await provider.call({
      to: WALLET_FACTORY_ADDRESS,
      data: data,
    });
    const walletAddress = ethers.utils.defaultAbiCoder.decode(["address"], result)[0];
    console.log("直接调用返回的钱包地址:", walletAddress);

    return walletAddress;
  } catch (error) {
    console.error("获取钱包地址时出错:", error);
    throw logError(error, "getWalletAddress");
  }
};

// 获取影子钱包地址（ShadowWallet）
const getShadowWalletAddress = async (
  salt: number,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> => {
  try {
    const effectiveProvider = provider || new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd");
    const factory = new ethers.Contract(SHADOW_WALLET_FACTORY_ADDRESS, SHADOW_WALLET_FACTORY_ABI, effectiveProvider);
    const walletAddress = await factory.getAddress(salt); 
    return walletAddress;
  } catch (error) {
    throw logError(error, "getShadowWalletAddress");
  }
};

// 签署用户操作
const signUOP = async (wallet: ethers.Wallet, uopHash: string): Promise<string> => {
  try {
    if (!wallet || typeof wallet.signMessage !== "function") {
      throw new Error("无效的钱包对象或钱包不支持 signMessage 方法");
    }
    const signature = await wallet.signMessage(ethers.utils.arrayify(uopHash));
    console.log("生成的签名长度:", signature.length);
    return signature;
  } catch (error) {
    throw logError(error, "signUOP");
  }
};

// 获取 ETH 余额
export const getETHBalance = async (walletAddress: string): Promise<string> => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    console.log("walletAddress:",walletAddress)
    if (!provider) throw new Error("提供者未初始化");
    const balanceWei = await provider.getBalance(walletAddress);
    return ethers.utils.formatEther(balanceWei);
  } catch (error) {
    throw logError(error, "getETHBalance");
  }
};

// 获取盐值（基于邮箱）
const getSalt = async (email: string): Promise<ethers.BigNumber> => {
  try {
    console.log("为邮箱获取盐值:", email);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
    return ethers.BigNumber.from(hash);
  } catch (error) {
    throw logError(error, "getSalt");
  }
};

// 创建账户初始化代码
const createAccount = async (owner: string, salt: number, emailcommitment: string, provider: ethers.providers.JsonRpcProvider): Promise<string> => {
  try {
    console.log("为所有者创建账户:", owner);
    if (!provider) throw new Error("提供者未初始化");
    const factory = new ethers.Contract(WALLET_FACTORY_ADDRESS, WALLET_FACTORY_ABI, provider);
    const encodedFunctionData = factory.interface.encodeFunctionData("createAccount", [owner, salt, emailcommitment]);
    console.log("编码函数数据:", encodedFunctionData);
    const initCode = ethers.utils.concat([
      ethers.utils.arrayify(WALLET_FACTORY_ADDRESS),
      ethers.utils.arrayify(encodedFunctionData)
    ]);
    console.log("初始化代码:", ethers.utils.hexlify(initCode));
    return ethers.utils.hexlify(initCode);
  } catch (error) {
    throw logError(error, "createAccount");
  }
};

// 编码 ShadowWalletFactory.createWallet 调用
const encodeShadowWalletInitCode = async (
  ring: string[],
  initKeyImage: string,
  salt: number,
  provider: ethers.providers.JsonRpcProvider
): Promise<string> => {
  try {
    if (!provider) throw new Error("提供者未初始化");
    const factory = new ethers.Contract(SHADOW_WALLET_FACTORY_ADDRESS, SHADOW_WALLET_FACTORY_ABI, provider);
    const temp = '0x' + initKeyImage;
    const encodedFunctionData = factory.interface.encodeFunctionData("createWallet", [
      salt, // 传递 salt
      ethers.utils.hexConcat(ring), // bytes
      temp // bytes32
    ]);
    return ethers.utils.hexlify(ethers.utils.hexConcat([ethers.utils.getAddress(SHADOW_WALLET_FACTORY_ADDRESS), encodedFunctionData]));
  } catch (error) {
    throw logError(error, "encodeShadowWalletInitCode");
  }
};

// 提交恢复用户操作到 Bundler
export const sendRecoveryUserOp = async (
  walletAddress: string,
  toSign: string,
  body: string,
  sign: string,
  newOwner: string,
  base64Encoded: boolean,
  signer: ethers.Wallet,
  provider: ethers.providers.JsonRpcProvider
) => {
  try {
    console.log("发送恢复用户操作:", { walletAddress, toSign, body, sign, newOwner, base64Encoded });

    // 1. 构造 verify 方法的 callData
    const walletContract = new ethers.Contract(walletAddress, WALLET_ABI, provider);
    const callData = walletContract.interface.encodeFunctionData("verify", [
      toSign,
      body,
      sign,
      newOwner,
      base64Encoded,
    ]);
    console.log("verify 方法的 callData:", callData);

    // 2. 构造用户操作（UserOperation）
    const initCode = "0x"; // 钱包已部署，无需 initCode
    const accountGasLimits = encodeGas(1000000, 2000000);
    const preVerificationGas = 100000000;
    const gasFees = encodeGas(1000000, 2000000);
    const paymasterAddress = "0x5B348AFbaC7ac1696D0ec658ccFA6a05C576e364";
    const paymasterVerificationGasLimit = 1000000;
    const paymasterPostOpGasLimit = 500000;
    const paymasterAndData = ethers.utils.hexlify(
      ethers.utils.concat([
        paymasterAddress,
        ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterVerificationGasLimit), 16),
        ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterPostOpGasLimit), 16),
        "0x",
      ])
    );

    const userOp = await createPackedUserOperation(
      walletAddress,
      initCode,
      callData,
      accountGasLimits,
      preVerificationGas,
      gasFees,
      paymasterAndData,
      "0x",
      provider
    );
    console.log("UserOperation 构造:", { userOp });

    // 3. 计算 userOpHash 并签名
    const userOpHash = await getHash(userOp, provider);
    console.log("userOpHash:", userOpHash);
    const signature = await signUOP(signer, userOpHash);
    userOp.signature = signature;
    const serializedUserOp = convertBigIntToString(userOp);
    console.log("UserOperation 构造完成:", { userOpHash, signature, serializedUserOp });

    // 4. 检查 Paymaster 余额
    const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
    const requiredGas = 1000000 + 2000000 + 100000000 + paymasterVerificationGasLimit + paymasterPostOpGasLimit;
    const maxFeePerGas = 2000000;
    const requiredPrefund = requiredGas * maxFeePerGas;
    const paymasterDeposit = await entrypoint.balanceOf(paymasterAddress);
    if (paymasterDeposit.lt(requiredPrefund)) {
      throw new Error("Paymaster 存款不足");
    }
    console.log("Paymaster 存款检查通过:", { paymasterDeposit: ethers.utils.formatEther(paymasterDeposit) });

    // 5. 提交用户操作到 Bundler
    const response = await fetch("http://127.0.0.1:8080/userOp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userOp: serializedUserOp,
        to: walletAddress,
        value: "0",
        useShadowAccount: false, // 普通钱包恢复
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Bundler 错误详情:", errorData);
      throw new Error(errorData.message || "提交用户操作失败");
    }
    const bundleData = await response.json();
    console.log("Bundler 响应:", { txHash: bundleData.transactionHash });

    return { txHash: bundleData.transactionHash || `0x${Math.random().toString(16).substring(2, 42)}` };
  } catch (error) {
    throw logError(error, "sendRecoveryUserOp");
  }
};

// 创建打包的用户操作
const createPackedUserOperation = async (
  sender: string,
  initCode: string,
  callData: string,
  accountGasLimits: string,
  preVerificationGas: number,
  gasFees: string,
  paymasterAndData: string,
  signature: string,
  provider: ethers.providers.JsonRpcProvider
): Promise<any> => {
  try {
    console.log("为发送者创建打包用户操作:", sender);
    console.log("initCode:", initCode);
    if (!provider) throw new Error("提供者未初始化");
    const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
    const currentNonce = await entrypoint.getNonce(sender, 0);
    console.log("当前 nonce:", currentNonce.toString());
    return {
      sender,
      nonce: currentNonce.toString(),
      initCode,
      callData,
      accountGasLimits,
      preVerificationGas,
      gasFees,
      paymasterAndData,
      signature,
    };
  } catch (error) {
    throw logError(error, "createPackedUserOperation");
  }
};


const encryptS3ShareForStorage = (shareHexData: string, emailKey: string): string => {
  const crypto = require("crypto");
  // 重要提示: crypto.createCipher 已被废弃，建议使用 crypto.createCipheriv 并妥善管理IV和密钥派生。
  // 此处为了严格匹配你提供的 splitPrivateKey 中的逻辑：
  const cipher = crypto.createCipher("aes-256-cbc", emailKey);
  let encrypted = cipher.update(shareHexData, "utf8", "hex"); // 将share的hex字符串作为utf8编码的输入进行加密
  encrypted += cipher.final("hex");
  return encrypted;
};

const SUPABASE_BACKEND_BASE_URL = "http://localhost:3001"; // 修改为你的后端实际地址

/**
 * 更新用户EOA私钥的SSS分片。
 * @param newPrivateKeyHex - 新的EOA私钥 (十六进制字符串, 不带 '0x' 前缀)。
 * @param email - 用户的QQ邮箱。
 * @param currentAAWalletAddress - 用户当前邮箱关联的AA钱包地址。
 */
export async function updateUserEOAShares(
  newPrivateKeyHex: string,
  email: string,
  currentAAWalletAddress: string // AA钱包地址对于更新S1分片是必需的
): Promise<{ success: boolean; s1Status?: string; s2Status?: string; s3Status?: string; error?: string }> {
  if (!newPrivateKeyHex || !email || !currentAAWalletAddress) {
    console.error("新私钥、邮箱和当前AA钱包地址均不能为空。");
    return { success: false, error: "新私钥、邮箱和当前AA钱包地址均不能为空。" };
  }
  if (!email.endsWith("@qq.com")) {
    console.error("必须使用 QQ 邮箱。");
    return { success: false, error: "必须使用 QQ 邮箱。" };
  }
  if (!ethers.utils.isAddress(currentAAWalletAddress)) {
    console.error("无效的AA钱包地址。");
    return { success: false, error: "无效的AA钱包地址。" };
  }


  try {
    const privateKeyBuffer = Buffer.from(newPrivateKeyHex, "hex");
    // 使用你的SSS加密函数分割私钥 (例如 2-of-3 方案)
    const shares: Buffer[] = encrypt(privateKeyBuffer, 2, 3); // 返回Buffer数组

    if (!shares || shares.length < 3) {
      throw new Error("SSS分片失败，未能生成足够的分片。");
    }

    const s1ShareHex = shares[0].toString("hex");
    const s2ShareHex = shares[1].toString("hex");
    const s3ShareHex = shares[2].toString("hex"); // S3 分片转为 hex 字符串用于加密

    let s1Status = "未更新", s2Status = "未更新", s3Status = "未更新";

    // 1. 更新S1分片 (通过后端 /wallet/save-wallet)
    try {
      const s1Response = await fetch(`${SUPABASE_BACKEND_BASE_URL}/wallet/save-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          walletAddress: currentAAWalletAddress, // AA钱包地址
          share: s1ShareHex,                   // 新的S1分片
        }),
      });
      if (!s1Response.ok) {
        const errData = await s1Response.json();
        throw new Error(errData.message || `更新S1分片失败 (状态 ${s1Response.status})`);
      }
      s1Status = "S1分片更新成功。";
      console.log(s1Status);
    } catch (e: any) {
      s1Status = `S1分片更新失败: ${e.message}`;
      console.error(s1Status);
    }

    // 2. 更新S2分片 (通过后端 /wallet/save-cloud-share)
    try {
      const s2StorageKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
      const s2Response = await fetch(`${SUPABASE_BACKEND_BASE_URL}/wallet/save-cloud-share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          share: s2ShareHex, // 新的S2分片
          key: s2StorageKey,
        }),
      });
      if (!s2Response.ok) {
        const errData = await s2Response.json();
        throw new Error(errData.message || `更新S2分片失败 (状态 ${s2Response.status})`);
      }
      s2Status = "S2云端分片更新成功。";
      console.log(s2Status);
    } catch (e: any) {
      s2Status = `S2云端分片更新失败: ${e.message}`;
      console.error(s2Status);
    }

    // 3. 更新S3分片 (加密后存储到 localStorage)
    try {
      const encryptedS3Share = encryptS3ShareForStorage(s3ShareHex, email);
      localStorage.setItem(`share_${email}`, encryptedS3Share);
      s3Status = "S3分片已加密并更新到localStorage。";
      console.log(s3Status);
    } catch (e: any) {
      s3Status = `S3分片更新到localStorage失败: ${e.message}`;
      console.error(s3Status);
    }
    
    // 检查是否所有更新都至少尝试过（不一定都成功）
    const allAttempted = s1Status !== "未更新" && s2Status !== "未更新" && s3Status !== "未更新";

    return {
      success: allAttempted, // 可以定义更严格的成功标准，例如所有都必须成功
      s1Status,
      s2Status,
      s3Status,
    };

  } catch (error: any) {
    console.error("更新用户EOA分片时发生严重错误:", error);
    return { success: false, error: error.message || "更新分片过程中发生未知错误。" };
  }
}

// 编码 gas 限制
const encodeGas = (verificationGasLimit: number, callGasLimit: number): string => {
  const verificationGasLimitBN = ethers.BigNumber.from(verificationGasLimit);
  const callGasLimitBN = ethers.BigNumber.from(callGasLimit);
  const accountGasLimits = verificationGasLimitBN.shl(128).or(callGasLimitBN);
  return ethers.utils.hexZeroPad(accountGasLimits.toHexString(), 32);
};

export const decryptShare = (data: string, key: string): Uint8Array => {
    const crypto = require("crypto");
    const decipher = crypto.createDecipher("aes-256-cbc", key);
    const decrypted = decipher.update(data, "hex", "binary") + decipher.final("binary");
    return Buffer.from(decrypted, "hex");
  }

// 主钱包服务 Hook
export function useWalletService() {
  const {
    walletPublickey,
    setwalletPublicKey,
    provider,
    setProvider,
    wallet,
    setWallet,
    walletAddress,
    setWalletAddress,
    shadowWalletAddress,
    setShadowWalletAddress,
    userEmail,
    setUserEmail,
    ringMembers,
    setRingMembers,
    balance,
    setBalance,
    isLoggedIn,
    setIsLoggedIn,
  } = useWallet();

  // 初始化提供者
  useEffect(() => {
    const init = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        setProvider(provider);
        const user = storageUtils.getUser();
        console.log("WalletProvider: user =", user);
        console.log("Restored walletPublickey:", user.walletPublickey);
        if (user && user.passport) {
          setUserEmail(user.passport);
          setWalletAddress(user.walletAddress?.[0] || "");
          setIsLoggedIn(true);
          setWallet(user.wallet);
          setwalletPublicKey(user.walletPublickey);
        }
      } catch (error) {
        logError(error, "init");
      }
    };
    init();
  }, [setProvider, setUserEmail, setWalletAddress, setIsLoggedIn]);

  const { initiateRecovery } = useSocialRecovery();

  // 创建普通 Wallet
  const createWallet = async (
    owner: string,
    salt: number,
    email: string, // 新增 email 参数
    emailCommitment: string,
    socialRecovery: string = "0x0000000000000000000000000000000000000000",
    signer: ethers.Wallet,
    provider: ethers.providers.JsonRpcProvider
  ) => {
    if (!signer || !provider) throw new Error("签名者或提供者未初始化");
    if (!email || !email.endsWith("@qq.com")) throw new Error("请输入有效的 QQ 邮箱地址");
  
    try {
      console.log("创建普通 Wallet 开始", { owner, salt, email, emailCommitment, socialRecovery });
  
      const initCode = await createAccount(owner, salt, emailCommitment, provider);
      console.log("initCode 生成", { initCode });
  
      const predictedWalletAddr = await getWalletAddress(owner, salt, emailCommitment, provider);
      console.log("预测 Wallet 地址", { predictedWalletAddr });
  
      const accountGasLimits = encodeGas(1000000, 2000000);
      const gasFees = encodeGas(1000000, 2000000);
      const paymasterAddress = "0x5B348AFbaC7ac1696D0ec658ccFA6a05C576e364";
      const paymasterVerificationGasLimit = 1000000;
      const paymasterPostOpGasLimit = 500000;
      const paymasterAndData = ethers.utils.hexlify(
        ethers.utils.concat([
          paymasterAddress,
          ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterVerificationGasLimit), 16),
          ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterPostOpGasLimit), 16),
          "0x",
        ])
      );
  
      const userOp = await createPackedUserOperation(
        predictedWalletAddr,
        initCode,
        "0x",
        accountGasLimits,
        100000000,
        gasFees,
        paymasterAndData,
        "0x",
        provider
      );
      console.log("UserOperation 构造", { userOp });
  
      const userOpHash = await getHash(userOp, provider);
      const signature = await signUOP(signer, userOpHash);
      userOp.signature = signature;
      const serializedUserOp = convertBigIntToString(userOp);
      console.log("UserOperation 构造完成", { userOpHash, signature, serializedUserOp });
  
      const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
      const requiredGas = 1000000 + 2000000 + 100000000 + paymasterVerificationGasLimit + paymasterPostOpGasLimit;
      const maxFeePerGas = 2000000;
      const requiredPrefund = requiredGas * maxFeePerGas;
      const paymasterDeposit = await entrypoint.balanceOf(paymasterAddress);
      if (paymasterDeposit.lt(requiredPrefund)) {
        throw new Error("Paymaster 存款不足");
      }
      console.log("Paymaster 存款检查通过", { paymasterDeposit: ethers.utils.formatEther(paymasterDeposit) });
  
      const response = await fetch("http://127.0.0.1:8080/userOp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userOp: serializedUserOp,
          to: predictedWalletAddr,
          value: "0",
          useShadowAccount: false,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Bundler 错误详情:", errorData);
        throw new Error(errorData.message || "提交用户操作失败");
      }
      const bundleData = await response.json();
      console.log("Bundler 响应", { txHash: bundleData.transactionHash });
  
      const actualWalletAddr = bundleData.createdAddress || predictedWalletAddr;
      if (actualWalletAddr.toLowerCase() !== predictedWalletAddr.toLowerCase()) {
        console.error("地址不匹配", { predicted: predictedWalletAddr, actual: actualWalletAddr });
        throw new Error("创建的 Wallet 地址与预测地址不一致");
      }
      console.log("地址验证通过", { predictedWalletAddr, actualWalletAddr });
  
      // 保存邮箱和钱包地址到 Supabase
      const saveResponse = await fetch("http://localhost:3001/wallet/save-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          walletAddress: actualWalletAddr,
        }),
      });
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || "保存钱包地址到数据库失败");
      }
      console.log("钱包地址保存到 Supabase 成功", { email, walletAddress: actualWalletAddr });
  
      setWalletAddress(actualWalletAddr);
      // const newBalance = await getETHBalance(actualWalletAddr, provider);
      // setBalance(newBalance);
  
      return {
        walletAddress: actualWalletAddr,
        txHash: bundleData.transactionHash,
        balance: newBalance,
      };
    } catch (error) {
      throw logError(error, "createWallet");
    }
  };

  const createShadowAA = async (salt, ring, ringId, shadowWalletAddress,publicKey,privateKey) => {
    if (!wallet || !provider) throw new Error("钱包或提供者未初始化");
    console.log("publicKey,privateKey:",publicKey,privateKey)
  
    try {
      const nonce = 1;
  
      const initMessage = ethers.utils.keccak256(ethers.utils.concat([
        ethers.utils.hexlify(shadowWalletAddress)
      ]));
      console.log(" H2(wallet.publicKey:",publicKey);
      const initKeyImageRaw = H2(publicKey, initMessage).mul(BigInt(privateKey)).encode('hex', true);
      const initKeyImage = initKeyImageRaw.startsWith("0x") ? initKeyImageRaw : `0x${initKeyImageRaw}`;
      const initCode = await encodeShadowWalletInitCode(ring, initKeyImage.slice(4), salt, provider);
      console.log("initCode 生成", { initCode });
  
      const accountGasLimits = encodeGas(1000000, 2000000);
      const gasFees = encodeGas(1000000, 2000000);
      const paymasterAddress = "0x5B348AFbaC7ac1696D0ec658ccFA6a05C576e364";
      const paymasterVerificationGasLimit = 1000000;
      const paymasterPostOpGasLimit = 500000;
      const paymasterAndData = ethers.utils.hexlify(ethers.utils.concat([
        paymasterAddress,
        ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterVerificationGasLimit), 16),
        ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterPostOpGasLimit), 16),
        "0x"
      ]));
  
      const abiCoder = new ethers.utils.AbiCoder();
      const userOp = await createPackedUserOperation(
        shadowWalletAddress,
        initCode,
        "0x",
        accountGasLimits,
        100000000,
        gasFees,
        paymasterAndData,
        "0x",
        provider
      );
      console.log("Shadow UserOperation 构造", { userOp });
  
      const userOpHash = await getHash(userOp, provider);
      console.log("userOpHash:", userOpHash);
  
      const response1 = await fetch("http://127.0.0.1:3001/wallet/generateRingSignature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sk: privateKey,
          message: userOpHash,
          ring,
          walletAddress: shadowWalletAddress,
          nonce
        })
      });
  
      if (!response1.ok) {
        const errorData = await response1.json();
        throw new Error(`generateRingSignature 失败: ${errorData.message || response1.statusText}`);
      }
  
      const { c, r, z, keyImage, initKeyImage: submittedInitKeyImage } = await response1.json();
      if (!c || !r || !z || !keyImage || !submittedInitKeyImage) {
        throw new Error("generateRingSignature 返回数据不完整");
      }
      console.log("环签名生成", { c, r, z, keyImage, submittedInitKeyImage });
  
      const fixHex = (val) => typeof val === "string" && val.match(/^[0-9a-fA-F]+$/) ? `0x${val}` : val;
      const validatedC = c.map(fixHex);
      const validatedR = r.map(fixHex);
      const validatedKeyImage = fixHex(keyImage);
      const validatedInitKeyImage = fixHex(submittedInitKeyImage);
  
      validatedC.forEach((val, i) => {
        if (!ethers.utils.isHexString(val)) {
          throw new Error(`无效的 c[${i}]: ${val}`);
        }
      });
      validatedR.forEach((val, i) => {
        if (!ethers.utils.isHexString(val)) {
          throw new Error(`无效的 r[${i}]: ${val}`);
        }
      });
      if (!ethers.utils.isHexString(validatedKeyImage)) {
        throw new Error(`无效的 keyImage: ${validatedKeyImage}`);
      }
      if (!ethers.utils.isHexString(validatedInitKeyImage)) {
        throw new Error(`无效的 submittedInitKeyImage: ${validatedInitKeyImage}`);
      }
      const temp = validatedInitKeyImage;
      const temp3 = "0x" + initKeyImage.slice(4);
      console.log("temp:", temp);
      console.log("temp3:", temp3);
  
      const computedRingId = ethers.utils.keccak256(ethers.utils.concat(ring));
      if (ringId !== computedRingId) {
        console.warn("ringId 不一致，修正为后端计算值");
        ringId = computedRingId;
      }
  
      const n = ring.length / 2;
      const zEncoded = [];
      for (let i = 0; i < n; i++) {
        const point = z.slice(i * 64, (i + 1) * 64);
        zEncoded.push(`0x${point.padStart(64, '0')}`);
      }
  
      const response2 = await fetch("http://127.0.0.1:3001/wallet/verifyRingSignature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userOpHash,
          ring,
          y_0: validatedKeyImage,
          c: validatedC,
          r: validatedR,
          z: z,
          initKeyImage: validatedInitKeyImage
        })
      });
  
      if (!response2.ok) {
        const errorData = await response2.json();
        throw new Error(`verifyRingSignature 失败: ${errorData.message || response2.statusText}`);
      }
  
      const { commitment: verifiedCommitment } = await response2.json();
      console.log("环签名验证通过", { verifiedCommitment });
  
      const temp4 = `0x${z}`;
      const temp4Bytes = ethers.utils.arrayify(temp4);
  
      console.log("validatedC.map(BigInt)", validatedC.map(BigInt).length);
      console.log("temp4", temp4);
      console.log("temp4", temp4.length);
  
      userOp.signature = abiCoder.encode(
        ['uint256[]', 'uint256[]', 'bytes32', 'bytes32', 'bytes', 'bytes32'],
        [validatedC, validatedR, ringId, validatedKeyImage, temp4Bytes, temp3]
      );
      const serializedUserOp = convertBigIntToString(userOp);
      console.log("Shadow UserOperation 构造完成", { userOpHash, serializedUserOp });
  
      const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
      const requiredGas = 1000000 + 2000000 + 100000000 + paymasterVerificationGasLimit + paymasterPostOpGasLimit;
      const maxFeePerGas = 2000000;
      const requiredPrefund = requiredGas * maxFeePerGas;
      const paymasterDeposit = await entrypoint.balanceOf(paymasterAddress);
      if (paymasterDeposit.lt(requiredPrefund)) {
        throw new Error("Paymaster 存款不足");
      }
      console.log("Paymaster 存款检查通过", { paymasterDeposit: ethers.utils.formatEther(paymasterDeposit) });
  
      const response = await fetch("http://127.0.0.1:8080/userOp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userOp: serializedUserOp,
          to: shadowWalletAddress,
          value: "0",
          useShadowAccount: true
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Shadow Bundler 错误详情:", errorData);
        throw new Error(errorData.message || "提交用户操作失败");
      }
      const bundleData = await response.json();
      console.log("Shadow Bundler 响应", { txHash: bundleData.transactionHash });
  
      setShadowWalletAddress(shadowWalletAddress);
      // const newBalance = await getETHBalance(shadowWalletAddress, provider);
      // setBalance(newBalance);
  
      return {
        shadowWalletAddress: shadowWalletAddress,
        txHash: bundleData.transactionHash || `0x${Math.random().toString(16).substring(2, 42)}`
      };
    } catch (error) {
      throw logError(error, "createShadowAA");
    }
  };

  const splitKeyIntoChunks = (key: string, chunkSize: number): Uint8Array[] => {
    const chunks = [];
    for (let i = 0; i < key.length; i += chunkSize) {
      chunks.push(new TextEncoder().encode(key.slice(i, i + chunkSize)));
    }
    return chunks;
  };

 const splitPrivateKey = async (privateKey: string, email: string) => {
    if (typeof window === "undefined") throw new Error("SSS 分片需在客户端执行");
  
    const bytes = Buffer.from(privateKey, "hex");
    console.log("Input bytes:", Array.from(bytes));
    const shares = encrypt(bytes, 2, 3); // 2-of-3
  
    const encryptShare = (data: string, key: string) => {
      const crypto = require("crypto");
      const cipher = crypto.createCipher("aes-256-cbc", key);
      return cipher.update(data, "utf8", "hex") + cipher.final("hex");
    };
    localStorage.setItem(`share_${email}`, encryptShare(Buffer.from(shares[2]).toString("hex"), email));
  
    return shares;
  };
  

  // 注册新用户

  // const registerUser = async (passport: string, password: string, nickname: string, code: string) => {
  //   try {
  //     console.log("注册新用户", { passport, nickname, code });

  //     const response = await fetch(`${API_BASE_URL}/user/sign-up`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         Passport: passport,
  //         Password: password,
  //         Password2: password,
  //         Nickname: nickname
  //       }),
  //     });

  //     const data = await response.json();
  //     if (!response.ok || data.code !== 0 || !data.data?.OK) {
  //       throw new Error(data.message || "注册失败");
  //     }

  //     const response3 = await fetch("http://localhost:3001/wallet/sign-up", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         Passport: passport,
  //         Password: password,
  //         Password2: password,
  //         Nickname: nickname
  //       }),
  //     });

  //     const data2 = await response3.json();
  //     // if (!response3.ok || data2.code !== 0 || !data2.data?.OK) {
  //     //   throw new Error(data2.message || "response3注册失败");
  //     // }

  //     if (!provider) throw new Error("提供者未初始化");

  //     const { wallet} = await createNewWallet(provider);
  //     // console.log("创建新钱包，地址:", newWallet.publicKey);
  //     let pk = wallet.publicKey;
  //     console.log("pkpkpkppkpkkpkp:", pk);
  //     const shares = await splitPrivateKey(wallet.privateKey.slice(2), passport);
  //     console.log({ wallet });
  //     console.log("Shares:", shares.map(s => Array.from(s)));
  //     // const rebuiltBytes = decrypt([shares[0].map(hex => Buffer.from(hex, "hex")), shares[2].map(hex => Buffer.from(hex, "hex"))], 2);
  //     const share3 = localStorage.getItem(`share_${passport}`);
  //     const decryptedShare3 = decryptShare(share3, passport);
  //     console.log("shares[0]:",shares[0])
  //     const rebuiltBytes = decrypt([shares[0], decryptedShare3], 2);
  //     const rebuiltHex = Buffer.from(rebuiltBytes).toString("hex");
  //     console.log("rebuiltHex:", rebuiltHex, "privateKey:", wallet.privateKey.slice(2));
  //     if (rebuiltHex !== wallet.privateKey.slice(2)) {
  //       console.log("Shares:", shares, "Decrypted Share3:", Array.from(decryptedShare3));
  //       throw new Error("SSS 分片重建失败");
  //     }
      
  //     // 份额 2：S3
  //     const cloudSaveResponse = await fetch("http://localhost:3001/wallet/save-cloud-share", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         email: passport,
  //         share: Buffer.from(shares[1]).toString("hex"),
  //         key: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(passport)),
  //       }),
  //     });
  //     if (!cloudSaveResponse.ok) {
  //       const errorData = await cloudSaveResponse.json();
  //       throw new Error(errorData.message || "保存云端分片失败");
  //     }
      
  //     const salt = await getSalt(passport);
  //     const commitments = await getCommitment(passport, provider);
  //     if (!commitments || commitments.length === 0) throw new Error("生成承诺失败");
  //     const emailcommitment = encodeCommitment(commitments[0]);
  //     console.log("getWalletAddress 信息:",wallet.address, salt, emailcommitment);
  //     const walletAddress = await getWalletAddress(wallet.address, salt, emailcommitment, provider);

  //     console.log("新钱包地址:", walletAddress);

  //     const save_Response = await fetch("http://localhost:3001/wallet/save-wallet", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         email: passport,
  //         walletAddress: walletAddress,
  //         share: Buffer.from(shares[0]).toString("hex"),
  //       }),
  //     });
  //     if (!save_Response.ok) throw new Error("保存后端股份失败");

  //     const initCode = await createAccount(wallet.address, salt, emailcommitment, provider);
  //     const accountGasLimits = encodeGas(10000000, 20000000);
  //     const gasFees = encodeGas(1000000, 2000000);
  //     const paymasterAddress = "0x5B348AFbaC7ac1696D0ec658ccFA6a05C576e364";
  //     const paymasterVerificationGasLimit = 100000000;
  //     const paymasterPostOpGasLimit = 50000000;
  //     const paymasterAndData = ethers.utils.hexlify(ethers.utils.concat([
  //       paymasterAddress,
  //       ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterVerificationGasLimit), 16),
  //       ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterPostOpGasLimit), 16),
  //       "0x"
  //     ]));

  //     const userOp = await createPackedUserOperation(
  //       walletAddress,
  //       initCode,
  //       "0x",
  //       accountGasLimits,
  //       100000000,
  //       gasFees,
  //       paymasterAndData,
  //       "0x",
  //       provider
  //     );
  //     const userOpHash = await getHash(userOp, provider);
  //     const signature = await signUOP(wallet, userOpHash);
  //     userOp.signature = signature;
  //     const serializedUserOp = convertBigIntToString(userOp);
  //     console.log("UserOperation 构造完成", { userOpHash, signature, serializedUserOp });

  //     const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
  //     const requiredGas = 1000000 + 2000000 + 100000000 + paymasterVerificationGasLimit + paymasterPostOpGasLimit;
  //     const maxFeePerGas = 2000000;
  //     const requiredPrefund = requiredGas * maxFeePerGas;
  //     const paymasterDeposit = await entrypoint.balanceOf(paymasterAddress);
  //     if (paymasterDeposit.lt(requiredPrefund)) {
  //       throw new Error("Paymaster 存款不足");
  //     }
  //     console.log("Paymaster 存款检查通过", { paymasterDeposit: ethers.utils.formatEther(paymasterDeposit) });
  //     // console.log("创建新钱包，地址22222222:", newWallet.publicKey);

  //     const user = {
  //       passport,
  //       nickname,
  //       wallet: { address: wallet.address, privateKey: wallet.privateKey, publicKey: pk },
  //       walletPublickey: wallet.publicKey,
  //       walletAddress: [walletAddress],
  //       guardian: [],
  //     };
  //     console.log("Saving user:", user);
  //     storageUtils.saveUser(user);


  //     memoryUtil.memoryUser.user = user;
  //     storageUtils.saveUser(user);
  //     setWallet(wallet);
  //     setwalletPublicKey(wallet.publicKey);
  //     // console.log("newWallet:", newWallet);
  //     setWalletAddress(walletAddress);
  //     setUserEmail(passport);
  //     setIsLoggedIn(true);

  //     console.log("发送用户操作到后端...");
  //     const response2 = await fetch("http://127.0.0.1:8080/userOp", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         userOp: serializedUserOp,
  //         to: walletAddress,
  //         value: "0",
  //         useShadowAccount: false,
  //       }),
  //     });
  //     if (!response2.ok) {
  //       const errorData = await response2.json();
  //       console.error("Bundler 错误详情:", errorData);
  //       throw new Error(errorData.message || "提交用户操作失败");
  //     }
  //     const bundleData = await response2.json();
  //     console.log("Bundler 响应", { txHash: bundleData.txHash });

  //     // const newBalance = await getETHBalance(walletAddress, provider);
  //     // setBalance(newBalance);

  //     return { walletAddress };
  //   } catch (error) {
  //     throw logError(error, "registerUser");
  //   }
  // };

  const registerUser = async (passport: string, password: string, nickname: string, code: string) => {
    try {
      console.log("注册新用户", { passport, nickname, code });

      const response = await fetch(`${API_BASE_URL}/user/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Passport: passport,
          Password: password,
          Password2: password,
          Nickname: nickname
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 0 || !data.data?.OK) {
        throw new Error(data.message || "注册失败");
      }

      const response3 = await fetch("http://localhost:3001/wallet/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Passport: passport,
          Password: password,
          Password2: password,
          Nickname: nickname
        }),
      });

      const data2 = await response3.json();
      // if (!response3.ok || data2.code !== 0 || !data2.data?.OK) {
      //   throw new Error(data2.message || "response3注册失败");
      // }

      if (!provider) throw new Error("提供者未初始化");

      const { wallet} = await createNewWallet(provider);
      let pk = wallet.publicKey;
      console.log("pkpkpkppkpkkpkp:", pk);
      const shares = await splitPrivateKey(wallet.privateKey.slice(2), passport);
      console.log({ wallet });
      console.log("Shares:", shares.map(s => Array.from(s)));
      const share3 = localStorage.getItem(`share_${passport}`);
      const decryptedShare3 = decryptShare(share3, passport);
      console.log("shares[0]:",shares[0])
      const rebuiltBytes = decrypt([shares[0], decryptedShare3], 2);
      const rebuiltHex = Buffer.from(rebuiltBytes).toString("hex");
      console.log("rebuiltHex:", rebuiltHex, "privateKey:", wallet.privateKey.slice(2));
      if (rebuiltHex !== wallet.privateKey.slice(2)) {
        console.log("Shares:", shares, "Decrypted Share3:", Array.from(decryptedShare3));
        throw new Error("SSS 分片重建失败");
      }
      
      const cloudSaveResponse = await fetch("http://localhost:3001/wallet/save-cloud-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: passport,
          share: Buffer.from(shares[1]).toString("hex"),
          key: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(passport)),
        }),
      });
      if (!cloudSaveResponse.ok) {
        const errorData = await cloudSaveResponse.json();
        throw new Error(errorData.message || "保存云端分片失败");
      }
      
      const salt = await getSalt(passport);
      const commitments = await getCommitment(passport, provider);
      if (!commitments || commitments.length === 0) throw new Error("生成承诺失败");
      const emailcommitment = encodeCommitment(commitments[0]);
      console.log("getWalletAddress 信息:",wallet.address, salt, emailcommitment);
      const walletAddress = await getWalletAddress(wallet.address, salt, emailcommitment, provider);

      console.log("新钱包地址:", walletAddress);

      const save_Response = await fetch("http://localhost:3001/wallet/save-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: passport,
          walletAddress: walletAddress,
          share: Buffer.from(shares[0]).toString("hex"),
        }),
      });
      if (!save_Response.ok) throw new Error("保存后端股份失败");

      const initCode = await createAccount(wallet.address, salt, emailcommitment, provider);
      
      // --- Gas 参数值修改开始 ---
      const feeData = await provider.getFeeData();
      const latestBlock = await provider.getBlock("latest");

      let actualCalculatedMaxPriorityFeePerGas_BN = feeData.maxPriorityFeePerGas || ethers.utils.parseUnits("1.5", "gwei");
      if (actualCalculatedMaxPriorityFeePerGas_BN.lt(ethers.utils.parseUnits("0.5", "gwei"))) {
           actualCalculatedMaxPriorityFeePerGas_BN = ethers.utils.parseUnits("1.5", "gwei");
      }

      let actualCalculatedMaxFeePerGas_BN;
      if (latestBlock.baseFeePerGas) {
          actualCalculatedMaxFeePerGas_BN = latestBlock.baseFeePerGas.mul(2).add(actualCalculatedMaxPriorityFeePerGas_BN);
      } else if (feeData.gasPrice) {
          actualCalculatedMaxFeePerGas_BN = feeData.gasPrice;
          if (actualCalculatedMaxFeePerGas_BN.lt(actualCalculatedMaxPriorityFeePerGas_BN)) {
               actualCalculatedMaxFeePerGas_BN = actualCalculatedMaxPriorityFeePerGas_BN.mul(2); 
          }
      } else {
          actualCalculatedMaxPriorityFeePerGas_BN = ethers.utils.parseUnits("2", "gwei");
          actualCalculatedMaxFeePerGas_BN = ethers.utils.parseUnits("50", "gwei"); // 保持50 Gwei作为最大费用，以便计算预存款
          console.warn("无法从 provider 获取 Gas 费用, 使用较高默认回退值。");
      }
      const gasFees = encodeGas(actualCalculatedMaxPriorityFeePerGas_BN, actualCalculatedMaxFeePerGas_BN);

      // 调整 Gas 上限以降低总预存款需求
      // 这些值需要您根据实际 initCode 复杂度和 Paymaster 的实际消耗来仔细设定
      // 目标是使 totalGasLimits * 50 Gwei < 0.0859 ETH
      // 0.0859 ETH / 50 Gwei = 0.0859 * 10^18 / (50 * 10^9) = (0.0859/50) * 10^9 = 0.001718 * 10^9 = 1,718,000 gas units total limit
      
      const valueForAccVerificationGasLimit_BN = ethers.BigNumber.from("1000000"); // MODIFIED: 1M (如果 initCode 复杂, 可能OOG)
      const valueForAccCallGasLimit_BN = ethers.BigNumber.from("100000");         // MODIFIED: 100k (对于 "0x" callData 足够)
      const accountGasLimits = encodeGas(valueForAccVerificationGasLimit_BN, valueForAccCallGasLimit_BN);

      const valueForPreVerificationGas_BN = ethers.BigNumber.from("150000"); // (150k)

      const paymasterAddress = "0x5B348AFbaC7ac1696D0ec658ccFA6a05C576e364";
      const valueForPmVerificationGasLimit_BN = ethers.BigNumber.from("300000"); // MODIFIED: 300k
      const valueForPmPostOpGasLimit_BN = ethers.BigNumber.from("150000");       // MODIFIED: 150k
      
      const paymasterAndData = ethers.utils.hexlify(ethers.utils.concat([
        paymasterAddress,
        ethers.utils.hexZeroPad(ethers.utils.hexlify(valueForPmVerificationGasLimit_BN), 16),
        ethers.utils.hexZeroPad(ethers.utils.hexlify(valueForPmPostOpGasLimit_BN), 16),
        "0x"
      ]));

      const userOp = await createPackedUserOperation(
        walletAddress,
        initCode,
        "0x",
        accountGasLimits,
        valueForPreVerificationGas_BN,
        gasFees,
        paymasterAndData,
        "0x",
        provider
      );
      
      const userOpHash = await getHash(userOp, provider);
      const signature = await signUOP(wallet, userOpHash);
      userOp.signature = signature;
      const serializedUserOp = convertBigIntToString(userOp);
      console.log("UserOperation 构造完成", { userOpHash, signature });

      const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
      
      if (paymasterAddress && paymasterAddress !== ethers.constants.AddressZero) {
        let totalGasLimitsForPrefund_BN = valueForAccVerificationGasLimit_BN
            .add(valueForAccCallGasLimit_BN)
            .add(valueForPreVerificationGas_BN)
            .add(valueForPmVerificationGasLimit_BN)
            .add(valueForPmPostOpGasLimit_BN);
        
        // 使用与 gasFees 中相同的 actualCalculatedMaxFeePerGas_BN 进行计算
        const requiredPrefund_BN = totalGasLimitsForPrefund_BN.mul(actualCalculatedMaxFeePerGas_BN);

        const paymasterDeposit = await entrypoint.balanceOf(paymasterAddress);
        if (paymasterDeposit.lt(requiredPrefund_BN)) {
          console.error(`Paymaster 存款不足: 计算所需 ${ethers.utils.formatEther(requiredPrefund_BN)} ETH (基于最大费用 ${ethers.utils.formatUnits(actualCalculatedMaxFeePerGas_BN, "gwei")} Gwei), Paymaster拥有 ${ethers.utils.formatEther(paymasterDeposit)} ETH。`);
          throw new Error("Paymaster 存款不足");
        }
        console.log("Paymaster 存款检查通过", { 
            paymasterDeposit: ethers.utils.formatEther(paymasterDeposit), 
            requiredPrefund: ethers.utils.formatEther(requiredPrefund_BN) 
        });
      }

      const user = {
        passport,
        nickname,
        wallet: { address: wallet.address, privateKey: wallet.privateKey, publicKey: pk },
        walletPublickey: wallet.publicKey,
        walletAddress: [walletAddress],
        guardian: [],
      };
      console.log("Saving user:", user);
      storageUtils.saveUser(user);

      memoryUtil.memoryUser.user = user;
      storageUtils.saveUser(user);
      setWallet(wallet);
      setwalletPublicKey(wallet.publicKey);
      setWalletAddress(walletAddress);
      setUserEmail(passport);
      // setIsLoggedIn(true);

      console.log("发送用户操作到后端...");
      const response2 = await fetch("http://127.0.0.1:8080/userOp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userOp: serializedUserOp,
        }),
      });
      if (!response2.ok) {
        const errorData = await response2.json();
        console.error("Bundler 错误详情:", errorData);
        throw new Error(errorData.message || "提交用户操作失败");
      }
      const bundleData = await response2.json();
      console.log("Bundler 响应", { txHash: bundleData });
      console.log("Bundler 响应", { txHash: bundleData.transactionHash });
      const txHash = bundleData.transactionHash;

      return { walletAddress,txHash };
    } catch (error) {
      throw logError(error, "registerUser");
    }
  };


  const loginUser = useCallback(async (email, password) => {
    if (!provider) { // 确保 provider 实例已存在
      throw new Error("Provider 未初始化，无法登录。");
    }
    try {
      console.log("开始登录流程...");
      const response = await fetch(`${SUPABASE_BACKEND_BASE_URL}/wallet/sign-in`, { // 确认这是你后端 /sign-in 的正确URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Passport: email, Password: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `登录失败 (状态 ${response.status})`);
      }

      const data = await response.json();
      console.log("登录响应:", data);
      const userInfoFromBackend = data.user;

      if (!userInfoFromBackend || !userInfoFromBackend.s1Share) {
        console.error("登录响应中缺少S1分片:", userInfoFromBackend);
        throw new Error("登录数据无效，未能获取钱包恢复信息。");
      }

      // 1. 从登录响应中获取S1分片 (hex string)
      const s1ShareHex = userInfoFromBackend.s1Share;

      // 2. 获取S2分片 (从 /wallet/get-cloud-share)
      // const s2Key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
      // const s2Response = await fetch(`${SUPABASE_BACKEND_BASE_URL}/wallet/get-cloud-share`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, key: s2Key }),
      // });
      // if (!s2Response.ok) {
      //   const s2ErrorData = await s2Response.json();
      //   throw new Error(s2ErrorData.message || "获取S2云端分片失败。");
      // }
      // const { share: s2ShareHex } = await s2Response.json(); // S2分片 (hex string)

      // 3. 获取并解密S3分片 (从localStorage)
      // const encryptedS3Share = localStorage.getItem(`share_${email}`);
      // if (!encryptedS3Share) {
      //   throw new Error("未在localStorage中找到S3分片。注册流程可能未完成。");
      // }
      // // 假设 decryptS3Share 是你用于解密存储在localStorage中的S3分片的函数
      // // 它应该接收加密的字符串和密钥(email)，返回 Uint8Array
      // const s3ShareBytes = decryptS3Share(encryptedS3Share, email);

      // // 4. 将分片转换为Buffer，并使用SSS重组私钥
      // const sharesForReconstruction = [
      //   Buffer.from(s1ShareHex, 'hex'),
      //   Buffer.from(s2ShareHex, 'hex'),
      //   Buffer.from(s3ShareBytes)
      // ];

      // console.log("准备用于重组的SSS分片 (S1, S2, S3的Buffer):", sharesForReconstruction.map(s => s.toString('hex')));
      
      // // 假设你的 `decrypt` 函数 (Shamir) 接收一个Buffer数组和阈值 (例如2-of-3)
      // // 请根据你的shamir库调整这里的调用
      // const reconstructedPrivateKeyBytes = decrypt(sharesForReconstruction, 2);
      // const reconstructedPrivateKeyHex = Buffer.from(reconstructedPrivateKeyBytes).toString('hex');
      // console.log("重组得到的EOA私钥 (hex):", reconstructedPrivateKeyHex);

      // // 5. 使用重组后的私钥创建EOA Wallet实例
      // const eoaWallet = new ethers.Wallet(`0x${reconstructedPrivateKeyHex}`, provider);
      // console.log("EOA钱包实例已创建, 地址:", eoaWallet.address);

      // 6. 更新应用状态 (Context/State Setters)
      setUserEmail(userInfoFromBackend.passport);
      setWalletAddress(userInfoFromBackend.walletAddress?.[0] || ""); // AA钱包地址
      setIsLoggedIn(true);
      // setWallet(eoaWallet); // 核心：设置EOA钱包实例
      // if (setwalletPublicKey) { // 确保函数存在
      //    setwalletPublicKey(eoaWallet.publicKey); // EOA公钥
      // }


      
      // 9. 构建用于存储的用户对象
      // 安全警告：在localStorage中直接存储私钥（即使是对象的一部分）存在安全风险。
      // 考虑仅在内存中持有 eoaWallet 实例，或采用更安全的持久化方案。
      // 此处为了尽量匹配你之前的逻辑，构建了包含私钥信息的对象。
      const userToStore = {
        passport: userInfoFromBackend.passport,
        nickname: userInfoFromBackend.nickname,
        wallet: { // EOA钱包详情
          address: eoaWallet.address,
          privateKey: `0x${reconstructedPrivateKeyHex}`, // 警告：存储私钥!
          publicKey: eoaWallet.publicKey, // 通常 ethers.Wallet.publicKey 包含 '0x04' 前缀
        },
        // walletPublickey: eoaWallet.publicKey, // EOA 钱包公钥
        walletAddress: userInfoFromBackend.walletAddress, // AA 钱包地址数组
        // s1Share: s1ShareHex, // 可以选择不存储分片，因为私钥已重组
        // guardian: userInfoFromBackend.guardian || [], // 如果有guardian信息
      };
      storageUtils.saveUser(userToStore);
      // memoryUtil.memoryUser.user = userToStore; // 如果你使用了 memoryUtil

      console.log("登录流程成功完成，用户状态已更新并存储。");
      return { walletAddress: userInfoFromBackend.walletAddress?.[0] }; // 返回AA钱包地址或其他成功标识

    } catch (error) {
      // 使用已定义的 logError 函数
      throw logError(error, "loginUser");
    }
  }, [
      provider,
      setUserEmail,
      setWalletAddress,
      setIsLoggedIn,
      setWallet,
      setwalletPublicKey,
      setShadowWalletAddress,
      // setBalance, // 如果启用了余额获取
      // getCommitment, // 如果启用了影子钱包
      // encodeCommitment,
      // getAAWalletAddress (for shadow)
      // 确保所有依赖项都已列出
    ]
  );





  // const loginUser = useCallback(async (email: string, password: string) => {
  //   try {
  //     console.log("开始登录流程...");
  //     const response = await fetch(`${API_BASE_URL}/user/sign-in`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ Passport: email, Password: password }),
  //     });
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || "登录失败");
  //     }
  //     const data = await response.json();
  //     console.log("登录响应:", data);
  //     const user = data.user || {};
  //     if (!storageUtils.getUser().passport) {
  //       memoryUtil.memoryUser.user = user;
  //       storageUtils.saveUser(user);
  //     }
  //     setUserEmail(user.passport);
  //     setWalletAddress(user.walletAddress?.[0] || "");
  //     setIsLoggedIn(true);

  //     try {
  //       const newWallet = new ethers.Wallet(user.wallet.privateKey, provider);
  //       setWallet(newWallet);
  //       console.log("钱包已连接到提供者:", newWallet.address);
  //     } catch (walletError) {
  //       console.error("创建钱包实例失败:", walletError);
  //     }

  //     if (user.walletAddress && user.walletAddress[0]) {
  //       // const balance = await getETHBalance(user.walletAddress[0], provider);
  //       // setBalance(balance);
  //     }
  //     const shadowSalt = ethers.utils.keccak256(ethers.utils.concat([ethers.utils.toUtf8Bytes(email), ethers.utils.toUtf8Bytes("shadow")]));
  //     const commitments = await getCommitment(email, provider);
  //     const commitment = encodeCommitment(commitments[0]);
  //     const shadowAddress = await getWalletAddress(user.wallet.address, shadowSalt, commitment, provider);
  //     setShadowWalletAddress(shadowAddress);
  //     return { walletAddress: user.walletAddress?.[0] };
  //   } catch (error) {
  //     throw logError(error, "loginUser");
  //   }
  // }, [provider, setUserEmail, setWalletAddress, setIsLoggedIn, setWallet, setBalance, setShadowWalletAddress]);

  const connectWithEmail = useCallback(async (email: string) => {
    if (!provider) throw new Error("提供者未初始化");
    try {
      console.log("使用邮箱连接:", email);
      if (!email.endsWith("@qq.com")) {
        throw new Error("请使用 QQ 邮箱地址");
      }

      setUserEmail(email);
      const newWallet = await createNewWallet(provider);
      setWallet(newWallet);
      const salt = await getSalt(email);
      const commitments = await getCommitment(email, provider);
      if (!commitments || commitments.length === 0) throw new Error("生成承诺失败");
      const encodedCommitment = encodeCommitment(commitments[0]);
      const walletAddress = await getWalletAddress(newWallet.address, salt, encodedCommitment, provider);
      setWalletAddress(walletAddress);
      memoryUtil.memoryUser.user = { email, wallet: newWallet, walletAddress };
      memoryUtil.memoryWalletAddress.walletAddress = walletAddress;
      storageUtils.saveUser({ passport: email, walletAddress: [walletAddress] });
      const shadowSalt = ethers.utils.keccak256(ethers.utils.concat([ethers.utils.toUtf8Bytes(email), ethers.utils.toUtf8Bytes("shadow")]));
      const shadowAddress = await getWalletAddress(newWallet.address, shadowSalt, encodedCommitment, provider);
      setShadowWalletAddress(shadowAddress);
      // const balance = await getETHBalance(walletAddress, provider);
      // setBalance(balance);
      return { walletAddress, shadowAddress };
    } catch (error) {
      throw logError(error, "connectWithEmail");
    }
  }, [provider, setUserEmail, setWallet, setWalletAddress, setShadowWalletAddress, setBalance]);

  const sendTransaction = useCallback(
    async (txData: { from:string,sk:any,pk:any,to: string, value: string }, useShadowAccount: boolean) => {
      if (!wallet || !provider) throw new Error("钱包未连接");
      try {
        console.log("发送交易:", txData);
        const { from,sk,to,pk, value } = txData;
        const valueWei = ethers.utils.parseEther(value);

        const walletContract = new ethers.Contract(
          useShadowAccount ? from : walletAddress,
          useShadowAccount ? SHADOW_WALLET_ABI : WALLET_ABI,
          provider
        );
        const callData = walletContract.interface.encodeFunctionData("execute", [
          to,
          valueWei,
          "0x"
        ]);

        const initCode = "0x";
        const accountGasLimits = encodeGas(1000000, 2000000);
        const preVerificationGas = 100000;
        const gasFees = encodeGas(1000000, 2000000);
        const paymasterAddress = "0x5B348AFbaC7ac1696D0ec658ccFA6a05C576e364";
        const paymasterVerificationGasLimit = 1000000;
        const paymasterPostOpGasLimit = 500000;
        const paymasterAndData = ethers.utils.hexlify(ethers.utils.concat([
          paymasterAddress,
          ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterVerificationGasLimit), 16),
          ethers.utils.hexZeroPad(ethers.utils.hexlify(paymasterPostOpGasLimit), 16),
          "0x"
        ]));

        const userOp = await createPackedUserOperation(
          useShadowAccount ? from : walletAddress,
          initCode,
          callData,
          accountGasLimits,
          preVerificationGas,
          gasFees,
          paymasterAndData,
          "0x",
          provider
        );
        console.log("UserOperation 构造", { userOp });

        const userOpHash = await getHash(userOp, provider);
        console.log("userOpHash:", userOpHash);

        let signature;
        if (useShadowAccount) {
          const responseRing = await fetch("http://localhost:3001/wallet/get-shadow-wallets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress:from   }),
          });
          if (!responseRing.ok) {
            throw new Error("获取环成员失败");
          }
          const { wallets } = await responseRing.json();
          const wallet = wallets.find(w => w.address.toLowerCase() === from.toLowerCase());
          if (!wallet) {
            throw new Error("未找到对应影子钱包的环成员");
          }
          const ring = wallet.ringMembers;
          const nonce = 1;
          const temp = '0x2493d85a105968ba323b25a2b8fc0b18e221fb9aee17b6ba448ac19b4dbf75a4'
          // sk = temp;
          const response1 = await fetch("http://127.0.0.1:3001/wallet/generateRingSignature", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sk: sk,
              message: userOpHash,
              ring,
              walletAddress: from,
              nonce
            })
          });

          if (!response1.ok) {
            const errorData = await response1.json();
            throw new Error(`generateRingSignature 失败: ${errorData.message || response1.statusText}`);
          }

          const { c, r, z, keyImage, initKeyImage: submittedInitKeyImage } = await response1.json();
          if (!c || !r || !z || !keyImage || !submittedInitKeyImage) {
            throw new Error("generateRingSignature 返回数据不完整");
          }
          console.log("环签名生成", { c, r, z, keyImage, submittedInitKeyImage });

          const fixHex = (val) => typeof val === "string" && val.match(/^[0-9a-fA-F]+$/) ? `0x${val}` : val;
          const validatedC = c.map(fixHex);
          const validatedR = r.map(fixHex);
          const validatedKeyImage = fixHex(keyImage);
          const validatedInitKeyImage = fixHex(submittedInitKeyImage);

          validatedC.forEach((val, i) => {
            if (!ethers.utils.isHexString(val)) {
              throw new Error(`无效的 c[${i}]: ${val}`);
            }
          });
          validatedR.forEach((val, i) => {
            if (!ethers.utils.isHexString(val)) {
              throw new Error(`无效的 r[${i}]: ${val}`);
            }
          });
          if (!ethers.utils.isHexString(validatedKeyImage)) {
            throw new Error(`无效的 keyImage: ${validatedKeyImage}`);
          }
          if (!ethers.utils.isHexString(validatedInitKeyImage)) {
            throw new Error(`无效的 submittedInitKeyImage: ${validatedInitKeyImage}`);
          }

          const computedRingId = ethers.utils.keccak256(ethers.utils.concat(ring));

          const initMessage = ethers.utils.keccak256(ethers.utils.concat([
            ethers.utils.hexlify(from)
          ]));

          const tempPublicKey = secp256k1.g.mul(BigInt(temp));
    console.log("tempPublicKey:", tempPublicKey);
    const calculatedPkFromSk_x = tempPublicKey.getX().toString('hex');
    const calculatedPkFromSk_y = tempPublicKey.getY().toString('hex');
    // 构建未压缩公钥（去掉 04 前缀）
    const uncompressedPk = `${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_x, 32).slice(2)}${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_y, 32).slice(2)}`;


          const publicKey ='0x'+uncompressedPk
          console.log("publicKey:",publicKey);

          const initKeyImageRaw = H2(publicKey, initMessage).mul(BigInt(temp)).encode('hex', true);
          const initKeyImage = initKeyImageRaw.startsWith("0x") ? initKeyImageRaw : `0x${initKeyImageRaw}`;

          const temp3 = "0x" + initKeyImage.slice(4);

          const temp4 = `0x${z}`;
          const temp4Bytes = ethers.utils.arrayify(temp4);
          const abiCoder = new ethers.utils.AbiCoder();
          signature = abiCoder.encode(
            ['uint256[]', 'uint256[]', 'bytes32', 'bytes32', 'bytes', 'bytes32'],
            [validatedC, validatedR, computedRingId, validatedKeyImage, temp4Bytes, temp3]
          );
        } else {
          signature = await signUOP(wallet, userOpHash);
        }

        userOp.signature = signature;
        const serializedUserOp = convertBigIntToString(userOp);
        console.log("UserOperation 构造完成", { userOpHash, signature, serializedUserOp });

        const entrypoint = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
        const requiredGas = 1000000 + 2000000 + 100000000 + paymasterVerificationGasLimit + paymasterPostOpGasLimit;
        const maxFeePerGas = 2000000;
        const requiredPrefund = requiredGas * maxFeePerGas;
        const paymasterDeposit = await entrypoint.balanceOf(paymasterAddress);
        if (paymasterDeposit.lt(requiredPrefund)) {
          throw new Error("Paymaster 存款不足");
        }
        console.log("Paymaster 存款检查通过", { paymasterDeposit: ethers.utils.formatEther(paymasterDeposit) });

        const response = await fetch("http://127.0.0.1:8080/userOp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userOp: serializedUserOp,
            to,
            value: valueWei.toString(),
            useShadowAccount,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Send Transaction Bundler 错误详情:", errorData);
          throw new Error(errorData.message || "用户操作失败");
        }
        const data = await response.json();
        console.log("用户操作响应:", data);
        const txHash = data.txHash || "0x" + Math.random().toString(16).substring(2, 42);
        // const newBalance = await getETHBalance(useShadowAccount ? shadowWalletAddress : walletAddress, provider);
        // setBalance(newBalance);
        return txHash;
      } catch (error) {
        throw logError(error, "sendTransaction");
      }
    },
    [wallet, provider, walletAddress, shadowWalletAddress, ringMembers, setBalance]
  );

  const getWalletInfo = useCallback(async () => {
    if (!walletAddress) return { address: "", shadowAddress: "", balance: "0.0", rootAddress: "", wallet: "" };
    try {
      // const balance = await getETHBalance(walletAddress, provider);
      // setBalance(balance);
      return { address: walletAddress, shadowAddress: shadowWalletAddress, balance, rootAddress: wallet?.address || "", wallet: wallet };
    } catch (error) {
      logError(error, "getWalletInfo");
      return { address: walletAddress, shadowAddress: shadowWalletAddress, balance, rootAddress: wallet?.address || "", wallet: wallet };
    }
  }, [provider, wallet, walletAddress, shadowWalletAddress, setBalance, walletPublickey]);

  const getRootInfo = useCallback(async () => {
    console.log("获取根账户信息，地址:", wallet);
    if (!wallet) return { address: "" };
    try {
      return { rootAddress: wallet };
    } catch (error) {
      logError(error, "getRootInfo");
      return { rootAddress: wallet };
    }
  }, [provider, wallet, shadowWalletAddress, setBalance]);

  const activateShadowMode = useCallback(async () => {
    try {
      console.log("激活影子模式");
      return true;
    } catch (error) {
      throw logError(error, "activateShadowMode");
    }
  }, []);

  const deactivateShadowMode = useCallback(async () => {
    try {
      console.log("停用影子模式");
      return true;
    } catch (error) {
      throw logError(error, "deactivateShadowMode");
    }
  }, []);

  const getRingMembers = useCallback(async (shadowWalletAddress:string) => {
    try {
      console.log("获取环成员");
      const from = shadowWalletAddress;
      console.log("from:",from);
      const responseRing = await fetch("http://localhost:3001/wallet/get-shadow-wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress:from   }),
      });
      if (!responseRing.ok) {
        throw new Error("获取环成员失败");
      }
      const { wallets } = await responseRing.json();
      const wallet = wallets.find(w => w.address.toLowerCase() === from.toLowerCase());
      if (!wallet) {
        throw new Error("未找到对应影子钱包的环成员");
      }
      const ring = wallet.ringMembers;
      console.log("环成员响应:", ring);
      // setRingMembers(data.members || []);
      return ring || [];
    } catch (error) {
      logError(error, "getRingMembers");
      return ringMembers;
    }
  }, [ringMembers, setRingMembers]);



  const logoutUser = useCallback(async () => {
    try {
      console.log("用户登出");
      await fetch(`${API_BASE_URL}/user/sign-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      storageUtils.removeUser();
      setWallet(null);
      setWalletAddress("");
      setShadowWalletAddress("");
      setUserEmail("");
      setRingMembers([]);
      setBalance("0.0");
      setIsLoggedIn(false);
      memoryUtil.memoryUser.user = {};
      memoryUtil.memoryWalletAddress.walletAddress = "";
      return true;
    } catch (error) {
      throw logError(error, "logoutUser");
    }
  }, [setWallet, setWalletAddress, setShadowWalletAddress, setUserEmail, setRingMembers, setBalance, setIsLoggedIn]);

  return {
    createNewRootWallet,
    connectWithEmail,
    getWalletInfo,
    getRootInfo,
    activateShadowMode,
    deactivateShadowMode,
    sendTransaction,
    getRingMembers,
    registerUser,
    loginUser,
    logoutUser,
    isLoggedIn,
    initiateRecovery: (email) => initiateRecovery(email, createNewWallet), // 传递 createNewWallet
    createWallet,
    createShadowAA,
    createNewWallet,
    getETHBalance,
    constructRing,
    getWalletAddress,
    getShadowWalletAddress
  };
}