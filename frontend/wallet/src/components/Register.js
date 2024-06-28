import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { encodeCommitment,signUOP, getHash, createAccount, getCommitment, createWallet, getSalt, getWalletAddress, createPackedUserOperation } from '../util/wallet.js';
import axios from 'axios';
import {Input,Form} from 'antd';
import storage from '../util/storageUtils.js';
import memoryUser from '../util/memoryUtil.js';
import '../css/Login.css'
import { encrypt } from '../util/shamir.js';


function Register() {
  const [passport, setPassport] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  function encodeGas(verificationGasLimit, callGasLimit) {
    const verificationGasLimitBN = ethers.BigNumber.from(verificationGasLimit);
    const callGasLimitBN = ethers.BigNumber.from(callGasLimit);

    // 将 verificationGasLimit 左移 128 位并与 callGasLimit 进行按位或操作
    const accountGasLimits = verificationGasLimitBN.shl(128).or(callGasLimitBN);

    // 返回填充到32字节的十六进制字符串
    return ethers.utils.hexZeroPad(accountGasLimits.toHexString(), 32);
  }

  function toString(privateKeyObj){
    const privateKeyArray = Object.values(privateKeyObj);
    const privateKeyHex = privateKeyArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    console.log("privateKeyHex:", privateKeyHex);
    const privateKeyString = '0x' + privateKeyHex;
    console.log("privateKeyString:", privateKeyString);
    return privateKeyString;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // 处理注册逻辑，请求验证码
    console.log('Registering with:', passport, password);
    const response = await axios.post('http://127.0.0.1:8000/user/sign-up', { passport, password, password2, nickname });
    setMessage(response.data.message);
    console.log(response);
    console.log('success')
    
  
  };
  const handleConfirm = async (e) => {
    e.preventDefault();
    try{
      const wallet = await createWallet();
      console.log("wallet:", wallet.address);
      const encoder = new TextEncoder();
      const privateKey = encoder.encode(wallet.privateKey);
      const result = await encrypt(privateKey, 2, 3);
      const salt = await getSalt(passport);
      const uncodecommitment = await getCommitment(passport);
      const commitment = encodeCommitment(uncodecommitment[0]);
      // console.log("salt:", salt.toString());
      console.log("commitment2:", commitment);
      const walletAddress = await getWalletAddress(wallet.address, salt, commitment);
      console.log("walletAddress:", walletAddress);

      const initCode = await createAccount(wallet.address, salt, commitment);
      const _accountGasLimits = encodeGas(1000000, 2000000);
      const _gasFees = encodeGas(1000000, 2000000);

      const puo = await createPackedUserOperation(walletAddress, initCode, "", _accountGasLimits, 1000000, _gasFees, "", "0x");
      console.log("puo:", puo);

      const userOpHash = await getHash(puo);
      console.log("userOpHash:", userOpHash);

      const signature = await signUOP(wallet, userOpHash);
      console.log("signature:", signature);

      // 更新 puo 对象中的 signature
      const updatedPuo = { ...puo, signature };
      console.log("updatedPuo:", updatedPuo);
      const response = await axios.post('http://127.0.0.1:8000/user/register', { passport, password, code });
      setMessage(response.data.message);
      const user = {
        passport: passport,
        nickname: nickname,
        wallet: {
          address: wallet.address,
          privateKey: toString(result[0]),
        },
        walletAddress: [walletAddress],
        guardian:[]
      };
      console.log(response);
      console.log('success')
      if(response.data.code == 0){
        console.log('注册成功,你的钱包地址为',walletAddress);
        memoryUser.user = user;
        console.log(wallet.privateKey);
        console.log(toString(result[0]));
        console.log(memoryUser.user);
        storage.saveUser(user);
        // window.location.href = '/login';
      }
      
    }catch (error) {
      console.error(error);
    } 
    
  };


  
  return (
    <div className='container'>
      <div className='container-inner'>
        <h2 className='Register'>Register</h2>
          <div className='container-email'>
            <Input 
              addonBefore='邮箱'
              type="email" value={passport} onChange={(e) => setPassport(e.target.value)} />
          </div>
          <div className='container-nickname'>
            <Input 
              addonBefore='昵称'
              type="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className='container-password'>
            <Input 
              addonBefore='密码'
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          </div>
          <div className='container-password2'>
            <Input 
              addonBefore='确认密码'
              type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
          </div>
          <div className='container-captcha'>
            <div className='captcha-input'>
            <Input 
            addonBefore='验证码'
            value={code} onChange={(e) => setCode(e.target.value)}/>
            </div>
            <div className='captcha-img'>
            <Button onClick={handleSubmit}>send</Button>
            </div>
          </div>
          <div className='login-button'>
          <Button onClick={handleConfirm} >
            Confirm
          </Button>
          </div>
        {message && <p>{message}</p>}
        <p className='login-link'>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
export default Register;