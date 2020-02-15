from collections import namedtuple

N_FIXED = 1000
W_FIXED = 8
K_FIXED = 6
V_FIXED = 8


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


Block = namedtuple("Block", ["color", "value"])


class TestCase:

    def __init__(self, seed=None, input=None):
        if seed is not None:
            self.N = N_FIXED
            self.W = W_FIXED
            self.K = K_FIXED
            self.V = V_FIXED
            self.blocks = []
            rnd = XorShift(seed)
            for _ in range(self.N):
                color = rnd.next_int(self.K)
                value = rnd.next_int(self.V) + 1
                self.blocks.append(Block(color, value))
        else:
            itr = iter(input)
            self.N, self.W, self.K, self.V = map(int, next(itr).split())
            self.blocks = []
            for i in range(self.N):
                self.blocks.append(Block(*map(int, next(itr).split())))

    def __str__(self):
        ret = "%d %d %d %d\n" % (self.N, self.W, self.K, self.V)
        return ret + "\n".join("%d %d" % (block.color, block.value) for block in self.blocks)
