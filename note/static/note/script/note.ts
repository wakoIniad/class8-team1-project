const objects = [];
const SPACER = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

let container:HTMLElement | null = document.getElementById('container');
if(!(container instanceof HTMLElement)) {
    throw new Error('コンテナの取得に失敗しました');
}

function appendToContainer(elm: HTMLElement): void {
    if(container) container.appendChild(elm);
}

interface RangeInterface {
    x:number;
    y:number;
    width:number;
    height:number;
}

type BlockObjectParameters = [ RangeInterface, string?, string?, string? ];

interface BlockInterface {
    x:number;
    y:number;
    width:number;
    height:number;
    editorElement: HTMLElement;
    displayElement: HTMLElement;
    value: string;
    id: string;
    boxFrameElement: HTMLSpanElement;
    makeBoxElement<T>(tagName: string):T;
    asign(element: HTMLElement):void;
    toggleToEditor():void;
    toggleToView():void;
    getValue: () => string | Promise<string>;
    applyValue: () => void;
    init: () => void;
}

function coordToString(coord: number): string {
    return `${coord}px`;
}

class Block<T extends HTMLElement,S extends HTMLElement>{
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
        { x, y, width, height }: RangeInterface,
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
            e.preventDefault();
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

        this?.init();

        appendToContainer(this.boxFrameElement);
        this.asign(this.editorElement, this.displayElement);
        this?.applyValue();//初期値の反映
        this.toggleToView();
    }
    makeBoxFrame<T>(tagName: string):T {
        const box: HTMLElement = document.createElement(tagName);
        box.style.left = coordToString(this.x);
        box.style.top = coordToString(this.y);
        box.style.width = coordToString(this.width);
        box.style.height = coordToString(this.height);
        box.classList.add('box-frame');
        box.classList.add('resizer');
        return box as T;
    }
    
    makeBoxContent<T>(tagName: string):T {
        const content: HTMLElement = document.createElement(tagName);
        content.style.left = coordToString(0);
        content.style.top = coordToString(0);
        content.classList.add('box-content');
        return content as T;
    }
    
    makeResizer<T>(tagName: string):T {
        const content: HTMLElement = document.createElement(tagName);
        content.style.left = coordToString(0);
        content.style.top = coordToString(0);
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
    makeData() {
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
        this.boxFrameElement.style.width = coordToString(this.width = width);
        this.boxFrameElement.style.height = coordToString(this.height = height);
    }
    relocate(x: number, y: number) {
        this.boxFrameElement.style.left = coordToString(this.x = x);
        this.boxFrameElement.style.top = coordToString(this.y = y);
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

class TextBlock extends Block<HTMLTextAreaElement,HTMLParagraphElement> {
    constructor( range: RangeInterface, text: string = '' ) {
        super({ EditorType: 'textarea', DisplayType: 'p' }, range, text, 'text', );
    }
    init() {
        this.editorElement.value = this.value;
        
        this.boxFrameElement.addEventListener('focusin', (e)=>{
            //this.editorElement.focus();
            this.toggleToEditor();
        }, {capture: true});
        this.boxFrameElement.addEventListener('focusout', (e)=>{
            this.update();
            this.toggleToView();
        });
    }
    getValue() {
        return this.editorElement.value;
    }
    applyValue() {
        this.displayElement.textContent = this.value;
    }
}

class ImageBlock extends Block<HTMLInputElement,HTMLImageElement> {
    constructor( range: RangeInterface, URI: string = SPACER ) {
        super({ 'EditorType': 'input', 'DisplayType': 'img' }, range, URI, 'image');
    }

    init() {
        this.editorElement.setAttribute('type', 'file');
        this.editorElement.setAttribute('accept', 'image/*');

        this.displayElement.setAttribute('src', this.value);
        this.displayElement.setAttribute('alt','');
        this.editorElement.addEventListener('change', ()=>{
            this.update();
            this.editorElement.value = '';
        });
        this.editorElement.addEventListener('dragenter', ()=>{
            this.toggleToEditor(); 
        });
        this.editorElement.addEventListener('dragleave', ()=> {
            this.toggleToView();
        });
        this.editorElement.addEventListener('drop', ()=> {
            this.toggleToView();
        });
    }

    async getValue(): Promise<string> {
        const fileReader = new FileReader();
        const files = this.editorElement.files!;
        return await new Promise<string>((resolve, reject)=>{
            fileReader.addEventListener('load', (e: ProgressEvent<FileReader>)=> {
                if(e.target instanceof FileReader && typeof e.target.result === 'string') {
                    resolve(e.target.result);
                } else {
                    reject(new Error('[ImageBlock-update]想定通りではありません'))
                }
            });
            //input[type="file"] と input[type="button"] を分ける型はない
            if(files.length) {
                fileReader.readAsDataURL(files[0]);
            } else {
                resolve(SPACER);
            }
        });
    }
    applyValue() {
        this.displayElement.setAttribute('src', this.value);
    }
    relayout(): void {
        this.displayElement.onload = ()=> {
            this.resize(this.width, this.displayElement.naturalHeight/this.displayElement.naturalWidth*this.width);
        }
    }
}

class canvasBlock extends Block<HTMLCanvasElement,HTMLImageElement> {
    bindedEvents: [string, (any)=>void][];
    context: CanvasRenderingContext2D;
    penSize: number = 3;
    penColor: string = '#000000';
    penOpacity: number = 1;
    private lastX: number | null;
    private lastY: number | null;
    constructor( range: RangeInterface, URI: string = SPACER ) {
        super({ 'EditorType': 'canvas', 'DisplayType': 'img' }, range, URI, 'canvas');
        const context = this.editorElement.getContext('2d');
        if(context !== null) {
            this.context = context;
            if(URI !== SPACER) {
                const image = new Image();
                image.src = URI;
                this.context.drawImage(image, 0, 0);
            }
        }
        this.bindedEvents = [];
    }
    init() {
        this.displayElement.setAttribute('src', this.value);
        this.displayElement.setAttribute('alt','');
        
        const onmousedown = ()=> {
            this.paintStart();
            this.updateLineStyle();
        }
        this.boxFrameElement.addEventListener('focusin', (e)=>{
            this.toggleToEditor();
            //this.paintStart();
            this.boxFrameElement.addEventListener('mousedown', onmousedown);
        }, {capture: true});
        this.boxFrameElement.addEventListener('focusout', (e)=>{
            this.paintEnd();
            this.update();
            this.toggleToView();
            this.boxFrameElement.removeEventListener('mousedown', onmousedown);
        });
        this.lastX = null;
        this.lastY = null;
    }
    updateLineStyle() {
        this.context.globalAlpha = this.penOpacity;
        this.context.lineCap = 'round';
        this.context.lineWidth =  this.penSize;
        this.context.strokeStyle = this.penColor;
        this.lastX = null;
        this.lastY = null;
    }
    paintAt(e) {
        const rect = this.editorElement.getBoundingClientRect();

        const x = (e.clientX - rect.left) * (this.editorElement.width / rect.width);
        const y = (e.clientY - rect.top) * (this.editorElement.height / rect.height);
        this.context.beginPath();

        const lastX = this.lastX || x;
        const lastY = this.lastY || y;

        this.context.moveTo(lastX, lastY);

        this.context.lineTo(x, y);

        this.context.stroke();

        this.lastX = x;
        this.lastY = y;
    }
    paintStart() {
        this.paintEnd();
        this.bindedEvents = [
            ['mousemove', (e: MouseEvent)=>{
                this.paintAt(e);
            }],
            ['mouseout', ()=>{
                this.paintEnd();
            }],
            ['mouseleave', (()=>{
                this.paintEnd();
            })],
        ];
        for( const [name, callback] of this.bindedEvents ) {
            this.editorElement.addEventListener(name, callback, {capture: true});
        }
    }
    paintEnd() {
        for( const [name, callback] of this.bindedEvents ) {
            this.editorElement.removeEventListener(name, callback, {capture: true});
        }
    }
    getValue() {
//        console.log('AAA',this.editorElement.toDataURL())
        return this.editorElement.toDataURL();
    }
    applyValue() {
        console.log(this.value)
        this.displayElement.setAttribute('src', this.value);
    }
}

//const test = new ImageBlock({x:0,y:0,width:100,height:100});
//const test2 = new canvasBlock({x:200,y:150,width:100,height:100});
//const test3 = new TextBlock({x:300,y:0,width:100,height:100});

function ttt() {
    if(!container)return;
    let xs:number[] = [];
    let ys:number[] = [];
    container.addEventListener('mousedown', (e)=>{
        xs.push(e.clientX);
        ys.push(e.clientY);
    })
    container.addEventListener('mouseup', (e)=>{
        xs.push(e.clientX);
        ys.push(e.clientY);
        const mx = Math.min(...xs);
        const my = Math.min(...ys);
        const Mx = Math.max(...xs);
        const My = Math.max(...ys);
        const res = new ImageBlock({x:mx,y:my,width:Mx-mx,height:My-my});
        xs = [];
        ys = [];
    })
}
ttt();
/**
 * @author JuthaDDA
 * @see [element.tagName は readonly なので，
 *     HTML 要素のタグ名を変更する関数を作った - Qiita](
 *     https://qiita.com/juthaDDA/items/974fda70945750e68120)
 */
const replaceTagName = ( target:Element, tagName:string ):Element => {
	if ( ! target.parentNode ) { return target; }

	const replacement = document.createElement( tagName );
	Array.from( target.attributes ).forEach( ( attribute ) => {
		const { nodeName, nodeValue } = attribute;
		if ( nodeValue ) {
			replacement.setAttribute( nodeName, nodeValue );
		}
	} );
	Array.from( target.childNodes ).forEach( ( node ) => {
		replacement.appendChild( node );
	} ); // For some reason, only textNodes are appended
		// without converting childNodes to Array.
	target.parentNode.replaceChild( replacement, target );
	return replacement;
};
