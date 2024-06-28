import React,{ useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes, Switch, Navigate } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import BottomBar from "./components/BottomBar"
import Login from './components/Login';
import Reset from './components/Reset';
import Register from './components/Register';
import Start from './components/Start';
import Home from './components/Home';
import Warn from './components/Warn';
import My from './components/my'
import {
  getVersion060EntryPoint,
  toSmartContractAccount,
} from "@alchemy/aa-core";
import { http } from "viem";
import { sepolia } from "@alchemy/aa-core";
import memoryUser from './util/memoryUtil';


/*

*/

function App() {
  //如果用户已登录，则重定向到首页
  if (memoryUser.user && memoryUser.user.passport) {
    return <Navigate to="/home" />;
  }
  return (
    <div className="App">
      <Router>
        <div>
          <Routes>
            <Route path='/login' exact element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/reset' element={<Reset />} />
            <Route path='/home' element={<Home />} />
            <Route path='/warning' element={<Warn />} />
            <Route path='/my' element={<My />} />
            <Route path='/' element={<Start/>} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
