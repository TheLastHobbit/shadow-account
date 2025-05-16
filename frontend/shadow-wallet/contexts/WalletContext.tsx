'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import storageUtils from '../lib/utils/storageUtils';
import memoryUtil from '../lib/utils/memoryUtil';

interface WalletContextType {
  provider: ethers.providers.JsonRpcProvider | null;
  setProvider: (provider: ethers.providers.JsonRpcProvider | null) => void;
  wallet: ethers.Wallet | null;
  setWallet: (wallet: ethers.Wallet | null) => void;
  walletPublicKey: string;
  setwalletPublicKey: (publicKey: string) => void;
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  shadowWalletAddress: string;
  setShadowWalletAddress: (address: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  ringMembers: string[];
  setRingMembers: (members: string[]) => void;
  balance: string;
  setBalance: (balance: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [walletPublicKey, setwalletPublicKey] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [shadowWalletAddress, setShadowWalletAddress] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [ringMembers, setRingMembers] = useState<string[]>([]);
  const [balance, setBalance] = useState('0.0');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 初始化提供者
  useEffect(() => {
    const init = async () => {
      try {
        const rpcUrl = 'https://sepolia.infura.io/v3/dbe77fbac5b8494e8f03b1099638abfd';
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        setProvider(provider);
        const user = storageUtils.getUser();
        console.log('もの WalletProvider: user =', user);
        console.log('もの Restored walletPublicKey:', user.walletPublickey);
        if (user && user.passport) {
          setUserEmail(user.passport);
          setWalletAddress(user.walletAddress?.[0] || '');
          setIsLoggedIn(true);
          if (user.wallet && user.wallet.publicKey) {
            // 验证公钥格式（66字符，带 0x 前缀）
            if (
              ethers.utils.isHexString(user.wallet.publicKey) &&
              user.wallet.publicKey.length === 66 &&
              user.wallet.publicKey.match(/^0x0[2-3]/)
            ) {
              // 恢复 ethers.Wallet
              const restoredWallet = new ethers.Wallet(user.wallet.privateKey, provider);
              if (restoredWallet.address.toLowerCase() === user.wallet.address.toLowerCase()) {
                setWallet(restoredWallet);
                setwalletPublicKey(user.wallet.publicKey); // 存储66字符公钥
              } else {
                console.warn('もの 恢复的钱包地址不匹配:', restoredWallet.address, user.wallet.address);
              }
            } else {
              console.warn('もの 恢复的公钥格式无效:', user.wallet.publicKey);
            }
          }
        }
      } catch (error) {
        console.error('もの WalletContext initialization error:', error);
      }
    };
    init();
  }, []);

  const value = {
    provider,
    setProvider,
    wallet,
    setWallet,
    walletPublicKey,
    setwalletPublicKey,
    walletAddress,
    setWalletAddress,
    shadowWalletAddress,
    setShadowWalletAddress,
    userEmail,
    setUserEmail,
    ringMembers,
    setRingMembers,
    balance,
    setBalance,
    isLoggedIn,
    setIsLoggedIn,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('もの useWallet must be used within a WalletProvider');
  }
  return context;
}