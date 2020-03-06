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
            this.intervalId = window.setInterval(() => {
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
    class Command {
        constructor(public op: string, public r0: number = -1, public c0: number = -1, public r1: number = -1, public c1: number = -1) {}
        public toString() {
            if (this.op === '-') {
                return "";
            }
            else if (this.op === 'P') {
                return [this.op, this.r0, this.c0, this.r1, this.c1].join(' ');
            }
            else {
                return this.op;
            }
        }
    }

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
        public P: number;
        public M: number;
        public A: number[][];
        public B: [number, number] = [-1, -1];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content);

            this.N = parser.getInt();
            this.P = parser.getInt();
            this.M = parser.getInt();
            parser.getNewline();

            const B : string[] = [];

            for (let i = 0; i < this.N; i++) {
                B.push(parser.getWord());
                parser.getNewline();
            }

            const A = this.A = array2d(this.N, 0);
            for (let i = 0; i < this.N; i++) {
                const S = parser.getWord();
                for (let j = 0; j < this.N; j++) {
                    A[i][j] = S.charCodeAt(j) - 0x40;  // 'A' を 1 に数値変換している
                    if (B[i][j] == 'x') A[i][j] = ~A[i][j];  // 柱の有無を ~ で反転して表している
                    else if (B[i][j] == 'o') this.B = [i, j];
                }
                parser.getNewline();
            }
        }
    }

    class OutputFile {
        public commands: Command[];

        constructor(public inputFile: InputFile, content: string) {
            const parser = new framework.FileParser('<output-file>', content);
            this.commands = [];
            while (!parser.isEOF()) {
                const c = parser.getWord();
                if (c == 'P') {
                    const r0 = parser.getInt();
                    const c0 = parser.getInt();
                    const r1 = parser.getInt();
                    const c1 = parser.getInt();
                    parser.getNewline();
                    if (r0 < 0 || r0 >= inputFile.N) parser.reportError(`座標が範囲外です`);
                    if (c0 < 0 || c0 >= inputFile.N) parser.reportError(`座標が範囲外です`);
                    if (r1 < 0 || r1 >= inputFile.N) parser.reportError(`座標が範囲外です`);
                    if (c1 < 0 || c1 >= inputFile.N) parser.reportError(`座標が範囲外です`);
                    this.commands.push(new Command(c, r0, c0, r1, c1));
                }
                else if ("DRUL".indexOf(c) != -1) {
                    this.commands.push(new Command(c));
                    parser.getNewline();
                }
                else {
                    parser.reportError(`出力が不正です`);

                }
            }
            if (this.commands.length > inputFile.M) parser.reportError(`操作回数が ${inputFile.M} 回を超えています`);
        }
    }

    class TesterFrame {
        static DR = [1, 0, -1, 0];
        static DC = [0, 1, 0, -1];

        public score: number;
        public last: string;

        constructor(public turn: number,
                    public outputFile: OutputFile,
                    public previousFrame: TesterFrame | null,
                    public command: Command,
                    public A: number[][],
                    public ball: [number, number],
                    public S: number[][],
                    public chains: [string, number][],
                    public P: [number, number][],
        ) {
            this.score = 0;
            let left = 0;

            for (let i = 0; i < chains.length; i++) {
                this.score += chains[i][1] * chains[i][1];
            }
            this.last = chains.length > 0 ? chains[chains.length - 1][0] : '-';
        }

        static createInitialFrame(input: InputFile, output: OutputFile) : TesterFrame {
            const S = array2d(output.inputFile.N, 0);
            return new TesterFrame(0, output, null, new Command('-'), input.A, input.B, S, [], []);
        }

        static createNextFrame(previousFrame: TesterFrame, command: Command) : TesterFrame {
            const A = previousFrame.A.map(x => Object.assign({}, x));  // deep copy

            const isPillar = (r: number, c: number) => {
                return A[r][c] < 0;
            };

            const [op, r0, c0, r1, c1] = [command.op, command.r0, command.c0, command.r1, command.c1];

            if (op == 'P') {
                // move pillar
                if (!isPillar(r0, c0)) {
                    throw Error(`${previousFrame.turn+1}行目 移動元に柱がありません: (${r0}, ${c0})`);
                }
                else if (isPillar(r1, c1)) {
                    throw Error(`${previousFrame.turn+1}行目 柱の移動先に別の柱があります: (${r1}, ${c1})`);
                }
                else if (r1 == previousFrame.ball[0] && c1 == previousFrame.ball[1]) {
                    throw Error(`${previousFrame.turn+1}行目 柱の移動先にロボットがいます: (${r1}, ${c1})`);
                }
                else {
                    A[r0][c0] = ~A[r0][c0];
                    A[r1][c1] = ~A[r1][c1];
                    return new TesterFrame(previousFrame.turn + 1, previousFrame.outputFile, previousFrame, command, A, previousFrame.ball, previousFrame.S, previousFrame.chains, previousFrame.P);
                }
            }

            // move ball
            const dr = TesterFrame.DR["DRUL".indexOf(op)];
            const dc = TesterFrame.DC["DRUL".indexOf(op)];

            const N = previousFrame.outputFile.inputFile.N;
            let [br, bc] = previousFrame.ball;

            while (true) {
                let nr = br + dr;
                let nc = bc + dc;
                if (nr < 0 || nc < 0 || nr >= N || nc >= N) break;
                if (isPillar(nr, nc)) break;
                [br, bc] = [nr, nc];
            }

            var chains = previousFrame.chains;
            var S = previousFrame.S;
            var P = previousFrame.P;

            const streak = (chars: number[]) => {
                if (chars.length == 0) return 0;
                const last = chars[chars.length - 1];
                let ret = 0;
                for (let i = chars.length - 1; i >= 0; i--) {
                    if (chars[i] == last) ret++;
                    else break;
                }
                return ret;
            };

            if (A[br][bc] > 0) {
                const a = String.fromCharCode(A[br][bc] + 0x40);
                chains = chains.concat();
                if (chains.length > 0 && chains[chains.length - 1][0] === a) {
                    chains[chains.length - 1] = [a, chains[chains.length - 1][1] + 1];
                }
                else {
                    chains.push([a, 1]);
                }

                P = P.concat();
                P.push([br, bc]);
                S = previousFrame.S.map(x => Object.assign({}, x));  // deep copy
                const srk = chains[chains.length - 1][1];
                A[br][bc] = 0;
                for (let i = 0; i < srk; i++) {
                    const [sr, sc] = P[P.length-1-i];
                    S[sr][sc] = srk;
                }
            }

            return new TesterFrame(previousFrame.turn + 1, previousFrame.outputFile, previousFrame, command, A, [br, bc], S, chains, P);
        }

        public isPillar(r: number, c: number): boolean {
            return this.A[r][c] < 0;
        }
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
        private readonly boardSize: number;
        private readonly height: number;
        private readonly width: number;
        private readonly bgColor = '#eee';
        private readonly highlightStyle = 'hsl(50, 100%, 94%)';
        private readonly cellMargin = 1;
        private readonly font = '11px Arial, meiryo, sans-serif';
        private readonly boldFont = 'bold 13px Arial, meiryo, sans-serif';
        private commandInput: HTMLInputElement;
        private scoreInput: HTMLInputElement;
        private lastInput: HTMLInputElement;
        private N: number = 40;
        private cellSize: number = 800 / this.N;
        private pillarCoords: [number, number][];
        private chainStyle: string[];

        constructor() {
            this.canvas = <HTMLCanvasElement>document.getElementById("canvas");
            this.height = this.boardSize = 800;
            this.width = 1000;
            this.ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.commandInput = <HTMLInputElement>document.getElementById("commandInput");
            this.scoreInput = <HTMLInputElement>document.getElementById("scoreInput");
            this.lastInput = <HTMLInputElement>document.getElementById("lastInput");

            this.ctx.lineJoin = 'round';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            this.pillarCoords = [];
            {
                const D = 0.4;
                this.pillarCoords.push([-D + 0.5, -D + 0.5]);
                this.pillarCoords.push([-D + 0.5, +D + 0.5]);
                this.pillarCoords.push([+D + 0.5, +D + 0.5]);
                this.pillarCoords.push([+D + 0.5, -D + 0.5]);
            }
            this.chainStyle = [];
            {
                const lim = 100;
                for (let i = 0; i < lim; i++) {
                    this.chainStyle[i] = `hsl(0, ${100*i/lim}%, 83%)`;
                }
            }
        }

        public inputFile(inputFile: InputFile) {
            this.N = inputFile.N;
            this.cellSize = this.height / this.N;
        }

        public draw(frame: TesterFrame, prev: TesterFrame | null) {
            const command = frame.command;
            if (command == null) {
                this.commandInput.value = "";
            }
            else {
                this.commandInput.value = command.toString();
            }
            this.scoreInput.value = frame.score.toString();
            this.lastInput.value = frame.last;
            this.drawAll(frame);
            /*
            if (prev) {
                this.drawPartial(frame, prev, cellSize);
            } else {
                this.drawAll(frame, cellSize);
            }
            */
        }

        /*
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
        */

        private drawAll(frame: TesterFrame) {
            const N = frame.outputFile.inputFile.N;
            const cs = this.cellSize;

            // clear canvas
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.boardSize, this.height);
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(this.boardSize, 0, this.width - this.boardSize, this.boardSize);

            // ball line highlight
            {
                this.ctx.fillStyle = this.highlightStyle;
                this.ctx.fillRect(0, frame.ball[0] * cs, this.boardSize, cs);
                this.ctx.fillRect(frame.ball[1] * cs, 0, cs, this.boardSize);
            }

            // grid lines
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for (let c = 0; c < N + 1; c++) {
                this.ctx.moveTo(c * this.cellSize, 0);
                this.ctx.lineTo(c * this.cellSize, this.boardSize);
            }
            for (let r = 0; r < N + 1; r++) {
                this.ctx.moveTo(0, r * this.cellSize);
                this.ctx.lineTo(this.boardSize, r * this.cellSize);
            }
            this.ctx.stroke();

            // cells
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    this.drawCell(frame, r, c);
                }
            }

            // scores
            {
                this.ctx.save();
                this.ctx.font = this.font;

                this.ctx.fillStyle = this.ctx.strokeStyle = 'black';
                this.ctx.font = '15pt bold';
                this.ctx.fillText(`score: ${frame.score}`, (N + 5) * cs, (0.5 + 0.55) * cs);
                this.ctx.font = this.font;

                for (let i = 0; i < frame.chains.length; i++) {
                    const chain = frame.chains[i];
                    const y = i % (frame.outputFile.inputFile.N - 2);
                    const x = Math.floor(i / (frame.outputFile.inputFile.N - 2));
                    const r = y + 2;
                    const c = N + 1 + x * 2;
                    const txt = `${chain[0]}×${chain[1]}`;

                    this.ctx.fillStyle = this.getChainStyle(chain[1]);
                    this.pillarPath(r, c);
                    this.ctx.fill();
                    this.ctx.fillStyle = this.ctx.strokeStyle = 'black';
                    this.ctx.fillText(chain[0], (c + 0.5) * cs, (r + 0.55) * cs);
                    this.ctx.fillText(chain[1].toString(), (c + 1 + 0.5) * cs, (r + 0.55) * cs);
                }
                this.ctx.restore();
            }
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0)';
            this.ctx.fillRect(this.width - 1, this.height - 1, 1, 1);
        }

        private drawCell(frame: TesterFrame, r: number, c: number) {
            const command = frame.command;
            const [op, r0, c0, r1, c1] = [command.op, command.r0, command.c0, command.r1, command.c1];
            const previousFrame = frame.previousFrame;

            // 背景色
            if (frame.S[r][c] > 0) {
                const s = frame.S[r][c];
                this.ctx.fillStyle = this.getChainStyle(frame.S[r][c]);
                this.pillarPath(r, c);
                this.ctx.fill();
            }

            if (r == r0 && c == c0) {
                // 消えた柱
                this.ctx.strokeStyle = 'darkblue';
                this.ctx.lineWidth = 4;
                this.ctx.setLineDash([3, 2]);
                this.pillarPath(r, c);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                this.ctx.lineWidth = 1;
            }
            else if (r == r1 && c == c1) {
                // 出現した柱
                this.ctx.strokeStyle = 'darkblue';
                this.ctx.lineWidth = 4;
                this.pillarPath(r, c);
                this.ctx.stroke();
                this.ctx.lineWidth = 1;
            }
            else if (frame.isPillar(r, c)) {
                // 柱
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.pillarPath(r, c);
                this.ctx.stroke();
            }
            else if (r == frame.ball[0] && c == frame.ball[1]) {
                // ボールがある
                this.ctx.strokeStyle = 'black';
                this.ctx.fillStyle = '#777';
                this.ctx.lineWidth = 2;
                this.ballPath(r, c);
                this.ctx.fill();
                this.ctx.stroke();
                if (frame.previousFrame) {
                    this.ctx.strokeStyle = this.ctx.fillStyle = '#eee';
                    this.drawChar(frame.previousFrame, r, c);
                }
            }
            else if (previousFrame != null && r == previousFrame.ball[0] && c == previousFrame.ball[1]) {
                // 前フレームにボールがあった
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([2, 2]);
                this.ballPath(r, c);
                this.ctx.stroke();
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([]);
                this.ctx.strokeStyle = this.ctx.fillStyle = '#111';
                this.drawArrow(r, c, op);
            }
            this.ctx.strokeStyle = this.ctx.fillStyle = '#111';
            this.drawChar(frame, r, c);
        }

        private getChainStyle(s: number) {
            return this.chainStyle[Math.min(s, this.chainStyle.length-1)];
        }

        private drawArrow(r: number, c: number, op: string) {
            const i = "DRUL".indexOf(op);
            if (i < 0) return;
            // const arrow = "↓→↑←"[i];
            const arrow = "▼▶▲◀"[i];
            const cs = this.cellSize;
            this.ctx.fillText(arrow, (c + 0.5) * cs, (r + 0.5) * cs);
        }

        private drawChar(frame: TesterFrame, r: number, c: number) {
            const a = frame.A[r][c] >= 0 ? frame.A[r][c] : ~frame.A[r][c];
            const alpha = String.fromCharCode(0x40 + a);
            if (a != 0) {
                const cs = this.cellSize;
                this.ctx.font = alpha == frame.last ? this.boldFont : this.font;
                this.ctx.fillText(alpha, (c + 0.5) * cs, (r + 0.55) * cs);
            }
        }

        private pillarPath(r: number, c: number) {
            const cs = this.cellSize;
            const bx = c * cs;
            const by = r * cs;
            this.ctx.beginPath();
            const P = this.pillarCoords;
            this.ctx.moveTo(bx + P[0][0] * cs, by + P[0][1] * cs);
            for (let i = 1; i < P.length; i++) {
                this.ctx.lineTo(bx + P[i][0] * cs, by + P[i][1] * cs);
            }
            this.ctx.closePath();
        }

        private ballPath(r: number, c: number) {
            const cs = this.cellSize;
            this.ctx.beginPath();
            const ox = (c + 0.5) * cs;
            const oy = (r + 0.5) * cs;
            this.ctx.arc(ox, oy, cs * 0.4, 0, Math.PI * 2, true);
            this.ctx.closePath();
        }

        private eraseCell(r: number, c: number) {
            const cellSize = this.cellSize;
            const cellMargin = this.cellMargin;
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(c * cellSize + cellMargin, r * cellSize + cellMargin, cellSize - cellMargin * 2, cellSize - cellMargin * 2);
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
                this.visualizer.inputFile(this.tester.frames[0].outputFile.inputFile);
                this.visualizer.draw(this.tester.frames[this.tester.frames.length - 1], null);
            });
        }
    }
}

window.onload = () => {
    new visualizer.App();
};
