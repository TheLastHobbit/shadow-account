import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import Button from './Button';
import '../css/Login.css'
import {Input} from 'antd';


function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // 处理登录逻辑，例如发送请求到服务器进行身份验证
        console.log('Logging in with:', email, password);
        // 登录成功后，可以跳转到其他页面，例如首页
        if(email === '111' && password === '111'){
            navigate('/home');
        }else{
            alert('Invalid username or password')
        }
    };

    return (
        <div className='container'>
            <div className='container-inner'>
            <h2>Login</h2>
            <form>
                <div className='container-email'>
                <label>Email:</label>
                    <Input 
                        placeholder='Enter your email'
                        autoFocus/*光标自动定位到输入框 */
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className='container-password'>
                    <label>Password:</label>
                    <Input 
                        placeholder='Enter your password'
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className='container-button'>
                <Button onClick={handleSubmit} className='login-button'>
                    Login
                </Button>
                </div>
            </form>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div> 
        </div>
    );
}

export default Login;