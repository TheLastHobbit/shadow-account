require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const ethers = require("ethers");
const router = express.Router();

// 配置 Supabase 客户端
const supabaseUrl = "https://iokhaxmlbqraaionclks.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 保存普通钱包（邮箱、钱包地址、分片）
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
    return res.status(400).json({ message: "无效的分片格式" });
  }

  try {
    const { data, error } = await supabase
      .from("user_wallets")
      .upsert(
        { email, wallet_address: walletAddress, share },
        { onConflict: "email" }
      )
      .select();
    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({ message: `保存失败: ${error.message}` });
    }

    res.status(200).json({
      message: "普通钱包地址和分片保存成功",
      data: data[0],
    });
  } catch (error) {
    console.error("保存普通钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 查询普通钱包地址和分片
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

// 保存影子钱包（邮箱、钱包地址、环成员）
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
      .upsert(
        { email, wallet_address: walletAddress, ring_members: ringMembers },
        { onConflict: ["email", "wallet_address"] }
      )
      .select();
    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({ message: `保存影子钱包失败: ${error.message}` });
    }

    res.status(200).json({
      message: "影子钱包保存成功",
      data: data[0],
    });
  } catch (error) {
    console.error("保存影子钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 查询影子钱包
router.post("/get-shadow-wallets", async (req, res) => {
  const { walletAddress } = req.body;

  // if (!email || !email.endsWith("@qq.com")) {
  //   return res.status(400).json({ message: "请输入有效的 QQ 邮箱" });
  // }

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
      wallets: data.map(item => ({
        address: item.wallet_address,
        ringMembers: item.ring_members,
      })),
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
      wallets: data.map(item => ({
        address: item.wallet_address,
        ringMembers: item.ring_members,
      })),
    });
  } catch (error) {
    console.error("查询影子钱包失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

module.exports = router;