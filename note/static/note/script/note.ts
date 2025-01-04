
// https://developer.mozilla.org/ja/docs/Learn/JavaScript/Client-side_web_APIs/Fetching_data

// CSRF対策

const csrftoken: string = getCsrfToken();//これはサーバー側で発行されている

const contentLoadingDisplay: HTMLElement|null = document.getElementById('content-loading-display');


import { parse } from 'path';
import { blockData } from '../type/blockData';
import { rangeData } from '../type/rangeData';
const SPACER_URI: string = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const NOTE_API_URL: string = window.location.origin + '/api/note/';


class Range {
    x:number;
    y:number;
    width: number;
    height: number;
    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    spread(): [ number, number, number, number ] {
        return [ this.x, this.y, this.width, this.height ];
    }
    shape(): Range {
        return new Range( 0, 0, this.width, this.height );
    }
    //Rectifiedは数学では非負になるように修正するみたいな意味らしい（真偽不明） 
    rectified(): Range {
        return new Range( 
            (this.x + Math.abs(this.x))/2,
            (this.y + Math.abs(this.y))/2,
            this.width,
            this.height  
        );
    }
    relative(ref: Range): Range {
        return new Range( 
            ref.x-this.x,
            ref.y-this.y,
            this.width,
            this.height  
        );
    }
}

class ContainerManager {
    container: HTMLElement;
    range: Range;
    constructor(containerElementID: string) {
        const containerElement:HTMLElement | null = document.getElementById(containerElementID);
        if(containerElement instanceof HTMLElement) {
            this.container = containerElement;
            const containerDomRect: DOMRect = this.container.getBoundingClientRect();
            
            this.range = 
                new Range(containerDomRect.left, containerDomRect.top, containerDomRect.width, containerDomRect.height);
        } else {
            this.error('コンテナの取得に失敗しました');
        }
    }
    append(target: HTMLElement) {
        this.container.appendChild(target);
    }
    error(message: string) {
        throw new Error(message);
    }
    updateContainerInfo(container = this.container) {
        const containerDomRect: DOMRect = container.getBoundingClientRect();
            
        this.range = 
            new Range(containerDomRect.left, containerDomRect.top, containerDomRect.width, containerDomRect.height);
    }
}

const containerManager = new ContainerManager('container');

class Block<T extends HTMLElement,S extends HTMLElement>{
    //連続編集時に、より前の変更処理が後から終わって古い情報が反映されるのを防ぐ用
    static minWidth: number = 100;
    static minHeight: number = 100;
    loaderId: number; 
    
    x:number;
    y:number;
    width:number;
    height:number;

    editorElement: T;
    displayElement: S;
    boxFrameElement: HTMLDivElement;
    resizerElement: HTMLSpanElement;
    maskElement: HTMLDivElement;
    dataTypeIconElement: HTMLDivElement;

    value: string;
    id: string | Promise<string>;
    type?: string;

    pendingRequest?: Promise<any>;

    pendingSync: boolean;
    dumped: boolean;
    moving: boolean = false;
    positionLocked: boolean = false;
    editorIsActive: boolean = false;
    onContainer: boolean = false;

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
        //this.boxFrameElement.setAttribute('draggable', 'true');
        this.boxFrameElement.setAttribute('id', `pending-${this.loaderId}`);
        this.append();

        this.maskElement = this.makeBoxContent<HTMLDivElement>('div');
        this.maskElement.classList.add('box-mask');

        /*this.boxFrameElement.addEventListener('dragstart', (e: DragEvent) => {

            //伝搬防止
            e.stopPropagation();

            //仕様: 編集中は動かさない
            if(this.positionLocked)return;
            this.moving = true;
            const callback = (e: DragEvent) => {
                //伝搬防止
                e.stopPropagation();
                this.relocate(this.x + e.clientX - sx, this.y + e.clientY - sy);
                this.boxFrameElement.removeEventListener('dragend', callback);
                this.moving = false;
            }
            this.boxFrameElement.addEventListener('dragend', callback);
            const sx: number = e.clientX; 
            const sy: number = e.clientY;
        })*/

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
        this.boxFrameElement.addEventListener('mousedown', function(event){
            /**ブロック編集時にブロック作成操作が実行されないようにする用 */
            event.stopPropagation();
        })
        

        /** フォーカスを受け取れるようにする 
         * 参考: https://www.mitsue.co.jp/knowledge/blog/a11y/201912/23_0000.html */
        this.boxFrameElement.setAttribute('tabindex', '-1');
        this.boxFrameElement.classList.add(`${type}-box-frame`)

        this.init().then(end=>{
            this.applyValue();//初期値の反映
        });

        this.assign(this.editorElement, this.displayElement, this.maskElement);
        this.toggleToView();
        
        this.makeResizer(-1,-1);
        this.makeResizer(1,1);
        this.makeResizer(1,-1);
        this.makeResizer(-1,1);
        this.makeResizer(0,0);

        this.dataTypeIconElement = this.createIcon(this.type, 'data-type-icon');
        this.dataTypeIconElement.setAttribute('draggable', 'true')
        this.boxFrameElement.appendChild(this.dataTypeIconElement);

        this.getId()
        .then(id => {
            this.dataTypeIconElement.addEventListener('dragstart', (event: DragEvent) => {
                console.log("ev-t-setdata",event.dataTransfer?.setData)
                event.dataTransfer?.setData("application/drag-box-id", id);
                //console.log(event.dataTransfer)
                console.log(event.dataTransfer?.items)
            });
        });

