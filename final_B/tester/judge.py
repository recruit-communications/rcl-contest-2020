from sys import argv, stderr
from testcase import TestCase


def usage():
    print("python judge.py [testdata_file_path] [output_file_path]")


def judge(tc, output, info):
    if len(output) > tc.M:
        raise RuntimeError("出力が%d行を超えています" % (tc.M,))

    for i in range(tc.N):
        for j in range(tc.N):
            if tc.rows[i][j] == "o":
                br = i
                bc = j
    chars = []
    VISITED = "#"
    for i, row in enumerate(output, start=1):
        move = row.split()
        if not(len(move) == 5 and move[0] == "P" or len(move) == 1 and move[0] in list("URDL")):
            raise RuntimeError("%d行目 出力が不正です: %s" % (i, row))
        if move[0] == "P":
            try:
                r0 = int(move[1])
                c0 = int(move[2])
                r1 = int(move[3])
                c1 = int(move[4])
            except Exception:
                raise RuntimeError("%d行目 出力が不正です: %s" % (i, row))
            if tc.rows[r0][c0] != "x":
                raise RuntimeError("%d行目 移動元に柱がありません: (%d %d) -> (%d %d)" % (i, r0, c0, r1, c1))
            if tc.rows[r1][c1] == "x":
                raise RuntimeError("%d行目 柱の移動先に柱があります: (%d %d) -> (%d %d)" % (i, r0, c0, r1, c1))
            elif tc.rows[r1][c1] == "o":
                raise RuntimeError("%d行目 柱の移動先にロボットがあります: (%d %d) -> (%d %d)" % (i, r0, c0, r1, c1))
            tc.rows[r0][c0] = "-"
            tc.rows[r1][c1] = "x"
        else:
            dr = dc = 0
            if move[0] == "U":
                dr = -1
            elif move[0] == "R":
                dc = 1
            elif move[0] == "D":
                dr = 1
            else:
                dc = -1
            tc.rows[br][bc] = "-"
            while True:
                nr = br + dr
                nc = bc + dc
                if not(0 <= nr < tc.N and 0 <= nc < tc.N) or tc.rows[nr][nc] == "x":
                    break
                br = nr
                bc = nc
            if tc.A[br][bc] != VISITED:
                chars.append(tc.A[br][bc])
                tc.A[br][bc] = VISITED
            tc.rows[br][bc] = "o"
    score = 0
    left = 0
    while left < len(chars):
        right = left
        while right < len(chars) and chars[left] == chars[right]:
            right += 1
        score += (right - left) ** 2
        if info:
            print("%s x %3d chain -> %5d" % (chars[left], right - left, (right - left) ** 2),
                  file=stderr)
        left = right
    return score


if __name__ == '__main__':
    if len(argv) < 3:
        usage()
        exit(1)
    with open(argv[1]) as in_file:
        tc = TestCase(input=in_file)
    with open(argv[2]) as out_file:
        output = [row.rstrip() for row in out_file]
    info = len(argv) >= 4 and argv[3] == "-info"
    score = judge(tc, output, info)
    print("score:%d" % score)
