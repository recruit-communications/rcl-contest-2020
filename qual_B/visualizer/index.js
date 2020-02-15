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
    function array2d(n, initial) {
        var ret = Array(n);
        for (var i = 0; i < n; i++) {
            ret[i] = Array(n);
            for (var j = 0; j < n; j++) {
                ret[i][j] = initial;
            }
        }
        return ret;
    }
    var InputFile = /** @class */ (function () {
        function InputFile(content) {
            var parser = new framework.FileParser('<input-file>', content);
            this.N = parser.getInt();
            this.M = parser.getInt();
            parser.getNewline();
            var A = this.A = array2d(this.N, 0);
            for (var i = 0; i < this.N; i++) {
                for (var j = 0; j < this.N; j++) {
                    A[i][j] = parser.getInt();
                }
                parser.getNewline();
            }
        }
        return InputFile;
    }());
    var OutputFile = /** @class */ (function () {
        function OutputFile(inputFile, content) {
            var parser = new framework.FileParser('<output-file>', content);
            this.commands = [];
            while (!parser.isEOF()) {
                var r = parser.getInt();
                if (r == -1) {
                    this.commands.push([-1, -1, -1]);
                    parser.getNewline();
                }
                else {
                    var c = parser.getInt();
                    var d = parser.getWord();
                    var dd = "DRUL".indexOf(d);
                    if (r < 0 || r >= inputFile.N)
                        parser.reportError("\u5EA7\u6A19\u304C\u7BC4\u56F2\u5916\u3067\u3059");
                    if (c < 0 || c >= inputFile.N)
                        parser.reportError("\u5EA7\u6A19\u304C\u7BC4\u56F2\u5916\u3067\u3059");
                    if (d.length != 1 || dd < 0)
                        parser.reportError("\u5857\u308B\u5411\u304D\u306F URDL \u306E\u3044\u305A\u308C\u304B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059");
                    this.commands.push([r, c, dd]);
                    parser.getNewline();
                }
            }
            if (this.commands.length != inputFile.M)
                parser.reportError("\u64CD\u4F5C\u56DE\u6570\u304C " + inputFile.M + " \u56DE\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
        }
        return OutputFile;
    }());
    var TesterFrame = /** @class */ (function () {
        function TesterFrame(turn, input, output, previousFrame, command, B) {
            this.turn = turn;
            this.input = input;
            this.output = output;
            this.previousFrame = previousFrame;
            this.command = command;
            this.B = B;
            this.score = calcScore(input.N, input.A, this.B);
            if (this.score == input.N * input.N) {
                this.score += input.M - output.commands.length;
            }
        }
        TesterFrame.createInitialFrame = function (input, output) {
            var B = array2d(input.N, 4);
            B[0][0] = 0;
            B[0][input.N - 1] = 1;
            B[input.N - 1][0] = 2;
            B[input.N - 1][input.N - 1] = 3;
            return new TesterFrame(0, input, output, null, null, B);
        };
        TesterFrame.createNextFrame = function (previousFrame, command) {
            var B = previousFrame.B.map(function (x) { return Object.assign({}, x); }); // deep copy
            var r = command[0], c = command[1], d = command[2];
            if (r == -1) {
                // pass
                return new TesterFrame(previousFrame.turn + 1, previousFrame.input, previousFrame.output, previousFrame, command, B);
                ;
            }
            var color = previousFrame.turn % 4;
            if (B[r][c] != color) {
                throw Error(previousFrame.turn + 1 + "\u884C\u76EE \u5857\u308A\u59CB\u3081\u306E\u4F4D\u7F6E\u306E\u8272\u304C\u30DA\u30F3\u306E\u8272\u3068\u7570\u306A\u308A\u307E\u3059 : " + r + " " + c);
            }
            var dr = TesterFrame.DR[d];
            var dc = TesterFrame.DC[d];
            var N = previousFrame.input.N;
            for (var i = 0; i < 5; i++) {
                var nr = r + (i + 1) * dr;
                var nc = c + (i + 1) * dc;
                if (0 <= nr && nr < N && 0 <= nc && nc < N) {
                    B[nr][nc] = color;
                }
                else
                    break;
            }
            return new TesterFrame(previousFrame.turn + 1, previousFrame.input, previousFrame.output, previousFrame, command, B);
        };
        TesterFrame.DR = [1, 0, -1, 0];
        TesterFrame.DC = [0, 1, 0, -1];
        return TesterFrame;
    }());
    function calcScore(N, A, B) {
        var score = 0;
        for (var i = 0; i < N; i++) {
            for (var j = 0; j < N; j++) {
                if (A[i][j] == B[i][j])
                    score++;
            }
        }
        return score;
    }
    var Tester = /** @class */ (function () {
        function Tester(inputContent, outputContent) {
            try {
                var input = new InputFile(inputContent);
                var output = new OutputFile(input, outputContent);
                this.frames = [TesterFrame.createInitialFrame(input, output)];
                for (var _i = 0, _a = output.commands; _i < _a.length; _i++) {
                    var command = _a[_i];
                    var lastFrame = this.frames[this.frames.length - 1];
                    this.frames.push(TesterFrame.createNextFrame(lastFrame, command));
                }
            }
            catch (e) {
                alert(e);
                throw e;
            }
        }
        return Tester;
    }());
    var Visualizer = /** @class */ (function () {
        function Visualizer() {
            this.bgColor = '#111';
            this.cellRound = 3;
            this.cellMargin = 1;
            this.canvas = document.getElementById("canvas");
            var size = 600;
            this.height = size; // pixels
            this.width = size; // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.commandInput = document.getElementById("commandInput");
            this.scoreInput = document.getElementById("scoreInput");
            var hueR = 0;
            var hueB = 240;
            var hueG = 120;
            var hueY = 60;
            var sat1 = '80%';
            var lig1 = '40%';
            this.strokeStyles = [
                "hsl(" + hueR + ", " + sat1 + ", " + lig1 + ")",
                "hsl(" + hueB + ", " + sat1 + ", 45%)",
                "hsl(" + hueG + ", " + sat1 + ", " + lig1 + ")",
                "hsl(" + hueY + ", " + sat1 + ", " + lig1 + ")",
            ];
            var sat2 = '60%';
            var lig2 = '50%';
            this.fillStyles = [
                "hsl(" + hueR + ", " + sat2 + ", " + lig2 + ")",
                "hsl(" + hueB + ", 70%, 55%)",
                "hsl(" + hueG + ", " + sat2 + ", " + lig2 + ")",
                "hsl(" + hueY + ", " + sat2 + ", " + lig2 + ")",
                "rgb(72, 72, 68)",
            ];
            var sat3 = '70%';
            var lig3 = '70%';
            this.fillStylesHighlighted = [
                "hsl(" + hueR + ", " + sat3 + ", " + lig3 + ")",
                "hsl(" + hueB + ", 80%, 75%)",
                "hsl(" + hueG + ", " + sat3 + ", " + lig3 + ")",
                "hsl(" + hueY + ", " + sat3 + ", " + lig3 + ")",
                "rgb(100, 100, 100)",
            ];
            this.ctx.lineJoin = 'round';
            this.ctx.font = '20px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
        }
        Visualizer.prototype.draw = function (frame, prev) {
            var command = frame.command;
            if (command == null) {
                this.commandInput.value = "";
            }
            else if (command[0] == -1) {
                this.commandInput.value = "PASS";
            }
            else {
                this.commandInput.value = command[0] + " " + command[1] + " " + "DRUL"[command[2]];
            }
            this.scoreInput.value = frame.score.toString();
            var cellSize = this.height / frame.input.N;
            if (prev) {
                this.drawPartial(frame, prev, cellSize);
            }
            else {
                this.drawAll(frame, cellSize);
            }
        };
        Visualizer.prototype.drawPartial = function (frame, prev, cellSize) {
            var _this = this;
            var fillCommand = function (command, fillStyles) {
                if (command == null)
                    return;
                var r = command[0], c = command[1], d = command[2];
                var dr = TesterFrame.DR[d];
                var dc = TesterFrame.DC[d];
                var N = frame.input.N;
                for (var i = 0; i < 6; i++) {
                    var nr = r + i * dr;
                    var nc = c + i * dc;
                    if (0 <= nr && nr < N && 0 <= nc && nc < N) {
                        _this.eraseCell(nr, nc, cellSize);
                        _this.drawCell(nr, nc, frame.input.A[nr][nc], frame.B[nr][nc], cellSize, fillStyles);
                    }
                    else
                        break;
                }
            };
            fillCommand(prev.command, this.fillStyles);
            fillCommand(frame.command, this.fillStylesHighlighted);
            this.drawTriangle(frame.command, cellSize);
        };
        Visualizer.prototype.drawAll = function (frame, cellSize) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            var N = frame.input.N;
            var _a = frame.command == null ? [-1, -1, -1, -1] : this.calcAffectedArea(N, frame.command), mir = _a[0], mar = _a[1], mic = _a[2], mac = _a[3];
            for (var r = 0; r < N; r++) {
                for (var c = 0; c < N; c++) {
                    var fillStyles = (mir <= r && r <= mar && mic <= c && c <= mac) ? this.fillStylesHighlighted : this.fillStyles;
                    this.drawCell(r, c, frame.input.A[r][c], frame.B[r][c], cellSize, fillStyles);
                }
            }
            this.drawTriangle(frame.command, cellSize);
        };
        Visualizer.prototype.drawCell = function (y, x, a, b, cellSize, fill) {
            this.ctx.strokeStyle = this.strokeStyles[a];
            this.ctx.fillStyle = fill[b];
            this.ctx.lineWidth = this.cellRound;
            var cr = this.ctx.lineWidth;
            var cr2 = cr / 2;
            this.ctx.strokeRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
            this.ctx.fillRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
        };
        Visualizer.prototype.drawTriangle = function (command, cellSize) {
            if (command == null || command[0] == -1)
                return;
            var y = command[0], x = command[1], d = command[2];
            var tx = Visualizer.tx;
            var ty = Visualizer.ty;
            this.ctx.strokeStyle = this.ctx.fillStyle = "black";
            this.ctx.beginPath();
            this.ctx.moveTo((x + tx[d][0]) * cellSize, (y + ty[d][0]) * cellSize);
            this.ctx.lineTo((x + tx[d][1]) * cellSize, (y + ty[d][1]) * cellSize);
            this.ctx.lineTo((x + tx[d][2]) * cellSize, (y + ty[d][2]) * cellSize);
            this.ctx.closePath();
            this.ctx.fill();
        };
        Visualizer.prototype.eraseCell = function (y, x, cellSize) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(x * cellSize + this.cellMargin, y * cellSize + this.cellMargin, cellSize - this.cellMargin * 2, cellSize - this.cellMargin * 2);
        };
        Visualizer.prototype.calcAffectedArea = function (N, command) {
            var r = command[0], c = command[1], d = command[2];
            var mir = r;
            var mar = r;
            var mic = c;
            var mac = c;
            var dr = TesterFrame.DR[d];
            var dc = TesterFrame.DC[d];
            for (var i = 0; i < 5; i++) {
                var nr = r + (i + 1) * dr;
                var nc = c + (i + 1) * dc;
                if (0 <= nr && nr < N && 0 <= nc && nc < N) {
                    mir = Math.min(mir, nr);
                    mar = Math.max(mar, nr);
                    mic = Math.min(mic, nc);
                    mac = Math.max(mac, nc);
                }
                else
                    break;
            }
            return [mir, mar, mic, mac];
        };
        Visualizer.prototype.getCanvas = function () {
            return this.canvas;
        };
        Visualizer.tx = [
            [0.5, 0.85, 0.15],
            [0.85, 0.15, 0.15],
            [0.5, 0.85, 0.15],
            [0.15, 0.85, 0.85],
        ];
        Visualizer.ty = [
            [0.85, 0.15, 0.15],
            [0.5, 0.85, 0.15],
            [0.15, 0.85, 0.85],
            [0.5, 0.85, 0.15],
        ];
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
