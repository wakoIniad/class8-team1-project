import { Block } from './Block.ts';
import { rangeData } from './type/rangeData.ts';
import { SPACER_URI } from './constants.ts';

export class TextBlock extends Block<HTMLTextAreaElement,HTMLParagraphElement> {
    constructor(container: HTMLElement, range: rangeData, text: string = '' ) {
        super(container, {EditorType: 'textarea', DisplayType: 'p' }, range, text, 'text', );
    }
    init() {
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
    applyValue() {
        this.displayElement.textContent = this.value;
    }
}