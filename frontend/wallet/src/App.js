import React,{ useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes, Switch } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import BottomBar from "./components/BottomBar"
import Login from './components/Login';
import Register from './components/Register';
import Start from './components/Start';
import Balance from "./components/Balance"
import Button from './components/Button';
import {
  getVersion060EntryPoint,
  toSmartContractAccount,
} from "@alchemy/aa-core";
import { http } from "viem";
import { sepolia } from "@alchemy/aa-core";


/*

*/

function App() {
  
  return (
    <div className="App">
      <Router>
        <div>
          <Routes>
            <Route path='/login' exact element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/home' element={<BottomBar />} />
            <Route path='/' element={<Start/>} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
