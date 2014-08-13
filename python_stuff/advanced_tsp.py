from heapq import heappop, heappush 
from collections import defaultdict


a, b, c, d, e, f, g, h = range(8) 
N = [ 
    {b:2, c:1, d:3, e:9, f:4}, # a 
    {c:4, e:3}, # b 
    {d:8}, # c 
    {e:7}, # d 
    {f:5}, # e 
    {c:2, g:2, h:2}, # f 
    {f:1, h:6}, # g 
    {f:9, g:8} # h 
] 

def prim(G, s): 
    P, Q = {}, [(0, None, s)] 
    while Q: 
        _, p, u = heappop(Q) 
        if u in P: continue 
        P[u] = p 
        for v, w in G[u].items(): 
            heappush(Q, (w, u, v)) 
    return P 

def approximate_tsp(G, r): # 2-approx for metric TSP 
    T, C = defaultdict(list), [] # Tree and cycle 
    def traverse(r): 
       C.append(r)
       for v in T[r]: walk(v)

    for c, p in prim(G, r).items(): 
        T[p].append(c)

    traverse(r) 
    return C 


def adjust(C, deps):
   
    def flat(deps):
       result = []
       for x in deps.items():
          if not x[1]:
             for y in x[1]:
             result.append((x,y))
       return result
    
    D = flat(deps)   
    L = len(D) 
    if L == 0:
       return C
    elif L == 1:
       if position_check(C, D[0]):
          return C
       else:
          return C.reverse()
    elif L == 2:
       if position_check_circle(C, D)[0]
          return C
       elif position_check_circle(C, D) == (False, 2)
          return C.reverse()
       else 
          return C
    elif L >= 3:
       if position_check_circle(C, D)[0]
          return C
       elif position_check_circle(C, D) == (False, L)
          return C.reverse()
       else 
          return C

def position_check(C, pair)
    temp = []
    k, v = pair
    for x in C:
       if x != k && x != v:
          temp.append(x)
       elif x == k:
          if v in temp:
            return True
          else: 
            return False
       elif x == v:
          if k not in temp:
            return True
          else:
            return False

def position_check_circle(C, pairs)
    count = 0
    result = True
    for x in pairs:
      if not position_check(C, x):
         ++count
         result = False

    return (result, count)

 
# def graph_transform(dist):

# def find_itinerary(times, dist, deps):
