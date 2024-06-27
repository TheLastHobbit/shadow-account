import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import Button from './Button';
import '../css/Login.css'
import {Input} from 'antd';
import axios from 'axios';

function Login() {
    const [passport, setPassport] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 处理登录逻辑，例如发送请求到服务器进行身份验证
        console.log('Logging in with:', passport, password);
        try{
            const response = await axios.post('http://127.0.0.1:8000/user/sign-in', { passport, password });

            console.log(response.data);
            // 登录成功后，可以跳转到其他页面，例如首页
            if(response.data.code == 0){
                setMessage('登录成功')
                // localStorage.setItem('token', response.data.token);
                navigate('/home');
            }else{
                setMessage('登录失败:'+response.data.message)
                console.error(response.data);
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
            <form>
                <div className='container-email'>
                <label>Email:</label>
                    <Input 
                        placeholder='Enter your email'
                        autoFocus/*光标自动定位到输入框 */
                        type="email" value={passport} onChange={(e) => setPassport(e.target.value)} />
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
            {message && <p>{message}</p>}
            <p>Forget password?<Link to='/reset'>Reset</Link></p>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div> 
        </div>
    );
}

export default Login;