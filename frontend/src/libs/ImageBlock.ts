import { Block } from './Block.ts';
import { rangeData } from './type/rangeData.ts';
import { SPACER_URI } from './constants.ts';

export class ImageBlock extends Block<HTMLInputElement,HTMLImageElement> {
    constructor(container:HTMLElement, range: rangeData, URI: string = SPACER_URI ) {
        super(container, { 'EditorType': 'input', 'DisplayType': 'img' }, range, URI, 'image');
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
                resolve(SPACER_URI);
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
