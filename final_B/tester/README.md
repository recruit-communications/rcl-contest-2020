# ハイパーお掃除ロボット テスター

* これは
[第4回 RECRUIT 日本橋ハーフマラソン 本戦](https://atcoder.jp/contests/rcl-contest-2020-final)
の
[B 問題 - ハイパーお掃除ロボット](https://atcoder.jp/contests/rcl-contest-2020-final/tasks/rcl_contest_2020_final_b)
のテストケースジェネレータとジャッジのためのプログラムです。これらを用いることで、ローカル環境でプログラムのテストを行うことができます。
* これらのプログラム上で計算された得点は、当コンテストでの得点を保証するものではありません。
* これらのプログラムを使用することによるあらゆる損害は保障しかねますので、予めご了承ください。
* これらのプログラムに関する質問は受け付けていません。予めご了承ください。
* これらのプログラムの一部を、コンテストの解答に流用してもかまいません。

# テストケース生成
好きな乱数シードを整数で与えることで、問題文の条件を満たすテストケースを生成できます。以下のコマンドでは `12345` という値を乱数シード値として、`input.txt` というテキストファイルにテストケースを保存しています。

```bash
python generator.py 12345 > input.txt
```
または
```bash
python3 generator.py 12345 > input.txt
```

シード値に `1`, `2`, `3` を与えて生成したテストケースを、それぞれ `input_1.txt`, `input_2.txt`, `input_3.txt` として置いています。

# 得点計算
テストケースのテキストファイルと、自分のプログラムの出力結果のテキストファイルから、テストケースに対する得点を計算することができます。以下のコマンドでは、 `input.txt` というテキストファイルに保存されたテストケースに対する `output.txt` というテキストファイル内の出力から得られる得点を計算しています。

```bash
python judge.py input.txt output.txt
```
または
```bash
python3 judge.py input.txt output.txt
```

# 情報出力
テスターに `-info` というオプションを与えると、連鎖数の情報をテスターの標準エラー出力に書き出します。このオプションを指定した例を以下に示します。
```bash
python judge.py input.txt output.txt -info
```
または
```bash
python3 judge.py input.txt output.txt -info
```

出力例
```
C x   1 chain ->     1
D x   2 chain ->     4
Q x   1 chain ->     1
A x   1 chain ->     1
L x   1 chain ->     1
A x   4 chain ->    16
F x   1 chain ->     1
H x   1 chain ->     1
```
