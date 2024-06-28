import "../css/Balance.css"
import React, { useEffect, useState } from "react";
import { Select, message } from 'antd';
import { ethers } from 'ethers';
import Button from './Button';
import { getETHBalance } from '../util/wallet';
import storage from '../util/storageUtils.js';
import { encodeCommitment,signUOP, getHash, createAccount, getCommitment, createWallet, getSalt, getWalletAddress, createPackedUserOperation } from '../util/wallet.js';

const Balance = ({onChildData}) => {
    const rpcUrl = 'https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd';
    // 获取本地存储中的用户信息
    const user = JSON.parse(localStorage.getItem('user_key'));
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl); // 确保提供正确的provider
    const wallet = new ethers.Wallet(user.wallet.privateKey, provider);
    const [balance, setBalance] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const addresses = Array.isArray(user.walletAddress) ? user.walletAddress : [user.walletAddress];

    function encodeGas(verificationGasLimit, callGasLimit) {
        const verificationGasLimitBN = ethers.BigNumber.from(verificationGasLimit);
        const callGasLimitBN = ethers.BigNumber.from(callGasLimit);
    
        // 将 verificationGasLimit 左移 128 位并与 callGasLimit 进行按位或操作
        const accountGasLimits = verificationGasLimitBN.shl(128).or(callGasLimitBN);
    
        // 返回填充到32字节的十六进制字符串
        return ethers.utils.hexZeroPad(accountGasLimits.toHexString(), 32);
      }

    useEffect(() => {

        if (user && addresses.length > 0) {
            
            setSelectedAddress(addresses[0]);
      
            const fetchBalance = async (address) => {
              try {
                const balance = await getETHBalance(address);
                setBalance(balance);
                console.log('Balance:', balance);
                console.log('User:', user);
              } catch (error) {
                console.error('Failed to fetch balance:', error);
              }
            };
      
            fetchBalance(addresses[0]);
          }
    }, [user, addresses]);

    useEffect(()=>{
        const myAddress = selectedAddress;
        onChildData(myAddress);
    },[onChildData])

    useEffect(() => {
        const fetchBalance = async (address) => {
            try {
                const balance = await getETHBalance(address);
                setBalance(balance);
                console.log('Balance:', balance);
                console.log('User:', user);
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };

        if (selectedAddress) {
            fetchBalance(selectedAddress);
        }
    }, [selectedAddress]);

    if (!user) {
        return <div>fail to find user</div>;
    }

    const handleSelectChange = (event) => {
        //address change
        setSelectedAddress(event);
    }

    const handleAddNewAccount = async() => {
        //add new account
        try{
            
            const passport = user.passport;
            console.log("wallet:", wallet.address);
            console.log("passport:", passport);

            const salt = await getSalt(passport);
            const uncodecommitment = await getCommitment(passport);
            const commitment = encodeCommitment(uncodecommitment[0]);
            // console.log("salt:", salt.toString());
            console.log("commitment2:", commitment);

            const walletAddress = await getWalletAddress(wallet.address, salt, commitment);
            console.log("walletAddress:", walletAddress);

            const initCode = await createAccount(wallet.address, salt, commitment);
            const _accountGasLimits = encodeGas(1000000, 2000000);
            const _gasFees = encodeGas(1000000, 2000000);

            const puo = await createPackedUserOperation(walletAddress, initCode, "", _accountGasLimits, 1000000, _gasFees, "", "0x");
            console.log("puo:", puo);

            const userOpHash = await getHash(puo);
            console.log("userOpHash:", userOpHash);

            const signature = await signUOP(wallet, userOpHash);
            console.log("signature:", signature);

            // 更新 puo 对象中的 signature
            const updatedPuo = { ...puo, signature };
            console.log("updatedPuo:", updatedPuo);

            user.walletAddress.push(walletAddress);
            storage.saveUser(user);
            console.log("新的账户已添加", walletAddress);
        }catch (error) {
            console.error("Failed to add new account:", error);
        }
        
    }

    return(
        <div className="card">
            <div className='select'>
                <Select 
                    className='select_chain'
                    value={selectedAddress} 
                    onChange={handleSelectChange}>
                        {addresses.map((address, index) => (
                            <option key={index} value={address}>{address}</option>
                        ))}
                </Select>
                <Button className='btn_select' onClick={handleAddNewAccount}>Add new account</Button>
            </div>
            <div class="card-header">Your total balance</div>
            <div class="card-body">
                <h2 class="card-title">{balance}</h2>
            </div>
        </div>
    )
}

export default Balance;