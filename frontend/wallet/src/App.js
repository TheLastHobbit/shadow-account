import logo from './logo.svg';
import './App.css';
import { createSmartAccountClient } from "@alchemy/aa-core";
import { createLightAccount } from "@alchemy/aa-accounts";
import { http } from "viem";
import { sepolia } from "@alchemy/aa-core";

export const smartAccountClient = new createSmartAccountClient({
  transport: http("ALCHEMY_RPC_URL"),
  chain: sepolia,
  // optionally provide an account to use as context
  account: await createLightAccount(lightAccountParams),
});

async function sendUserOperation(smartAccountClient, lightAccountParams, targetAddress, dataValue, valueAmount) {
  const uo = { 
    target: targetAddress, 
    data: dataValue, 
    value: valueAmount 
  };
  const account = await createLightAccount(lightAccountParams);
  const result = await smartAccountClient.sendUserOperation({
    uo: uo,
    account: account
  });

  return result;
}

// 使用示例
sendUserOperation(smartAccountClient, lightAccountParams, "0xaddress", "0x", 0n)
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });


function App() {

  
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
