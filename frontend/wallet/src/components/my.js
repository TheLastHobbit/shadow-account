import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import { Avatar, List, Skeleton, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Balance from './Balance';
import axios from 'axios';

function My(){
    const count = 3;
    // const fakeDataUrl = `http://127.0.0.1:8000/user/profile`;
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [list, setList] = useState([]);

    useEffect(() => {
      fetchEmails();
    }, []);

    const handleAddEmail = async (e) => {
        // if(newEmail){
        //   setEmails([...emails, newEmail]);
        //   setNewEmail("");
        //   setShowForm(false);
        //   console.log(newEmail);
        //   console.log(emails);
        // }
        e.preventDefault();
        try{
          const response = await axios.post("http://127.0.0.1:8000/user/profile", {
            email: newEmail
          });
          setEmails([...emails, response.data.email]);
          setNewEmail("");
        }catch(error){
          console.log(error);
        }
    };
    
    const fetchEmails = async () => {
      try{
        const response = await axios.get("http://127.0.0.1:8000/user/profile");
        setEmails(response.data.emails);
      }catch(error){
        console.log(error);
      }
    }
    // const onLoadMore = () => {
    //   setLoading(true);
    //   setList(
    //     data.concat(      //data是请求的数据
    //       [...new Array(count)].map(() => ({   //请求一个新的数组
    //         loading: true,
    //         name: {},
    //         picture: {},
    //       })),
    //     ),
    //   );
      // fetch(fakeDataUrl)
      //   .then((res) => res.json())
      //   .then((res) => {
      //     const newData = data.concat(res.results);
      //     setData(newData);
      //     setList(newData);
      //     setLoading(false);
      //     // Resetting window's offsetTop so as to display react-virtualized demo underfloor.
      //     // In real scene, you can using public method of react-virtualized:
      //     // https://stackoverflow.com/questions/46700726/how-to-use-public-method-updateposition-of-react-virtualized
      //     window.dispatchEvent(new Event('resize'));
      //   });
    // };
    // const loadMore =
    //     !initLoading && !loading ? (
    //     <div
    //         style={{
    //         textAlign: 'center',
    //         marginTop: 12,
    //         height: 32,
    //         lineHeight: '32px',
    //         }}
    //     >
    //         <Button onClick={onLoadMore}>loading more</Button>
    //     </div>
    //     ) : null;

    return(
        <div>
            <div>
                <Avatar size={64} icon={<UserOutlined />} />
                <h2>Sanji</h2>
            </div>
            
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
            <p3>Your Guardian emials</p3>
            
            <ul>
              {emails.map((email) => (
                <li key={email.id}>{email.address}</li>
              ))}
            </ul>
            
            <BottomBar></BottomBar>

        </div>

    

    );
}

export default My;