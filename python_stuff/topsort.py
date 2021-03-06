def valid(e, deps, visited):
    """
    Returns if e's dependencies have all been visitedited already
    """
    for dep in deps[e]:
        if not visited[dep]:
            return False
    return True
            
def topsort_dfs(nodes, deps, visited, solutions, path=[]):
    if len(path) == len(nodes):
        solutions.append(path)

    for elem in nodes.keys():
        if not visited[elem]:
            if valid(elem, deps, visited):
                v = visited.copy()
                v[elem] = True
                topsort_dfs(nodes, deps, v, solutions, path + [elem])

def topsort(nodes, deps):
    visited = dict((node, False) for node in nodes)
    solutions = []
    topsort_dfs(nodes, deps, visited, solutions)
    return solutions
    

"""
Single topsort, first attempt at implementation

def topsort(nodes, deps):
    # nodes is a dict of tuple:
    #     { <node_id_int> : (deadline, duration),
    #       ... 
    #     }
    #
    # deps is a dict of list:
    #     { <node_id_int> : <list of nodes that this node depends on>
    #       ...
    #     }

    result = []
    no_dep = [k for k, v in deps.items() if v == []]
    deps = deps.copy()

    while(len(no_dep) != 0):
        node = no_dep.pop(0)
        result.append(node)
        
        # we can del a node's dep once it has been entered into the solution list because we will never need to again look at its dependencies b/c they've all already been resolved
        del deps[node]

        # all nodes that depend on node
        adjs = [k for k, v in deps.items() if node in v]
        # for each dependant node, see if that nodes dependencies have all been met
        for adj in adjs:
            if all(x in result for x in deps[adj]):
                no_dep.append(adj)

    if len(deps) != 0:
        raise ValueError('Cyclic Dependencies found among these nodes: {}'.format(', '.join(str(k) for k in deps.keys())))
    return result

d = {1:[], 2: [1, 3], 3: [], 4:[2], 5:[1]}
print topsort([], d)

"""
