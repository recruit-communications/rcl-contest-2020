var framework;
(function (framework) {
    var FileParser = /** @class */ (function () {
        function FileParser(filename, content) {
            this.filename = filename;
            this.content = [];
            for (var _i = 0, _a = content.trim().split('\n'); _i < _a.length; _i++) {
                var line = _a[_i];
                var words = line.trim().split(new RegExp('\\s+'));
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }
        FileParser.prototype.isEOF = function () {
            return this.content.length <= this.y;
        };
        FileParser.prototype.getWord = function () {
            if (this.isEOF()) {
                this.reportError('a word expected, but EOF');
            }
            if (this.content[this.y].length <= this.x) {
                this.reportError('a word expected, but newline');
            }
            var word = this.content[this.y][this.x];
            this.x += 1;
            return word;
        };
        FileParser.prototype.getInt = function () {
            var word = this.getWord();
            if (!word.match(new RegExp('^[-+]?[0-9]+$'))) {
                this.reportError("a number expected, but word " + JSON.stringify(this.content[this.y][this.x]));
            }
            return parseInt(word);
        };
        FileParser.prototype.getNewline = function () {
            if (this.isEOF()) {
                this.reportError('newline expected, but EOF');
            }
            if (this.x < this.content[this.y].length) {
                this.reportError("newline expected, but word " + JSON.stringify(this.content[this.y][this.x]));
            }
            this.x = 0;
            this.y += 1;
        };
        FileParser.prototype.reportError = function (msg) {
            msg = this.filename + ": line " + (this.y + 1) + ": " + msg;
            alert(msg);
            throw new Error(msg);
        };
        return FileParser;
    }());
    framework.FileParser = FileParser;
    var FileSelector = /** @class */ (function () {
        function FileSelector(callback) {
            var _this = this;
            this.callback = callback;
            this.inputFile = document.getElementById("inputFile");
            this.outputFile = document.getElementById("outputFile");
            this.reloadButton = document.getElementById("reloadButton");
            this.reloadFilesClosure = function () {
                _this.reloadFiles();
            };
            this.inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }
        FileSelector.prototype.reloadFiles = function () {
            var _this = this;
            if (this.inputFile.files == null || this.inputFile.files.length == 0)
                return;
            loadFile(this.inputFile.files[0], function (inputContent) {
                if (_this.outputFile.files == null || _this.outputFile.files.length == 0)
                    return;
                loadFile(_this.outputFile.files[0], function (outputContent) {
                    _this.reloadButton.classList.remove('disabled');
                    if (_this.callback !== undefined) {
                        _this.callback(inputContent, outputContent);
                    }
                });
            });
        };
        return FileSelector;
    }());
    framework.FileSelector = FileSelector;
    var RichSeekBar = /** @class */ (function () {
        function RichSeekBar(callback) {
            var _this = this;
            this.callback = callback;
            this.seekRange = document.getElementById("seekRange");
            this.seekNumber = document.getElementById("seekNumber");
            this.fpsInput = document.getElementById("fpsInput");
            this.firstButton = document.getElementById("firstButton");
            this.prevButton = document.getElementById("prevButton");
            this.playButton = document.getElementById("playButton");
            this.nextButton = document.getElementById("nextButton");
            this.lastButton = document.getElementById("lastButton");
            this.runIcon = document.getElementById("runIcon");
            this.intervalId = null;
            this.setMinMax(-1, -1);
            this.seekRange.addEventListener('change', function () {
                _this.setValue(parseInt(_this.seekRange.value));
            });
            this.seekNumber.addEventListener('change', function () {
                _this.setValue(parseInt(_this.seekNumber.value));
            });
            this.seekRange.addEventListener('input', function () {
                _this.setValue(parseInt(_this.seekRange.value));
            });
            this.seekNumber.addEventListener('input', function () {
                _this.setValue(parseInt(_this.seekNumber.value));
            });
            this.fpsInput.addEventListener('change', function () {
                if (_this.intervalId !== null) {
                    _this.play();
                }
            });
            this.firstButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getMin());
            });
            this.prevButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getValue() - 1);
            });
            this.nextButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getValue() + 1);
            });
            this.lastButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getMax());
            });
            this.playClosure = function () {
                _this.play();
            };
            this.stopClosure = function () {
                _this.stop();
            };
            this.playButton.addEventListener('click', this.playClosure);
        }
        RichSeekBar.prototype.setMinMax = function (min, max) {
            this.seekRange.min = this.seekNumber.min = min.toString();
            this.seekRange.max = this.seekNumber.max = max.toString();
            this.seekRange.step = this.seekNumber.step = '1';
            this.setValue(min);
        };
        RichSeekBar.prototype.getMin = function () {
            return parseInt(this.seekRange.min);
        };
        RichSeekBar.prototype.getMax = function () {
            return parseInt(this.seekRange.max);
        };
        RichSeekBar.prototype.setValue = function (value) {
            value = Math.max(this.getMin(), Math.min(this.getMax(), value)); // clamp
            var preValue = this.seekNumber.valueAsNumber;
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value, preValue);
            }
        };
        RichSeekBar.prototype.getValue = function () {
            return parseInt(this.seekRange.value);
        };
        RichSeekBar.prototype.getDelay = function () {
            var fps = parseInt(this.fpsInput.value);
            return Math.floor(1000 / fps);
        };
        RichSeekBar.prototype.resetInterval = function () {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        };
        RichSeekBar.prototype.play = function () {
            var _this = this;
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) { // if last, go to first
                this.setValue(this.getMin());
            }
            this.resetInterval();
            this.intervalId = setInterval(function () {
                if (_this.getValue() == _this.getMax()) {
                    _this.stop();
                }
                else {
                    _this.setValue(_this.getValue() + 1);
                }
            }, this.getDelay());
        };
        RichSeekBar.prototype.stop = function () {
            this.playButton.removeEventListener('click', this.stopClosure);
            this.playButton.addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        };
        return RichSeekBar;
    }());
    framework.RichSeekBar = RichSeekBar;
    var loadFile = function (file, callback) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            if (typeof reader.result == 'string')
                callback(reader.result);
        };
    };
    var saveUrlAsLocalFile = function (url, filename) {
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        var evt = document.createEvent('MouseEvent');
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
    };
    var FileExporter = /** @class */ (function () {
        function FileExporter(canvas) {
            var saveAsImage = document.getElementById("saveAsImage");
            saveAsImage.addEventListener('click', function () {
                saveUrlAsLocalFile(canvas.toDataURL('image/png'), 'canvas.png');
            });
        }
        return FileExporter;
    }());
    framework.FileExporter = FileExporter;
})(framework || (framework = {}));
var visualizer;
(function (visualizer) {
    function createInitialBoard(n, w, initial) {
        var ret = Array(n);
        for (var i = 0; i < n; i++) {
            ret[i] = Array(w);
            for (var j = 0; j < w; j++) {
                ret[i][j] = initial;
            }
        }
        return ret;
    }
    function isEmptyBlock(b) {
        return b[0] === -1;
    }
    var InputFile = /** @class */ (function () {
        function InputFile(content) {
            this.cells = [];
            var parser = new framework.FileParser('<input-file>', content);
            this.N = parser.getInt();
            this.W = parser.getInt();
            // visualizerで描画する高さ
            this.H = Math.floor(this.N / this.W) + 25;
            this.K = parser.getInt();
            this.V = parser.getInt();
            parser.getNewline();
            for (var i = 0; i < this.N; i++) {
                var c = parser.getInt();
                var v = parser.getInt();
                if (c < 0 || c >= this.K)
                    parser.reportError("color " + c + " is out of range");
                if (v < 1 || v > this.V)
                    parser.reportError("value " + v + " is out of range");
                parser.getNewline();
                this.cells.push([c, v]);
            }
            // if (!parser.isEOF()) parser.reportError('Too long file.');
        }
        return InputFile;
    }());
    var OutputFile = /** @class */ (function () {
        function OutputFile(content, inputFile) {
            this.commands = [];
            var N = inputFile.N;
            var W = inputFile.W;
            var parser = new framework.FileParser('<output-file>', content.trim());
            for (var i = 0; i < N; i++) {
                var col = parser.getInt();
                if (col < 0 || col >= W)
                    parser.reportError(col + " is out of range.");
                this.commands.push(col);
                parser.getNewline();
            }
            if (!parser.isEOF())
                parser.reportError("Too long file.");
        }
        return OutputFile;
    }());
    var TesterFrame = /** @class */ (function () {
        function TesterFrame(turn, input, output, previousFrame, row, command, B) {
            this.turn = turn;
            this.input = input;
            this.output = output;
            this.previousFrame = previousFrame;
            this.row = row;
            this.command = command;
            this.B = B;
            this.scores = previousFrame ? previousFrame.scores.slice() : [];
            var prevLine = previousFrame ? previousFrame.line : 0;
            var _a = calcScoreAndLine(input.H, input.W, input.K, prevLine, B), score = _a[0], line = _a[1];
            if (score > 0) {
                this.scores.push(score);
            }
            this.line = line;
        }
        TesterFrame.createInitialFrame = function (input, output) {
            var B = createInitialBoard(input.H, input.W, [-1, -1]);
            return new TesterFrame(0, input, output, null, null, null, B);
        };
        TesterFrame.createNextFrame = function (previousFrame, command) {
            var B = previousFrame.B.map(function (x) { return Object.assign({}, x); }); // deep copy
            var cell = previousFrame.input.cells[previousFrame.turn];
            var row = null;
            for (var r = previousFrame.line; r < previousFrame.input.H; r++) {
                if (isEmptyBlock(B[r][command])) {
                    B[r][command] = cell;
                    row = r;
                    break;
                }
            }
            return new TesterFrame(previousFrame.turn + 1, previousFrame.input, previousFrame.output, previousFrame, row, command, B);
        };
        Object.defineProperty(TesterFrame.prototype, "totalScore", {
            get: function () {
                var sum = 0;
                for (var _i = 0, _a = this.scores; _i < _a.length; _i++) {
                    var score = _a[_i];
                    sum += score;
                }
                return sum;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TesterFrame.prototype, "average", {
            get: function () {
                return this.line > 0 ? this.totalScore / this.line : 0;
            },
            enumerable: true,
            configurable: true
        });
        return TesterFrame;
    }());
    function calcScoreAndLine(N, W, K, line, B) {
        var score = 0;
        for (var r = line; r < N; r++) {
            for (var c = 0; c < W; c++) {
                var color = B[r][c][0];
                if (color === -1)
                    return [score, r];
            }
            var values = Array(K).fill(0);
            for (var c = 0; c < W; c++) {
                var _a = B[r][c], color = _a[0], value = _a[1];
                values[color] += value;
            }
            score += Math.max.apply(Math, values);
        }
        throw Error('calc score error');
    }
    var Tester = /** @class */ (function () {
        function Tester(inputContent, outputContent) {
            var input = new InputFile(inputContent);
            var output = new OutputFile(outputContent, input);
            this.frames = [TesterFrame.createInitialFrame(input, output)];
            for (var _i = 0, _a = output.commands; _i < _a.length; _i++) {
                var command = _a[_i];
                var lastFrame = this.frames[this.frames.length - 1];
                this.frames.push(TesterFrame.createNextFrame(lastFrame, command));
            }
        }
        return Tester;
    }());
    var Visualizer = /** @class */ (function () {
        function Visualizer() {
            this.bgColor = '#111';
            this.scoreBgColor = '#fff';
            this.cellRound = 0;
            this.cellMargin = 0;
            this.nextCellNums = 10;
            this.dividedH = 50; // TODO inputに合わせてきれいに初期化したい
            this.canvas = document.getElementById("canvas");
            // デバイスの解像度に合わせてcanvasの解像度を調整
            this.dpr = window.devicePixelRatio || 1;
            var height = this.canvas.height;
            var width = this.canvas.width;
            // 表示上のcanvasはサイズを変更しない（dpr倍緻密に描画される）
            this.canvas.style.height = height + 'px';
            this.canvas.style.width = width + 'px';
            // 実際のcanvasのサイズはdpr倍にする
            this.height = this.canvas.height = height * this.dpr; // pixels
            this.width = this.canvas.width = width * this.dpr; // pixels
            this.divideNum = 3; // 何分割するか
            this.dividedWidth = this.width / this.divideNum;
            this.scoreWidth = 20 * this.dpr; // pixels
            this.rowNumWidth = 30 * this.dpr; // pixels
            this.rowNumMargin = 2 * this.dpr; // pixels
            this.offsetTop = 30 * this.dpr; // pixels
            this.effectGradHeight = this.height / 5; // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.colInput = document.getElementById("colInput");
            this.scoreInput = document.getElementById("scoreInput");
            this.lineInput = document.getElementById("lineInput");
            this.averageInput = document.getElementById("averageInput");
            var lo = 40;
            var md = 80;
            var hi = 190;
            this.fillStyles = [
                "rgb(" + hi + ", " + hi + ", " + hi + ")",
                "rgb(" + hi + ", " + lo + ", " + lo + ")",
                "rgb(" + lo + ", " + lo + ", " + hi + ")",
                "rgb(" + lo + ", " + hi + ", " + lo + ")",
                "rgb(" + hi + ", " + hi + ", " + lo + ")",
                "rgb(" + md + ", " + md + ", " + md + ")",
            ];
            this.ctx.lineJoin = 'round';
            this.ctx.font = 9 * this.dpr + "px sans-serif";
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            // canvas左下を基準点にする（ただし文字等は反転するので描画前にscale(1, -1)が必要）
            this.ctx.translate(0, this.height);
            this.ctx.scale(1, -1);
        }
        Visualizer.prototype.draw = function (frame, prev) {
            var command = frame.command;
            this.colInput.value = command == null ? "" : "" + command;
            this.scoreInput.value = frame.totalScore.toString();
            this.lineInput.value = frame.line.toString();
            this.averageInput.value = frame.average.toFixed(2);
            this.dividedH = Math.floor(frame.input.H / this.divideNum);
            var cellHeight = (this.height - this.offsetTop) * this.divideNum / frame.input.H;
            var cellWidth = (this.dividedWidth - this.scoreWidth - this.rowNumWidth) / frame.input.W;
            if (prev) {
                this.drawPartial(frame, prev, cellHeight, cellWidth);
            }
            else {
                this.drawAll(frame, cellHeight, cellWidth);
            }
        };
        Visualizer.prototype.drawPartial = function (frame, prev, cellHeight, cellWidth) {
            if (frame.command == null)
                return;
            {
                var r = prev.row;
                var c = prev.command;
                if (r != null && c != null) {
                    this.eraseEffect(r, c, cellHeight, cellWidth);
                }
            }
            {
                var r = frame.row;
                var c = frame.command;
                if (r != null && c != null) {
                    this.drawEffect(r, c, cellHeight, cellWidth);
                    this.drawCell(r, c, frame.B[r][c], cellHeight, cellWidth);
                }
                var last = frame.scores.length - 1;
                if (last >= 0) {
                    this.drawScore(last, frame.scores[last], cellHeight);
                }
            }
            this.drawNext(frame.input.cells.slice(frame.turn, frame.turn + this.nextCellNums), cellHeight, cellWidth);
        };
        Visualizer.prototype.drawAll = function (frame, cellHeight, cellWidth) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = this.scoreBgColor;
            var H = frame.input.H;
            var W = frame.input.W;
            this.drawRowNums(H, cellHeight);
            for (var r_1 = 0; r_1 < H; r_1++) {
                for (var c_1 = 0; c_1 < W; c_1++) {
                    if (frame.B[r_1][c_1][0] != -1) {
                        this.drawCell(r_1, c_1, frame.B[r_1][c_1], cellHeight, cellWidth);
                    }
                }
            }
            for (var i = 0; i < frame.scores.length; i++) {
                this.drawScore(i, frame.scores[i], cellHeight);
            }
            var r = frame.row;
            var c = frame.command;
            if (r != null && c != null) {
                this.drawEffect(r, c, cellHeight, cellWidth);
            }
            this.drawNext(frame.input.cells.slice(frame.turn, frame.turn + this.nextCellNums), cellHeight, cellWidth);
        };
        Visualizer.prototype.drawCell = function (y, x, b, cellHeight, cellWidth) {
            var c = b[0], v = b[1];
            if (c === -1)
                return;
            this.ctx.save();
            var fill = this.fillStyles;
            this.ctx.strokeStyle = fill[c];
            this.ctx.fillStyle = fill[c];
            this.ctx.lineWidth = this.cellRound;
            var cr = this.ctx.lineWidth;
            var OffsetX = this.OffsetX(y) + this.rowNumWidth;
            y = y % this.dividedH;
            this.ctx.strokeRect(x * cellWidth + this.cellMargin + cr + OffsetX, y * cellHeight + this.cellMargin + cr, cellWidth - this.cellMargin * 2 - cr, cellHeight - this.cellMargin * 2 - cr);
            this.ctx.fillRect(x * cellWidth + this.cellMargin + cr + OffsetX, y * cellHeight + this.cellMargin + cr, cellWidth - this.cellMargin * 2 - cr, cellHeight - this.cellMargin * 2 - cr);
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.fillText(v.toString(), x * cellWidth + cellWidth / 2 + OffsetX, -(y * cellHeight + cellHeight / 2));
            this.ctx.restore();
        };
        Visualizer.prototype.drawScore = function (y, score, cellHeight) {
            var OffsetX = this.dividedWidth + this.OffsetX(y);
            y = y % this.dividedH;
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(OffsetX - this.scoreWidth, -(y * cellHeight + cellHeight), this.scoreWidth, cellHeight);
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.fillText(score.toString(), OffsetX - this.scoreWidth / 2, -(y * cellHeight + cellHeight / 2));
            this.ctx.restore();
        };
        Visualizer.prototype.drawEffect = function (y, x, cellHeight, cellWidth) {
            var OffsetX = this.OffsetX(y) + this.rowNumWidth;
            y = y % this.dividedH;
            var cr = this.ctx.lineWidth;
            var x0 = x * cellWidth + this.cellMargin + cr + OffsetX;
            var y0 = (y + 1) * cellHeight;
            var w = cellWidth - this.cellMargin * 2 - cr;
            var h = this.effectGradHeight;
            var gradient = this.ctx.createLinearGradient(x0, y0 + h, x0, y0);
            gradient.addColorStop(0, this.bgColor);
            gradient.addColorStop(1, "blue");
            this.ctx.save();
            // this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x0, y0, w, h);
            this.ctx.restore();
        };
        Visualizer.prototype.drawRowNums = function (nums, cellHeight) {
            for (var i = 0; i < nums; i++) {
                var OffsetX = this.OffsetX(i);
                var y = i % this.dividedH;
                this.ctx.save();
                this.ctx.scale(1, -1);
                this.ctx.fillStyle = 'rgb(150, 150, 150)';
                this.ctx.textAlign = 'right';
                this.ctx.fillText((i + 1).toString(), OffsetX + this.rowNumWidth - this.rowNumMargin, -(y * cellHeight + cellHeight / 2));
                this.ctx.restore();
            }
        };
        Visualizer.prototype.eraseEffect = function (y, x, cellHeight, cellWidth) {
            var OffsetX = this.OffsetX(y) + this.rowNumWidth;
            y = y % this.dividedH;
            this.ctx.save();
            this.ctx.fillStyle = this.bgColor;
            var cr = this.ctx.lineWidth;
            this.ctx.fillRect(x * cellWidth + this.cellMargin + cr + OffsetX, (y + 1) * cellHeight, cellWidth - this.cellMargin * 2 - cr + 1, this.effectGradHeight);
            this.ctx.restore();
        };
        Visualizer.prototype.drawNext = function (cells, cellHeight, cellWidth) {
            var y = this.height - this.offsetTop / 2;
            var offsetX = this.rowNumWidth + 15 * this.dpr;
            this.ctx.save();
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, this.height, 1.5 * this.nextCellNums * cellWidth + offsetX, -this.offsetTop / 2);
            this.ctx.scale(1, -1);
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText('Next:', this.rowNumWidth, -(y + cellHeight / 2));
            this.ctx.restore();
            for (var i = 0; i < cells.length; i++) {
                var _a = cells[i], c = _a[0], v = _a[1];
                var cr = this.ctx.lineWidth;
                this.ctx.save();
                this.ctx.fillStyle = this.fillStyles[c];
                this.ctx.fillRect(1.5 * i * cellWidth + this.cellMargin + cr + offsetX, y, cellWidth - this.cellMargin * 2 - cr, cellHeight - this.cellMargin * 2 - cr);
                this.ctx.scale(1, -1);
                this.ctx.fillStyle = 'rgb(255, 255, 255)';
                this.ctx.fillText(v.toString(), 1.5 * i * cellWidth + cellWidth / 2 + offsetX, -(y + cellHeight / 2));
                this.ctx.restore();
            }
        };
        Visualizer.prototype.OffsetX = function (y) {
            var col = Math.floor(y / this.dividedH);
            return this.dividedWidth * col;
        };
        Visualizer.prototype.getCanvas = function () {
            return this.canvas;
        };
        return Visualizer;
    }());
    var App = /** @class */ (function () {
        function App() {
            var _this = this;
            this.tester = null;
            this.visualizer = new Visualizer();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas());
            this.seek = new framework.RichSeekBar(function (curValue, preValue) {
                if (_this.tester) {
                    if (preValue == curValue - 1) {
                        _this.visualizer.draw(_this.tester.frames[curValue], _this.tester.frames[preValue]);
                    }
                    else {
                        _this.visualizer.draw(_this.tester.frames[curValue], null);
                    }
                }
            });
            this.loader = new framework.FileSelector(function (inputContent, outputContent) {
                _this.tester = new Tester(inputContent, outputContent);
                _this.seek.setMinMax(0, _this.tester.frames.length - 1);
                _this.seek.setValue(_this.tester.frames.length - 1);
                _this.visualizer.draw(_this.tester.frames[_this.tester.frames.length - 1], null);
            });
        }
        return App;
    }());
    visualizer.App = App;
})(visualizer || (visualizer = {}));
window.onload = function () {
    new visualizer.App();
};
//# sourceMappingURL=index.js.map