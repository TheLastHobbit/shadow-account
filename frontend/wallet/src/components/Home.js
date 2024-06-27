import React, {useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import Balance from './Balance';
import '../css/Home.css';
import { Input, Select } from 'antd';

function Home(){
    const [showInput, setShowInput] = useState(false);
    const [inputAccountNumber, setInputAccountNumber] = useState('');
    const [selectedValue, setSelectedValue] = useState('ETH');
    const options = ['ETH','BTC','USDT']
    const [coin, setCoin] = useState('');
    const [inputAmount, setInputAmount] = useState('');
    const handleSend = () => {
        // 点击按钮显示输入框
        setShowInput(true);
    }
    const handleAccountChange = (event) => {
        setInputAccountNumber(event.target.value);
    }
    const handleSelectChange = (event) => {
        console.log('Event:',event);
        setSelectedValue(event);
        setCoin(event);
    }
    const handleAmountChange = (event) => {
        setInputAmount(event.target.value);
    }
    const handleConfirm = () => {
        // 处理确认按钮点击事件
        console.log('Send', coin, 'to:', inputAccountNumber);
        console.log('Amount:', inputAmount);
        setShowInput(false);
        setInputAccountNumber('');
        setSelectedValue('');
        setInputAmount('');
    }
    const [currentTime] = useState(new Date());
    const getGreeting = () => {  
        const hour = currentTime.getHours();  
        if (hour < 11) {  
          return <h1 className='greeting'>Good morning!</h1>;
        } else if (hour >= 11 && hour < 18) {  
          return <h1 className='greeting'>Good afternoon!</h1>;  
        } else {  
          return <h1 className='greeting'>Good evening!</h1>;
        }  
      };  

    return(
        <div className='home-container'>

            <div>
                {getGreeting()}
            </div>
            <div className='balance'>
                <Balance></Balance>
            </div>
            <div className='send_to'>
                {showInput && (
                    <div>
                        <div className='input'>
                            <Input
                                type="text" 
                                placeholder='Enter the account number'
                                value={inputAccountNumber}
                                onChange={handleAccountChange}
                                />
                        </div>
                        <div className='select'>
                            <Select 
                                className='select_chain'
                                value={selectedValue} 
                                onChange={handleSelectChange}>
                                    {options.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                            </Select>
                        </div>
                        <div className='input'>
                            <Input 
                                type="text" 
                                placeholder='Enter the amount'
                                value={inputAmount}
                                onChange={handleAmountChange}
                                />
                        </div>
                        <div className='button'>
                            <Button onClick={handleConfirm}>Confirm</Button>
                        </div>
                    </div>
                )}
            </div>
            <div>
                { !showInput && (
                    <Button onClick={handleSend} className='send'>
                        Send
                    </Button>
                )}
            </div>
            
            <BottomBar></BottomBar>
        </div>

    

    );
}

export default Home;