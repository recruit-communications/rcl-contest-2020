import itertools

N_FIXED = 50
M_FIXED = 500
DR = [1, 0, -1, 0]
DC = [0, 1, 0, -1]
MAX_INITIAL_POINT = 10
MIN_INITIAL_POINT = 3


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


class TestCase:

    def __init__(self, seed=None, input=None):
        if seed is not None:
            self.N = N_FIXED
            self.M = M_FIXED
            self.A = self.generate(seed)
        else:
            itr = iter(input)
            self.N, self.M = map(int, next(itr).split())
            self.A = []
            for i in range(self.N):
                self.A.append(list(map(int, next(itr).split())))

    def __str__(self):
        ret = "%d %d\n" % (self.N, self.M)
        return ret + "\n".join(" ".join(str(v) for v in row) for row in self.A)

    def generate(self, seed):
        rnd = XorShift(seed)
        while True:
            a = self.generate_single(rnd)
            colors = sorted(itertools.chain.from_iterable(row for row in a))
            if all(len(list(g)) >= self.N * self.N // 6 for _, g in itertools.groupby(colors)):
                return a

    def generate_single(self, rnd):
        a = [[-1] * self.N for _ in range(self.N)]
        a[0][0] = 0
        a[0][self.N - 1] = 1
        a[self.N - 1][0] = 2
        a[self.N - 1][self.N - 1] = 3
        for color in range(4):
            num_base = rnd.next_int(MAX_INITIAL_POINT - MIN_INITIAL_POINT + 1) + MIN_INITIAL_POINT
            painted = 0
            while painted < num_base:
                r = rnd.next_int(self.N)
                c = rnd.next_int(self.N)
                if a[r][c] == -1:
                    a[r][c] = color
                    painted += 1
        queue = []

        def add_queue(r, c):
            for d in range(4):
                nr = r + DR[d]
                nc = c + DC[d]
                if 0 <= nr < self.N and 0 <= nc < self.N:
                    queue.append((nr, nc, a[r][c]))

        for r in range(self.N):
            for c in range(self.N):
                if a[r][c] != -1:
                    add_queue(r, c)

        while queue:
            idx = rnd.next_int(len(queue))
            queue[idx], queue[-1] = queue[-1], queue[idx]
            t = queue.pop()
            if a[t[0]][t[1]] == -1:
                a[t[0]][t[1]] = t[2]
                add_queue(t[0], t[1])

        return a
