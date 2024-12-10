import React from 'react';
import logo from './logo.svg';
import './App.css';

import testData from '../../test/test.json' assert { type: 'json' };;

import { blockData } from './lib/type/blockData.ts';
import { rangeData } from './lib/type/rangeData.ts';

import { Block } from './lib/Block.ts';
import { TextBlock } from './lib/TextBlock.ts';
import { ImageBlock } from './lib/ImageBlock.ts';
import { canvasBlock } from './lib/CanvasBlock.ts';

const pageObjects: Block<any,any>[] = [];

function putBox(type: string) {
  const container:HTMLElement = document.getElementById('container')!;
  let xs:number[] = [];
  let ys:number[] = [];
  const onmousedown = (e)=>{
      xs.push(e.clientX);
      ys.push(e.clientY);
  }
  const onmouseup = (e)=>{
      xs.push(e.clientX);
      ys.push(e.clientY);
      const mx = Math.min(...xs);
      const my = Math.min(...ys);
      const Mx = Math.max(...xs);
      const My = Math.max(...ys);
      const range = { 
          x: mx,
          y: my,
          width: Mx - mx, 
          height: My - my
      };
      const res = makeBlockObject(range, type);
      xs = [];
      ys = [];
      container.removeEventListener('mousedown', onmousedown);
      container.removeEventListener('mouseup', onmouseup);
      pageObjects.push(res);
      console.log(makePageData())
  }
  container.addEventListener('mousedown', onmousedown);
  container.addEventListener('mouseup', onmouseup);
}
function makeBlockObject(range: rangeData, type, value?: string, id?: string) {
  let res;
  switch(type) {
      case 'text':
          res = new TextBlock(range, value);
          break;
      case 'image':
          res = new ImageBlock(range, value);
          break;
      case 'canvas':
          res = new canvasBlock(range, value);
          break;
  }
  if(id) {
      res.id = id;
  }
  return res;
}

function makePageData(): blockData[] {
return pageObjects.map(object=>object.makeData());
}

function applyPageData(pageData: blockData[]): void {
  for( const boxData of pageData ) {
      const { range, id, type, value } = boxData;
      pageObjects.push(makeBlockObject(range, type, value, id));
  }
}

const uitest:HTMLSelectElement = document.getElementById('ui') as HTMLSelectElement;
uitest.addEventListener('change',e=>{
  putBox(uitest.value);
  let option_states: NodeListOf<HTMLOptionElement> = document.querySelectorAll("#ui option");
  for(let state of option_states) {
      state.selected = false;
  }
})

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div id="container">
          {
            (function() {
              for(const blockData of testData) {
              
              }
              return <></>;
            })()
          }
        </div>
      </header>
    </div>
  );
}

export default App;
