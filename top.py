elements = [1,2,3,4]
adj = {1:[],
       2:[1],
       3:[],
       4:[3]}

visited = {1:False,
           2:False,
           3:False,
           4:False,
           5:False}

def valid(e):
    """
    Returns if e's dependencies have all been visitedited already
    """
    for dep in adj[e]:
        if not visited[dep]:
            return False
    return True
 
def dfs(path=[]):
    if len(path) == len(elements):
        print path

    for elem in elements:
        if not visited[elem]:
            if valid(elem):
                visited[elem] = True
                dfs(path + [elem])
                visited[elem] = False

dfs()
