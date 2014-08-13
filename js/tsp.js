define([
    'underscore',
    'heap'
], function(_, Heap) {

    function valid(e, deps, visited) {
        // """
        // Returns if e's dependencies have all been visited already
        // """
        for (var i = 0; i < deps[e].length; i++) {
            if (!visited[deps[e][i]])
                return false;
        }
        return true;
    }
    
    function topsort_dfs(nodes, deps, visited, solutions, path) {
        if (path.length == _.size(nodes)) {
            solutions.push(path);
        }

        var keys = Object.keys(nodes);
        _.each(keys, function(key) {
            if (!visited[key]) {
                if (valid(key, deps, visited)) {
                    var v = _.clone(visited);
                    v[key] = true;
                    var p = _.clone(path);
                    p.push(key);
                    topsort_dfs(nodes, deps, v, solutions, p);
                }
            }
        });
    }

    function topsort(nodes, deps) {
        var visited = {};
        
        _.each(Object.keys(nodes), function(key) {
            visited[key] = false;
        });
        
        var solutions = [];
        topsort_dfs(nodes, deps, visited, solutions, []);
        return solutions;
    }

    function find_itinerary(tasks, distances, deps) {
        var valid_scheds = valid_schedules(tasks, deps);
        return shortest_path(tasks, distances, valid_scheds);
    }

    function valid_schedules(tasks, deps) {
        // """
        // Returns a list of valid orderings based on dependencies and time constraints

        // Can assume that for every task, deadline - available >= duration
        // """
        // just to print out some stats
        var valids = 0
        var failed = 0

        // each schedule is a list of task_ids
        var schedules = topsort(tasks, deps);
        var result = [];
        
        _.each(schedules, function(schedule) {
            var time_now = 0;

            var failed_flag = false;
            for (var i = 0; i < schedule.length; i++) {
                var task_id = schedule[i];
                var available = tasks[task_id][0];
                var duration = tasks[task_id][1];
                var deadline = tasks[task_id][2];
                
                if (deadline < time_now + duration) {
                    failed += 1;
                    failed_flag = true;
                    break;
                } else {
                    time_now = available + duration;
                }
            }
            
            // if for loop didn't break out 
            if (!failed_flag) {
                valids += 1;
                result.push(schedule)
            }
        });
        console.log("time constraints => failed: " + failed + "success: " + valids);
        return result;
    }
    
    function shortest_path(tasks, dists, scheds) {
        var shortest_dist = -1;
        var shortest = null;

        for (var i = 0; i < scheds.length; i++) {            
            var sched = scheds[i];
            var dist = 0;
            
            for (var j = 0; j < sched.length -1; j++) {
                var a = sched[j];
                var b = sched[j + 1];
                dist += get_dist(dists, a, b);
            }
            
            if (shortest == null || dist < shortest_dist) {
                shortest_dist = dist;
                shortest = sched;
            }
        }
        
        return {
            "distance" : shortest_dist, 
            "schedule" : shortest
        };        
    }

    function get_dist(dists, a, b) {
        // """ 
        // dists is a dictionary where keys are tuples of (from_id, to_id) and the values are the distance from from_id to to_id. 

        // This function returns the value with key (a,b) or (b,a) since they are the same distance.

        // We need this function so we don't need to duplicate the dictionary with both keys (a,b) and (b,a)
        
        // Will still throw an error if neither key exist
        // """
        var dist = dists[a + "," + b];
        
        if (dist == undefined)
            return dists[b + "," + a];
        return dist;
    }


    // tests: passed
    // var tasks = { "1": [10, 2, 24],
    //           "2": [11, 1, 14],
    //           "3": [13, 1, 15],
    //           "4": [14, 4, 18] }

    // var distances = { "1,2": 10,
    //               "1,3" : 12,
    //               "1,4" : 10,
    //               "2,3" : 5,
    //               "2,4" : 19,
    //               "3,4" : 16 }

    // var deps = { "1": [],
    //          "2": ["1"],
    //          "3": [],
    //          "4": ["3"] }

    // console.log(find_itinerary(tasks, distances, deps));



    function prim(G, s) {
        // """
        // G : connected graph represented as adj. list
        // s : starting node that will be root of MST
        
        // return : a MST
        // """
        
        // P is the MST represented as a dict of edges
        // where keys are the end/to node
        // and the values are the start/from nodes
        var P = {};
        var Q = new Heap(function(a, b) {
            return a[0] - b[0];
        });

        Q.push([0, null, s]);
        
        while (Q.size() != 0) { 
            // heappop(Q) returns the minimum edge that can be 
            // connected to the current MST
            // p is the "from" node and is already in the MST
            // u is the "to" node and may or may not already be in the tree
            var item = Q.pop();
            var p = item[1];
            var u = item[2];
            
            // if u is already in the tree, ignore this edge
            if (!(P[u] === undefined)) { 
                continue;
            } 
            
            // add the edge to the MST
            P[u] = p; 
            
            // for every neighbor of the added "to" node,
            // add the edge to the neighbor to the heap
            var neighbors = G[u];
            var keys = Object.keys(neighbors);
            for (var i = 0; i < keys.length; i++) {
                var id = keys[i];
                var weight = neighbors[id];
                Q.push([weight, u, id]); 
            }
        }
        
        return P;
    }
    
    function approximate_tsp(G, r) { // 2-approx for metric TSP 
        // """
        // G : adjaceny list rep. of graph
        // r : root of MST
        
        // return : a complete linear path
        // """
        // tree is an adj. list 
        // path a list of nodes
        var tree = {};
        var path = [];
        
        // create the adj. list representation of the tree
        var prim_tree = prim(G, r);

        var keys = Object.keys(prim_tree);
        for (var i = 0; i < keys.length; i++) {
            var c = keys[i];
            var p = prim_tree[c];
            
            if (tree[p] == undefined)
                tree[p] = [c];
            else
                tree[p].push(c);
        }

        // DFS traversal that creates a linear path that includes all nodes
        function traverse(r) { 
            path.push(r);
            
            if (tree[r] == undefined) 
                return;

            for (var i = 0; i < tree[r].length; i++) {
                var v = tree[r][i];
                traverse(v);
            }
        }

        traverse(r);
        return path;
    }

    function adjust(C, deps) {
        // """
        // C : a linear path
        // deps : a dict of dependencies
        // """

        function flat(deps) {
            // """
            // Convert the dict rep. of deps into a list of tuples
            // """
            var result = [];
            
            var keys = Object.keys(deps);
            
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var val = deps[key];
                
                if (val.length != 0) { // if has deps
                    _.each(val, function(dep) {
                        result.push([key, dep]);
                    });
                }
            }
            
            return result;
        }
        
        var D = flat(deps);
        var L = D.length;
        
        if (L == 0) // there are no deps
            return C; // just return the path from MST
        else if (L == 1) { // there is a single dep
            // if that single dep is already satisfied
            if (position_check(C, D[0])) {
                return C;
            } else { // otherwise reverse the path to resolve the dep.
                return C.reverse();
            }
        } else {
            // if all deps already resolved
            if ((position_check_circle(C, D))[0]) {
                return C;
            }
            // if all deps are not resolved, 
            // then we can just reverse it to resolve them all
            else if (position_check_circle(C, D) == [False, L]) {
                return C.reverse();
            }
            // some resolved, some not = dammit, maybe incorrect solution
            else { 
                console.log( "maybe incorrect");
                return C;
            }
        }
    }

    function position_check(C, dep) {
        // """
        // C : a linear path
        // dep : a tuple (node, dependency)
        
        // return : whether or not dep is satisfied in C
        // """
        
        var temp = [];
        var k = dep[0];
        var v = dep[0];

        for (var i = 0; i < C.length; i++) {
            var x = C[i];
            
            if (x != k && x != v)
                temp.push(x);
            else if (x == k)
                return _.contains(temp, v);
            else if (x == v)
                return !_.contains(temp, k);
        }
    }
    
    function position_check_circle(C, pairs) {
        // """
        // C : a linear path
        // pairs : a list of tuples, where the tuples are deps (node, dep)

        // return : tuple (boolean, int)
        //          boolean : all deps were resolved
        //          int : num of deps in pairs that aren't resolved
        // """
        var num_unresolved = 0;
        var all_resolved = true;
        
        for (var i = 0; i <pairs.length; i++) {
            var tup = pairs[i];
            
            // if this dep is not resolved
            if (!position_check(C, tup)) {
                num_unresolved++;
                all_resolved = false;
            }
        }
        return [all_resolved, num_unresolved];
    }

    // G = {
    //     "a" : {"b":1, "c":1, "d":1, "e":2}, // a 
    //     "b" : {"a":1, "c":1, "d":2, "e":1}, // b 
    //     "c" : {"a":1, "b":1, "d":1, "e":1}, // "c" 
    //     "d" : {"a":1, "b":2, "c":1, "e":1}, // "d" 
    //     "e" : {"a":2, "b":1, "c":1, "d":1}  // e 
    // }
    
    // deps = { "a": [],  // 0
    //          "b": ["c"], // 1 
    //          "c": [],  // 2
    //          "d": [], // 3
    //          "e": []   // 4
    //        }

    // c = adjust(approximate_tsp(G, "a"), deps)
    // console.log( c);
    
    return {
        findItinerary: find_itinerary
    }
});
