import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import BottomBar from './BottomBar';
import { Avatar, List, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Balance from './Balance';
import '../css/My.css';

function My(){
    const count = 3;
    const fakeDataUrl = `https://randomuser.me/api/?results=${count}&inc=name,gender,email,nat,picture&noinfo`;
    const [email, setEmail] = useState("");
    const [initLoading, setInitLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [list, setList] = useState([]);
    const handleAddEmail = () => {
        setEmail(email + 1);
    }
    useEffect(() => {
      fetch(fakeDataUrl)  //fakeDataUrl请求数据
        .then((res) => res.json())  //返回json数据
        .then((res) => {
          setInitLoading(false);
          setData(res.results);
          setList(res.results);
        });
    }, []);
    const onLoadMore = () => {
      setLoading(true);
      setList(
        data.concat(      //data是请求的数据
          [...new Array(count)].map(() => ({   //请求一个新的数组
            loading: true,
            name: {},
            picture: {},
          })),
        ),
      );
      fetch(fakeDataUrl)
        .then((res) => res.json())
        .then((res) => {
          const newData = data.concat(res.results);
          setData(newData);
          setList(newData);
          setLoading(false);
          // Resetting window's offsetTop so as to display react-virtualized demo underfloor.
          // In real scene, you can using public method of react-virtualized:
          // https://stackoverflow.com/questions/46700726/how-to-use-public-method-updateposition-of-react-virtualized
          window.dispatchEvent(new Event('resize'));
        });
    };
    const loadMore =
        !initLoading && !loading ? (
        <div
            style={{
            textAlign: 'center',
            marginTop: 12,
            height: 32,
            lineHeight: '32px',
            }}
        >
            <Button onClick={onLoadMore}>loading more</Button>
        </div>
        ) : null;

    return(
        <div>
            <div>
                <Avatar size={64} icon={<UserOutlined />} />
                <h2>Sanji</h2>
            </div>
            <p3>Your Guardian emials</p3>
            <Button onClick={handleAddEmail}>Add your Guardian mailbox</Button>
            <div className='my-list'>
            <List
                className="demo-loadmore-list"
                loading={initLoading}
                itemLayout="horizontal"
                loadMore={loadMore}
                dataSource={list}
                renderItem={(item) => (   //每一个列表项的渲染方式
                    <List.Item
                        actions={[<a key="list-loadmore-edit">edit</a>]}
                    >
                    <Skeleton avatar title={false} loading={item.loading} active>
                        <List.Item.Meta
                            description={email}
                        />
                        <div>content</div>
                    </Skeleton>
                    </List.Item>
                )}
            />
            </div>
            
            <BottomBar></BottomBar>

        </div>

    

    );
}

export default My;