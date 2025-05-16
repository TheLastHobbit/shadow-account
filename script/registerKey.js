const ethers = require('ethers');

// 配置
const privateKey = process.env.PRIVATE_KEY || '0x81812554ba8d112aa1c546243ea875642abf054cb0bd4dcccc4e045b4aa33291';
const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd';
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// 合约 ABI
const abi = [
  'function registerPublicKey(bytes32 x, bytes32 y, bytes calldata signature, address aaAddress) external'
];

// 合约地址
const certifierAddress = '0xdFEC0877432B7667e005E23F6Fc4Df84341E8386';
const certifier = new ethers.Contract(certifierAddress, abi, wallet);

async function registerKey() {
  try {
    const tx = await certifier.registerPublicKey(
      '0x87dc4ea4745dc5dbdc6c6ca5a0c456129e37f8e1a254054d9b6af45dedc50a0f',
      '0x011b1d830c88d646809ad77d69c61dcdc6e0e1bbb80f5c8fbb99e3c790c73f37',
      '0x959d1e416c0bacba0170be6252badf8d831abfafda350d772a1bc25af65f44bc1edc263fc90ad3c0214ff35ad2460ba47d298ce182bde901d29ca202fcc387611c',
      '0xE7b10b335646b7065096a647fdF56F975C3D37A4'
    );
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
  } catch (error) {
    console.error('Error:', error);
  }
}

registerKey().catch(console.error);