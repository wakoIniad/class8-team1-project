import { blockData } from './type/blockData.ts';
import { rangeData } from './type/rangeData.ts';
import { SPACER_URI } from './constants.ts';

export class Block<T extends HTMLElement,S extends HTMLElement>{
    //連続編集時に、より前の変更処理が後から終わって古い情報が反映されるのを防ぐ用
    
    loaderId: number; 
    
    x:number;
    y:number;
    width:number;
    height:number;
    editorElement: T;
    displayElement: S;
    boxFrameElement: HTMLDivElement;
    resizerElement: HTMLSpanElement;
    value: string;
    id: string;
    type: string | null;
    constructor(
        { EditorType, DisplayType } : { EditorType: string, DisplayType: string },
        { x, y, width, height }: rangeData,
        value?: string, type?: string, id?: string,
    ) {
        this.loaderId = 0;

        this.id = id || String(Date.now());
        this.type = type || null;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.value = value || '';

        this.editorElement = this.makeBoxContent<T>(EditorType);
        this.editorElement.classList.add('box-editor');

        this.displayElement = this.makeBoxContent<S>(DisplayType);
        this.displayElement.classList.add('box-view');

        this.boxFrameElement = this.makeBoxFrame<HTMLDivElement>('div');
        this.boxFrameElement.setAttribute('id', this.id);
        this.boxFrameElement.setAttribute('draggable', 'true');

        this.boxFrameElement.addEventListener('dragstart', (e: DragEvent) => {
            const callback = (e: DragEvent) => {
                this.x += e.clientX - sx;
                this.y += e.clientY - sy;
                this.relocate(this.x, this.y);
                this.boxFrameElement.removeEventListener('dragend', callback);
            }
            this.boxFrameElement.addEventListener('dragend', callback);
            const sx: number = e.clientX; 
            const sy: number = e.clientY;
        })

        

        /** フォーカスを受け取れるようにする 
         * 参考: https://www.mitsue.co.jp/knowledge/blog/a11y/201912/23_0000.html */
        this.boxFrameElement.setAttribute('tabindex', '-1');

        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[], observer) => {
            this.width = entries[0].contentRect.width;
            this.height = entries[0].contentRect.height;
            //this.resize(e;ntries[0].contentRect.width, entries[0].contentRect.height);
        });
        resizeObserver.observe(this.boxFrameElement);

        this.init();

        this.asign(this.editorElement, this.displayElement);
        this.applyValue();//初期値の反映
        this.toggleToView();
    }

    getHTMLElement(elm: HTMLElement): HTMLElement {
        return this.boxFrameElement;
    }

    coordToString(coord: number): string {
        return `${coord}px`;
    }   

    makeBoxFrame<T>(tagName: string):T {
        const box: HTMLElement = document.createElement(tagName);
        box.style.left =   this.coordToString(this.x);
        box.style.top =    this.coordToString(this.y);
        box.style.width =  this.coordToString(this.width);
        box.style.height = this.coordToString(this.height);
        box.classList.add('box-frame');
        box.classList.add('resizer');
        return box as T;
    }
    
    makeBoxContent<T>(tagName: string):T {
        const content: HTMLElement = document.createElement(tagName);
        content.style.left = this.coordToString(0);
        content.style.top =  this.coordToString(0);
        content.classList.add('box-content');
        return content as T;
    }
    
    makeResizer<T>(tagName: string):T {
        const content: HTMLElement = document.createElement(tagName);
        content.style.left = this.coordToString(0);
        content.style.top =  this.coordToString(0);
        content.classList.add('resizer');
        return content as T;
    }
    asign(...element: HTMLElement[]) {
        this.boxFrameElement.replaceChildren(...element);
    }
    toggleToEditor() {
        this.editorElement.classList.add('visible');
        this.displayElement.classList.remove('visible');
        //this.asign(this.editorElment);
    }
    toggleToView() {
        this.editorElement.classList.remove('visible');
        this.displayElement.classList.add('visible');
        //this.asign(this.displayElement);
    }
    makeData(): blockData {
        return {
            range: {
                x:this.x, y:this.y, width: this.width, height: this.height,
            },
            id: this.id,
            type: this.type,
            value: this.value,
        }
    }
    
    update(...args){
        const processId = ++this.loaderId;
        
        Promise.any([this.getValue()]).then((value: string)=>{
            if( processId !== this.loaderId )return;
            this.value = value;
            this.applyValue();
            this.relayout();
        })
    }
    init(): void {
        
    }
    getValue(): string | Promise<string> {
        return ''
    }
    applyValue(): void {

    }
    resize(width: number, height: number) {
        this.boxFrameElement.style.width =  this.coordToString(this.width = width);
        this.boxFrameElement.style.height = this.coordToString(this.height = height);
    }
    relocate(x: number, y: number) {
        this.boxFrameElement.style.left = this.coordToString(this.x = x);
        this.boxFrameElement.style.top =  this.coordToString(this.y = y);
    }
    relayout() {

    }
    deleteElement(element: HTMLElement) {
        const clone = element.cloneNode(true) as HTMLElement; // true: 子要素も複製
        element.replaceWith(clone);
        clone.remove();
    }
    dump() {
        this.deleteElement(this.editorElement);
        this.deleteElement(this.displayElement);
        this.deleteElement(this.boxFrameElement);
    }
}
