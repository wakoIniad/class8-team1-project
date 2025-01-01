// https://developer.mozilla.org/ja/docs/Learn/JavaScript/Client-side_web_APIs/Fetching_data

// CSRF対策

const csrftoken: string = getCsrfToken();

const contentLoadingDisplay: HTMLElement|null = document.getElementById('content-loading-display');
const contentLoadingBar: HTMLElement|null = document.getElementById('content-loading-bar');
function endLoadingAnimation() {
    console.log('END_LOADING_ANIMATION')
    if(contentLoadingBar && contentLoadingDisplay) {
        contentLoadingBar.classList.remove('animate-bar');
        //contentLoadingBar.style.animationPlayState = 'paused'; // ロード完了時にアニメーションを停止
        contentLoadingBar.style.width = '100%'; // 最後にバーを100%に設定
        contentLoadingBar.style.transition = 'width 1s'
        
        contentLoadingDisplay.style.transition = 'height 1s 1s';
        contentLoadingDisplay.style.height = '0%';
    }
}

import { blockData } from '../type/blockData';
import { rangeData } from '../type/rangeData';
const SPACER_URI: string = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const NOTE_API_URL: string = window.location.origin + '/api/note/';

const pageObjects: Block<any,any>[] = [];

let container:HTMLElement | null = document.getElementById('container');
if(!(container instanceof HTMLElement)) {
    throw new Error('コンテナの取得に失敗しました');
}

function appendToContainer(elm: HTMLElement): void {
    if(container) container.appendChild(elm);
}

type BlockObjectParameters = [ rangeData, string?, string?, string? ];

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
    assign(element: HTMLElement):void;
    toggleToEditor():void;
    toggleToView():void;
    getValue: () => string | Promise<string>;
    applyValue: () => void;
    init: () => void;
}

class NoteController {

    activeFunctions: {[key: string]: boolean} = {
        'nudge': false,
    };
    shortcutMap: {[key: string]: string} = {
        'n': 'nudge',
    };
    nudgeSize: number = 32;

    constructor(nudgeSize?: number) {
        if(nudgeSize)this.nudgeSize = nudgeSize;
        document.addEventListener('keydown', this.activateFunctions.bind(this))
        document.addEventListener('keyup', this.deactiveFunctions.bind(this))
    }
    
    activateFunctions(event: KeyboardEvent) {    
        if(this.activeFunctions?.[this.shortcutMap?.[event.key]] !== undefined) {
            this.activeFunctions[this.shortcutMap[event.key]] = true;
        }
    }
    deactiveFunctions(event: KeyboardEvent) {
        if(this.activeFunctions?.[this.shortcutMap?.[event.key]] !== undefined) {        
            this.activeFunctions[this.shortcutMap[event.key]] = false;
        }

    }
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
    id: string | Promise<string>;
    type?: string;
    pendingRequest?: Promise<any>;
    pendingSync: boolean;
    dumped: boolean;
    maskElement: HTMLDivElement;

