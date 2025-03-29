import React, { useState } from 'react';
import Button from './Button';
import {Input} from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Reset(){
    // 获取本地存储中的用户信息
    const user = JSON.parse(localStorage.getItem('user_key'));
    const navigate = useNavigate();
    const passport = user.passport;
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [code, setCode] = useState('');
    const nickname = user.nickname;

    function toString(privateKeyObj){
        const privateKeyArray = Object.values(privateKeyObj);
        const privateKeyHex = privateKeyArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
        console.log("privateKeyHex:", privateKeyHex);
        const privateKeyString = '0x' + privateKeyHex;
        console.log("privateKeyString:", privateKeyString);
        return privateKeyString;
    }

    const handleSendCode = async(e) => {
        e.preventDefault();
        // 发送验证码
        const response = await axios.post('http://127.0.0.1:8000/user/reset-password', {passport, password, password2});
        console.log(response.data.message);
        
    }
    const handleReset = async(e) => {
        e.preventDefault();
        const response = await axios.post('http://127.0.0.1:8000/user/reset-register', {passport, password, code, nickname});
        if(response.data.code == 0){
            //to do slice privare key
            console.log(response.data.message);
            alert('Reset successfully!');
            navigate('/login');
        }
    }

    return(
        <div className='container'>
            <div>
            <h2>Reset</h2>
            <form>
                <div>
                    <label>Your new password:</label>
                    <Input 
                        placeholder='Enter your new password'
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <label>Your new password:</label>
                    <Input 
                        placeholder='Check your new password'
                        type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                    <Button onClick={handleSendCode}>
                        Send Code
                    </Button>
                </div>
                <div>
                    <label>Code:</label>
                    <Input 
                        placeholder='Enter your code'
                        type="text" value={code} onChange={(e) => setCode(e.target.value)} />
                    <Button onClick={handleReset}>
                        Reset
                    </Button>
                </div>
            </form>
            </div> 
        </div>
    )
}

export default Reset;