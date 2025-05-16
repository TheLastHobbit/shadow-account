const { ec: EC } = require('elliptic');
const secp256k1 = new EC('secp256k1');
const crypto = require('crypto');

// 生成随机私钥并生成公钥
function testEllipticPublicKey() {
  console.log("=== 测试 elliptic 公钥生成 ===");

  // 生成随机私钥
  const privateKey = crypto.randomBytes(32).toString('hex'); // 32字节私钥（64字符，不含 0x）
  console.log("私钥:", privateKey, "length:", privateKey.length);

  // 使用 elliptic 从私钥派生公钥（未压缩格式）
  const keyPair = secp256k1.keyFromPrivate(privateKey, 'hex');
  const publicKeyRaw = keyPair.getPublic(false, 'hex'); // 未压缩公钥（不含 0x 前缀）
  const publicKey = `0x${publicKeyRaw}`; // 添加 0x 前缀
  console.log("公钥 (含 0x 前缀):", publicKey, "length:", publicKey.length);

  // 检查公钥长度
  if (publicKey.length !== 130) {
    console.warn("公钥长度异常:", publicKey.length, "字符，预期130字符");
    // 提取 x 和 y 坐标
    const withoutPrefix = publicKey.slice(2); // 去掉 0x 前缀
    const prefix = withoutPrefix.slice(0, 2); // 前缀 04
    const xHex = withoutPrefix.slice(2, 68); // x 坐标（预期 64 字符，但可能为 66 字符）
    const yHex = withoutPrefix.slice(68, 132); // y 坐标（64 字符）
    console.log("前缀:", prefix);
    console.log("x 坐标:", xHex, "length:", xHex.length);
    console.log("y 坐标:", yHex, "length:", yHex.length);
  }

  // 验证公钥有效性（使用 elliptic）
  try {
    const parsedKey = secp256k1.keyFromPublic(publicKeyRaw, 'hex'); // 直接使用不含 0x 的公钥
    const parsedPublicKey = `0x${parsedKey.getPublic(false, 'hex')}`;
    console.log("公钥验证通过，解析后的公钥:", parsedPublicKey, "length:", parsedPublicKey.length);
  } catch (error) {
    console.error("公钥验证失败:", error.message);
  }

  // 规范化公钥到 130 字符
  if (publicKey.length !== 130) {
    const withoutPrefix = publicKey.slice(2);
    const xHex = withoutPrefix.slice(0, 66); // x 坐标（66 字符，33 字节）
    const yHex = withoutPrefix.slice(66, 130); // y 坐标（64 字符，32 字节）
    const xTrimmed = xHex.slice(2, 66); // 截取 x 坐标为 32 字节（64 字符）
    const normalizedPublicKey = `0x04${xTrimmed}${yHex}`;
    console.log("规范化后的公钥:", normalizedPublicKey, "length:", normalizedPublicKey.length);

    // 验证规范化后的公钥
    try {
      const parsedKey = secp256k1.keyFromPublic(normalizedPublicKey.slice(2), 'hex');
      const parsedPublicKey = `0x${parsedKey.getPublic(false, 'hex')}`;
      console.log("规范化公钥验证通过，解析后的公钥:", parsedPublicKey, "length:", parsedPublicKey.length);
    } catch (error) {
      console.error("规范化公钥验证失败:", error.message);
    }
  }
}

// 运行测试
testEllipticPublicKey();