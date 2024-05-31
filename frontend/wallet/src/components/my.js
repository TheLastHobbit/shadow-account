import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import Balance from './Balance';

function my(){
    const navigate = useNavigate();

    return(
        <div>
            <Balance></Balance>
            <BottomBar></BottomBar>

        </div>

    

    );
}