        this.boxFrameElement.addEventListener("dragover", (event) => {
            // ドロップできるように既定の動作を停止
            event.preventDefault();
        });
        this.boxFrameElement.addEventListener('drop', (event: DragEvent) => {
            const droppedElementId: string = String(event.dataTransfer?.getData("application/drag-box-id"));
            
            const droppedBlock = NoteController.getBlockById(droppedElementId);
            if(droppedBlock)this.dropped(droppedBlock);
        });
        
    }
    dropped(block: Block<any, any>) {
        switch(block.type) {
            case 'image':
                break;
            case 'text':
                break;
            case 'canvas':
                break;
        }
    }

    createIcon(imageSrc, className): HTMLDivElement {
        const iconFrame = document.createElement('div');
        const img: HTMLImageElement = document.createElement('img');
        img.src = `${window.location.origin}/static/note/image/ui_icon_${imageSrc}.png`;
        iconFrame.classList.add(className);
        iconFrame.appendChild(img);
        return iconFrame;
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
                            Modal.infoContainer, 
                            'info-bar', 
                            'データの反映に失敗しました\n'+messageText,
                            7000,
                        );
                        noticeModal.init();
                        noticeModal.show();
                    })();
                }
            }
        });
    }

    remove() {
        this.noteController.containerManager.container.removeChild(this.boxFrameElement);
        
        this.onContainer = false;
    }
    
    append() {
        this.noteController.containerManager.container.appendChild(this.boxFrameElement);
        
        this.onContainer = true;
    }

    coordToString(coord: number): string {
        return `${coord}px`;
    }

    /*coordToString(globalCoord: number): string {
        return `${this.noteController.getLocalCoordinate(globalCoord)}px`;
    }*/

    makeBoxFrame<T>(tagName: string):T {
        const box: HTMLElement = document.createElement(tagName);
        box.style.left =   this.coordToString(this.x);
        box.style.top =    this.coordToString(this.y);
        box.style.width =  this.coordToString(this.width);
        box.style.height = this.coordToString(this.height);
        box.classList.add('box-frame');
        return box as T;
    }
    
    makeBoxContent<T>(tagName: string):T {
        const content: HTMLElement = document.createElement(tagName);
        content.style.left = this.coordToString(0);
        content.style.top =  this.coordToString(0);
        content.classList.add('box-content');
        return content as T;
    }
    
    makeResizer(offset_x: number, offset_y: number):HTMLElement {
        const resizer: HTMLElement = document.createElement('div');
        resizer.style.left = (~~((1+offset_x)/2*100))+'%';
        resizer.style.top =  (~~((1+offset_y)/2*100))+'%';
        resizer.classList.add('resizer', `resizer-${offset_x}-${offset_y}`);
        resizer.setAttribute('draggable', 'true');
        this.boxFrameElement.appendChild(resizer);

        let startX: number;
        let startY: number;
        resizer.addEventListener('dragstart', (event: DragEvent)=>{
            event.stopPropagation();
            startX = event.clientX;
            startY = event.clientY;

            resizer.classList.add('dragging');
            this.boxFrameElement.classList.add('resizing');
        })
        resizer.addEventListener('dragend', (event: DragEvent)=>{
            event.stopPropagation();
            
            /**条件分岐なしで、拡大縮小・移動・全ての座標の計算を同じ式で行うための
             * 自作の関数
             * @param n = -1, 0, 1
             * @returns 0, 1, 1
             * 
             * - n = 1 0 -1
             * - ternary(1, 0, -1) = -1 -1 0
             * ternary(-1 -1 0) = 0 0 1
             * ternary(-ternary(-n)) = relu
             * 
             * (n**∞ + 1)**(1/∞): 0 -> 1, n -> n
             * 
             */
            const ternary = n => ( (n**64 + 1)**(1/64) ) + ( n - ( n + (n ** 2) ** 0.5 ) / 2 );
            
            const movementX: number = event.clientX - startX;
            const movementY: number = event.clientY - startY;
            const resizedWidth =  this.width  + offset_x * (movementX);
            const resizedHeight = this.height + offset_y * (movementY);
            const lackX = ternary(Block.minWidth - resizedWidth  );
            const lackY = ternary(Block.minHeight - resizedHeight);

            const relocatedX = this.x + ternary(-offset_x) * movementX;
            const relocatedY = this.y + ternary(-offset_y) * movementY;

            this.relocate(relocatedX-lackX*ternary(-ternary(offset_x)), relocatedY-     lackY*ternary(-ternary(offset_y)));
            this.resize(resizedWidth-lackX,                    resizedHeight - lackY);
            
            resizer.classList.remove('dragging');
            this.boxFrameElement.classList.remove('resizing');
        })
        return resizer;
    }
    assign(...element: HTMLElement[]) {
        this.boxFrameElement.replaceChildren(...element);
    }
    toggleToEditor() {
        
        //this.boxFrameElement.setAttribute('draggable', 'false');
        this.editorIsActive = true;
        this.editorElement.classList.add('visible');
        this.displayElement.classList.remove('visible');
        //this.assign(this.editorElment);
    }
    toggleToView() {
        //this.boxFrameElement.setAttribute('draggable', 'true');
        this.editorIsActive = false;
        this.editorElement.classList.remove('visible');
        this.displayElement.classList.add('visible');
        
        //this.assign(this.displayElement);
    }
    lockPosition() {
        this.positionLocked = true;
        //this.boxFrameElement.setAttribute('draggable', 'false');
    }
    
    unlockPosition() {
        this.positionLocked = false;
        //this.boxFrameElement.setAttribute('draggable', 'true');
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
            update_keys: ["x", "y", "width", "height", "value"],
            update_values: [this.x, this.y, this.width, this.height, this.value]
        }});
    }

    update_parameters(update_keys, update_values) {
        for(const [ i, key ] of update_keys.entries()) {
            this[key] = update_values[i];
        }
    }

    render() {
        this.boxFrameElement.style.left = this.coordToString(this.x);
        this.boxFrameElement.style.top = this.coordToString(this.y);
        this.boxFrameElement.style.width = this.coordToString(this.width);
        this.boxFrameElement.style.height = this.coordToString(this.height);
        this.applyValue(true);
    }

    async applyValue(nosynch: boolean = false): Promise<void> {
        this.resetMaskUI();
        if(!nosynch) {
            const applying = {
                update_keys: ["value"],
                update_values: [this.value]
            }
            if(this.noteController.functionManager.activeFunctions['autosave'] === true) {
                await this.callAPI('POST', { body: applying});
            }
            if(this.noteController.functionManager.activeFunctions['live']) {
                socket.emit("update", this.id, applying.update_keys, applying.update_values);
            }
        }
    }

    async resize(width: number, height: number, nosynch=false): Promise<void> {
        width = Math.max(Block.minWidth, width);
        height = Math.max(Block.minHeight, height);

        if(this.noteController.functionManager.activeFunctions['nudge'] === true) {
            width -= width%this.noteController.functionManager.nudgeSize;
            height -= height%this.noteController.functionManager.nudgeSize;
        }

        this.boxFrameElement.style.width =  
            this.coordToString(this.width = width);
        this.boxFrameElement.style.height = 
            this.coordToString(this.height = height);
        
        const applying = {
            update_keys: ["width","height"],
            update_values: [this.width, this.height]
        };

        if(nosynch)return;
        
        if(this.noteController.functionManager.activeFunctions['autosave'] === true) {
            await this.callAPI('POST', { body: applying});
        }
        if(this.noteController.functionManager.activeFunctions['live']) {
            socket.emit("update", this.id, applying.update_keys, applying.update_values);
        }
    }
    async relocate(x: number, y: number): Promise<void> {
        //console.log('relocate: ', x, y, this.type);
        if(this.noteController.functionManager.activeFunctions['nudge'] === true) {
            x -= x%this.noteController.functionManager.nudgeSize;
            y -= y%this.noteController.functionManager.nudgeSize;
        }
        this.x = x;
        this.y = y;
        this.boxFrameElement.style.left = this.coordToString(x);
        this.boxFrameElement.style.top =  this.coordToString(y);
        
        const applying = {
            update_keys: ["x","y"],
            update_values: [this.x, this.y]
        };
        if(this.noteController.functionManager.activeFunctions['autosave'] === true) {
            await this.callAPI('POST', { body: applying});
        }
        if(this.noteController.functionManager.activeFunctions['live']) {
            socket.emit("update", this.id, applying.update_keys, applying.update_values);
        }
    }
    relayout() {

    }
    deleteElement(element: HTMLElement) {
        const clone = element.cloneNode(true) as HTMLElement; // true: 子要素も複製
        element.replaceWith(clone);
        clone.remove();
    }
    async dump(nosync=false): Promise<void> {
        this.deleteElement(this.editorElement);
        this.deleteElement(this.displayElement);
        this.deleteElement(this.boxFrameElement);
        if(nosync)return;
        /**
         * データベースから削除されているが通知が届いていない場合に、
         * 値の更新をリクエストしてしまうことを防止するためawaitしない。
         * (あとで削除失敗した場合のリカバリーも追加する必要あり)
         * 
         * 削除リクエスト ⇒ データベースから削除 ⇒ 通知
         */ 
        await this.callAPI('DELETE', { force: true } );
        this.dumped = true;

        if(this.noteController.functionManager.activeFunctions['live']) {
            socket.emit("delete", this.id);
        }
    }
}

