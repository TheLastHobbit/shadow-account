import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BottomBar from './BottomBar';
import Button from './Button';

function Warn() {
    
    return (
        <div>
            <div className="warn">
                <h1>Warning</h1>
                <p>You are not allowed to access this page</p>
                <Link to="/"><Button>Go Back</Button></Link>
            </div>
            <BottomBar />
        </div>
    )
}

export default Warn;