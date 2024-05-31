import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import Button from './Button';
import '../css/Login.css'

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
            <h2 className='head'>Login</h2>
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
                    Login
                </Button>
            </form>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
    );
}

export default Login;