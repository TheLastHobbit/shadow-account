require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const ethers = require("ethers");
const router = express.Router();
const bcrypt = require('bcryptjs'); // 用于密码哈希

// 配置 Supabase 客户端
const supabaseUrl = "https://iokhaxmlbqraaionclks.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


router.post("/update-password", async (req, res) => {
  const { email, newPassword } = req.body;

  // 1. 输入验证
  if (!email || !newPassword) {
    return res.status(400).json({ message: "邮箱和新密码不能为空。" });
  }
  if (!email.endsWith("@qq.com")) { // 与你的系统保持一致
    return res.status(400).json({ message: "邮箱必须是 QQ 邮箱。" });
  }
  if (newPassword.length < 6) { // 与注册时的密码策略保持一致
    return res.status(400).json({ message: "新密码长度至少为6位。" });
  }

  try {
    // 2. 检查用户是否存在 (可选，但最好有)
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (selectError || !existingUser) {
      if (selectError && selectError.code !== 'PGRST116') {
         console.error("Supabase查询用户错误 (update-password):", selectError);
      }
      return res.status(404).json({ message: "用户不存在，无法更新密码。" });
    }

    // 3. 哈希新密码
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 4. 更新用户密码
    const { error: updateError } = await supabase
      .from("users")
      .update({ hashed_password: hashedNewPassword })
      .eq("email", email);

    if (updateError) {
      console.error("Supabase 更新密码错误:", updateError);
      return res.status(500).json({ message: `更新密码失败: ${updateError.message}` });
    }

    res.status(200).json({ message: "密码更新成功。" });

  } catch (error) {
    console.error("更新密码时服务器内部错误:", error);
    res.status(500).json({ message: "更新密码过程中发生服务器错误。" });
  }
});

router.post("/sign-up", async (req, res) => {
  const { Passport, Password, Password2, Nickname } = req.body; // Passport 就是 email

  // 1. 输入验证
  if (!Passport || !Password || !Password2 || !Nickname) {
    return res.status(400).json({ message: "通行证 (邮箱)、密码、确认密码和昵称均不能为空。" });
  }
  if (Password !== Password2) {
    return res.status(400).json({ message: "两次输入的密码不匹配。" });
  }
  // Passport 就是 email，进行 QQ 邮箱验证
  if (!Passport.endsWith("@qq.com")) {
    return res.status(400).json({ message: "通行证 (邮箱) 必须是 QQ 邮箱 (以 @qq.com 结尾)。" });
  }
  if (Password.length < 6) {
    return res.status(400).json({ message: "密码长度至少为6位。" });
  }

  const userEmail = Passport; // 使用更清晰的变量名

  try {
    // 2. 检查用户 (email) 是否已存在于 'users' 表中
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("email") // 查询 email 列
      .eq("email", userEmail) // 使用 email 进行匹配
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: 未找到行
        console.error("Supabase 查询用户错误:", selectError);
        return res.status(500).json({ message: `检查用户是否存在时出错: ${selectError.message}` });
    }

    if (existingUser) {
      return res.status(409).json({ message: "该邮箱已被注册。" });
    }

    // 3. 哈希密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);

    // 4. 将新用户保存到 Supabase 的 'users' 表
    // 'users' 表中, email 是主键
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ email: userEmail, hashed_password: hashedPassword, nickname: Nickname }])
      .select("email, nickname, created_at"); // 选择返回的字段

    if (insertError) {
      console.error("Supabase 插入用户错误:", insertError);
      if (insertError.code === '23505') {
        return res.status(409).json({ message: `用户注册失败: 邮箱已存在。` });
      }
      return res.status(500).json({ message: `用户注册失败: ${insertError.message}` });
    }

    res.status(201).json({ message: "用户注册成功。", user: newUser[0] });

  } catch (error) {
    console.error("用户注册时服务器内部错误:", error);
    res.status(500).json({ message: "注册过程中发生服务器错误。" });
  }
});

