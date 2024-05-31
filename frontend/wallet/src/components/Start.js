import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import Login from './Login';
import Balance from './Balance';

function Start() {
    const navigate = useNavigate();
    const handleSignIn = () => {
        navigate('/login');
    };

    const handleSignUp = () => {
        navigate('/register');
    };

    return(
        <div className='start'>
            <h1 className='welcome'>Welcome Back</h1>
            <Button onClick={handleSignIn} className='sign-in'>
                Sign In
            </Button>
            <Button onClick={handleSignUp} className='sign-up'>
                Sign Up
            </Button>
        </div>

    )
}

export default Start;