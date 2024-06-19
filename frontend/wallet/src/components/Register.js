import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { signUOP, getHash, createAccount, getCommitment, createWallet, getSalt, getWalletAddress, createPackedUserOperation } from '../util/wallet.js';
import axios from 'axios';


function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  function encodeGas(verificationGasLimit, callGasLimit) {
    const verificationGasLimitBN = ethers.BigNumber.from(verificationGasLimit);
    const callGasLimitBN = ethers.BigNumber.from(callGasLimit);

    // 将 verificationGasLimit 左移 128 位并与 callGasLimit 进行按位或操作
    const accountGasLimits = verificationGasLimitBN.shl(128).or(callGasLimitBN);

    // 返回填充到32字节的十六进制字符串
    return ethers.utils.hexZeroPad(accountGasLimits.toHexString(), 32);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 处理注册逻辑，例如发送请求到服务器进行用户创建
    console.log('Registering with:', email, password);
    try{
      const response = await axios.post('http://127.0.0.1:8000/user/sign-up', { email, password });
      setMessage(response.data.message);
      console.log('success')
      window.location.href = '/login';
    }catch(error){
    console.log("handleSubmit");

    try {
      const wallet = await createWallet();
      console.log("wallet:", wallet.address);
      const salt = await getSalt(email);
      const commitment = await getCommitment(email);
      console.log("salt:", salt.toString());
      console.log("commitment:", commitment);
      const walletAddress = await getWalletAddress(wallet.address, salt, commitment);
      console.log("walletAddress:", walletAddress);

      const initCode = await createAccount(wallet.address, salt, commitment);
      const _accountGasLimits = encodeGas(100000, 200000);
      const _gasFees = encodeGas(100000, 200000);

      const puo = await createPackedUserOperation(walletAddress, initCode, "", _accountGasLimits, 1000000, _gasFees, "", "0x");
      console.log("puo:", puo);

      const userOpHash = await getHash(puo);
      console.log("userOpHash:", userOpHash);

      const signature = await signUOP(wallet, userOpHash);
      console.log("signature:", signature);

      // 更新 puo 对象中的 signature
      const updatedPuo = { ...puo, signature };
      console.log("updatedPuo:", updatedPuo);


      // 处理注册逻辑，例如发送请求到服务器进行用户创建
      console.log('Registering with:', email, password);
      const response = await axios.post('http://127.0.0.1:8000/user/sign-up', { email, password });
      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setMessage('Registration failed'+error);
    }

    // 重定向到登录页面
    
    // window.location.href = '/login';
  };

  return (
    <div className='container'>
      <div className='container-inner'>
        <h2>Register</h2>
        <form>
          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className='login-button'>
            Confirm
          </Button>
        </form>
        {message && <p>{message}</p>}
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
}

export default Register;