class TextBlock extends Block<HTMLTextAreaElement,HTMLParagraphElement> {
    embedBlockList: { [key: string]: Block<any, any> } = {};
    constructor( range: rangeData, text: string = '', id: string|Promise<string> , noteController: NoteController) {
        super({ EditorType: 'textarea', DisplayType: 'p' }, range, id, noteController, text, 'text', );
    }
    async init() {
        await super.init();
        this.editorElement.value = this.value;
        this.editorElement.classList.add('text-editor');

        this.displayElement.classList.add('text-view');
        this.displayElement.classList.add('markdown-text-default');
        
        this.boxFrameElement.addEventListener('dblclick', (e)=>{
            
            //イベントの伝搬を中止
            e.stopPropagation();
            if(this.editorIsActive) {
                this.update();
                this.toggleToView();
            } else {
                this.toggleToEditor();
            }
        });
        this.boxFrameElement.addEventListener('focusout', (e)=>{
            if(this.editorIsActive) {
                this.update();
                this.toggleToView();
            }
        })
        //this.boxFrameElement.addEventListener('focusout', (e)=>{
        //});
    }
    getValue() {
        return this.editorElement.value;
    }
    async applyValue(nosynch: boolean = false) {
        this.displayElement.innerHTML = this.parseMarkdown();
        this.applyEmbed();
        await super.applyValue(nosynch);
    }
    applyEmbed() {
        for(const [ id, block ] of Object.entries(this.embedBlockList)) {
            const anchor = document.getElementById(this.getEmbedAnchor(id));
            if(anchor) {
                if(block.onContainer)block.remove();
                block.boxFrameElement.style.position = 'static';
                
                //document.replaceChild(block.boxFrameElement, anchor);
                anchor.appendChild(block.boxFrameElement);
            } else {
                if(!block.onContainer)block.append();
                block.boxFrameElement.style.position = 'absolute';
                delete this.embedBlockList[id];
            }
        }
    }
    getEmbedAnchor(id: string): string {
        return `embed_anchor-${NoteController.getFullObjectIdByObjectId(id)}`;
    }
    parseMarkdown(): string {
        const escapedStr: string = escapeHTML(this.value);//仕方なくinnerHTML使用中:ミス注意。
        
        const parsedAsMarkdown: string = escapedStr 
        .replace(/\*\*((.*?(\n)?)*?)\*\*/g, '<span class="markdown-bold">$1</span>')
        .replace(/\*((.*?(\n)?)*?)\*/g, '<span class="markdown-italic">$1</span>')
        .replace(/\_\_((.*?(\n)?)*?)\_\_/g, '<span class="markdown-under-line">$1</span>')
        .replace(/\_((.*?(\n)?)*?)\_/g, '<span class="markdown-italic">$1</span>')
        .replace(/\~\~((.*?(\n)?)*?)\~\~/g, '<span class="markdown-strike-through">$1</span>')
        .replace(/\[color\=([a-z]+?)\]((.*?(\n)?)*?)\[\/color\]/g,'<span style="color:$1">$2</span>')
        .replace(/\[size\=([0-9]+?)\]((.*?(\n)?)*?)\[\/size\]/g,'<span style="font-size:$1px">$2</span>')
        .replace(/\[embed\=([A-Za-z0-9]+?)\]/g, (function(match, p1: string): string {
            const target = NoteController.getBlockById(NoteController.getFullObjectIdByObjectId(p1));
            if(target) {
                if(!(p1 in this.embedBlockList))this.embedBlockList[p1] = target;
                return `<div class="embed-anchor" id=${this.getEmbedAnchor(p1)}></div>`;
            } else {
                return `[embed not found]`;
            }
        }).bind(this));
        
        return parsedAsMarkdown;
    }

