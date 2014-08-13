from heapq import heappop, heappush 
from collections import defaultdict

def prim(G, s): 
    """
    G : connected graph represented as adj. list
    s : starting node that will be root of MST
    
    return : a MST
    """
    
    # P is the MST represented as a dict of edges
    # where keys are the end/to node
    # and the values are the start/from nodes
    P, Q = {}, [(0, None, s)] 

    while Q: ### Q : how do we know we prevent cycles?
        # heappop(Q) returns the minimum edge that can be 
        # connected to the current MST
        # p is the "from" node and is already in the MST
        # u is the "to" node and may or may not already be in the tree
        _, p, u = heappop(Q) 
        
        # if u is already in the tree, ignore this edge
        if u in P: 
            continue 
        
        # add the edge to the MST
        P[u] = p 
    
        # for every neighbor of the added "to" node,
        # add the edge to the neighbor to the heap
        for id, weight in G[u].items(): 
            heappush(Q, (weight, u, id)) 
            
    return P 
      
def approximate_tsp(G, r): # 2-approx for metric TSP 
    """
    G : adjaceny list rep. of graph
    r : root of MST
    
    return : a complete linear path
    """
    # tree is an adj. list 
    # path a list of nodes
    tree, path = defaultdict(list), []
    
    # create the adj. list representation of the tree
    for c, p in prim(G, r).items(): 
        tree[p].append(c)

    print tree
    # DFS traversal that creates a linear path that includes all nodes
    def traverse(r): 
       path.append(r)
       print tree[r]
       for v in tree[r]: 
           traverse(v)

    traverse(r) 
    return path

def adjust(C, deps):
    """
    C : a linear path
    deps : a dict of dependencies
    """

    def flat(deps):
        """
        Convert the dict rep. of deps into a list of tuples
        """
        result = []
        for key, val in deps.items():
            if val: # if has deps
                for dep in val:
                    result.append((key, dep))
        return result
    
    D = flat(deps)   
    L = len(D)
    
    if L == 0: # there are no deps
       return C # just return the path from MST
    elif L == 1: # there is a single dep
        # if that single dep is already satisfied
        if position_check(C, D[0]):
           return C
        # otherwise reverse the path to resolve the dep.
        else:
            C.reverse()
            return C
    # elif L == 2:
    #     # if all two deps are already resolved
    #     if (position_check_circle(C, D))[0]:
    #         return C
    #     # if both deps are not resolved, 
    #     # it means we can simply reverse the path to resolve both
    #     elif position_check_circle(C, D) == (False, 2):
    #         C.reverse()
    #         return C
    #     # otherwise, dammit 
    #     else: 
    #         return C
    else:
        # if all deps already resolved
        if (position_check_circle(C, D))[0]:
            return C
        # if all deps are not resolved, 
        # then we can just reverse it to resolve them all
        elif position_check_circle(C, D) == (False, L):
            C.reverse()
            return C
        # some resolved, some not = dammit, maybe incorrect solution
        else: 
            print "maybe incorrect"
            return C
    

def position_check(C, dep):
    """
    C : a linear path
    dep : a tuple (node, dependency)
    
    return : whether or not dep is satisfied in C
    """
    
    temp = []
    k, v = dep

    for x in C:
        if x != k and x != v:
            temp.append(x)
        elif x == k:
            return (v in temp)
        elif x == v:
            return (k not in temp)
         
def position_check_circle(C, pairs):
    """
    C : a linear path
    pairs : a list of tuples, where the tuples are deps (node, dep)

    return : tuple (boolean, int)
             boolean : all deps were resolved
             int : num of deps in pairs that aren't resolved
    """
    num_unresolved = 0
    all_resolved = True
    for tup in pairs:
        # if this dep is not resolved
        if not position_check(C, tup):
            ++num_unresolved
            all_resolved = False

    return (all_resolved, num_unresolved)



if __name__ == "__main__":
    a, b, c, d, e = range(5)
    G = [ 
        {b:1, c:1, d:1, e:2}, # a 
        {a:1, c:1, d:2, e:1}, # b 
        {a:1, b:1, d:1, e:1}, # c 
        {a: 1, b:2, c:1, e:1}, # d 
        {a:2, b:1, c:1, d:1}  # e 
    ] 
    
    deps = { a: [],  # 0
             b: [], # 1 
             c: [],  # 2
             d: [], # 3
             e: []   # 4
         }
    
    c = adjust(approximate_tsp(G, a), deps)
    print c
