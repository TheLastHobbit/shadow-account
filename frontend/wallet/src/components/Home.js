import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import Balance from './Balance';
import '../css/Home.css';

function Home(){
    const [email, setEmail] = useState('');
    const handleAddEmail = () => {
        // Add email to state
        setEmail('');
    }

    return(
        <div className='home-container'>
            <div className='balance'>
                <Balance></Balance>
            </div>
            <div>
                <Button onClick={handleAddEmail} className='add-email'>
                    Set your Guardian mailbox
                </Button>
            </div>
            <BottomBar></BottomBar>
        </div>

    

    );
}

export default Home;