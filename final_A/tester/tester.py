import argparse
import subprocess as sp
import sys

N = 500
M = 5000


class XorShift:
    mask = (1 << 64) - 1

    def __init__(self, seed=None):
        self.x = seed or 88172645463325252

    def next(self):
        self.x ^= self.x << 13
        self.x &= self.mask
        self.x ^= self.x >> 7
        self.x ^= self.x << 17
        self.x &= self.mask
        return self.x

    def next_int(self, n):
        upper = self.mask // n * n
        v = self.next()
        while upper <= v:
            v = self.next()
        return v % n


class Tester:
    def __init__(self, seed, info):
        self.rnd = XorShift(seed)
        self.v = [0] * (N + 1)
        self.v[N] = 5000
        for _ in range(100):
            size = self.rnd.next_int(10) + 1
            add = self.rnd.next_int(200) + 1
            pos = self.rnd.next_int(N - 5 - size) + 1
            for i in range(size):
                self.v[pos + i] += add

        if info:
            print("各マスの値", file=sys.stderr)
            for i in range(0, N + 1, 20):
                v_str = map(lambda x: "%3d" % x, self.v[i:i+20])
                print("%3d: %s" % (i, " ".join(v_str)), file=sys.stderr)

    def judge(self, command, info, debug):
        score = 0
        goal = 0
        with sp.Popen(command, shell=True, stdin=sp.PIPE, stdout=sp.PIPE, stderr=sys.stderr,
                      universal_newlines=True) as proc:
            proc.stdin.write("%d %d\n" % (N, M))
            proc.stdin.flush()
            prev_dice = [1, 2, 3, 4, 5, 6]
            prev_pos = 0
            pos = 0
            hide = [False] + [True] * (N - 6) + [False] * 5
            pos_count = [0] * (N + 1)
            for t in range(M):
                row = proc.stdout.readline()
                try:
                    dice = list(map(int, row.split()))
                except Exception:
                    print("[ERROR] 出力が不正です : %s" % row)
                    proc.kill()
                    sys.exit(1)

                if len(dice) != 6:
                    print("[ERROR] 値が6個ではありません : %s" % dice)
                    proc.kill()
                    sys.exit(1)

                change_count = 0
                for i in range(6):
                    if dice[i] < 1 or 6 < dice[i]:
                        print("[ERROR] 値が範囲外です : %d" % dice[i])
                        proc.kill()
                        sys.exit(1)
                    if dice[i] != prev_dice[i]:
                        change_count += 1

                if change_count > 1:
                    print("[ERROR] 2つ以上のサイコロの面を変更しました : %s => %s" %
                            (prev_dice, dice))
                    proc.kill()
                    sys.exit(1)

                dice_index = self.rnd.next_int(6)
                move = dice[dice_index]
                pos += move
                if pos > N:
                    pos = N - (pos - N)
                move_pos = pos
                score += self.v[pos]
                pos_count[pos] += 1
                proc.stdin.write("%d %d %d\n" % (move, self.v[pos], pos))
                proc.stdin.flush()
                if pos == N:
                    pos = 0
                    goal += 1
                hide[pos] = False

                if debug:
                    dice_str = []
                    for j in range(6):
                        if j == dice_index:
                            dice_str.append("[%d]" % dice[j])
                        else:
                            dice_str.append(" %d " % dice[j])
                    print("%4d, pos: %3d => %3d, dice: %s score: %d goal: %d" %
                            (t, prev_pos, move_pos, "".join(dice_str), score, goal),
                            file=sys.stderr)
                    values = []
                    indexes = []
                    for j in range(pos, pos + 20):
                        if hide[j % N]:
                            values.append("  ?")
                        else:
                            values.append("%3d" % self.v[j % N])
                        indexes.append("%3d" % (j % N))
                    print("value: %s\nindex: %s\n" % (" ".join(values), " ".join(indexes)),
                            file=sys.stderr)

                prev_dice = dice
                prev_pos = pos

            if info:
                print("各マスに到達した回数", file=sys.stderr)
                for i in range(0, N + 1, 20):
                    count_str = map(lambda x: "%3d" % x, pos_count[i:i+20])
                    print("%3d: %s" % (i, " ".join(count_str)), file=sys.stderr)

        return (score, goal)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("-seed", type=int, required=True)
    parser.add_argument("-command", required=True)
    parser.add_argument("-info", action='store_true')
    parser.add_argument("-debug", action='store_true')
    args = parser.parse_args()
    tester = Tester(args.seed, args.info)
    result = tester.judge(args.command, args.info, args.debug)
    print("score: %d goal: %d" % result)
