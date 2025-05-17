const { ethers } = require("ethers");

// 配置 Sepolia 测试网提供者
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/7cbaf46a5d5e4e7e9d4bcaf436516aa2"); // 替换为你的 Infura 项目 ID 或其他 RPC URL

async function getContractLogs() {
  try {
    const logs = await provider.getLogs({
      address: "0xb6761B669e5D0CeD6C87b51616d1Dc668B3026aE",
      fromBlock: 8344378,
      toBlock: 8344378,
    });
    console.log("Logs:", logs);
  } catch (error) {
    console.error("查询日志失败:", error);
  }
}

getContractLogs();