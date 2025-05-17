require('dotenv').config();
const express = require('express');
const { ec: EC } = require('elliptic');
const ethers = require('ethers');
const { createClient } = require('@supabase/supabase-js');
const secp256k1 = new EC('secp256k1');
const router = express.Router();

// 配置以太坊提供者
const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd');

// 配置 Supabase 客户端
const supabaseUrl = 'https://iokhaxmlbqraaionclks.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const q = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
const H2 = (pk, m) => secp256k1.g.mul(BigInt(ethers.utils.keccak256(ethers.utils.concat([pk, m]))));

// 获取公钥池
router.get('/public-keys', async (req, res) => {
  try {
    // 从查询参数获取 size，默认 10
    const poolSize = parseInt(req.query.size) || 10;
    if (poolSize < 1 || poolSize > 100) {
      throw new Error('Invalid size parameter, must be between 1 and 100');
    }
    const keys = [];

    // 从 Supabase 查询公钥
    const { data: rows, error } = await supabase
      .from('public_keys')
      .select('address, x, y')
      .limit(poolSize);
    if (error) throw new Error(`Supabase query error: ${error.message}`);
    keys.push(...rows.map(row => ({ x: row.x, y: row.y })));
    console.log(`Fetched ${keys.length} public keys from Supabase`);

    // 如果数据库公钥不足，从链上恢复
    if (keys.length < poolSize) {
      const seenAddresses = new Set(rows.map(row => row.address));
      const latestBlock = await provider.getBlockNumber();
      let blockNumber = latestBlock;

      while (keys.length < poolSize && blockNumber >= latestBlock - 200) {
        const block = await provider.getBlockWithTransactions(blockNumber);
        console.log(`Scanning block ${blockNumber}, transactions: ${block.transactions.length}`);
        for (const tx of block.transactions) {
          if (keys.length >= poolSize) break;
          if (!tx.from || !tx.r || !tx.s || !tx.v || seenAddresses.has(tx.from)) continue;
          seenAddresses.add(tx.from);

          try {
            const msgHash = ethers.utils.hashMessage(ethers.utils.serializeTransaction({
              ...tx,
              r: undefined,
              s: undefined,
              v: undefined
            }));
            const publicKey = ethers.utils.recoverPublicKey(msgHash, {
              r: tx.r,
              s: tx.s,
              v: tx.v
            });
            const x = `0x${publicKey.slice(4, 68)}`;
            const y = `0x${publicKey.slice(68)}`;
            if (!ethers.utils.isHexString(x) || x.length !== 66 || !ethers.utils.isHexString(y) || y.length !== 66) {
              console.warn(`Invalid public key for tx ${tx.hash}: x=${x}, y=${y}`);
              continue;
            }

            // 插入数据库（Supabase upsert）
            const { error: upsertError } = await supabase
              .from('public_keys')
              .upsert({ address: tx.from, x, y }, { onConflict: 'address' });
            if (upsertError) throw new Error(`Supabase upsert error: ${upsertError.message}`);
            keys.push({ x, y });
            console.log(`Recovered and saved public key for address ${tx.from}:`, { x, y });
          } catch (error) {
            console.warn(`Failed to recover public key for tx ${tx.hash}:`, error.message);
          }
        }
        blockNumber--;
      }
    }

    // 补充随机公钥（如果仍不足）
    while (keys.length < poolSize) {
      const privateKey = ethers.utils.randomBytes(32);
      const keyPair = secp256k1.keyFromPrivate(privateKey);
      const publicKey = keyPair.getPublic(false, 'hex');
      const x = `0x${publicKey.slice(2, 66)}`;
      const y = `0x${publicKey.slice(66)}`;
      if (ethers.utils.isHexString(x) && x.length === 66 && ethers.utils.isHexString(y) && y.length === 66) {
        const randomAddress = `0x${ethers.utils.keccak256(privateKey).slice(-40)}`;
        const { error: upsertError } = await supabase
          .from('public_keys')
          .upsert({ address: randomAddress, x, y }, { onConflict: 'address' });
        if (upsertError) throw new Error(`Supabase upsert error: ${upsertError.message}`);
        keys.push({ x, y });
        console.log(`Generated and saved random public key for address ${randomAddress}:`, { x, y });
      }
    }

    console.log('Generated public key pool:', keys);
    res.json({ keys });
  } catch (error) {
    console.error('Public key pool generation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


router.post('/generateRingSignature', async (req, res) => {
  try {
    const { sk, message, ring, walletAddress, nonce } = req.body;
    console.log("sk:",sk);

    // 验证输入格式
    if (!sk || !ethers.utils.isHexString(sk) || sk.length !== 66) {
      throw new Error('无效的私钥格式');
    }
    if (!message || !ethers.utils.isHexString(message)) {
      throw new Error('无效的消息格式');
    }
    if (!ring || !Array.isArray(ring) || ring.length < 4 || ring.length % 2 !== 0) {
      throw new Error('无效的环成员数组');
    }

    // 根据 sk 计算 pk
    const calculatedPkFromSk_point = secp256k1.g.mul(BigInt(sk));
    const calculatedPkFromSk_x = calculatedPkFromSk_point.getX().toString('hex');
    const calculatedPkFromSk_y = calculatedPkFromSk_point.getY().toString('hex');
    const uncompressedPk = `0x${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_x, 32).slice(2)}${ethers.utils.hexZeroPad("0x" + calculatedPkFromSk_y, 32).slice(2)}`;
    console.log("Calculated uncompressed pk:", uncompressedPk);

    const n = ring.length / 2;
    if (n < 2) throw new Error('环成员数量过少');

    // 在 ring 中检测 pk
    let pkFound = false;
    let s = -1; // 签名者索引
    for (let i = 0; i < n; i++) {
      const currentRingPkX = ring[i * 2];
      const currentRingPkY = ring[i * 2 + 1];
      const ringMemberPk = `0x${currentRingPkX.slice(2)}${currentRingPkY.slice(2)}`;
      console.log("ringMemberPk:", ringMemberPk);
      if (ringMemberPk === uncompressedPk) {
        pkFound = true;
        s = i;
        break;
      }
    }

    if (!pkFound) throw new Error('签名者公钥未在环中找到');

    // Key Images
    const y_0 = H2(uncompressedPk, message).mul(BigInt(sk));
    console.log("walletAddress:",walletAddress)
    const initMessage = ethers.utils.keccak256(ethers.utils.concat([
      ethers.utils.hexlify(walletAddress)
    ]));
    const initKeyImage = H2(uncompressedPk, initMessage).mul(BigInt(sk));

    const u = BigInt(ethers.utils.hexlify(ethers.utils.randomBytes(32))) % q;
    const c_final = new Array(n);
    const r_final = new Array(n);
    const z_final_points = new Array(n);
    const z_final_encoded = new Array(n);

    const ringId = ethers.utils.keccak256(ethers.utils.concat(ring.map(coord => ethers.utils.arrayify(coord))));

    // 计算 z[i] = G * r[i] (i ≠ s) 和 z[s] = G * u
    const initial_Gu = secp256k1.g.mul(u);
    z_final_points[s] = initial_Gu;
    z_final_encoded[s] = `0x${z_final_points[s].encode('hex', true)}`;

    for (let i = (s + 1) % n; i !== s; i = (i + 1) % n) {
      r_final[i] = BigInt(ethers.utils.hexlify(ethers.utils.randomBytes(32))) % q;
      const ringMemberPkHex = `${ring[i * 2].slice(2)}${ring[i * 2 + 1].slice(2)}`;
      const temp = '04' + ringMemberPkHex;
      console.log("ringPk:", temp);
      z_final_points[i] = secp256k1.g.mul(r_final[i]);
      z_final_encoded[i] = `0x${z_final_points[i].encode('hex', true)}`;
    }

    // 计算哈希链，动态生成 c[i]
    let current_L_for_hash = z_final_points[s];
    for (let k = 0; k < n; k++) {
      const i = (s + 1 + k) % n;
      c_final[i] = BigInt(ethers.utils.keccak256(ethers.utils.concat([
        ethers.utils.arrayify(message),
        ethers.utils.arrayify(`0x${current_L_for_hash.encode('hex', true)}`),
        ethers.utils.arrayify(ringId)
      ]))) % q;

      if (i === s) {
        r_final[s] = (u - (BigInt(sk) * c_final[s])) % q;
        if (r_final[s] < 0n) {
          r_final[s] += q;
        }
      } else {
        const ringMemberPkHex = `${ring[i * 2].slice(2)}${ring[i * 2 + 1].slice(2)}`;
        const temp = '04' + ringMemberPkHex;
        z_final_points[i] = z_final_points[i].add(secp256k1.keyFromPublic(temp, 'hex').getPublic().mul(c_final[i]));
        z_final_encoded[i] = `0x${z_final_points[i].encode('hex', true)}`;
      }
      current_L_for_hash = z_final_points[i];
    }

    // 验证哈希链闭合
    let temp_L_for_hash_check = z_final_points[s];
    for (let k = 0; k < n; k++) {
      const i = (s + 1 + k) % n;
      const calculated_c = BigInt(ethers.utils.keccak256(ethers.utils.concat([
        ethers.utils.arrayify(message),
        ethers.utils.arrayify(`0x${temp_L_for_hash_check.encode('hex', true)}`),
        ethers.utils.arrayify(ringId)
      ]))) % q;

      if (calculated_c !== c_final[i]) {
        console.error(`内部校验失败: c[${i}] 不匹配`, {
          expected_c: c_final[i].toString(16),
          recalculated_c: calculated_c.toString(16),
        });
        throw new Error(`内部签名一致性校验失败 at c[${i}]`);
      }
      temp_L_for_hash_check = secp256k1.keyFromPublic(z_final_encoded[i].slice(2), 'hex').getPublic();
    }
    console.log("内部签名一致性校验通过");

    const zString = z_final_encoded.map(item => item.slice(2)).join('');

    res.json({
      c: c_final.map(x => ethers.utils.hexZeroPad(ethers.utils.hexlify(x), 32)),
      r: r_final.map(x => ethers.utils.hexZeroPad(ethers.utils.hexlify(x), 32)),
      z: zString,
      keyImage: `0x${y_0.encode('hex', true).slice(2)}`,
      initKeyImage: `0x${initKeyImage.encode('hex', true).slice(2)}`,
    });
  } catch (error) {
    console.error('签名生成错误:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// 验证环签名
router.post('/verifyRingSignature', async (req, res) => {
  try {
    const { message, ring, y_0, c, r, z, initKeyImage } = req.body;
    const n = c.length;
    console.log("z:", z.length);
    console.log("z:", z);
    console.log("c:", c);
    console.log("r:", r);
    console.log("ring:", ring);

    // 验证 z 点操作：z[i] == G * r[i] + P[i] * c[i]
    // for (let i = 0; i < n; i++) {
    //   const ringPk = `04${ring[i * 2].slice(2)}${ring[i * 2 + 1].slice(2)}`;
    //   console.log("11111111");
    //   const temp = z.slice(i * 66, (i + 1) * 66);
    //   console.log("temp:", temp);
    //   const zPoint = secp256k1.keyFromPublic(temp, 'hex').getPublic();
    //   console.log("222222222");
    //   console.log("zPoint:", zPoint);

    //   const gr = secp256k1.g.mul(BigInt(r[i]));
    //   console.log("333333333");
    //   const pc = secp256k1.keyFromPublic(ringPk, 'hex').getPublic().mul(BigInt(c[i]));
    //   console.log("444444444");
    //   const sum = gr.add(pc);
    //   console.log("sum:", sum);
    //   console.log("zPoint.x:", zPoint.x);
    //   console.log("zPoint.y:", zPoint.y);
    //   if (sum.x.cmp(zPoint.x) !== 0 || sum.y.cmp(zPoint.y) !== 0) {
    //     console.log(`Mismatch at index ${i}: sum.x=${sum.x}, zPoint.x=${zPoint.x}, sum.y=${sum.y}, zPoint.y=${zPoint.y}`);
    //     throw new Error(`Invalid point operation at index ${i}`);
    //   }
    // }

    // 验证哈希链闭合
    const ringId = ethers.utils.keccak256(ethers.utils.concat(ring));
    const zEncoded = [];
    for (let i = 0; i < n; i++) {
      zEncoded.push(`0x${z.slice(i * 66, (i + 1) * 66)}`);
    }

    let validHashChain = false;
    for (let s = 0; s < n; s++) {
      let h = ethers.utils.keccak256(ethers.utils.concat([
        ethers.utils.arrayify(message),
        ethers.utils.arrayify(zEncoded[s]),
        ethers.utils.arrayify(ringId)
      ]));
      if (BigInt(h) !== BigInt(c[(s + 1) % n])) continue;

      let chainValid = true;
      for (let j = 1; j < n; j++) {
        const i = (s + 1 + j) % n;
        const prevIndex = (i - 1 + n) % n;
        h = ethers.utils.keccak256(ethers.utils.concat([
          ethers.utils.arrayify(message),
          ethers.utils.arrayify(zEncoded[prevIndex]),
          ethers.utils.arrayify(ringId)
        ]));
        if (BigInt(h) !== BigInt(c[i])) {
          chainValid = false;
          break;
        }
      }
      if (chainValid) {
        validHashChain = true;
        break;
      }
    }
    if (!validHashChain) {
      throw new Error('Hash chain verification failed');
    }

    console.log('Verification successful');

    res.json({ success: true });
  } catch (error) {
    console.error('Verification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// router.post('/verifyRingSignature', async (req, res) => {
//   try {
//     // Use the variable names as specified by the user
//     const { message, ring, y_0, c, r, z, initKeyImage, commitment } = req.body;

//     // --- 1. Input Validation ---
//     if (message === undefined || !ring || y_0 === undefined || !c || !r || z === undefined || initKeyImage === undefined || commitment === undefined) {
//       throw new Error('Missing one or more required fields in the request body (message, ring, y_0, c, r, z, initKeyImage, commitment)');
//     }
//     if (typeof message !== 'string') {
//         throw new Error('Message must be a string.');
//     }
//     if (!Array.isArray(ring) || ring.length === 0 || ring.length % 2 !== 0) {
//         throw new Error('Invalid ring: must be a non-empty array with an even number of elements (x, y coordinates).');
//     }

//     const n = ring.length / 2;
//     if (n < 2) { // Consistent with signer's check
//         throw new Error('Ring too small (must contain at least 2 public keys)');
//     }

//     if (!Array.isArray(c) || c.length !== n) {
//         throw new Error(`Invalid 'c' array: length must be ${n}, but got ${c.length}`);
//     }
//     if (!Array.isArray(r) || r.length !== n) {
//         throw new Error(`Invalid 'r' array: length must be ${n}, but got ${r.length}`);
//     }
//     // 'z' is expected to be a concatenated string of hex characters (compressed keys without "0x")
//     if (typeof z !== 'string' || z.length !== n * 66) { // Each compressed key is 33 bytes = 66 hex chars
//         throw new Error(`Invalid 'z' string: length must be ${n * 66}, but got ${z.length}`);
//     }

//     // Validate hex formats and lengths for signature components
//     // y_0 (formerly keyImage) is expected to be a "0x" prefixed hex string of a compressed point
//     // if (!ethers.utils.isHexString(y_0) || y_0.length !== 68) { // "0x" + 33 bytes (66 hex chars)
//     //     throw new Error('Invalid y_0: must be a 68-character hex string (e.g., "0x...") representing a compressed public key.');
//     // }
//     if (!ethers.utils.isHexString(initKeyImage) || initKeyImage.length !== 68) { // "0x" + 33 bytes (66 hex chars)
//         throw new Error('Invalid initKeyImage: must be a 68-character hex string (e.g., "0x...") representing a compressed public key.');
//     }
//     if (!ethers.utils.isHexString(commitment) || commitment.length !== 66) { // "0x" + 32 bytes (64 hex chars) hash
//         throw new Error('Invalid commitment: must be a 66-character hex string (e.g., "0x...") representing a hash.');
//     }

//     for(let i=0; i<n; i++) {
//         if (!ethers.utils.isHexString(c[i]) || c[i].length !== 66) { // 0x + 32 bytes zero padded
//             throw new Error(`Invalid c element at index ${i}: must be a 66-character hex string (32-byte value).`);
//         }
//         if (!ethers.utils.isHexString(r[i]) || r[i].length !== 66) {
//             throw new Error(`Invalid r element at index ${i}: must be a 66-character hex string (32-byte value).`);
//         }
//     }

//     // --- 2. Calculate expected c value (H(message)) ---
//     // The signing algorithm implies c_i = H(message) for all i.
//     const messageBytes = ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : ethers.utils.toUtf8Bytes(message);
//     const expected_c_val_hash = ethers.utils.keccak256(messageBytes);
//     const expected_c_val = BigInt(expected_c_val_hash) % q;

//     const z_points = [];    // Array to store elliptic curve points for z_i
//     const Pk_points = [];   // Array to store elliptic curve points for ring public keys Pk_i

//     // --- 3. Process ring public keys and parse z_i values from signature ---
//     for (let i = 0; i < n; i++) {
//         // a. Process public key Pk_i from the ring
//         const pk_x_hex = ring[i * 2];
//         const pk_y_hex = ring[i * 2 + 1];

//         if (!ethers.utils.isHexString(pk_x_hex) || pk_x_hex.length !== 66 || // "0x" + 32-byte coordinate
//             !ethers.utils.isHexString(pk_y_hex) || pk_y_hex.length !== 66) {
//             throw new Error(`Invalid public key coordinate format or length in ring at index ${i}. Each coordinate must be a 0x-prefixed 32-byte hex string.`);
//         }
//         const pk_x_coord = pk_x_hex.slice(2); // remove "0x"
//         const pk_y_coord = pk_y_hex.slice(2); // remove "0x"
        
//         const pk_i_uncompressed_hex_str = `04${pk_x_coord}${pk_y_coord}`; // Uncompressed public key format (without "0x")
//         try {
//             Pk_points.push(secp256k1.keyFromPublic(pk_i_uncompressed_hex_str, 'hex').getPublic());
//         } catch (e) {
//             throw new Error(`Invalid public key in ring at index ${i} (pk: ${pk_i_uncompressed_hex_str}): ${e.message}`);
//         }

//         // b. Parse z_i from z (concatenated compressed public key hex strings without "0x")
//         const z_i_hex_compressed_no_prefix = z.substring(i * 66, (i + 1) * 66);
//         if (!/^[0-9a-fA-F]{66}$/.test(z_i_hex_compressed_no_prefix)) { // Should be 33 bytes hex
//             throw new Error(`Invalid z_i hex format in z string at segment ${i}. Expected 66 hex characters.`);
//         }
//         try {
//             // secp256k1.keyFromPublic expects hex string without "0x" if it's just coordinates or compressed form
//             z_points.push(secp256k1.keyFromPublic(z_i_hex_compressed_no_prefix, 'hex').getPublic());
//         } catch (e) {
//             throw new Error(`Invalid z_i point (z_i_hex: ${z_i_hex_compressed_no_prefix}) at index ${i}: ${e.message}`);
//         }
//     }

//     // --- 4. Perform core verification for each ring member ---
//     // Check: z_i == G * r_i + Pk_i * c_i  AND  c_i == H(message)
//     for (let i = 0; i < n; i++) {
//         const c_i_from_sig = BigInt(c[i]); // c[i] is "0x..." hex string
//         const r_i_from_sig = BigInt(r[i]); // r[i] is "0x..." hex string

//         // Check 4a: c_i from signature must match H(message)
//         if (c_i_from_sig !== expected_c_val) {
//             throw new Error(`Verification failed: c_i mismatch at index ${i}. Expected ${expected_c_val.toString(16)}, got ${c_i_from_sig.toString(16)}`);
//         }

//         // Check 4b: z_i == G * r_i + Pk_i * c_i
//         const Pk_i_point = Pk_points[i];
//         const z_i_point = z_points[i];

//         let G_mul_ri;
//         try {
//             G_mul_ri = secp256k1.g.mul(r_i_from_sig);
//         } catch (e) {
//             throw new Error(`Error computing G*r[${i}] (r_i=${r[i]}): ${e.message}`);
//         }
        
//         let Pki_mul_ci;
//         try {
//             Pki_mul_ci = Pk_i_point.mul(c_i_from_sig);
//         } catch (e) {
//             throw new Error(`Error computing Pk[${i}]*c[${i}] (c_i=${c[i]}): ${e.message}`);
//         }

//         const lhs_point = G_mul_ri.add(Pki_mul_ci); // Elliptic curve point addition

//         if (!lhs_point.eq(z_i_point)) { // Elliptic curve point equality check
//             throw new Error(`Signature verification failed at index ${i}: z_i does not match G*r_i + Pk_i*c_i`);
//         }
//     }

//     // --- 5. Recompute and verify commitment ---
//     // The commitment in the signer was formed using `zEncoded`, which is an array of "0x"-prefixed compressed keys.
//     const z_hex_array_for_commitment = [];
//     for (let k = 0; k < n; k++) {
//       // z is concatenated hex without "0x", so we extract and prepend "0x"
//       z_hex_array_for_commitment.push("0x" + z.substring(k * 66, (k + 1) * 66));
//     }

//     const concatenated_c = ethers.utils.concat(c); // c array already contains "0x..." hex strings
//     const concatenated_r = ethers.utils.concat(r); // r array already contains "0x..." hex strings
//     const concatenated_z = ethers.utils.concat(z_hex_array_for_commitment);

//     const commitment_recomputed = ethers.utils.keccak256(
//       ethers.utils.concat([
//         concatenated_c,
//         concatenated_r,
//         concatenated_z,
//         y_0,          // y_0 from input is already "0x..." hex string
//         initKeyImage  // initKeyImage from input is already "0x..." hex string
//       ])
//     );

//     if (commitment_recomputed !== commitment) {
//       throw new Error(`Commitment mismatch. Recomputed: ${commitment_recomputed}, Given: ${commitment}`);
//     }

//     // If all checks pass
//     res.json({ verified: true, message: 'Signature verified successfully.' });

//   } catch (error) {
//     console.error('Signature verification error:', error.message, error.stack);
//     res.status(400).json({ verified: false, error: error.message });
//   }
// });



module.exports = router;