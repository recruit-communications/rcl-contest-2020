from sys import argv
from testcase import TestCase

DR = [1, 0, -1, 0]
DC = [0, 1, 0, -1]


def usage():
    print("python judge.py [testdata_file_path] [output_file_path]")


def judge(tc, output):
    if len(output) != tc.M:
        raise RuntimeError("[ERROR] 出力が%d行ではありません" % tc.M)
    area = [[-1] * tc.N for _ in range(tc.N)]
    area[0][0] = 0
    area[0][tc.N - 1] = 1
    area[tc.N - 1][0] = 2
    area[tc.N - 1][tc.N - 1] = 3
    for i, x in enumerate(output):
        if len(x) == 1:
            if x[0] != -1:
                raise RuntimeError("[ERROR] %d行目 出力が不正です : %d" % (i + 1, x[0]))
            continue
        pr = x[0]
        pc = x[1]
        d = "DRUL".find(x[2][0])
        if not(0 <= pr < tc.N and 0 <= pc < tc.N) or d == -1 or len(x[2]) != 1:
            raise RuntimeError("[ERROR] %d行目 出力が不正です : %d %d %s" % (i + 1, x[0], x[1], x[2]))
        color = i % 4
        if area[pr][pc] != color:
            raise RuntimeError(
                "[ERROR] %d行目 塗り始めの位置の色が塗ろうとしている色と異なります : "
                "(%d %d) 塗り始めの位置の色:%s 塗ろうとしている色:%d" % (
                    i + 1, pr, pc, "未着色" if area[pr][pc] == -1 else str(area[pr][pc]), color))
        mr = DR[d]
        mc = DC[d]
        for j in range(1, 6):
            nr = pr + j * mr
            nc = pc + j * mc
            if not(0 <= nr < tc.N and 0 <= nc < tc.N):
                break
            area[nr][nc] = color

    score = 0
    for r in range(tc.N):
        for c in range(tc.N):
            if tc.A[r][c] == area[r][c]:
                score += 1
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
            elems = row.split()
            if len(elems) == 3:
                output.append((int(elems[0]), int(elems[1]), elems[2]))
            elif len(elems) == 1:
                output.append((int(elems[0]),))
            else:
                raise RuntimeError("[ERROR] %d行目 出力が不正です : %s" % (i, row))

    score = judge(tc, output)
    print("score:%d" % score)
