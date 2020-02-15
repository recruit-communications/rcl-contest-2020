module framework {
    export class FileParser {
        private readonly filename: string;
        private readonly content: string[][];
        private y: number;
        private x: number;

        constructor(filename: string, content: string) {
            this.filename = filename;
            this.content = [];
            for (const line of content.trim().split('\n')) {
                const words = line.trim().split(new RegExp('\\s+'));
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }

        public isEOF(): boolean {
            return this.content.length <= this.y;
        }

        public getWord(): string {
            if (this.isEOF()) {
                this.reportError('a word expected, but EOF');
            }
            if (this.content[this.y].length <= this.x) {
                this.reportError('a word expected, but newline');
            }
            const word = this.content[this.y][this.x];
            this.x += 1;
            return word;
        }

        public getInt(): number {
            const word = this.getWord();
            if (!word.match(new RegExp('^[-+]?[0-9]+$'))) {
                this.reportError(`a number expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            return parseInt(word);
        }

        public getNewline() {
            if (this.isEOF()) {
                this.reportError('newline expected, but EOF');
            }
            if (this.x < this.content[this.y].length) {
                this.reportError(`newline expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            this.x = 0;
            this.y += 1;
        }

        public reportError(msg: string) {
            msg = `${this.filename}: line ${this.y + 1}: ${msg}`;
            alert(msg);
            throw new Error(msg);
        }
    }

    export class FileSelector {
        public callback: (inputContent: string, outputContent: string) => void;

        private inputFile: HTMLInputElement;
        private outputFile: HTMLInputElement;
        private reloadButton: HTMLInputElement;

        constructor(callback: (inputContent: string, outputContent: string) => void) {
            this.callback = callback;
            this.inputFile = <HTMLInputElement>document.getElementById("inputFile");
            this.outputFile = <HTMLInputElement>document.getElementById("outputFile");
            this.reloadButton = <HTMLInputElement>document.getElementById("reloadButton");

            this.reloadFilesClosure = () => {
                this.reloadFiles();
            };
            this.inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }

        private readonly reloadFilesClosure: () => void;

        reloadFiles() {
            if (this.inputFile.files == null || this.inputFile.files.length == 0) return;
            loadFile(this.inputFile.files[0], (inputContent: string) => {
                if (this.outputFile.files == null || this.outputFile.files.length == 0) return;
                loadFile(this.outputFile.files[0], (outputContent: string) => {
                    this.reloadButton.classList.remove('disabled');
                    if (this.callback !== undefined) {
                        this.callback(inputContent, outputContent);
                    }
                });
            });
        }
    }

    export class RichSeekBar {
        private readonly callback: (curValue: number, preValue: number) => void;

        private readonly seekRange: HTMLInputElement;
        private readonly seekNumber: HTMLInputElement;
        private readonly fpsInput: HTMLInputElement;
        private readonly firstButton: HTMLInputElement;
        private readonly prevButton: HTMLInputElement;
        private readonly playButton: HTMLInputElement;
        private readonly nextButton: HTMLInputElement;
        private readonly lastButton: HTMLInputElement;
        private readonly runIcon: HTMLElement;
        private readonly playClosure: () => void;
        private readonly stopClosure: () => void;
        private intervalId: number | null;

        constructor(callback: (curValue: number, preValue: number) => void) {
            this.callback = callback;
            this.seekRange = <HTMLInputElement>document.getElementById("seekRange");
            this.seekNumber = <HTMLInputElement>document.getElementById("seekNumber");
            this.fpsInput = <HTMLInputElement>document.getElementById("fpsInput");
            this.firstButton = <HTMLInputElement>document.getElementById("firstButton");
            this.prevButton = <HTMLInputElement>document.getElementById("prevButton");
            this.playButton = <HTMLInputElement>document.getElementById("playButton");
            this.nextButton = <HTMLInputElement>document.getElementById("nextButton");
            this.lastButton = <HTMLInputElement>document.getElementById("lastButton");
            this.runIcon = <HTMLElement>document.getElementById("runIcon");
            this.intervalId = null;

            this.setMinMax(-1, -1);
            this.seekRange.addEventListener('change', () => {
                this.setValue(parseInt(this.seekRange.value));
            });
            this.seekNumber.addEventListener('change', () => {
                this.setValue(parseInt(this.seekNumber.value));
            });
            this.seekRange.addEventListener('input', () => {
                this.setValue(parseInt(this.seekRange.value));
            });
            this.seekNumber.addEventListener('input', () => {
                this.setValue(parseInt(this.seekNumber.value));
            });
            this.fpsInput.addEventListener('change', () => {
                if (this.intervalId !== null) {
                    this.play();
                }
            });
            this.firstButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getMin());
            });
            this.prevButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getValue() - 1);
            });
            this.nextButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getValue() + 1);
            });
            this.lastButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getMax());
            });
            this.playClosure = () => {
                this.play();
            };
            this.stopClosure = () => {
                this.stop();
            };
            this.playButton.addEventListener('click', this.playClosure);
        }

        public setMinMax(min: number, max: number) {
            this.seekRange.min = this.seekNumber.min = min.toString();
            this.seekRange.max = this.seekNumber.max = max.toString();
            this.seekRange.step = this.seekNumber.step = '1';
            this.setValue(min);
        }

        public getMin(): number {
            return parseInt(this.seekRange.min);
        }

        public getMax(): number {
            return parseInt(this.seekRange.max);
        }

        public setValue(value: number) {
            value = Math.max(this.getMin(),
              Math.min(this.getMax(), value));  // clamp
            const preValue = this.seekNumber.valueAsNumber;
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value, preValue);
            }
        }

        public getValue(): number {
            return parseInt(this.seekRange.value);
        }

        public getDelay(): number {
            const fps = parseInt(this.fpsInput.value);
            return Math.floor(1000 / fps);
        }

        private resetInterval() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        public play() {
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) {  // if last, go to first
                this.setValue(this.getMin());
            }
            this.resetInterval();
            this.intervalId = setInterval(() => {
                if (this.getValue() == this.getMax()) {
                    this.stop();
                } else {
                    this.setValue(this.getValue() + 1);
                }
            }, this.getDelay());
        }

        public stop() {
            this.playButton.removeEventListener('click', this.stopClosure);
            this.playButton.addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        }
    }

    const loadFile = (file: File, callback: (value: string) => void) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            if (typeof reader.result == 'string') callback(reader.result);
        }
    };

    const saveUrlAsLocalFile = (url: string, filename: string) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        const evt = document.createEvent('MouseEvent');
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
    };

    export class FileExporter {
        constructor(canvas: HTMLCanvasElement) {
            const saveAsImage = <HTMLInputElement>document.getElementById("saveAsImage");

            saveAsImage.addEventListener('click', () => {
                saveUrlAsLocalFile(canvas.toDataURL('image/png'), 'canvas.png');
            });
        }
    }
}

