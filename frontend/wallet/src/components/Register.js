import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 处理注册逻辑，例如发送请求到服务器进行用户创建
    console.log('Registering with:', email, password);
  };

  return (
    <div className='container'>
      <div className='container-inner'>
      <h2>Register</h2>
      <form>
        <div className="email">
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="password">
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button onClick={handleSubmit} className='login-button'>
            Login
        </Button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Register;
