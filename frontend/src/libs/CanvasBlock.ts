import { Block } from './Block.ts';
import { rangeData } from './type/rangeData.ts';
import { SPACER_URI } from './constants.ts';

export class canvasBlock extends Block<HTMLCanvasElement,HTMLImageElement> {
    bindedEvents: [string, (any)=>void][];
    context: CanvasRenderingContext2D;
    penSize: number = 3;
    penColor: string = '#000000';
    penOpacity: number = 1;
    private lastX: number | null;
    private lastY: number | null;
    constructor(range: rangeData, URI: string = SPACER_URI ) {
        super({ 'EditorType': 'canvas', 'DisplayType': 'img' }, range, URI, 'canvas');
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
        return this.editorElement.toDataURL();
    }
    applyValue() {
        console.log(this.value)
        this.displayElement.setAttribute('src', this.value);
    }
}