router.post("/sign-in", async (req, res) => {
  const { Passport, Password } = req.body; // Passport 就是 email

  if (!Passport || !Password) {
    return res.status(400).json({ message: "邮箱和密码均不能为空。" });
  }
  if (!Passport.endsWith("@qq.com")) {
    return res.status(400).json({ message: "请使用 QQ 邮箱地址。" });
  }

  const userEmail = Passport;

  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, nickname, hashed_password")
      .eq("email", userEmail)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return res.status(404).json({ message: "用户不存在或邮箱错误。" });
      }
      console.error("Supabase 查询用户错误:", userError);
      return res.status(500).json({ message: `查询用户时出错: ${userError.message}` });
    }

    if (!userData) {
      return res.status(404).json({ message: "用户不存在或邮箱错误。" });
    }

    const passwordIsValid = await bcrypt.compare(Password, userData.hashed_password);
    if (!passwordIsValid) {
      return res.status(401).json({ message: "密码错误。" });
    }

    let aaWalletAddress = null;
    let s1Share = null; // S1分片
    const { data: walletData, error: walletError } = await supabase
      .from("user_wallets")
      .select("wallet_address, share") // 'share' 是 S1 分片
      .eq("email", userEmail)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.warn(`获取用户 ${userEmail} 的钱包信息失败:`, walletError.message);
    } else if (walletData) {
      aaWalletAddress = walletData.wallet_address;
      s1Share = walletData.share; // 获取S1分片
    }

    if (!s1Share) {
      // 根据你的业务逻辑，如果S1分片是必须的，这里应该返回错误
      console.error(`用户 ${userEmail} 的S1分片未在 user_wallets 表中找到。`);
      return res.status(404).json({ message: "无法获取用户钱包恢复信息(S1)，请检查用户注册流程是否完整。" });
    }

    const userForClient = {
      passport: userData.email,
      nickname: userData.nickname,
      walletAddress: aaWalletAddress ? [aaWalletAddress] : [], // AA钱包地址数组
      s1Share: s1Share, // 直接返回S1分片 (hex string)
    };

    res.status(200).json({
      message: "登录成功。",
      user: userForClient,
    });

  } catch (error) {
    console.error("用户登录时服务器内部错误:", error);
    res.status(500).json({ message: "登录过程中发生服务器错误。" });
  }
});


