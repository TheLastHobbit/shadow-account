import React, {useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import Balance from './Balance';
import '../css/Home.css';
import { Input, Select } from 'antd';
import { signUOP,sendETHCalldata, getHash,createPackedUserOperation } from '../util/wallet.js';
import { ethers } from 'ethers';


function Home(){
    const [showInput, setShowInput] = useState(false);
    const [inputAccountNumber, setInputAccountNumber] = useState('');
    const [selectedValue, setSelectedValue] = useState('ETH');
    const options = ['ETH','BTC','USDT']
    const [coin, setCoin] = useState('');
    const [inputAmount, setInputAmount] = useState('');
    const [myAddress,setMyAddress] = useState('');

    //回调函数，用于接收myAddress
    const getMyAddress = (address) => {
        setMyAddress(address);
    }
    

    const handleSend = () => {
        // 点击按钮显示输入框
        setShowInput(true);
    }

    function encodeGas(verificationGasLimit, callGasLimit) {
        const verificationGasLimitBN = ethers.BigNumber.from(verificationGasLimit);
        const callGasLimitBN = ethers.BigNumber.from(callGasLimit);
    
        // 将 verificationGasLimit 左移 128 位并与 callGasLimit 进行按位或操作
        const accountGasLimits = verificationGasLimitBN.shl(128).or(callGasLimitBN);
    
        // 返回填充到32字节的十六进制字符串
        return ethers.utils.hexZeroPad(accountGasLimits.toHexString(), 32);
    }

    const handleAccountChange = (event) => {
        setInputAccountNumber(event.target.value);
    }
    const handleSelectChange = (event) => {
        console.log('Event:',event);
        setSelectedValue(event);
        setCoin(event);
    }
      //回调函数，用于接收myAddress
    // const getMyAddress = (address) => {
    //     setMyAddress(address);
    // }
    const handleAmountChange = (event) => {
        setInputAmount(event.target.value);
    }
    const handleConfirm = async () => {
        const user = JSON.parse(localStorage.getItem('user_key'));
        // 处理确认按钮点击事件
        console.log('my',myAddress);
        console.log('Send', coin, 'to:', inputAccountNumber);
        console.log('Amount:', inputAmount);
        // 调用发送函数
        const calldata = sendETHCalldata(myAddress,inputAccountNumber,inputAmount);
        const _accountGasLimits = encodeGas(1000000, 2000000);
        const _gasFees = encodeGas(1000000, 2000000);
        const puo = await createPackedUserOperation(myAddress, "", calldata, _accountGasLimits, 100000000, _gasFees, "", "0x");

        const userOpHash = await getHash(puo);
        console.log("userOpHash:", userOpHash);

        const signature = await signUOP(user.wallet, userOpHash);
        console.log("signature:", signature);
        const updatedPuo = { ...puo, signature };


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
            <Balance onChildData={getMyAddress}></Balance>
                {/* <Balance onChildData={getMyAddress}></Balance> */}
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