module visualizer {
    type Cell = [number, number]; // color, value
    type Board = Cell[][];
    type Command = number;

    function createInitialBoard(n: number, w: number, initial: Cell) : Board {
        let ret = Array(n);
        for (let i = 0; i < n; i++) {
            ret[i] = Array(w);
            for (let j = 0; j < w; j++) {
                ret[i][j] = initial;
            }
        }
        return ret;
    }

    function isEmptyBlock(b: Cell) {
        return b[0] === -1;
    }

    class InputFile {
        public N: number;
        public H: number;
        public W: number;
        public K: number;
        public V: number;
        public cells: Cell[] = [];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content);

            this.N = parser.getInt();
            this.W = parser.getInt();
            // visualizerで描画する高さ
            this.H = Math.floor(this.N/this.W) + 25;
            this.K = parser.getInt();
            this.V = parser.getInt();
            parser.getNewline();
            for (let i = 0; i < this.N; i++) {
                const c = parser.getInt();
                const v = parser.getInt();
                if (c < 0 || c >= this.K) parser.reportError(`color ${c} is out of range`);
                if (v < 1 || v > this.V) parser.reportError(`value ${v} is out of range`);
                parser.getNewline();
                this.cells.push([c, v]);
            }
            // if (!parser.isEOF()) parser.reportError('Too long file.');
        }
    }

    class OutputFile {
        public commands: Command[] = [];

        constructor(content: string, inputFile: InputFile) {
            const N = inputFile.N;
            const W = inputFile.W;
            const parser = new framework.FileParser('<output-file>', content.trim());
            for (let i = 0; i < N; i++) {
                const col = parser.getInt();
                if (col < 0 || col >= W) parser.reportError(`${col} is out of range.`);
                this.commands.push(col);
                parser.getNewline();
            }
            if (!parser.isEOF()) parser.reportError(`Too long file.`);
        }
    }

    class TesterFrame {
        public scores: number[];
        public line: number;

        constructor(public turn: number,
                    public input: InputFile,
                    public output: OutputFile,
                    public previousFrame: TesterFrame | null,
                    public row: number | null,
                    public command: Command | null,
                    public B: Board,
        ) {
            this.scores = previousFrame ? previousFrame.scores.slice(): [];
            const prevLine = previousFrame ? previousFrame.line : 0;
            const [score, line] = calcScoreAndLine(input.H, input.W, input.K, prevLine, B);
            if (score > 0) {
                this.scores.push(score);
            }
            this.line = line;
        }

        static createInitialFrame(input: InputFile, output: OutputFile) : TesterFrame {
            const B = createInitialBoard(input.H, input.W, [-1, -1]);

            return new TesterFrame(0, input, output, null, null, null, B);
        }

        static createNextFrame(previousFrame: TesterFrame, command: Command) : TesterFrame {
            const B = previousFrame.B.map(x => Object.assign({}, x));  // deep copy

            const cell = previousFrame.input.cells[previousFrame.turn];

            let row = null;
            for (let r = previousFrame.line; r < previousFrame.input.H; r++) {
                if (isEmptyBlock(B[r][command])) {
                    B[r][command] = cell;
                    row = r;
                    break;
                }
            }

            return new TesterFrame(previousFrame.turn + 1, previousFrame.input, previousFrame.output, previousFrame, row, command, B);
        }

        get totalScore() {
            let sum = 0;
            for (let score of this.scores) sum += score;
            return sum;
        }

        get average() {
            return this.line > 0 ? this.totalScore / this.line : 0;
        }
    }

    function calcScoreAndLine(N: number, W: number, K: number, line: number, B: Board) {
        let score = 0;
        for (let r = line; r < N; r++) {
            for (let c = 0; c < W; c++) {
                const color = B[r][c][0];
                if (color === -1) return [score, r];
            }
            const values = Array(K).fill(0);
            for (let c = 0; c < W; c++) {
                const [color, value] = B[r][c];
                values[color] += value;
            }
            score += Math.max(...values);
        }
        throw Error('calc score error');
    }

    class Tester {
        public frames: TesterFrame[];

        constructor(inputContent: string, outputContent: string) {
            const input = new InputFile(inputContent);
            const output = new OutputFile(outputContent, input);
            this.frames = [TesterFrame.createInitialFrame(input, output)];
            for (const command of output.commands) {
                let lastFrame = this.frames[this.frames.length - 1];
                this.frames.push(TesterFrame.createNextFrame(lastFrame, command));
            }
        }
    }

    class Visualizer {
        private readonly canvas: HTMLCanvasElement;
        private readonly ctx: CanvasRenderingContext2D;
        private readonly dpr: number;
        private readonly height: number;
        private readonly width: number;
        private readonly divideNum: number;
        private readonly dividedWidth: number;
        private readonly scoreWidth: number;
        private readonly rowNumWidth: number;
        private readonly rowNumMargin: number;
        private readonly offsetTop: number;
        private readonly effectGradHeight: number;
        private readonly fillStyles: [string, string, string, string, string, string];
        private readonly bgColor = '#111';
        private readonly scoreBgColor = '#fff';
        private readonly cellRound = 0;
        private readonly cellMargin = 0;
        private readonly nextCellNums = 10;
        private colInput: HTMLInputElement;
        private scoreInput: HTMLInputElement;
        private lineInput: HTMLInputElement;
        private averageInput: HTMLInputElement;
        private dividedH = 50; // TODO inputに合わせてきれいに初期化したい

        constructor() {
            this.canvas = <HTMLCanvasElement>document.getElementById("canvas");
            // デバイスの解像度に合わせてcanvasの解像度を調整
            this.dpr = window.devicePixelRatio || 1;
            const height = this.canvas.height;
            const width = this.canvas.width;
            // 表示上のcanvasはサイズを変更しない（dpr倍緻密に描画される）
            this.canvas.style.height = height + 'px';
            this.canvas.style.width = width + 'px';
            // 実際のcanvasのサイズはdpr倍にする
            this.height = this.canvas.height = height * this.dpr;  // pixels
            this.width = this.canvas.width = width * this.dpr;  // pixels
            this.divideNum = 3; // 何分割するか
            this.dividedWidth = this.width/this.divideNum;
            this.scoreWidth = 20 * this.dpr; // pixels
            this.rowNumWidth = 30 * this.dpr; // pixels
            this.rowNumMargin = 2 * this.dpr; // pixels
            this.offsetTop = 30 * this.dpr; // pixels
            this.effectGradHeight = this.height/5; // pixels
            this.ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.colInput = <HTMLInputElement>document.getElementById("colInput");
            this.scoreInput = <HTMLInputElement>document.getElementById("scoreInput");
            this.lineInput = <HTMLInputElement>document.getElementById("lineInput");
            this.averageInput = <HTMLInputElement>document.getElementById("averageInput");
            const lo = 40;
            const md = 80;
            const hi = 190;
            this.fillStyles = [
                `rgb(${hi}, ${hi}, ${hi})`, // light gray
                `rgb(${hi}, ${lo}, ${lo})`, // r
                `rgb(${lo}, ${lo}, ${hi})`, // b
                `rgb(${lo}, ${hi}, ${lo})`, // g
                `rgb(${hi}, ${hi}, ${lo})`, // y
                `rgb(${md}, ${md}, ${md})`, // dark gray
            ];
            this.ctx.lineJoin = 'round';
            this.ctx.font = `${9*this.dpr}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            // canvas左下を基準点にする（ただし文字等は反転するので描画前にscale(1, -1)が必要）
            this.ctx.translate(0, this.height);
            this.ctx.scale(1, -1);
        }

        public draw(frame: TesterFrame, prev: TesterFrame | null) {
            const command = frame.command;
            this.colInput.value = command == null ? "" : `${command}`;
            this.scoreInput.value = frame.totalScore.toString();
            this.lineInput.value = frame.line.toString();
            this.averageInput.value = frame.average.toFixed(2);
            this.dividedH = Math.floor(frame.input.H / this.divideNum);
            const cellHeight = (this.height - this.offsetTop) * this.divideNum / frame.input.H;
            const cellWidth = (this.dividedWidth - this.scoreWidth - this.rowNumWidth) / frame.input.W;
            if (prev) {
                this.drawPartial(frame, prev, cellHeight, cellWidth);
            } else {
                this.drawAll(frame, cellHeight, cellWidth);
            }
        }

        private drawPartial(frame: TesterFrame, prev: TesterFrame, cellHeight: number, cellWidth: number) {
            if (frame.command == null) return;
            {
                const r = prev.row;
                const c = prev.command;
                if (r != null && c != null) {
                    this.eraseEffect(r, c, cellHeight, cellWidth);
                }
            }
            {
                const r = frame.row;
                const c = frame.command;
                if (r != null && c != null) {
                    this.drawEffect(r, c, cellHeight, cellWidth);
                    this.drawCell(r, c, frame.B[r][c], cellHeight, cellWidth);
                }
                const last = frame.scores.length - 1;
                if (last >= 0) {
                    this.drawScore(last, frame.scores[last], cellHeight);
                }
            }
            this.drawNext(frame.input.cells.slice(frame.turn, frame.turn + this.nextCellNums), cellHeight, cellWidth);
        }

        private drawAll(frame: TesterFrame, cellHeight: number, cellWidth: number) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = this.scoreBgColor;

            const H = frame.input.H;
            const W = frame.input.W;
            this.drawRowNums(H, cellHeight);
            for (let r = 0; r < H; r++) {
                for (let c = 0; c < W; c++) {
                    if (frame.B[r][c][0] != -1) {
                        this.drawCell(r, c, frame.B[r][c], cellHeight, cellWidth);
                    }
                }
            }

            for(let i = 0; i < frame.scores.length; i++) {
                this.drawScore(i, frame.scores[i], cellHeight);
            }

            const r = frame.row;
            const c = frame.command;
            if (r != null && c != null) {
                this.drawEffect(r, c, cellHeight, cellWidth);
            }
            this.drawNext(frame.input.cells.slice(frame.turn, frame.turn + this.nextCellNums), cellHeight, cellWidth);
        }

        private drawCell(y: number, x: number, b: Cell, cellHeight: number, cellWidth: number) {
            const [c, v] = b;
            if (c === -1)  return;
            this.ctx.save();
            const fill = this.fillStyles;
            this.ctx.strokeStyle = fill[c];
            this.ctx.fillStyle = fill[c];
            this.ctx.lineWidth = this.cellRound;
            const cr = this.ctx.lineWidth;

            const OffsetX = this.OffsetX(y) + this.rowNumWidth;
            y = y%this.dividedH;

            this.ctx.strokeRect(x * cellWidth + this.cellMargin + cr + OffsetX,y * cellHeight + this.cellMargin + cr, cellWidth - this.cellMargin * 2 - cr, cellHeight - this.cellMargin * 2 - cr);
            this.ctx.fillRect(x * cellWidth + this.cellMargin + cr + OffsetX, y * cellHeight + this.cellMargin + cr, cellWidth - this.cellMargin * 2 - cr, cellHeight - this.cellMargin * 2 - cr);

            this.ctx.scale(1, -1);
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.fillText(v.toString(), x * cellWidth + cellWidth / 2 + OffsetX, -(y*cellHeight + cellHeight/2));
            this.ctx.restore();
        }

        private drawScore(y: number, score: number, cellHeight: number) {
            const OffsetX = this.dividedWidth + this.OffsetX(y);
            y = y%this.dividedH;

            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(OffsetX - this.scoreWidth, -(y*cellHeight + cellHeight), this.scoreWidth, cellHeight);
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.fillText(score.toString(), OffsetX - this.scoreWidth/2, -(y*cellHeight + cellHeight/2));
            this.ctx.restore();
        }

        private drawEffect(y: number, x: number, cellHeight: number, cellWidth: number) {
            const OffsetX = this.OffsetX(y) + this.rowNumWidth;
            y = y%this.dividedH;
            const cr = this.ctx.lineWidth;
            const x0 = x * cellWidth + this.cellMargin + cr + OffsetX;
            const y0 = (y + 1) * cellHeight;
            const w = cellWidth - this.cellMargin * 2 - cr;
            const h = this.effectGradHeight;

            const gradient = this.ctx.createLinearGradient(x0, y0 + h, x0, y0);
            gradient.addColorStop(0, this.bgColor);
            gradient.addColorStop(1, "blue");

            this.ctx.save();
            // this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x0, y0, w, h);
            this.ctx.restore();
        }

        private drawRowNums(nums: number, cellHeight: number) {
            for (let i = 0; i < nums; i++) {
                const OffsetX = this.OffsetX(i);
                const y = i % this.dividedH;
                this.ctx.save();
                this.ctx.scale(1, -1);
                this.ctx.fillStyle = 'rgb(150, 150, 150)';
                this.ctx.textAlign = 'right';
                this.ctx.fillText((i + 1).toString(), OffsetX + this.rowNumWidth - this.rowNumMargin, -(y * cellHeight + cellHeight / 2));
                this.ctx.restore();
            }
        }

        private eraseEffect(y: number, x: number, cellHeight: number, cellWidth: number) {
            const OffsetX = this.OffsetX(y) + this.rowNumWidth;
            y = y%this.dividedH;

            this.ctx.save();
            this.ctx.fillStyle = this.bgColor;
            const cr = this.ctx.lineWidth;
            this.ctx.fillRect(x * cellWidth + this.cellMargin + cr + OffsetX, (y + 1) * cellHeight, cellWidth - this.cellMargin * 2 - cr + 1, this.effectGradHeight);
            this.ctx.restore();
        }

        private drawNext(cells: Cell[], cellHeight: number, cellWidth: number) {
            const y = this.height - this.offsetTop/2;
            const offsetX = this.rowNumWidth + 15*this.dpr;
            this.ctx.save();
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, this.height, 1.5 * this.nextCellNums * cellWidth + offsetX, -this.offsetTop/2);
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText('Next:', this.rowNumWidth, -(y + cellHeight/2));
            this.ctx.restore();
            for (let i = 0; i < cells.length; i++) {
                const [c, v] = cells[i];
                const cr = this.ctx.lineWidth;
                this.ctx.save();
                this.ctx.fillStyle = this.fillStyles[c];
                this.ctx.fillRect(1.5 * i * cellWidth + this.cellMargin + cr + offsetX, y, cellWidth - this.cellMargin * 2 - cr, cellHeight - this.cellMargin * 2 - cr);
                this.ctx.scale(1, -1);
                this.ctx.fillStyle = 'rgb(255, 255, 255)';
                this.ctx.fillText(v.toString(), 1.5 * i * cellWidth + cellWidth / 2 + offsetX, -(y + cellHeight/2));
                this.ctx.restore();
            }
        }

        private OffsetX(y: number) {
            const col = Math.floor(y / this.dividedH);
            return this.dividedWidth * col;
        }

        public getCanvas(): HTMLCanvasElement {
            return this.canvas;
        }
    }

    export class App {
        public visualizer: Visualizer;
        public tester: Tester | null = null;
        public loader: framework.FileSelector;
        public seek: framework.RichSeekBar;
        public exporter: framework.FileExporter;

        constructor() {
            this.visualizer = new Visualizer();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas());
            this.seek = new framework.RichSeekBar((curValue: number, preValue: number) => {
                if (this.tester) {
                    if (preValue == curValue - 1) {
                        this.visualizer.draw(this.tester.frames[curValue], this.tester.frames[preValue]);
                    } else {
                        this.visualizer.draw(this.tester.frames[curValue], null);
                    }
                }
            });

            this.loader = new framework.FileSelector((inputContent: string, outputContent: string) => {
                this.tester = new Tester(inputContent, outputContent);
                this.seek.setMinMax(0, this.tester.frames.length - 1);
                this.seek.setValue(this.tester.frames.length - 1);
                this.visualizer.draw(this.tester.frames[this.tester.frames.length - 1], null);
            });
        }
    }
}

window.onload = () => {
    new visualizer.App();
};
