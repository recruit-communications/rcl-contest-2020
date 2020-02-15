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
    type Command = [number, number, number];

    function array2d(n: number, initial: number) : number[][] {
        let ret = Array(n);
        for (let i = 0; i < n; i++) {
            ret[i] = Array(n);
            for (let j = 0; j < n; j++) {
                ret[i][j] = initial;
            }
        }
        return ret;
    }

    class InputFile {
        public N: number;
        public M: number;
        public A: number[][];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content);

            this.N = parser.getInt();
            this.M = parser.getInt();
            parser.getNewline();

            const A = this.A = array2d(this.N, 0);
            for (let i = 0; i < this.N; i++) {
                for (let j = 0; j < this.N; j++) {
                    A[i][j] = parser.getInt();
                }
                parser.getNewline();
            }
        }
    }

    class OutputFile {
        public commands: Command[];

        constructor(inputFile: InputFile, content: string) {
            const parser = new framework.FileParser('<output-file>', content);
            this.commands = [];
            while (!parser.isEOF()) {
                const r = parser.getInt();
                if (r == -1) {
                    this.commands.push([-1, -1, -1]);
                    parser.getNewline();
                }
                else {
                    const c = parser.getInt();
                    const d = parser.getWord();
                    const dd = "DRUL".indexOf(d);
                    if (r < 0 || r >= inputFile.N) parser.reportError(`座標が範囲外です`);
                    if (c < 0 || c >= inputFile.N) parser.reportError(`座標が範囲外です`);
                    if (d.length != 1 || dd < 0) parser.reportError(`塗る向きは URDL のいずれかである必要があります`);
                    this.commands.push([r, c, dd]);
                    parser.getNewline();
                    }
            }
            if (this.commands.length != inputFile.M) parser.reportError(`操作回数が ${inputFile.M} 回ではありません`);
        }
    }

    class TesterFrame {
        static DR = [1, 0, -1, 0];
        static DC = [0, 1, 0, -1];

        public score: number;

        constructor(public turn: number,
                    public input: InputFile,
                    public output: OutputFile,
                    public previousFrame: TesterFrame | null,
                    public command: [number, number, number] | null,
                    public B: number[][]
        ) {
            this.score = calcScore(input.N, input.A, this.B);
            if (this.score == input.N * input.N) {
                this.score += input.M - output.commands.length;
            }
        }

        static createInitialFrame(input: InputFile, output: OutputFile) : TesterFrame {
            const B = array2d(input.N, 4);
            B[0][0] = 0;
            B[0][input.N-1] = 1;
            B[input.N-1][0] = 2;
            B[input.N-1][input.N-1] = 3;

            return new TesterFrame(0, input, output, null, null, B);
        }

        static createNextFrame(previousFrame: TesterFrame, command: Command) : TesterFrame {
            const B = previousFrame.B.map(x => Object.assign({}, x));  // deep copy
            const [r, c, d] = command;

            if (r == -1) {
                // pass
                return new TesterFrame(previousFrame.turn + 1, previousFrame.input, previousFrame.output, previousFrame, command, B);;
            }

            const color = previousFrame.turn % 4;

            if (B[r][c] != color) {
                throw Error(`${previousFrame.turn+1}行目 塗り始めの位置の色がペンの色と異なります : ${r} ${c}`);
            }

            const dr = TesterFrame.DR[d];
            const dc = TesterFrame.DC[d];
            const N = previousFrame.input.N;

            for (let i = 0; i < 5; i++) {
                const nr = r + (i + 1) * dr;
                const nc = c + (i + 1) * dc;
                if (0 <= nr && nr < N && 0 <= nc && nc < N) {
                    B[nr][nc] = color;
                }
                else break;
            }

            return new TesterFrame(previousFrame.turn + 1, previousFrame.input, previousFrame.output, previousFrame, command, B);
        }
    }

    function calcScore(N: number, A: number[][], B: number[][]) {
        let score = 0;
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (A[i][j] == B[i][j]) score++;
            }
        }
        return score;
    }

    class Tester {
        public frames: TesterFrame[];

        constructor(inputContent: string, outputContent: string) {
            try {
                const input = new InputFile(inputContent);
                const output = new OutputFile(input, outputContent);
                this.frames = [TesterFrame.createInitialFrame(input, output)];
                for (const command of output.commands) {
                    let lastFrame = this.frames[this.frames.length - 1];
                    this.frames.push(TesterFrame.createNextFrame(lastFrame, command));
                }
            }
            catch (e) {
                alert(e);
                throw e;
            }
        }
    }

    class Visualizer {
        private readonly canvas: HTMLCanvasElement;
        private readonly ctx: CanvasRenderingContext2D;
        private readonly height: number;
        private readonly width: number;
        private readonly strokeStyles: [string, string, string, string];
        private readonly fillStyles: [string, string, string, string, string];
        private readonly fillStylesHighlighted: [string, string, string, string, string];
        private readonly bgColor = '#111';
        private readonly cellRound = 3;
        private readonly cellMargin = 1;
        private commandInput: HTMLInputElement;
        private scoreInput: HTMLInputElement;

        constructor() {
            this.canvas = <HTMLCanvasElement>document.getElementById("canvas");
            const size = 600;
            this.height = size;  // pixels
            this.width = size;  // pixels
            this.ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.commandInput = <HTMLInputElement>document.getElementById("commandInput");
            this.scoreInput = <HTMLInputElement>document.getElementById("scoreInput");

            const hueR = 0;
            const hueB = 240;
            const hueG = 120;
            const hueY = 60;

            const sat1 = '80%';
            const lig1 = '40%';
            this.strokeStyles = [
                `hsl(${hueR}, ${sat1}, ${lig1})`, // r
                `hsl(${hueB}, ${sat1}, 45%)`, // b
                `hsl(${hueG}, ${sat1}, ${lig1})`, // g
                `hsl(${hueY}, ${sat1}, ${lig1})`, // y
            ];

            const sat2 = '60%';
            const lig2 = '50%';
            this.fillStyles = [
                `hsl(${hueR}, ${sat2}, ${lig2})`, // r
                `hsl(${hueB}, 70%, 55%)`, // b
                `hsl(${hueG}, ${sat2}, ${lig2})`, // g
                `hsl(${hueY}, ${sat2}, ${lig2})`, // y
                `rgb(72, 72, 68)`, // gray
            ];

            const sat3 = '70%';
            const lig3 = '70%';
            this.fillStylesHighlighted = [
                `hsl(${hueR}, ${sat3}, ${lig3})`, // r
                `hsl(${hueB}, 80%, 75%)`, // b
                `hsl(${hueG}, ${sat3}, ${lig3})`, // g
                `hsl(${hueY}, ${sat3}, ${lig3})`, // y
                `rgb(100, 100, 100)`, // gray
            ];

            this.ctx.lineJoin = 'round';
            this.ctx.font = '20px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
        }

        public draw(frame: TesterFrame, prev: TesterFrame | null) {
            const command = frame.command;
            if (command == null) {
                this.commandInput.value = "";
            }
            else if (command[0] == -1) {
                this.commandInput.value = "PASS";
            }
            else {
                this.commandInput.value = `${command[0]} ${command[1]} ${"DRUL"[command[2]]}`;
            }
            this.scoreInput.value = frame.score.toString();
            const cellSize = this.height / frame.input.N;
            if (prev) {
                this.drawPartial(frame, prev, cellSize);
            } else {
                this.drawAll(frame, cellSize);
            }
        }

        private drawPartial(frame: TesterFrame, prev: TesterFrame, cellSize: number) {
            const fillCommand = (command: Command|null, fillStyles: [string, string, string, string, string]) => {
                if (command == null) return;
                const [r, c, d] = command;
                const dr = TesterFrame.DR[d];
                const dc = TesterFrame.DC[d];
                const N = frame.input.N;
    
                for (let i = 0; i < 6; i++) {
                    const nr = r + i * dr;
                    const nc = c + i * dc;
                    if (0 <= nr && nr < N && 0 <= nc && nc < N) {
                        this.eraseCell(nr, nc, cellSize);
                        this.drawCell(nr, nc, frame.input.A[nr][nc], frame.B[nr][nc], cellSize, fillStyles);
                    }
                    else break;
                }
            };
            fillCommand(prev.command, this.fillStyles);
            fillCommand(frame.command, this.fillStylesHighlighted);
            this.drawTriangle(frame.command, cellSize);
        }

        private drawAll(frame: TesterFrame, cellSize: number) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            const N = frame.input.N;

            const [mir, mar, mic, mac] = frame.command == null ? [-1, -1, -1, -1] : this.calcAffectedArea(N, frame.command);

            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const fillStyles = (mir <= r && r <= mar && mic <= c && c <= mac) ? this.fillStylesHighlighted : this.fillStyles;
                    this.drawCell(r, c, frame.input.A[r][c], frame.B[r][c], cellSize, fillStyles);
                }
            }
            this.drawTriangle(frame.command, cellSize);
        }

        private drawCell(y: number, x: number, a: number, b: number, cellSize: number, fill: [string, string, string, string, string]) {
            this.ctx.strokeStyle = this.strokeStyles[a];
            this.ctx.fillStyle = fill[b];
            this.ctx.lineWidth = this.cellRound;
            const cr = this.ctx.lineWidth;
            const cr2 = cr / 2;
            this.ctx.strokeRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
            this.ctx.fillRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
        }

        static tx = [
            [0.5,  0.85, 0.15],
            [0.85, 0.15, 0.15],
            [0.5,  0.85, 0.15],
            [0.15, 0.85, 0.85],
        ];
        static ty = [
            [0.85, 0.15, 0.15],
            [0.5,  0.85, 0.15],
            [0.15, 0.85, 0.85],
            [0.5,  0.85, 0.15],
        ];
        private drawTriangle(command: Command|null, cellSize: number) {
            if (command == null || command[0] == -1) return;
            const [y, x, d] = command;
            const tx = Visualizer.tx;
            const ty = Visualizer.ty;

            this.ctx.strokeStyle = this.ctx.fillStyle = "black";
            this.ctx.beginPath();
            this.ctx.moveTo((x + tx[d][0]) * cellSize, (y + ty[d][0]) * cellSize);
            this.ctx.lineTo((x + tx[d][1]) * cellSize, (y + ty[d][1]) * cellSize);
            this.ctx.lineTo((x + tx[d][2]) * cellSize, (y + ty[d][2]) * cellSize);
            this.ctx.closePath();
            this.ctx.fill();
        }

        private eraseCell(y: number, x: number, cellSize: number) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(x * cellSize + this.cellMargin, y * cellSize + this.cellMargin, cellSize - this.cellMargin * 2, cellSize - this.cellMargin * 2);
        }

        private calcAffectedArea(N: number, command: Command) {
            const [r, c, d] = command;
            let mir = r;
            let mar = r;
            let mic = c;
            let mac = c;
            const dr = TesterFrame.DR[d];
            const dc = TesterFrame.DC[d];

            for (let i = 0; i < 5; i++) {
                const nr = r + (i + 1) * dr;
                const nc = c + (i + 1) * dc;
                if (0 <= nr && nr < N && 0 <= nc && nc < N) {
                    mir = Math.min(mir, nr);
                    mar = Math.max(mar, nr);
                    mic = Math.min(mic, nc);
                    mac = Math.max(mac, nc);
                }
                else break;
            }
            return [mir, mar, mic, mac];
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
