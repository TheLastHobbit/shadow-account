import React, { useCallback, useState ,useRef} from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { createAccount,getCommitment, createWallet,getSalt,getWalletAddress} from '../util/wallet.js';
import {Input,Form} from 'antd';
// import { createAccount, createWallet } from '../util/wallet.js';
import axios from 'axios';
import Captcha from 'react-captcha-code'

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [code,setCode] = useState('');
  const handleChange = useCallback((captcha) => {
    console.log("captcha",captcha);
    setCode(captcha);
  }, []);
  const captchaRef = useRef(null);
  const handleClick = () => {
    //刷新验证码
    captchaRef.current.refresh();
  };
  const onFinish = async(values) => {
    if(code===values.code){
      let res = await Request.post('/user/sign-up',values)
      localStorage.setItem('router',JSON.stringify(res.data.data))
      window.location.href = '/login'
    }else{
      window.alert("验证码错误，请重新输入！")
    }
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

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
            <label></label>
            <Form.Item 
              label="Email"
              placeholder='Enter your email'
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} >
            <Input/>
            </Form.Item>
          </div>
          <div className='container-password'>
            <label></label>
            <Form.Item
              label="Password"
              placeholder='Enter your password'
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} >
              <Input/>
            </Form.Item>
          </div>
          <Form.Item label="验证码" name="code" className='container-captcha'
            rules={[{ required: true, message: '请输入验证码' }]}>

            <Input/>
            </Form.Item>
            <Captcha ref={captchaRef} fontSize={24} charNum={4} onChange={handleChange} onClick={handleClick} />
            <Form.Item 
            wrapperCol={{
              offset:8,
              span:16
            }}>
              </Form.Item>
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