// 保存普通钱包（S1 分片、邮箱、钱包地址到 Supabase 数据库）
router.post("/save-wallet", async (req, res) => {
  const { email, walletAddress, share } = req.body;

  if (!email || !walletAddress || !share) {
    return res.status(400).json({ message: "邮箱、钱包地址和分片不能为空" });
  }
  if (!email.endsWith("@qq.com")) {
    return res.status(400).json({ message: "必须使用 QQ 邮箱" });
  }
  if (!ethers.utils.isAddress(walletAddress)) {
    return res.status(400).json({ message: "无效的钱包地址" });
  }
  if (!/^[0-9a-fA-F]+$/.test(share)) {
    console.error("Invalid share format:", share);
    return res.status(400).json({ message: "无效的分片格式" });
  }

  console.log("S1 share:", share);

  try {
    const { data, error } = await supabase
      .from("user_wallets")
      .upsert({ email, wallet_address: walletAddress, share }, { onConflict: "email" })
      .select();
    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({ message: `保存失败: ${error.message}` });
    }
    res.status(200).json({ message: "普通钱包地址和分片保存成功", data: data[0] });
  } catch (error) {
    console.error("保存普通钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});



// 查询普通钱包（S1 分片和钱包地址从 Supabase 数据库）
router.get("/get-wallet/:email", async (req, res) => {
  const { email } = req.params;

  if (!email || !email.endsWith("@qq.com")) {
    return res.status(400).json({ message: "请输入有效的 QQ 邮箱" });
  }

  try {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("wallet_address, share")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "未找到对应的普通钱包地址或分片" });
    }
    res.status(200).json({
      message: "查询普通钱包成功",
      data: { wallet_address: data.wallet_address, share: data.share },
    });
  } catch (error) {
    console.error("查询普通钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 保存影子钱包（Supabase 数据库）
router.post("/save-shadow-wallet", async (req, res) => {
  const { email, walletAddress, ringMembers } = req.body;

  if (!email || !walletAddress || !ringMembers || !Array.isArray(ringMembers)) {
    return res.status(400).json({ message: "邮箱、钱包地址和环成员不能为空，且环成员必须是数组" });
  }
  if (!email.endsWith("@qq.com")) {
    return res.status(400).json({ message: "必须使用 QQ 邮箱" });
  }
  if (!ethers.utils.isAddress(walletAddress)) {
    return res.status(400).json({ message: "无效的钱包地址" });
  }
  if (ringMembers.some(member => !ethers.utils.isHexString(member))) {
    return res.status(400).json({ message: "无效的环成员格式" });
  }

  try {
    const { data, error } = await supabase
      .from("shadow_wallets")
      .upsert({ email, wallet_address: walletAddress, ring_members: ringMembers }, { onConflict: ["email", "wallet_address"] })
      .select();
    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({ message: `保存影子钱包失败: ${error.message}` });
    }
    res.status(200).json({ message: "影子钱包保存成功", data: data[0] });
  } catch (error) {
    console.error("保存影子钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 查询影子钱包（Supabase 数据库）
router.post("/get-shadow-wallets", async (req, res) => {
  const { walletAddress } = req.body;

  try {
    const { data, error } = await supabase
      .from("shadow_wallets")
      .select("wallet_address, ring_members")
      .eq("wallet_address", walletAddress);

    if (error) {
      console.error("Supabase 查询错误:", error);
      return res.status(500).json({ message: `查询影子钱包失败: ${error.message}` });
    }
    res.status(200).json({
      message: "查询影子钱包成功",
      wallets: data.map(item => ({ address: item.wallet_address, ringMembers: item.ring_members })),
    });
  } catch (error) {
    console.error("查询影子钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.post("/get-shadow-wallets-by-email", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.endsWith("@qq.com")) {
    return res.status(400).json({ message: "请输入有效的 QQ 邮箱" });
  }

  try {
    const { data, error } = await supabase
      .from("shadow_wallets")
      .select("wallet_address, ring_members")
      .eq("email", email);

    if (error) {
      console.error("Supabase 查询错误:", error);
      return res.status(500).json({ message: `查询影子钱包失败: ${error.message}` });
    }
    res.status(200).json({
      message: "查询影子钱包成功",
      wallets: data.map(item => ({ address: item.wallet_address, ringMembers: item.ring_members })),
    });
  } catch (error) {
    console.error("查询影子钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 保存 S2 分片到 Supabase Storage
router.post("/save-cloud-share", async (req, res) => {
  const { email, share, key } = req.body;

  if (!email || !share || !key) {
    return res.status(400).json({ message: "邮箱、分片和密钥不能为空" });
  }
  if (!email.endsWith("@qq.com")) {
    return res.status(400).json({ message: "必须使用 QQ 邮箱" });
  }
  if (!/^[0-9a-fA-F]+$/.test(share)) {
    console.error("Invalid share format:", share);
    return res.status(400).json({ message: "无效的分片格式" });
  }
  if (!ethers.utils.isHexString(key)) {
    return res.status(400).json({ message: "无效的密钥格式" });
  }

  console.log("S2 share:", share, "length:", share.length);

  try {
    const { error } = await supabase.storage
      .from("shares")
      .upload(`shares/${key}`, share, {
        contentType: "text/plain",
        upsert: true,
        metadata: { email },
      });
    if (error) {
      console.error("Supabase Storage upload error:", error);
      return res.status(500).json({ message: `保存云端分片失败: ${error.message}` });
    }
    console.log(`S2 分片已保存到 Supabase Storage: shares/${key}`);
    res.status(200).json({ message: "云端分片保存成功" });
  } catch (error) {
    console.error("保存云端分片失败:", error);
    res.status(500).json({ message: "保存云端分片失败", error: error.message });
  }
});

// 获取 S2 分片从 Supabase Storage
router.post("/get-cloud-share", async (req, res) => {
  const { email, key } = req.body;

  if (!email || !key) {
    return res.status(400).json({ message: "邮箱和密钥不能为空" });
  }
  if (!email.endsWith("@qq.com")) {
    return res.status(400).json({ message: "必须使用 QQ 邮箱" });
  }
  if (!ethers.utils.isHexString(key)) {
    return res.status(400).json({ message: "无效的密钥格式" });
  }

  try {
    const { data, error } = await supabase.storage
      .from("shares")
      .download(`shares/${key}`);
    if (error) {
      console.error("Supabase Storage download error:", error);
      return res.status(404).json({ message: `未找到云端分片: ${error.message}` });
    }
    const share = await data.text();
    console.log(`S2 分片已从 Supabase Storage 获取: shares/${key}`);
    res.status(200).json({ message: "获取云端分片成功", share });
  } catch (error) {
    console.error("获取云端分片失败:", error);
    res.status(500).json({ message: "获取云端分片失败", error: error.message });
  }
});

module.exports = router;