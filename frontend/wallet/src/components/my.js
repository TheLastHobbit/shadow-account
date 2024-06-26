import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import { Avatar, List, Skeleton, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import storage from '../util/storageUtils.js';
import Balance from './Balance';
import axios from 'axios';

function My(){
    const count = 3;
    // 获取本地存储中的用户信息
    const user = JSON.parse(localStorage.getItem('user_key'));
    const NickName = user.nickname;
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState("");
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
      const fetchEmails = async () => {
        try{
          let email = Array.isArray(user.guardian) ? user.guardian : [user.guardian];
          console.log(email);
          
          setEmails(email);
        }catch(error){
          console.log(error);
        }
      };
      fetchEmails();
    }, []);

    const handleAddEmail = async (e) => {
        e.preventDefault();
        try{
          setEmails([...emails, newEmail]);
          setNewEmail("");
          user.guardian = [...emails, newEmail];
          storage.saveUser(user);
          console.log(user.guardian);
        }catch(error){
          console.log(error);
        }
    };
    

    return(
        <div>
            <div>
                <Avatar size={64} icon={<UserOutlined />} />
                <h2>{NickName}</h2>
            </div>
            
            <div>
            <Button onClick={() => setShowForm(true)}>Add your Guardian mailbox</Button>
            
            {showForm && (
              <div style={{marginTop: 12}}>
                <Input 
                  type="email" 
                  placeholder='Enter the email'
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button onClick={handleAddEmail}>Add</Button>
              </div>
            )}
            </div>
            <p3>Your Guardian emials</p3>
            
            <ul>
              {emails.map((email,index) => (
                <li key={index}>{email}</li>
              ))}
            </ul>
            
            <BottomBar></BottomBar>

        </div>

    

    );
}

export default My;