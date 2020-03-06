N = 40
P = 300
M = 1000


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

    def next_double(self):
        return self.next() / (self.mask + 1)


class TestCase:

    def __init__(self, seed=None, input=None):
        if seed is not None:
            self.N = N
            self.P = P
            self.M = M
            rnd = XorShift(seed)

            pos = []
            for i in range(N):
                for j in range(N):
                    pos.append((i, j))
            for i in range(P + 1):
                ch = rnd.next_int(N * N - i) + i
                pos[i], pos[ch] = pos[ch], pos[i]
            self.rows = [["-"] * N for _ in range(N)]
            for i in range(P):
                self.rows[pos[i][0]][pos[i][1]] = "x"
            self.rows[pos[P][0]][pos[P][1]] = "o"

            self.A = [[] for _ in range(self.N)]
            for i in range(self.N):
                for _ in range(self.N):
                    self.A[i].append(chr(ord("A") + rnd.next_int(26)))
        else:
            itr = iter(input)
            self.N, self.P, self.M = map(int, next(itr).split())
            self.rows = []
            for i in range(self.N):
                self.rows.append(list(next(itr).strip()))
            self.A = []
            for i in range(self.N):
                self.A.append(list(next(itr).strip()))

    def __str__(self):
        ret = "%d %d %d\n" % (self.N, self.P, self.M)
        ret += "\n".join("".join(row) for row in self.rows)
        ret += "\n"
        return ret + "\n".join("".join(a_row) for a_row in self.A)
