// setDkimPublicKey.js
const { ethers } = require("ethers");

// --- 配置参数 ---
const RPC_URL ="https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd";; // 例如 "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID" 或其他节点的URL
const OWNER_PRIVATE_KEY = "0x81812554ba8d112aa1c546243ea875642abf054cb0bd4dcccc4e045b4aa33291"; // PublicKeyOracle 合约拥有者的私钥
const PUBLIC_KEY_ORACLE_CONTRACT_ADDRESS = "0x4D4bDD8A52E46496ff7D82d781C2aa132EEDa9Af"; // 你部署的 PublicKeyOracle 合约地址

// DKIM 参数 (根据你之前 dig 和 openssl 的结果)
const DKIM_DOMAIN = "qq.com";
const DKIM_SELECTOR = "s201512";

// 从你 OpenSSL 输出解析得到的模数和指数
const DKIM_MODULUS_HEX = "0xcfb0520e4ad78c4adb0deb5e605162b6469349fc1fde9269b88d596ed9f3735c00c592317c982320874b987bcc38e8556ac544bdee169b66ae8fe639828ff5afb4f199017e3d8e675a077f21cd9e5c526c1866476e7ba74cd7bb16a1c3d93bc7bb1d576aedb4307c6b948d5b8c29f79307788d7a8ebf84585bf53994827c23a5";
const DKIM_EXPONENT_HEX = "0x010001"; // (65537, 0x10001)
// --- 配置结束 ---

// PublicKeyOracle 合约中 setPublicKey 函数的最小化 ABI
const publicKeyOracleAbi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "domain",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "selector",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "modulus",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "exponent",
        "type": "bytes"
      }
    ],
    "name": "setPublicKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  if (OWNER_PRIVATE_KEY === "YOUR_CONTRACT_OWNER_PRIVATE_KEY" ||
      PUBLIC_KEY_ORACLE_CONTRACT_ADDRESS === "YOUR_PUBLIC_KEY_ORACLE_CONTRACT_ADDRESS" ||
      RPC_URL === "YOUR_SEPOLIA_RPC_URL") {
    console.error("错误：请在脚本中替换 RPC_URL, OWNER_PRIVATE_KEY, 和 PUBLIC_KEY_ORACLE_CONTRACT_ADDRESS 的占位符为你实际的值。");
    return;
  }

  // 1. 连接到以太坊网络
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  // 2. 使用合约拥有者的私钥创建钱包
  const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  console.log(`操作账户 (合约Owner): ${ownerWallet.address}`);
  const balance = await provider.getBalance(ownerWallet.address);
  console.log(`账户余额: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.isZero()) {
    console.warn("警告：操作账户余额为0，可能无法支付交易的Gas费用。");
  }

  // 3. 获取 PublicKeyOracle 合约实例
  const publicKeyOracleContract = new ethers.Contract(
    PUBLIC_KEY_ORACLE_CONTRACT_ADDRESS,
    publicKeyOracleAbi,
    ownerWallet // 使用 ownerWallet 作为签名者来发送交易
  );

  console.log(`连接到 PublicKeyOracle 合约: ${publicKeyOracleContract.address}`);
  console.log(`准备为域名 "${DKIM_DOMAIN}" 和选择器 "${DKIM_SELECTOR}" 设置公钥...`);
  console.log(`  模数 (Modulus): ${DKIM_MODULUS_HEX}`);
  console.log(`  指数 (Exponent): ${DKIM_EXPONENT_HEX}`);

  try {
    // 4. 调用 setPublicKey 函数
    console.log("正在发送交易以调用 setPublicKey...");
    const tx = await publicKeyOracleContract.setPublicKey(
      DKIM_DOMAIN,
      DKIM_SELECTOR,
      DKIM_MODULUS_HEX,
      DKIM_EXPONENT_HEX
      // 你可以在这里添加 gasLimit 或 gasPrice (如果需要)
      // 例如: { gasLimit: 300000, gasPrice: ethers.utils.parseUnits('10', 'gwei') }
    );

    console.log(`交易已发送，交易哈希: ${tx.hash}`);
    console.log("等待交易确认 (通常需要1-3个区块)...");

    const receipt = await tx.wait(1); // 等待至少1个区块确认
    console.log(`交易已确认！区块号: ${receipt.blockNumber}`);
    console.log(`成功为 ${DKIM_DOMAIN} / ${DKIM_SELECTOR} 设置/更新了DKIM公钥。`);

  } catch (error) {
    console.error("调用 setPublicKey 函数时发生错误:");
    if (error.reason) {
        console.error("  Reason:", error.reason);
    }
    if (error.code) {
        console.error("  Code:", error.code);
    }
    if (error.message) {
        console.error("  Message:", error.message);
    }
    if (error.transactionHash) {
        console.error("  交易哈希:", error.transactionHash);
    }
    // 对于 Ethers v5，可以尝试解析合约 revert 的错误信息
    if (error.data && typeof error.data === 'string' && error.data.startsWith('0x')) {
        try {
            const decodedError = publicKeyOracleContract.interface.parseError(error.data);
            if (decodedError) {
                console.error("  合约 Revert 原因:", decodedError.name, decodedError.args);
            }
        } catch (parseError) {
            // console.error("  无法解析合约错误数据:", parseError);
        }
    }
    // console.error("详细错误对象:", error);
  }
}

main().catch((error) => {
  console.error("脚本执行失败:", error);
  process.exitCode = 1;
});