    noteController: NoteController;
    constructor(
        { EditorType, DisplayType } : { EditorType: string, DisplayType: string },
        { x, y, width, height }: rangeData,
        id: string | Promise<string>, noteController: NoteController, value?: string, type?: string,
    ) {
        this.noteController = noteController;
        this.dumped = false;

        this.loaderId = 0;
        this.pendingRequest = undefined;
        this.pendingSync = false;

        this.id = id;
        this.type = type || undefined;
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
        this.boxFrameElement.setAttribute('draggable', 'true');
        this.boxFrameElement.setAttribute('id', `pending-${this.loaderId}`);

        this.maskElement = this.makeBoxContent<HTMLDivElement>('div');
        this.maskElement.classList.add('box-mask');

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

        this.boxFrameElement.addEventListener("keydown", (function(e) {
            /**
             * キー属性値≒入力された文字を取得する
             * 例えば、フルキーボードの5でもNumPadの5でもevent.keyで取得されるのは"5"
             * ロケールやシステムレベルキーマップの影響を受ける
             * https://qiita.com/riversun/items/3ff4f5ecf5c21b0548a4
             * ※keyCodeは非推奨になった!!
             */
            if(e.key == 'Delete') {
//                this.boxFrameElement.removeEventListener("keydown", this);
                this.dump();
            } else {

            }
            console.log(this.id, e.key);
        }).bind(this));
        

        /** フォーカスを受け取れるようにする 
         * 参考: https://www.mitsue.co.jp/knowledge/blog/a11y/201912/23_0000.html */
        this.boxFrameElement.setAttribute('tabindex', '-1');
        this.boxFrameElement.classList.add(`${type}-box-frame`)

        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[], observer) => {
            this.resize(entries[0].contentRect.width, entries[0].contentRect.height);
        });
        resizeObserver.observe(this.boxFrameElement);

        this.init();

        appendToContainer(this.boxFrameElement);
        this.assign(this.editorElement, this.displayElement, this.maskElement);
        this.applyValue();//初期値の反映
        this.toggleToView();
        
        
    }
    resetMaskUI() {
        this.maskElement.classList.remove('loading-error');
    }

    async getId() {
        return await Promise.any([this.id]);
    }

    async callAPI(method: string, option?: { body?: {} , force?: boolean }) {
        
        const TARGET_URL = NOTE_API_URL+ NOTE_ID + '/' + await this.getId() + '/';
        const config = {
            method: method,
            headers: {
                'X-CSRFToken': csrftoken,
            }
        }
        if(option?.body) {
            config['body'] = JSON.stringify(option.body);
            config.headers['Content-Type'] = 'application/json; charset=utf-8';
        }

        if(this.pendingRequest) {
            if(option?.force === true) {
                /**
                 * これは、削除リクエストなどに使われるため、
                 * 前のリクエスト（値の更新など)が終わってから行う
                 */
                while(this.pendingRequest) await this.pendingRequest; //forceが複数あった時用
            } else {
                //全ての情報を同期するので、更新だけなら送信順の逆転は気にしなくてOK
                this.pendingSync = true;
                return;
            }
        }

        if(this.dumped) return; //廃棄している場合リクエストは送らない。
        
        console.log('request: ',TARGET_URL);
        this.pendingRequest = fetch(TARGET_URL, config);
        
        this.maskElement.classList.add('loading');
        this.pendingRequest.then(response => {
            this.pendingRequest = undefined;
            if(this.pendingSync) {
                this.pendingSync = false;
                this.syncServer();
            } else {
                this.maskElement.classList.remove('loading');
                if (response.statusText !== 'OK') {
                    this.maskElement.classList.add('loading-error');
                    (async()=>{
                        const responseData = await response.json();
                        let messageText = '';
                        switch(response.status) {
                            case 400:
                                switch(responseData?.message) {
                                    case 'RequestDataTooBig':
                                        messageText = '- データサイズが大きすぎます'
                                        break;
                                    default:
                                        messageText = '- 編集内容に問題があります';
                                }
                                break;
                            default:
                                messageText = '- 原因不明';
                        }
                        const noticeModal = new Modal(
                            'info-bar', 
                            'データの反映に失敗しました\n'+messageText,
                            5000
                        );
                        noticeModal.init();
                        noticeModal.show();
                    })();
                }
            }
        });
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
    assign(...element: HTMLElement[]) {
        this.boxFrameElement.replaceChildren(...element);
    }
    toggleToEditor() {
        this.editorElement.classList.add('visible');
        this.displayElement.classList.remove('visible');
        //this.assign(this.editorElment);
    }
    toggleToView() {
        this.editorElement.classList.remove('visible');
        this.displayElement.classList.add('visible');
        //this.assign(this.displayElement);
    }
    async makeData(): Promise<blockData> {
        return {
            range: {
                x:this.x, y:this.y, width: this.width, height: this.height,
            },
            id: await this.getId(),
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

    async init(): Promise<void> {
        this.id = await this.getId();
        this.boxFrameElement.setAttribute('id', this.id);
    }

    getValue(): string | Promise<string> {
        return ''
    }

    async syncServer() {
        this.callAPI('POST', { body: {
            update_keys: ["X", "y", "width", "height", "value"],
            update_values: [this.x, this.y, this.width, this.height, this.value]
        }});
    }

    async applyValue(): Promise<void> {
        this.resetMaskUI();
        await this.callAPI('POST', { body: {
            update_keys: ["value"],
            update_values: [this.value]
        }});
    }

    async resize(width: number, height: number): Promise<void> {
        if(this.noteController.activeFunctions['nudge'] === true) {
            width -= width%this.noteController.nudgeSize;
            height -= height%this.noteController.nudgeSize;
        }
        //this.boxFrameElement.style.width =  
            this.coordToString(this.width = width);
        //this.boxFrameElement.style.height = 
            this.coordToString(this.height = height);
        await this.callAPI('POST', { body: {
            update_keys: ["width","height"],
            update_values: [this.width, this.height]
        }});
    }
    async relocate(x: number, y: number): Promise<void> {
        if(this.noteController.activeFunctions['nudge'] === true) {
            x -= x%this.noteController.nudgeSize;
            y -= y%this.noteController.nudgeSize;
        }
        this.x = x;
        this.y = y;
        this.boxFrameElement.style.left = this.coordToString(x);
        this.boxFrameElement.style.top =  this.coordToString(y);
        await this.callAPI('POST', { body: {
            update_keys: ["x","y"],
            update_values: [this.x, this.y]
        }});
    }
    relayout() {

    }
    deleteElement(element: HTMLElement) {
        const clone = element.cloneNode(true) as HTMLElement; // true: 子要素も複製
        element.replaceWith(clone);
        clone.remove();
    }
    async dump(): Promise<void> {
        this.deleteElement(this.editorElement);
        this.deleteElement(this.displayElement);
        this.deleteElement(this.boxFrameElement);
        /**
         * データベースから削除されているが通知が届いていない場合に、
         * 値の更新をリクエストしてしまうことを防止するためawaitしない。
         * (あとで削除失敗した場合のリカバリーも追加する必要あり)
         * 
         * 削除リクエスト ⇒ データベースから削除 ⇒ 通知
         */ 
        this.callAPI('DELETE', { force: true } );
        this.dumped = true;
    }
}

class TextBlock extends Block<HTMLTextAreaElement,HTMLParagraphElement> {
    constructor( range: rangeData, text: string = '', id: string|Promise<string> , noteController: NoteController) {
        super({ EditorType: 'textarea', DisplayType: 'p' }, range, id, noteController, text, 'text', );
    }
    async init() {
        super.init();
        this.editorElement.value = this.value;
        this.editorElement.classList.add('text-editor');

        this.displayElement.classList.add('text-view');
        
        this.boxFrameElement.addEventListener('focusin', (e)=>{
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
    async applyValue() {
        this.displayElement.textContent = this.value;
        await super.applyValue();
    }
}

class ImageBlock extends Block<HTMLInputElement,HTMLImageElement> {
    constructor( range: rangeData, URI: string = SPACER_URI, id: string|Promise<string>, noteController: NoteController ) {
        super({ 'EditorType': 'input', 'DisplayType': 'img' }, range, id, noteController, URI, 'image');
    }

    async init() {
        super.init();
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
                resolve(SPACER_URI);
            }
        });
    }
    async applyValue() {
        this.displayElement.setAttribute('src', this.value);
        await super.applyValue();
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
    constructor( range: rangeData, URI: string = SPACER_URI, id: string|Promise<string>, noteController: NoteController ) {
        super({ 'EditorType': 'canvas', 'DisplayType': 'img' }, range, id, noteController, URI, 'canvas');
        const context = this.editorElement.getContext('2d');
        if(context !== null) {
            this.context = context;
            if(URI !== SPACER_URI) {
                const image = new Image();
                image.src = URI;
                this.context.drawImage(image, 0, 0);
            }
        }
        this.bindedEvents = [];
    }
    async init() {
        super.init();
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
            ['mouseleave', ()=>{
                this.paintEnd();
            }],
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
        return this.editorElement.toDataURL();
    }
    async applyValue() {
        console.log(this.value);
        this.displayElement.setAttribute('src', this.value);
        await super.applyValue();
    }
}

const noteController: NoteController = new NoteController(32);

function putBox(type: string) {
    if(!container)return;
    let xs:number[] = [];
    let ys:number[] = [];
    const cancel = () => {
        container?.removeEventListener('mousedown', onmousedown);
        container?.removeEventListener('mouseup', onmouseup);
        container?.removeEventListener('onmouseout', cancel);
        container?.removeEventListener('onmouseleave', cancel);
    }
    const onmousedown = (e)=>{
        xs.push(e.clientX);
        ys.push(e.clientY);
        container?.removeEventListener('mousedown', onmousedown);
        //container?.removeEventListener('onmouseleave', cancel);
        //container?.removeEventListener('onmouseout', cancel);
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
            width: Math.max(Mx - mx,150), 
            height: Math.max(My - my, 100)
        };
        const putData = {
            range: range, type: type
        }
        const idPromise = (async function() {
            const url = `${NOTE_API_URL+NOTE_ID}/${SYSTEM_API_PATH_SEGMENT}/`
            const response = await fetch(url, {
                method: 'PUT',
                body: JSON.stringify(putData),
                headers: {
                  'Content-Type': 'application/json; charset=utf-8',
                  'X-CSRFToken': csrftoken,
                },
            });
            //try
            const parsed = await response.json()

            return parsed['assigned_id'];
            //} catch(e) {
            
            //}
        })();
        //登録が完了したときに、cssアニメーションで作成後のボックスのふちを光らせる
        
        
        const block = makeBlockObject(range, type, idPromise);
        pageObjects.push(block);
        xs = [];
        ys = [];
        container?.removeEventListener('mouseup', onmouseup);
        makePageData().then(console.log);
    }

    container.addEventListener('mousedown', onmousedown);
    container.addEventListener('mouseup', onmouseup);
}
function makeBlockObject(range: rangeData, type, id: string|Promise<string>, value?: string) {
    let res;
    switch(type) {
        case 'text':
            res = new TextBlock(range, value, id, noteController);
            break;
        case 'image':
            res = new ImageBlock(range, value, id, noteController);
            break;
        case 'canvas':
            res = new canvasBlock(range, value, id, noteController);
            break;
    }
    if(id) {
        res.id = id;
    }
    return res;
}

async function makePageData(): Promise<blockData[]> {
  return await Promise.all(pageObjects.map(object=>object.makeData()));
}

function applyPageData(...pageData: blockData[]): void {
    for( const boxData of pageData ) {
        const { range, id, type, value } = boxData;
        pageObjects.push(makeBlockObject(range, type, id, value));
    }
    endLoadingAnimation();
}
/*applyPageData(initialPageObjects);
pageObjects.push(...initialPageObjects);*/

fetch(NOTE_API_URL+NOTE_ID)
.then(result=>result.json())
.then(pageData=>{
    const initialPageObjects = pageData.children;
    applyPageData(...initialPageObjects);
});

const uitest:HTMLSelectElement = document.getElementById('ui') as HTMLSelectElement;
uitest.addEventListener('change',e=>{
    putBox(uitest.value);
    let option_states: NodeListOf<HTMLOptionElement> = document.querySelectorAll("#ui option");
    for(let state of option_states) {
        state.selected = false;
    }
})

class Modal {
    static container: HTMLElement;
    message: string;
    type: string;
    modalElement?: HTMLDivElement;
    lifetime: number;
    initialized: boolean = false;
    
    constructor(type: string, message: string, lifetime?: number) {
        this.type = type;
        this.message = message;
        this.lifetime = lifetime || Infinity;
    }
    //代入されるのを待つために ? をつけてるんだから、
    //代入したということをコンパイル時に伝える方法が欲しい
    init() { 
        this.modalElement = document.createElement('div');
        
        switch(this.type) {
            case 'info-bar':
                this.modalElement.classList.add('modal', 'modal-info-bar');
                this.modalElement.innerText = this.message;
                break;
        }
        this.initialized = true;
    }
    proveInitialized<T>(target,initializer): target is NonNullable<T> {
        if(target === undefined || target === null) initializer();
        return target !== undefined && target !== null;
    }
    show() {//なんかかっこいいから許容範囲内
        if(this.proveInitialized(this.modalElement, this.init.bind(this))) {
            Modal.container.appendChild(this.modalElement);
            if(Number.isFinite(this.lifetime)) {
                setTimeout(this.delete.bind(this), this.lifetime)
            }
        }
    }
    close() {
        if(this.proveInitialized(this.modalElement, this.init.bind(this))) {
            Modal.container.removeChild(this.modalElement);
        }
    }
    delete() {
        this.close();
    }
    static init() {
        const container:HTMLElement | null = document.getElementById('modal-container');
        if( container !== null ) {
            Modal.container = container;
        } else {
            const container = document.createElement('div');
            container.setAttribute('id', `modal-container-${Date.now()}`); //被らないようにするため
            container.setAttribute('class', 'modal-container')
            document.body.appendChild(container);
            Modal.container = container;
        }
    }
}
Modal.init();

const m = new Modal('info-bar', 'Hello!',3000);
m.init();
m.show();