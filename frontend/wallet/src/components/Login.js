import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import Button from './Button';
import '../css/Login.css'
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 处理登录逻辑，例如发送请求到服务器进行身份验证
        console.log('Logging in with:', email, password);
        try{
            const response = await axios.post('/user/sign-in', { email, password });

            // 登录成功后，可以跳转到其他页面，例如首页
            if(response.data.success){
                setMessage('登录成功')
                localStorage.setItem('token', response.data.token);
                navigate('/home');
            }else{
                setMessage('登录失败:'+response.data.message)
            }
        }catch(error){
            console.error(error);
            setMessage('登录失败: 服务器错误');
        }
        
        
    };

    return (
        <div className='container'>
            <div className='container-inner'>
            <h2>Login</h2>
            <form >
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button onClick={handleSubmit} className='login-button'>
                    Login
                </Button>
            </form>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div> 
        </div>
    );
}

export default Login;