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
    
