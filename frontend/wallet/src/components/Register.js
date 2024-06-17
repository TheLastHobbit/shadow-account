import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { createAccount, createWallet } from '../util/wallet.js';
import axios from 'axios';


function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

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
      console.error(error);
      setMessage('Registration failed'+error);
    }
    // 调用钱包注册方法
    // const result = createWallet;
    // console.log(result);
    // 重定向到登录页面
    
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

export default Register;