    async dropped(block: Block<any, any>): void {

        const objectId = NoteController.getObjectIdFromFullObjectId(await block.getId());
        
        this.value += `\n[embed=${objectId}]`;
        this.editorElement.value = this.value;
        await this.applyValue();
    }
}

class ImageBlock extends Block<HTMLInputElement,HTMLImageElement> {
    constructor( range: rangeData, URI: string = '', id: string|Promise<string>, noteController: NoteController ) {
        super({ 'EditorType': 'input', 'DisplayType': 'img' }, range, id, noteController, URI, 'image');
    }

    async init() {
        await super.init();
        this.editorElement.setAttribute('type', 'file');
        this.editorElement.setAttribute('accept', 'image/*');

        this.displayElement.setAttribute('src', this.value||SPACER_URI);
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
        this.toggleToView();
    }
    async compress(imageFile) {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1024
        }
    
        const compressed = await imageCompression(imageFile, options);
        
        return compressed;
    }

    async getValue(): Promise<string> {
        const fileReader = new FileReader();
        const files = this.editorElement.files!;
        return await new Promise<string>(async(resolve, reject)=>{
            fileReader.addEventListener('load', (e: ProgressEvent<FileReader>)=> {
                if(e.target instanceof FileReader && typeof e.target.result === 'string') {
                    resolve(e.target.result);
                } else {
                    reject(new Error('[ImageBlock-update]想定通りではありません'))
                }
            });
            //input[type="file"] と input[type="button"] を分ける型はない
            if(files.length) {
                fileReader.readAsDataURL(await this.compress(files[0]));
            } else {
                resolve(SPACER_URI);
            }
        });
    }
    async applyValue(nosynch: boolean = false) {
        this.displayElement.setAttribute('src', this.value);
        this.toggleToView();
        await super.applyValue(nosynch);
    }
    relayout(): void {
        this.displayElement.onload = ()=> {
            this.resize(this.width, this.displayElement.naturalHeight/this.displayElement.naturalWidth*this.width, true);
        }
    }
    toggleToView() {
        if(this.value) {
            super.toggleToView();
        } else {
            super.toggleToEditor();
        }
        //this.assign(this.displayElement);
    }
}

class canvasBlock extends Block<HTMLCanvasElement,HTMLImageElement> {
    private lastX: number | null;
    private lastY: number | null;

    bindedEvents: [string, (any)=>void][];
    editingContext: CanvasRenderingContext2D;
    penSize: number = 3;
    penColor: string = '#000000';
    penOpacity: number = 1;
    drawing: boolean = false;

    background: HTMLCanvasElement;
    backgroundContext: CanvasRenderingContext2D;

    editingRange: Range;

