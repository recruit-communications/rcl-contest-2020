# ハイパー覆面すごろく テスター

* これは
[第4回 RECRUIT 日本橋ハーフマラソン 本戦](https://atcoder.jp/contests/rcl-contest-2020-final/)
の
[A 問題 - ハイパー覆面すごろく](https://atcoder.jp/contests/rcl-contest-2020-final/tasks/rcl_contest_2020_final_a)
のテストを行うプログラムです。
* これを用いることで、ローカル環境で回答プログラムを実行し、スコアを確認できます。
* このプログラム上で計算された得点は、当コンテストでの得点を保証するものではありません。
* このプログラムを使用することによるあらゆる損害は保障しかねますので、予めご了承ください。
* このプログラムに関する質問は受け付けていません。予めご了承ください。
* このプログラムの一部を、コンテストの解答に流用してもかまいません。

# 実行
`-command` オプションにあなたの回答プログラムを実行するコマンドを渡してテスターを実行すると、テスターが問題の仕様にしたがってあなたのプログラムとやりとりを行い、スコアを計算します。また、好きな乱数シードを整数で与えることができます。

以下のコマンドは、回答プログラムが `a.out` という実行可能バイナリにコンパイルされて `tester.py` と同じディレクトリに配置されており、 `334` という値を乱数シード値としてテストを実行する場合の例です。
```bash
python tester.py -seed 334 -command "./a.out"
```
または
```bash
python3 tester.py -seed 334 -command "./a.out"
```

回答プログラムをRubyで `main.rb` というファイルに記述している場合は、たとえば次のようになります。 `-command` に渡すオプションは、スペースが含まれていても１つの文字列として認識されるよう、`"` で囲ってください。
```bash
python tester.py -seed 334 -command "ruby main.rb"
```
または
```bash
python3 tester.py -seed 334 -command "ruby main.rb"
```


# デバッグ
あなたの回答プログラムが標準エラー出力へ出力した内容は、テスターの標準エラー出力へリダイレクトして書き出します。

また、テスターに `-debug` というオプションを与えると、各マスに到達した時の状況をテスターの標準エラー出力に書き出します。 多くの出力がされるので、適宜ファイルにリダイレクトするなどしてください。このオプションを指定した例を以下に示します。
```bash
python tester.py -seed 334 -command "./a.out" -debug
```
または
```bash
python3 tester.py -seed 334 -command "./a.out" -debug
```

# 情報出力
テスターに `-info` というオプションを与えると、最初と最後に情報をテスターの標準エラー出力に書き出します。このオプションを指定した例を以下に示します。
```bash
python tester.py -seed 334 -command "./a.out" -info
```
または
```bash
python3 tester.py -seed 334 -command "./a.out" -info
```
