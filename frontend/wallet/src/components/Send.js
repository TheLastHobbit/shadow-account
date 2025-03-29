import React, { useState, useEffect } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import Button from './Button';
import { message } from 'antd';
import axios from 'axios';

function Send() {
    const [address, setAddress] = useState('');
    const navigate = useNavigate();

    const [taskCompleted, setTaskCompleted] = useState(false);
    const [timer, setTimer] = useState(360); // 6 minutes = 360 seconds
    const [intervalId, setIntervalId] = useState(null);

    useEffect(() => {
        if (taskCompleted) {
          clearInterval(intervalId);
          sendConfirmation();
          return;
        }
    
        const id = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer <= 0) {
              clearInterval(id);
              message.error('Task not completed in time');
              return 0;
            }
            return prevTimer - 1;
          });
        }, 1000);
    
        setIntervalId(id);
    
        return () => clearInterval(id);
      }, [taskCompleted]);

    const sendConfirmation = () => {
        // Your confirmation logic here, e.g., send an API request
        message.success('Task completed and confirmation sent');
    };

    const handleSend = async () => {
        // try {
        //     const response = await axios.post('http://127.0.0.1:8000/user/sign-in', {
        //         address: address,
        //     });
        //     console.log(response.data);
        // } catch (error) {
        //     console.error(error);
        // }
    }

    const handleFinish = async () => {
        setTaskCompleted(true);
        navigate('/reset');
    }
    return(
        <div className='send'>
            <Button
            className='send-btn'
            onClick={handleSend}
            >Send</Button>
            <p>Your new Address is {address}</p>
            <p>Please follow the email prompts!</p>
            <div>Time Remaining: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</div>
            <p>If you have completed the task, please click the button below!</p>
            <Button onClick={handleFinish}>Finish</Button>
        </div>
    );
}

export default Send;