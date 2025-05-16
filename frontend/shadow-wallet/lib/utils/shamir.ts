// 假设 Y_VALUE_BYTE_LENGTH 是存储每个 y 坐标（模 prime 后）所需的字节数
// 对于接近 2^256 的素数，32字节是合适的。
const Y_VALUE_BYTE_LENGTH = 32;

// 大素数 (近 2^256)
const prime = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639747");

// 辅助函数：BigInt 转换为固定长度的字节数组 (大端序)
function bigIntToBytes(val: bigint, length: number): Uint8Array {
  let hex = val.toString(16);
  if (hex.length > length * 2) {
    throw new Error("BigInt太大，无法放入指定长度的字节数组");
  }
  // 前补0以达到指定长度
  hex = hex.padStart(length * 2, '0');
  
  const u8 = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return u8;
}

// 辅助函数：字节数组 (大端序) 转换为 BigInt
function bytesToBigInt(bytes: Uint8Array): bigint {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  if (hex === '') return BigInt(0); // 处理空字节数组的情况
  return BigInt('0x' + hex);
}

// 模逆计算
function modInverse(a: bigint, m: bigint): bigint {
  if (m === BigInt(0)) throw new Error("模数不能为零");
  let m0 = m, t, q;
  let x0 = BigInt(0), x1 = BigInt(1);
  a = (a % m + m) % m; 
  if (m === BigInt(1)) return BigInt(0);

  while (a > 1) {
    if (m === BigInt(0)) throw new Error("在模逆计算中出现模为零的情况");
    q = a / m;
    t = m;
    m = a % m;
    a = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }
  if (x1 < 0) x1 += m0;
  if (a !== BigInt(1)) throw new Error(`模逆不存在: a=${a} (化简后), m=${m0}`);
  return x1;
}

// 模幂运算
function pow(base: bigint, exp: bigint): bigint {
  let result = BigInt(1);
  base = (base % prime + prime) % prime; 
  while (exp > 0) {
    if (exp & BigInt(1)) result = (result * base) % prime;
    base = (base * base) % prime;
    exp >>= BigInt(1);
  }
  return result;
}

// 安全生成小于 prime 的随机 BigInt
function getRandomBigInt(maxExclusive: bigint): bigint {
  const byteLength = Math.ceil(maxExclusive.toString(2).length / 8);
  let randomVal: bigint;
  // 假设在浏览器环境中，Node.js 中可用 crypto.randomBytes
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    do {
      const randomBytes = new Uint8Array(byteLength);
      crypto.getRandomValues(randomBytes);
      randomVal = bytesToBigInt(randomBytes);
      // 确保随机数分布尽可能均匀，通过拒绝采样使其严格小于 maxExclusive
      // 对于非常接近 2^N 的 maxExclusive，这种简单拒绝采样可能效率不高，但对于随机系数够用
    } while (randomVal >= maxExclusive);
  } else {
    // Fallback for environments without crypto.getRandomValues (不安全)
    // 实际应用中应确保有安全的随机源
    console.warn("警告: 正在使用不安全的随机数生成器 Math.random");
    let hex = "";
    for (let i = 0; i < byteLength; i++) {
      hex += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }
    randomVal = BigInt('0x' + hex) % maxExclusive;
  }
  return randomVal;
}

