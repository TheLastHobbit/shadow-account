"use client";

import { ethers } from "ethers";
import { useCallback, useState, useEffect } from "react";
import { createNewWallet } from "../lib/wallet-service";
import WALLET_ABI from "../contracts/wallet.json";

const rpcUrl = "https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd";
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

const logError = (error: any, functionName: string) => {
  console.error(`wallet-service.ts (${functionName}) 中的错误:`, error);
  console.error("堆栈跟踪:", error.stack);
  return error;
};

// 获取恢复邮件的 body
const getRecoveryBody = async (walletAddress: string, newOwner: string) => {
  try {
    if (!provider) throw new Error("提供者未初始化");
    console.log("walletAddress：", { walletAddress });

    const walletContract = new ethers.Contract(walletAddress, WALLET_ABI, provider);
    console.log("walletContract ：", { walletContract });
    const recoveryNonce = await walletContract.recoveryNonce();
    console.log("当前 recoveryNonce:", recoveryNonce.toNumber());

    const body = await walletContract.getRecoveryBody(newOwner);
    const bodyHex = ethers.utils.hexlify(body).slice(2);
    console.log("Body (hex string):", bodyHex);

    return {
      recoveryNonce: recoveryNonce.toNumber(),
      body: bodyHex,
    };
  } catch (error) {
    throw logError(error, "getRecoveryBody");
  }
};

// 提示用户发送恢复邮件
const promptSendRecoveryEmail = async (email: string, walletAddress: string, newOwner: string) => {
  try {
    const { recoveryNonce, body } = await getRecoveryBody(walletAddress, newOwner);

    const recoveryEmail = {
      from: email,
      to: "18328555534@163.com",
      subject: `Wallet Recovery Request (Nonce: ${recoveryNonce + 1})`,
      body,
    };

    console.log("请使用以下信息发送恢复邮件：", recoveryEmail);
    alert(
      `请使用您的 QQ 邮箱 ${recoveryEmail.from} 发送一封邮件到 ${recoveryEmail.to}，` +
      `主题为 "${recoveryEmail.subject}"，正文为 "${recoveryEmail.body}"。` +
      `发送完成后，点击“确认”继续操作。`
    );

    return recoveryEmail;
  } catch (error) {
    throw logError(error, "promptSendRecoveryEmail");
  }
};

// 调用 Wallet.verify 进行恢复
const recoverWallet = async (
  walletAddress: string,
  toSign: string,
  body: string,
  sign: string,
  newOwner: string,
  base64Encoded: boolean
) => {
  try {
    console.log("provider.getSigner():",provider.getSigner())
    const walletContract = new ethers.Contract(walletAddress, WALLET_ABI, provider.getSigner());
    console.log("walletContract",walletContract)
    const tx = await walletContract.verify(toSign, body, sign, newOwner, base64Encoded);
    const receipt = await tx.wait(); 
    console.log("Wallet recovery successful:", receipt);
    return receipt;
  } catch (error) {
    throw logError(error, "recoverWallet");
  }
};

// 查询钱包地址
const getWalletAddress = async (email: string) => {
  try {
    const response = await fetch(`http://localhost:3001/wallet/get-wallet/${encodeURIComponent(email)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "查询失败");
    }
    const { data } = await response.json();
    return data.wallet_address;
  } catch (error) {
    console.error("查询钱包地址失败:", error);
    throw error;
  }
};

export function useSocialRecovery(email: string) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 查询钱包地址
  useEffect(() => {
    if (!email || !email.endsWith("@qq.com")) {
      setError("请输入有效的 QQ 邮箱");
      return;
    }

    const fetchWalletAddress = async () => {
      setLoading(true);
      setError(null);
      try {
        const address = await getWalletAddress(email);
        setWalletAddress(address);
      } catch (err) {
        setError(err.message || "查询钱包地址失败");
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAddress();
  }, [email]);

  // 生成恢复邮件详情
  const generateRecoveryEmail = useCallback(async () => {
    if (!walletAddress) {
      throw new Error("钱包地址未加载");
    }
    try {
      const newWallet = await createNewWallet(provider);
      const newOwner = newWallet.address;
      console.log("生成的恢复地址 (new owner):", newOwner);

      const recoveryEmail = await promptSendRecoveryEmail(email, walletAddress, newOwner);
      return { recoveryEmail, newOwner };
    } catch (error) {
      throw logError(error, "generateRecoveryEmail");
    }
  }, [email, walletAddress]);

  // 完成恢复流程
  const completeRecovery = useCallback(
    async (recoveryEmail: { from: string; to: string; subject: string; body: string }, newOwner: string) => {
      if (!walletAddress) {
        throw new Error("钱包地址未加载");
      }
      try {
        const userConfirmed = confirm("邮件已发送，是否继续？");
        if (!userConfirmed) {
          throw new Error("用户取消操作");
        }

        const response = await fetch("http://127.0.0.1:3001/wallet/parse-recovery-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: email,
            subject: recoveryEmail.subject,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`解析邮件失败: ${errorData.message || response.statusText}`);
        }

        const { toSign, body: parsedBody, sign, base64Encoded } = await response.json();
        console.log("后端解析结果:", { toSign, parsedBody, sign, base64Encoded });
        console.log("3333333")

        const receipt = await recoverWallet(walletAddress, toSign, parsedBody, sign, newOwner, base64Encoded);
        return { receipt, newOwner };
      } catch (error) {
        throw logError(error, "completeRecovery");
      }
    },
    [email, walletAddress]
  );

  return {
    generateRecoveryEmail,
    completeRecovery,
    getRecoveryBody,
    walletAddress,
    loading,
    error,
  };
}