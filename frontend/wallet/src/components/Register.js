import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { createAccount,getCommitment, createWallet,getSalt,getWalletAddress} from '../util/wallet.js';
import axios from 'axios';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
     console.log("handleSubmit");
     const wallet = createWallet();
     console.log("wallet:",(await wallet).address);
     const salt = getSalt(email);
     const commitment = getCommitment(email);
     console.log("salt:",salt);
     console.log("commitment:",commitment);
     const walletAddress = getWalletAddress((await wallet).address,salt,commitment);
     console.log("walletAddress:",walletAddress);
 
    e.preventDefault();
    // 处理注册逻辑，例如发送请求到服务器进行用户创建
    console.log('Registering with:', email, password);
    try{
      const response = await axios.post('/user/sign-up', { email, password });
      setMessage(response.data.message);
    }catch(error){
      console.error(error);
      setMessage('Registration failed');
    }
   
    // 重定向到登录页面
    // window.location.href = '/login';
  };

  return (
    <div className='container'>
      <div className='container-inner'>
        <h2>Register</h2>
        <form>
          <div className='container-email'>
            <label>Email:</label>
            <Input 
              addonBefore="Email"
              placeholder='Enter your email'
              autoFocus/*光标自动定位到输入框 */
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className='container-password'>
            <label>Password:</label>
            <Input 
              addonBefore="Password"
              placeholder='Enter your password'
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className='container-button'>
            <Button onClick={handleSubmit} className='login-button'>
              Login
            </Button>
          </div>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Register;