// 分割秘密
// n: 阈值 (threshold)
// num: 生成的分片总数 (number of shares)
function encrypt(secret: Uint8Array, n_threshold: number, num_shares: number): Uint8Array[] {
  if (secret.length === 0 || n_threshold <= 0) throw new Error("无效的秘密或阈值");
  if (num_shares < n_threshold) throw new Error("分片总数必须大于或等于阈值");
  if (n_threshold <= 1) throw new Error("阈值必须大于1"); // 1-of-k 方案通常没有意义或有更简单的实现

  const degree = n_threshold - 1;
  const resultShares: Uint8Array[] = Array.from({ length: num_shares }, () => 
    new Uint8Array(1 + secret.length * Y_VALUE_BYTE_LENGTH)
  );

  for (let j = 0; j < secret.length; j++) { // 对秘密的每一个字节
    const secretByte = BigInt(secret[j]);
    const coeffs: bigint[] = [secretByte]; // coeffs[0] 是秘密字节 S_j
    
    for (let d = 0; d < degree; d++) { // 生成 degree 个随机系数 a_1, ..., a_{degree}
      coeffs.push(getRandomBigInt(prime));
    }

    for (let i = 0; i < num_shares; i++) { // 对每一个分片
      const x_val = BigInt(i + 1); // 分片索引 x_i 从1开始
      if (j === 0) { // 仅在处理第一个秘密字节时设置分片的 x 坐标
        resultShares[i][0] = Number(x_val); // 假设 x_val 能安全转为 Number (对于小的 num_shares)
      }
      
      let y_value_mod_prime = BigInt(0);
      for (let k = 0; k < coeffs.length; k++) { // coeffs.length 是 n_threshold (或 degree+1)
        y_value_mod_prime = (y_value_mod_prime + coeffs[k] * pow(x_val, BigInt(k))) % prime;
      }
      
      const y_bytes = bigIntToBytes(y_value_mod_prime, Y_VALUE_BYTE_LENGTH);
      resultShares[i].set(y_bytes, 1 + j * Y_VALUE_BYTE_LENGTH);
    }
  }
  return resultShares;
}

// 重建秘密
// n_threshold: 恢复秘密所需的最小分片数
function decrypt(shares: Uint8Array[], n_threshold: number): Uint8Array {
  if (shares.length < n_threshold) throw new Error(`分片不足: 期望至少 ${n_threshold}, 实际 ${shares.length}`);

  const sharesToUse = shares.slice(0, n_threshold); // 使用提供的分片中的前 n_threshold 个

  const firstShareLength = sharesToUse[0]?.length ?? 0;
  if (firstShareLength <= 1 || (firstShareLength - 1) % Y_VALUE_BYTE_LENGTH !== 0) {
    throw new Error("无效的分片长度或格式");
  }
  const secretLength = (firstShareLength - 1) / Y_VALUE_BYTE_LENGTH;
  const result = new Uint8Array(secretLength);

  const xs = sharesToUse.map(s => BigInt(s[0]));
  const uniqueXs = new Set(xs);
  if (uniqueXs.size < n_threshold) throw new Error("用于解密的分片 x 坐标不唯一: " + xs.join(", "));

  for (let j = 0; j < secretLength; j++) { // 对原始秘密的每一个字节位置
    let secret_byte_reconstructed = BigInt(0);
    
    const ys_for_current_byte: bigint[] = [];
    for(let i = 0; i < n_threshold; i++) {
        const y_bytes_offset = 1 + j * Y_VALUE_BYTE_LENGTH;
        const y_bytes = sharesToUse[i].slice(y_bytes_offset, y_bytes_offset + Y_VALUE_BYTE_LENGTH);
        ys_for_current_byte.push(bytesToBigInt(y_bytes));
    }

    for (let i = 0; i < n_threshold; i++) { // 拉格朗日插值 P(0)
      let lagrange_basis_at_zero = BigInt(1);
      for (let k = 0; k < n_threshold; k++) {
        if (i !== k) {
          let num_term = (BigInt(0) - xs[k] % prime + prime) % prime;
          let den_term = (xs[i] - xs[k] % prime + prime) % prime;
          if (den_term === BigInt(0)) throw new Error(`无效分片导致拉格朗日分母为零: xs[${i}]=${xs[i]}, xs[${k}]=${xs[k]}`);
          
          lagrange_basis_at_zero = (lagrange_basis_at_zero * num_term % prime * modInverse(den_term, prime)) % prime;
        }
      }
      secret_byte_reconstructed = (secret_byte_reconstructed + ys_for_current_byte[i] * lagrange_basis_at_zero) % prime;
    }
    secret_byte_reconstructed = (secret_byte_reconstructed % prime + prime) % prime;
    result[j] = Number(secret_byte_reconstructed % BigInt(256));
  }
  return result;
}

export { encrypt, decrypt, prime, modInverse, pow, bigIntToBytes, bytesToBigInt, Y_VALUE_BYTE_LENGTH };