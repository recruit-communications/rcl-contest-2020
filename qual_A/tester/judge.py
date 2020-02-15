from sys import argv
from testcase import TestCase


def usage():
    print("python judge.py [testdata_file_path] [output_file_path]")


def judge(tc, output):
    if len(output) != tc.N:
        raise RuntimeError("[ERROR] 出力が%d行ではありません" % tc.N)

    fields = [[] for _ in range(tc.W)]
    for i, col in enumerate(output):
        if col < 0 or tc.W <= col:
            raise RuntimeError("[ERROR] %d行目 出力が不正です : %d" % (i + 1, col))
        fields[col].append(tc.blocks[i])

    score = 0
    for row in range(tc.N // tc.W):
        finish = False
        total = [0] * tc.K
        for col in range(tc.W):
            if len(fields[col]) <= row:
                finish = True
                break
            block = fields[col][row]
            total[block.color] += block.value
        if finish:
            break
        score += max(total)
    return score


if __name__ == '__main__':
    if len(argv) < 3:
        usage()
        exit(1)
    with open(argv[1]) as in_file:
        tc = TestCase(input=in_file)
    with open(argv[2]) as out_file:
        output = []
        for i, row in enumerate(out_file, start=1):
            try:
                output.append(int(row))
            except Exception:
                raise RuntimeError("[ERROR] %d行目 出力が不正です : %s" % (i, row))
    score = judge(tc, output)
    print("score:%d" % score)
