import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

function Start() {
    const navigate = useNavigate();
    const handleSignIn = () => {
        navigate('/login');
    };

    const handleSignUp = () => {
        navigate('/register');
    };

    return(
        <div>
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