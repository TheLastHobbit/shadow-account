import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import Balance from './Balance';

function My(){

    return(
        <div>
            <Balance className="balance"></Balance>
            <BottomBar></BottomBar>

        </div>

    

    );
}