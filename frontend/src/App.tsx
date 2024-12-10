import React from 'react';
import logo from './logo.svg';
import './App.css';
import testData from '../../test/test.json' assert { type: 'json' };;

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        {
          (function() {
            for(const blockData of testData) {
              
            }
            return <></>;
          })()
        }
      </header>
    </div>
  );
}

export default App;