    constructor( range: rangeData, URI: string = SPACER_URI, id: string|Promise<string>, noteController: NoteController ) {
        super({ 'EditorType': 'canvas', 'DisplayType': 'img' }, range, id, noteController, URI, 'canvas');
        
        this.bindedEvents = [];
    }
    async init() {
        await super.init();

        const editingContext = this.editorElement.getContext('2d');
        //background(非描画領域も含めた全データ)はサーバーに保存済みのデータで初期化
        // = サーバーに保存後、アプリを閉じたら非描画部分は消える
        const background = document.createElement('canvas');
        background.width = this.width;
        background.height = this.height;
        this.background = background;
        const backgroundContext = this.background.getContext('2d');
        this.editingRange = new Range(0, 0, this.width, this.height);

        if(backgroundContext !== null && editingContext !== null) {
            this.backgroundContext = backgroundContext;
            this.editingContext = editingContext;
            if(this.value !== SPACER_URI) {
                const image = new Image();
                image.addEventListener("load", () => {
                    this.backgroundContext.drawImage(image, 0, 0);
                });
                image.src = this.value;
            }
        }

        this.editorElement.setAttribute('width', String(this.width));
        this.editorElement.setAttribute('height', String(this.height));

        this.displayElement.setAttribute('src', this.value);
        this.displayElement.setAttribute('alt', '');
        this.boxFrameElement.addEventListener('dblclick', e=>{
            
            //イベントの伝搬を中止
            e.stopPropagation();
            if(this.editorIsActive) {
                this.deactivateCanvasEditor();
            } else {
                this.activateCanvasEditor();
            }
        });

        this.lastX = null;
        this.lastY = null;
    }
    activateCanvasEditor() {
        
        this.lockPosition();
        this.toggleToEditor();
        this.paintStart();

        //新しく書き始めるときは描画システム関連用の変数の状態をリセットする
        this.drawing = false;
    }
    deactivateCanvasEditor() {
        
        this.unlockPosition();
        this.toggleToView();
        this.paintEnd();

        //キャンバスの編集を終えるときは、編集情報を適用する
        this.update();
    }
    paintStart() {
        this.bindedEvents = [
            //仕様: クリックしながら動かして線を書く
            ['mousemove', (e: MouseEvent)=>{
                this.paintAt(e);
            }],
            ['mousedown', ()=>{
                this.newLine();
                this.applyLineStyle();

                this.drawing = true;
            }],
            ['mouseup', ()=>{
                this.drawing = false;

                //仕様: 線一本の変更ごとに保存
                this.update();
            }],

            //仕様: マウスがボックス外に出たら編集終了
            ['mouseout', ()=>{
                
                this.deactivateCanvasEditor();
            }],
            ['mouseleave', ()=>{

                this.deactivateCanvasEditor();
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
    applyLineStyle() {
        this.editingContext.globalAlpha = this.penOpacity;
        this.editingContext.lineCap = 'round';
        this.editingContext.lineWidth =  this.penSize;
        this.editingContext.strokeStyle = this.penColor;
    }
    newLine() {
        this.lastX = null;
        this.lastY = null;
    }
    paintAt(e) {
        if(!this.drawing) return;

        const rect = this.editorElement.getBoundingClientRect();

        const x = (e.clientX - rect.left) * (this.editorElement.width / rect.width);
        const y = (e.clientY - rect.top) * (this.editorElement.height / rect.height);
        this.editingContext.beginPath();

        const lastX = this.lastX || x;
        const lastY = this.lastY || y;

        this.editingContext.moveTo(lastX, lastY);

        this.editingContext.lineTo(x, y);

        this.editingContext.stroke();

        this.lastX = x;
        this.lastY = y;
    }
    getValue() {
        return this.editorElement.toDataURL();
    }

    /**
     * 左上から縮小 ⇒ relocate & ( -= moveMent )
     * 左上から拡大 ⇒ relocate & ( -= movement )
     * 右下から縮小 ⇒ += movement
     * 右下から拡大 ⇒ += movement 
     * 
     * rangeが -n (n: 自然数)
     * (x + |-x|)/2 ⇒ n: n, -n: 0
     * 
     * 
     */
    async applyValue(nosynch: boolean = false) {
        //左上から拡大・縮小されることは想定していない
        if(this.background.width < this.editingRange.width) {
            //this.background.setAttribute('width', String(this.editingRange.width));
            this.background.width = this.editingRange.width;
        }
        
        if(this.background.height < this.editingRange.height) {
            this.background.height = this.editingRange.height;
           // this.background.setAttribute('height', String(this.editingRange.height));
        }
        this.backgroundContext.clearRect(...this.editingRange.spread());
        this.backgroundContext.drawImage(this.editorElement, ...this.editingRange.spread());
        this.displayElement.setAttribute('src', this.value);
        await super.applyValue(nosynch);
    }
    async resize(width, height, nosynch=false) {
        
        this.editorElement.setAttribute('width', width);
        this.editorElement.setAttribute('height', height);
        this.editingRange.width = width;
        this.editingRange.height = height;

        this.editingContext.clearRect(...this.editingRange.shape().spread());
        this.editingContext.drawImage(this.background, ...new Range(0, 0, this.background.width, this.background.height).relative(this.editingRange).spread());
        
        this.value = this.getValue();
        this.applyValue();
        super.resize(width, height, nosynch);
    }
}

class NoteController {
    functionManager: FunctionManager;
    containerManager: ContainerManager;
    static contentLoadingBar: HTMLElement;
    static pageObjects: Block<any,any>[] = [];
    constructor(functionManager: FunctionManager, containerManager: ContainerManager) {
        this.functionManager = functionManager;
        this.containerManager = containerManager;

    }
    static getFullObjectIdByObjectId(objectId: string): string {
        return NOTE_ID + '-' + objectId;
    }
    static getObjectIdFromFullObjectId(fullObjectId: string): string {
        return fullObjectId.split('-')[1];
    }
    normalizeRange(target: DOMRect | Range): Range {
        // 幅をノーマライズの基準にする
        const ref = this.containerManager.range.width;

        const normalizedX = ( target.x - this.containerManager.range.x ) / ref;
        const normalizedY = ( target.y - this.containerManager.range.y ) / ref;
        const normalizedHeight = target.height / ref;
        return new Range(normalizedX, normalizedY, 1, normalizedHeight);
    }
    getLocalCoordinate(n: number): number {
        return n * this.containerManager.range.width;
    }
    
    static allBlockSyncServer() {
        NoteController.pageObjects.forEach(block=>block.syncServer());
    }
    static async makePageData(): Promise<blockData[]> {
        return await Promise.all(NoteController.pageObjects.map(object=>object.makeData()));
    }
    static applyPageData(...pageData: blockData[]): void {
        for( const boxData of pageData ) {
            const { range, id, type, value } = boxData;
            NoteController.pageObjects.push(makeBlockObject(range, type, id, value));
        }
        setTimeout(NoteController.endLoadingAnimation,250);
    }
    static applyServerData() {
        NoteController.startLoadingAnimation();
        fetch(NOTE_API_URL+NOTE_ID)
            .then(result=>result.json())
            .then(pageData=>{
                NoteController.pageObjects.forEach(obj=>obj.dump(true));
                const initialPageObjects = pageData.children;
                NoteController.applyPageData(...initialPageObjects);
            });
    }
    static startLoadingAnimation() {
        if(NoteController.contentLoadingBar && contentLoadingDisplay) {
            NoteController.contentLoadingBar.classList.add('animate-bar');
            
            contentLoadingDisplay.style.transition = 'height 0s 0s';
            contentLoadingDisplay.style.height = 'var(--loading-bar-height)';
        }
    }
    static endLoadingAnimation() {
        console.log('END_LOADING_ANIMATION')
        if(NoteController.contentLoadingBar && contentLoadingDisplay) {
            NoteController.contentLoadingBar.classList.remove('animate-bar');
            //contentLoadingBar.style.animationPlayState = 'paused'; // ロード完了時にアニメーションを停止
            NoteController.contentLoadingBar.style.width = '100%'; // 最後にバーを100%に設定
            NoteController.contentLoadingBar.style.transition = 'width 1s'
            
            contentLoadingDisplay.style.transition = 'height 1s 1s';
            contentLoadingDisplay.style.height = '0%';
        }
    }
    static getBlockById(target_id: string): Block<any, any> | undefined {
        return NoteController.pageObjects.find(object=>object.id === target_id);
    }
}


const loadingBarElm = document.getElementById('content-loading-bar');
if(loadingBarElm)NoteController.contentLoadingBar = loadingBarElm;
class FunctionManager {

    activeFunctions: {[key: string]: boolean} = {
        'nudge': false,
        'putbox': false,
        'autosave': true,
        'live': false,
    };
    onActivate: {[key: string]: ()=>void} = {
        /*'putbox': ()=> {
            if( UiDrawMode.selectedItem !== undefined ) {
                putBox();
            }
        },*/
       'live': NoteController.applyServerData,
       'autosave': NoteController.allBlockSyncServer,
    }
    shortcutMap: {[key: string]: string} = {
        'n': 'nudge',
        'b': 'putbox',
    };
    nudgeSize: number = 32;

    constructor(noteSettings: { nudgeSize?: number } = {} ) {
        if(noteSettings.nudgeSize) this.nudgeSize = noteSettings.nudgeSize;
        document.addEventListener('keydown', this.onKeydown.bind(this));
        document.addEventListener('keyup', this.onKeyup.bind(this));
    }

    onKeydown(event: KeyboardEvent) {
        this.activateFunctions(this.shortcutMap?.[event.key]);
    }
    onKeyup(event: KeyboardEvent) {
        this.deactiveFunctions(this.shortcutMap?.[event.key]);
    }
    
    activateFunctions(functionName: string) {  
        if(this.activeFunctions?.[functionName] !== undefined) {
            this.activeFunctions[functionName] = true;
            if(functionName in this.onActivate) {
                this.onActivate[functionName]();
            }
        }
        console.table(this.activeFunctions)
    }
    deactiveFunctions(functionName: string) {
        if(this.activeFunctions?.[functionName] !== undefined) {        
            this.activeFunctions[functionName] = false;
        }

    }
}

const functionManager: FunctionManager = new FunctionManager({ nudgeSize: 32 });


const noteController: NoteController = new NoteController(functionManager, containerManager);



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


/*applyPageData(initialPageObjects);
pageObjects.push(...initialPageObjects);*/



class Modal {
    static container: HTMLElement;
    static infoContainer: HTMLElement;
    message: string;
    type: string;
    modalElement?: HTMLDivElement;
    lifetime: number;
    initialized: boolean = false;
    container: HTMLElement;
    
    constructor(container: HTMLElement, type: string, message: string, lifetime?: number) {
        this.type = type;
        this.message = message;
        this.lifetime = lifetime || Infinity;
        this.container = container;
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
            this.container.appendChild(this.modalElement);
            if(Number.isFinite(this.lifetime)) {
                setTimeout(this.delete.bind(this), this.lifetime)
            }
        }
    }
    close() {
        if(this.proveInitialized(this.modalElement, this.init.bind(this))) {
            this.container.removeChild(this.modalElement);
        }
    }
    delete() {
        this.close();
    }
    static init() {
        const container:HTMLElement|null = document.getElementById('modal-container');
        if( container !== null ) {
            Modal.container = container;
        } else {
            const container = document.createElement('div');
            container.setAttribute('id', `modal-container`); 
            container.setAttribute('class', 'modal-container');
            document.body.appendChild(container);
            Modal.container = container;
        }
        const infoContainer: HTMLElement = document.createElement('div');
        infoContainer.setAttribute('id','info-container');
        infoContainer.setAttribute('class','info-container');
        Modal.infoContainer = infoContainer;
        Modal.container.appendChild(Modal.infoContainer);
    }
}
Modal.init();

async function sleep(time) {
    return new Promise((resolve)=>{
        setTimeout(resolve,time);
    })
}
async function helloUser() {
    const m1 = new Modal(Modal.infoContainer, 'info-bar', 'Hello',4000);
    m1.init();
    m1.show();
    await sleep(650);
    const m2 = new Modal(Modal.infoContainer, 'info-bar', 'You can use it',4000);
    m2.init();
    m2.show();
    await sleep(650);
    const m3 = new Modal(Modal.infoContainer, 'info-bar', 'as you like',4000);
    m3.init();
    m3.show();
    await sleep(650);
    const m4 = new Modal(Modal.infoContainer, 'info-bar', '**Memolive**',4000);
    m4.init();
    m4.show();
}
//helloUser();

class UiDrawMode {
    static allTypes: UiDrawMode[] = [];
    static selectedItem?: UiDrawMode = undefined;
    element: HTMLElement;
    type: string;
    constructor(element: HTMLElement, type: string) {
        this.type = type;
        this.element = element;
        UiDrawMode.allTypes.push(this);
        this.element.addEventListener('click', (event: MouseEvent) => {
            this.selected();
        });
        this.element.addEventListener('mouseover', (event: MouseEvent) => {
            this.focused();
        });
        this.element.addEventListener('mouseleave', (event: MouseEvent) => {
            if(UiDrawMode.selectedItem !== undefined)UiDrawMode.selectedItem.focused();
        });
    }
    selected() {
        if(UiDrawMode.selectedItem && this.type === UiDrawMode.selectedItem.type) {
            this.unselected();
            UiDrawMode.selectedItem = undefined;
        } else {
            UiDrawMode.allTypes.forEach(uiItem=> uiItem.unselected());
            this.element.classList.add('ui-selected');
            UiDrawMode.selectedItem = this;
            putBox();
        }
    }
    unselected() {
        this.element.classList.remove('ui-selected');
        this.unfocused();
    }
    focused() {
        UiDrawMode.allTypes.forEach(uiItem=> uiItem.unfocused());
        this.element.classList.add('ui-forcused');
    }
    unfocused() {
        this.element.classList.remove('ui-forcused');
    }
}

class UiFunctions {
    static applying: { [key: string]: UiFunctions } = {};
    type: string;
    activated: boolean = false;
    element: HTMLElement;
    noteController: NoteController;
    constructor(uiLamp: HTMLElement, type: string, noteController: NoteController) {
        this.element = uiLamp;
        this.type = type;
        this.element.addEventListener('click', (event: MouseEvent)=>{
           this.activate.apply(this); 
        });
        this.noteController = noteController;
        if(this.noteController.functionManager.activeFunctions[this.type]) {
            this.activate();
        }
        UiFunctions.applying[this.type] = this;
    }
    lock() {
        this.element.classList.add('locked');
    }
    unlock() {
        this.element.classList.remove('locked');
    }
    activate() {
        if(this.activated) {
            this.deactivate();
        } else {
            this.noteController.functionManager.activateFunctions(this.type);
            this.activated = true;
            this.element.classList.add('activate');
        }
    }
    deactivate() {
        this.noteController.functionManager.deactiveFunctions(this.type);
        this.activated = false;
        this.element.classList.remove('activate');
    }
}

const uiButtonElements:HTMLCollectionOf<Element> = document.getElementsByClassName('ui-button');
for(const uiItem of uiButtonElements) {
    if (uiItem instanceof HTMLElement) {
        new UiDrawMode(uiItem, uiItem.id.replace('ui-item-for_',''));
    }
}
const uiLampElements:HTMLCollectionOf<Element> = document.getElementsByClassName('ui-lamp');
for(const uiLamp of uiLampElements) {
    if (uiLamp instanceof HTMLElement) {
        new UiFunctions(uiLamp, uiLamp.id.replace('ui-item-for_',''), noteController);
    }
}

UiFunctions.applying['live']?.lock?.();

let putBoxId = 0;
function putBox() {
    const PROCESS_ID = ++putBoxId;
    let xs:number[] = [];
    let ys:number[] = [];
    const cancel = () => {
        noteController.containerManager.container.removeEventListener('mouseup', onmouseup);
        noteController.containerManager.container.removeEventListener('onmouseout', cancel);
        noteController.containerManager.container.removeEventListener('onmouseleave', cancel);
    }
    const onmousedown = (e)=>{
        xs.push(e.clientX);
        ys.push(e.clientY);
        noteController.containerManager.container.removeEventListener('mousedown', onmousedown);

        // mouseupは離した地点の要素に対して行われるので、要素買いに出た場合の処理が必要
        noteController.containerManager.container.addEventListener('mouseup', onmouseup);
        noteController.containerManager.container.addEventListener('onmouseout', cancel);
        noteController.containerManager.container.addEventListener('onmouseleave', cancel);
    }
    const onmouseup = (e)=>{
        const rect = noteController.containerManager.container.getBoundingClientRect();
        xs.push(e.clientX);
        ys.push(e.clientY);
        const mx = Math.min(...xs);
        const my = Math.min(...ys);
        const Mx = Math.max(...xs);
        const My = Math.max(...ys);
        const range = {
            x: mx - rect.left,
            y: my - rect.top,
            width: Math.max(Mx - mx,150), 
            height: Math.max(My - my, 100)
        };
        if(UiDrawMode.selectedItem && PROCESS_ID === putBoxId) {
            const boxType = UiDrawMode.selectedItem.type;
            const putData = {
                range: range, type: boxType
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
                const parsed = await response.json();
                return parsed['assigned_id'];
                //} catch(e) {
                //}
            })();

            //登録が完了したときに、cssアニメーションで作成後のボックスのふちを光らせる
            const block = makeBlockObject(range, boxType, idPromise);
            NoteController.pageObjects.push(block);
            (async()=>{
                const id = await Promise.any([idPromise]);
                
                socket.emit('create', range, boxType, id);
            })();
        }

        UiDrawMode.selectedItem?.unselected();
        
        xs = [];
        ys = [];
        noteController.containerManager.container.removeEventListener('mouseup', onmouseup);
        NoteController.makePageData().then(console.log);
    }

    noteController.containerManager.container.addEventListener('mousedown', onmousedown);
}
putBox();
const saveUiElement: HTMLElement|null = document.getElementById('ui-save');
const sendEffectBarElement: HTMLElement|null = document.getElementById('send-effect-bar');
if(saveUiElement) {
    saveUiElement.addEventListener('click', (event: MouseEvent) => {
                
        const message = new Modal(
            Modal.infoContainer, 
            'info-bar',
            'セーブしました',
            3000
        );
        message.init();
        message.show();

        NoteController.allBlockSyncServer();

        //sendEffectBarElement.classList.add('send-effect-bar');
    });
}


function escapeHTML(str: string) {
    const temp = document.createElement('div'); 
    temp.textContent = str; 
    return temp.innerHTML; 
}

NoteController.applyServerData();

class SocketIOManager {
    socket: any;
    constructor() {
    }
    tryAccessServer() {
           
        const noticeModal = new Modal(
            Modal.infoContainer, 
            'info-bar', 
            'WebSocketサーバーへ接続中...',
            1000,
        );
        noticeModal.init();
        noticeModal.show();

        const script = document.createElement('script');
        script.src = SOCKET_IO_LIBURL;
        script.async = true;

        // 成功時
        script.onload = () => {
          console.log(`socketIO successfully loaded`);
          this.start.apply(this);
        };
        script.onerror = (e) => {
            console.error(e);
            setTimeout(this.tryAccessServer.bind(this),1000);
            document.head.removeChild(script);
        }
        
        document.head.appendChild(script); 
    }
    start() {
        let socket;
        try {
            socket = this.connectSocketIO();
        } catch(e) {
            console.error(e);
        }
        if(socket) {
            this.socket = socket;
            this.listenChannel();
        } else {
            const noticeModal = new Modal(
                Modal.infoContainer, 
                'info-bar', 
                'WebSocketサーバーへの接続に失敗しました',
                10000,
            );
            //noticeModal.init();
            //noticeModal.show();
            this.tryAccessServer();
        }
    }
    connectSocketIO(): any|null {
        if(io) {
            const socket = io("http://localhost:3000", {
                transportOptions: {
                    polling: {
                        extraHeaders: {
                            "self-proclaimed-referer": window.location.href,  //書き換えられるリスクあり
                        }
                    }
                }
            });
            return socket;
        } else {
            return null;
        }
    }
    listenChannel() {

        this.socket.on("reconnect", (attempt) => {
            //window.location.reload(true);
            const noticeModal = new Modal(
                Modal.infoContainer, 
                'info-bar', 
                'WebSocketサーバーへの接続が復旧しました',
                3000,
            );
            noticeModal.init();
            noticeModal.show();
            UiFunctions.applying['live']?.unlock?.();
        });
        this.socket.on("connect", () => {
            // ...//window.location.reload(true);
            const noticeModal = new Modal(
                Modal.infoContainer, 
                'info-bar', 
                'WebSocketサーバーへの接続しました',
                3000,
            );
            noticeModal.init();
            noticeModal.show();

            UiFunctions.applying['live']?.unlock?.();
        });
        this.socket.on("disconnect", (reason, details) => {
            // ...
            const noticeModal = new Modal(
                Modal.infoContainer, 
                'info-bar', 
                'WebSocketサーバーへの接続が切れました',
                5000,
            );
            noticeModal.init();
            noticeModal.show();
            UiFunctions.applying['live']?.lock?.();
        });

        this.socket.on("update", (target_id, update_keys, update_values) => {
            if(noteController.functionManager.activeFunctions["live"])  {
                const target = NoteController.getBlockById(target_id);

                if(target !== undefined) {
                    target.update_parameters(update_keys, update_values);
                    console.log(target.x,target.y,target.width,target.height,target.value);
                    target.render();
                } else {
                    console.warn('ボックスがない')
                }
            }
        });

        this.socket.on("delete", (id) => {
            if(noteController.functionManager.activeFunctions["live"])  {
                const target = NoteController.getBlockById(id);
                if(target !== undefined) {
                    target.dump();
                } else {
                    console.warn('ボックスがない')
                }
            }
        });

        this.socket.on("create", (range, type, id) => {
            if(noteController.functionManager.activeFunctions["live"])  {
                const block = makeBlockObject(range, type, id);
                NoteController.pageObjects.push(block);
            }
        });
    }
}
const socketIOManager = new SocketIOManager();
socketIOManager.start();