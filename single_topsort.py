def topsort(nodes, deps):
    """
    nodes is a dict of tuple:
        { <node_id_int> : (deadline, duration),
          ... 
        }

    deps is a dict of list:
        { <node_id_int> : <list of nodes that this node depends on>
          ...
        }
    """
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
