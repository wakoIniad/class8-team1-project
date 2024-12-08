const objects = [];
const SPACER = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

let container:HTMLElement | null = document.getElementById('#container');
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

type BlockObjectParameters = [ number, number, number, number, string?, string?, string? ];

interface BlockInterface {
    x:number;
    y:number;
    width:number;
    height:number;
    editorElment: HTMLElement;
    displayElement: HTMLElement;
    value: string;
    id: string;
    boxFrameElement: HTMLSpanElement;
    makeBoxElement<T>(tagName: string):T;
    asign(element: HTMLElement):void;
    toggleToEditor():void;
    toggleToView():void;

}

class Block<T extends HTMLElement,S extends HTMLElement>{
    //連続編集時に、より前の変更処理が後から終わって古い情報が反映されるのを防ぐ用
    loaderId: number; 
    
    x:number;
    y:number;
    width:number;
    height:number;
    editorElment: T;
    displayElement: S;
    value: string;
    id: string;
    boxFrameElement: HTMLSpanElement;
    type: string | null;
    constructor(
        { EditorType, DisplayType } : { EditorType: string, DisplayType: string },
        x: number, y: number, width: number, height: number,
        id?: string, type?: string, value?: string, 
    ) {
        this.id = id || String(Date.now());
        this.type = type || null;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.value = value || '';

        this.editorElment = this.makeBoxContent<T>(EditorType);
        this.editorElment.setAttribute('class','box-editor');

        this.displayElement = this.makeBoxContent<S>(DisplayType);
        this.displayElement.setAttribute('class','box-view');

        this.boxFrameElement = this.makeBoxFrame<HTMLSpanElement>('span');
        this.boxFrameElement.setAttribute('id', this.id);
        this.boxFrameElement.setAttribute('class', 'box-frame');

        this.init();

        appendToContainer(this.boxFrameElement);
        this.asign(this.editorElment, this.displayElement);
        this.applyValue();//初期値の反映
        this.toggleToView();
    }
    makeBoxFrame<T>(tagName: string):T {
        const box: HTMLElement = document.createElement(tagName);
        box.style.left = String(this.y);
        box.style.top = String(this.y);
        box.style.width = String(this.width);
        box.style.height = String(this.height);
        return box as T;
    }
    
    makeBoxContent<T>(tagName: string):T {
        const box: HTMLElement = document.createElement(tagName);
        box.style.left = String(0);
        box.style.top = String(0);
        box.setAttribute('class', 'box-content');
        return box as T;
    }
    asign(...element: HTMLElement[]) {
        this.boxFrameElement.replaceChildren(...element);
    }
    toggleToEditor() {
        this.editorElment.classList.add('visible');
        this.displayElement.classList.remove('visible');
        //this.asign(this.editorElment);
    }
    toggleToView() {
        this.editorElment.classList.remove('visible');
        this.displayElement.classList.add('visible');
        //this.asign(this.displayElement);
    }
    makeData() {
        return {
            type: this.type,
            id: this.id,
            range: {
                x:this.x, y:this.y, width: this.width, height: this.height,
            }
        }
    }

    updateValue(){}
    applyValue(){}
    update(){
        this.updateValue();
        this.applyValue();
    }
    init(){}
}

class TextBlock extends Block<HTMLTextAreaElement,HTMLParagraphElement> {
    constructor(...params: BlockObjectParameters) {
        super({ 'EditorType': 'textarea', 'DisplayType': 'p' }, ...params);
    }
    init() {
        this.editorElment.value = this.value;
        
        this.boxFrameElement.addEventListener('focusin', (e)=>{
            this.toggleToEditor();
        }, {capture: true});
        this.boxFrameElement.addEventListener('focusout', (e)=>{
            this.update();
            this.toggleToView();
        });
    }
    updateValue() {
        this.value = this.editorElment.value;
    }
    applyValue() {
        this.displayElement.textContent = this.value;
    }
}

class ImageBlock extends Block<HTMLInputElement,HTMLImageElement> {
    constructor(...params: BlockObjectParameters) {
        super({ 'EditorType': 'input', 'DisplayType': 'img' }, ...params);
    }

    init() {
        this.editorElment.setAttribute('type', 'file');
        this.editorElment.setAttribute('accept', 'image/*');

        this.displayElement.setAttribute('src', this.value);
        this.displayElement.setAttribute('alt','');
        this.editorElment.addEventListener('change', ()=>{
            this.editorElment.value = '';
            this.update(++this.loaderId);
        });
    }

    async updateValue() {
        const fileReader = new FileReader();
        return await new Promise((resolve, reject)=>{
            fileReader.addEventListener('load', (e: ProgressEvent<FileReader>)=> {
                if(e.target instanceof FileReader && typeof e.target.result === 'string') {
                    this.value = e.target.result;
                    resolve(this.value);
                } else {
                    reject(new Error('[ImageBlock-update]想定通りではありません'))
                }
            });
            //input[type="file"] と input[type="button"] を分ける型はない
            const files = this.editorElment.files!;
            if(files.length) {
                fileReader.readAsDataURL(files[0]);
            } else {
                this.value = SPACER;
                resolve(this.value);
            }
        });
    }
    applyValue() {
        this.displayElement.setAttribute('src', this.value);
    }
    async update(processId: number) {
        await this.updateValue();
        if(processId !== this.loaderId) return;
        this.applyValue();
    }
}

class canvasBlock extends Block<HTMLCanvasElement,HTMLImageElement> {
    constructor(...params: BlockObjectParameters) {
        super({ 'EditorType': 'canvas', 'DisplayType': 'img' }, ...params);
    }
    init() {
        this.displayElement.setAttribute('src', this.value);
        this.displayElement.setAttribute('alt','');
        
        this.boxFrameElement.addEventListener('focusin', (e)=>{
            this.toggleToEditor();
        }, {capture: true});
        this.boxFrameElement.addEventListener('focusout', (e)=>{
            this.update();
            this.toggleToView();
        });
    }
    UpdateValue() {
        this.value = this.editorElment.toDataURL();
    }
    applyValue() {
        this.displayElement.setAttribute('src', this.value);
    }
}

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