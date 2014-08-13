var map;
var placesService, directionsService;
var searchBox;
var waypoints = [];
var MARKER_PATH = 'http://maps.gstatic.com/intl/en_us/mapfiles/marker_green';
var MARKER_HOVER_PATH = 'http://maps.gstatic.com/intl/en_us/mapfiles/marker';
var MARKER_SELECTED_PATH = 'http://maps.gstatic.com/intl/en_us/mapfiles/marker_orange';
var directions = {};
var distances = {};
var NYC_LATLNG = null;
var ZOOM_DEFAULT = 13;

var Task, TaskList, TaskView, AppView;
var Tasks, App;

$(function() {    
    // Task = Backbone.Model.extend({
    //     defaults: function() {
    //         return {
    //             name: "No Name",
    //             address: "No Address",
    //             letter: "-",
    //             earliest: 0,
    //             duration: 60,
    //             latest: 2400,
    //             selected: false,
    //             canAdd: true,
    //         };
    //     },
        
    //     initialize: function() {
    //         this.dependencies = new DependencyList;
    //     },
        
    //     toggle: function() {
    //         this.save({
    //             selected: !this.get("selected"),
    //             canAdd: !this.get("canAdd")
    //         });
    //     },
    // });
    
    // Dependency = Backbone.Model.extend({
    //     defaults: function() {
    //         return {
    //             letter: "-",
    //             name: "No Name"
    //         };
    //     }
    // });
    
    // DependencyView = Backbone.View.extend({
    //     tagName: "tr",
    //     template: _.template($("#dep-template").html()),
        
    //     events: {
    //         "click .delete_btn" : "clear"
    //     },
        
    //     initialize: function() {
    //         this.listenTo(this.model, 'change', this.render);
    //         this.listenTo(this.model, 'destroy', this.remove);
    //     },

    //     render: function() {
    //         this.$el.attr("class", "dependency");
    //         this.$el.html(this.template(this.model.toJSON()));
    //         return this;
    //     },

    //     clear: function() {
    //         this.model.destroy();
    //     }
    // });
        
    // DependencyList = Backbone.Collection.extend({
    //     model: Dependency,
    //     localStorage: new Backbone.LocalStorage("tasks-dependencies")
    // });
    
    // TaskList = Backbone.Collection.extend({
    //     model: Task,
    //     localStorage: new Backbone.LocalStorage("tasks"),
        
    //     selected: function() {
    //         return this.where({selected: true});
    //     },
        
    //     deselectAll: function() {
    //         this.each(function(model) {
    //             model.save({
    //                 selected: false,
    //                 canAdd: true
    //             });
    //         });
    //     }
    // });
    
    // Tasks = new TaskList;

    // TaskView = Backbone.View.extend({
    //     tagName: "tr",
    //     template: _.template($("#task-template").html()),
        
    //     events: {
    //         "click .task_str"   : "toggleSelected",
    //         "click .delete_btn" : "clear",
    //         "click .dep_btn"    : "addDeps",
    //         "dblclick .time"    : "editTime",
    //         "blur .edit"        : "close",
    //         "keypress .edit"    : "updateOnEnter"
    //     },
        
    //     initialize: function() {
    //         this.depViews = [];
    //         this.listenTo(this.model, 'change', this.render);
    //         this.listenTo(this.model, 'destroy', this.remove);
    //         var marker = this.model.get("marker");
    //         if (marker) 
    //             marker.setMap(map);
            
    //         _.bindAll(this, 'render');
    //         this.model.dependencies.bind('reset', this.render);
    //         this.model.dependencies.bind('add', this.render);
    //         this.model.dependencies.bind('remove', this.render);
    //     },

    //     render: function() {
    //         this.$el.html(this.template(this.model.toJSON()));
    //         this.displaySelected();
    //         this.$el.children("td").children(".dep_btn").prop("disabled", !this.model.get("canAdd"));
            
    //         _.each(this.depViews, function(view) {
    //             view.remove();
    //         });

    //         var depCollection = this.model.dependencies;
            
    //         var taskView = this;
    //         depCollection.each(function(model) {
    //             var depView = new DependencyView({
    //                 model: model
    //             });
    //             taskView.depViews = taskView.depViews.concat([depView]);
    //             taskView.$el.after(depView.render().el);
    //         });

    //         return this;
    //     },
        
    //     toggleSelected: function() {
    //         this.model.toggle();
    //     },
        
    //     addDeps: function() {
    //         var selected = Tasks.selected();
    //         var taskView = this;
    //         var depViews = _.each(selected, function(v) {
    //             taskView.model.dependencies.create({
    //                 id: v.get("id"),
    //                 name: v.get("name"),
    //                 letter: v.get("letter")
    //             });
    //         });
            
    //         Tasks.deselectAll();
    //     },
        
    //     editTime: function(e) {
    //         var edit_box = $(e.target).siblings(".edit");
    //         edit_box.css("display", "block").focus().select();
    //         $(e.target).hide();
    //     },
        
    //     close: function(e) {
    //         $(e.target).siblings(".edit_view").show();
    //         $(e.target).hide();
    //     },

    //     updateOnEnter: function(e) {
    //         if (e.keyCode != 13) return;
    //         var which = $(e.target).attr("which");
    //         var dict = {};
    //         dict[which] = $(e.target).val();
    //         this.model.save(dict);
    //     },
        
    //     clear: function() {
    //         var marker = this.model.get("marker");
    //         if (marker) {
    //             waypoints = _.without(waypoints, marker);
    //             marker.setMap(null);
    //             zoomToFit();
    //         }
            
    //         this.model.dependencies.each(function(model) {
    //             model.destroy();
    //         });
            
    //         this.model.destroy();
    //     },
        
    //     displaySelected: function() {
    //         var marker = this.model.get("marker");
    //         if (this.model.get("selected")) {
    //             this.$el.children(".task_str").addClass("dep_selected");
    //             marker.path = MARKER_SELECTED_PATH;
    //             marker.prev = marker.path;
    //             marker.setIcon(iconPath(marker.path,  marker.letter));
    //         } else {
    //             this.$el.children(".task_str").removeClass("dep_selected");
    //             marker.path = MARKER_PATH;
    //             marker.prev = marker.path;
    //             marker.setIcon(iconPath(marker.path, marker.letter));
    //         }
    //     }
    // });

    // AppView = Backbone.View.extend({
        
    //     el: $("#task_list"),
                
    //     initialize: function() {
    //         this.input = this.$("#searchTextField");
            
    //         this.listenTo(Tasks, 'add', this.addOne);
    //         Tasks.fetch();

    //         initGoogleMaps();
    //         google.maps.event.addListener(searchBox, 'places_changed', this.handleNewTask);
    //     },
        
        
    //     addOne: function(task) {
    //         var view = new TaskView({model: task});
    //         this.$("#list").append(view.render().el);
    //     },
        
    //     handleNewTask: function() {
    //         onPlaceChanged();
    //     }
    // });
    
    //App = new AppView;
    
    // $('#searchTextField').keypress(function (e) {
    //     if (e.which == 13) {
    //         e.preventDefault();
    //     }
    // });    
    // $("#go a").click(function() {
    //     $("#landing").slideUp();
    //     $("#app").show();
    //     google.maps.event.trigger(map, 'resize');
    //     $("html").css("background", "white");
    //     $("#searchTextField").focus();
    // });
    
    // $("#app a").click(function() {
    //     $("#landing").slideDown();
    //     $("#app").hide();
    //     $("html").css("background", 'url("static/img/map.png")');
    // });
    
});


// Google Maps

// function initGoogleMaps() {
//     NYC_LATLNG = new google.maps.LatLng(40.790278, -73.959722);
    
//     // create the map element
//     map = new google.maps.Map(document.getElementById('map'), {
//         center: NYC_LATLNG,
//         zoom: ZOOM_DEFAULT,
//         maxZoom: 18
//     });
    
//     // create the places and directions API interfacing objects
//     placesService = new google.maps.places.PlacesService(map);
//     directionsService = new google.maps.DirectionsService();

//     // create the autocompleting text box
//     var input = document.getElementById('searchTextField');
//     searchBox = new google.maps.places.SearchBox(input);
//     searchBox.bindTo('bounds', map);

//     // add a listener to when an item is selected from the list
//   //  google.maps.event.addListener(searchBox, 'places_changed', onPlaceChanged);
    
//     // create the directions display and attach it to the map
//     directionsDisplay = new google.maps.DirectionsRenderer({
//         suppressMarkers: true,
//         preserveViewport: true
//     });
//     directionsDisplay.setMap(map);
// }

// function nextMarkerLetter() {
//     if (waypoints.length != 0) {            
//         var lastLetterCode = _.last(waypoints).letter.charCodeAt(0);
//         var nextLetterCode = lastLetterCode;
        
//         // we use '-' when we run out of letters
//         if (lastLetterCode != 45) {
//             nextLetterCode = lastLetterCode == 90 ? 0 : lastLetterCode + 1;
//         }            
//         return String.fromCharCode(nextLetterCode);
//     } else {
//         return "A";
//     }
// }

// function resolveHours(hours) {
//     // figure out when the place opens/closes, and default duration is 1 hour
//     // user can later edit these
//     var earliest, latest;
    
//     if (hours == undefined) {
//         earliest = 0;
//         latest = 2400;
//     } else {
//         // Sun = 0, Sat = 6; same as Google Maps
//         var todays_weekday = new Date().getDay();

//         var close_open = hours.periods[todays_weekday];

//         // TODO : some things (Central Park) are open from 6am to 1am. deal with this; it breaks the guarantee that latest > earliest
//         earliest = close_open['open']['hours'] * 100 
//             + close_open['open']['minutes'];
//         latest = close_open['close']['hours'] * 100 
//             + close_open['close']['minutes'];
//     }
    
//     return {
//         earliest: earliest,
//         latest: latest
//     };
// }

// function onPlaceChanged() {
//     var places = searchBox.getPlaces();
//     if (places[0].geometry) {
//         var place = places[0];

//         if (_.find(waypoints, function(n) {
//             return n.id == place.place_id;
//         })) {
//             console.log("already added");
//             return;
//         }

//         map.panTo(place.geometry.location);
        
//         var markerLetter = nextMarkerLetter();
//         var markerIcon = iconPath(MARKER_PATH, markerLetter);
//         marker = new google.maps.Marker({
//             position: place.geometry.location,
//             animation: google.maps.Animation.DROP,
//             icon: markerIcon,
//             id: place.place_id,
//             path: MARKER_PATH,
//             prev: MARKER_PATH,
//             letter: markerLetter
//         });
        
//         var hour_range = resolveHours(place.opening_hours);

//         Tasks.create({
//             id: place.place_id,
//             name: place.name,
//             letter: markerLetter,
//             address: place.formatted_address,
//             earliest: hour_range.earliest,
//             latest: hour_range.latest,
//             marker: marker
//         });

        
//         // FOLLOWING THREE NEED TO BE IMPLEMENTED W/ BACKBONE
//         // clicking on a marker selects the corresponding item in list
//         // google.maps.event.addListener(marker, 'click', function() {
//         //     $("#tr_" + this.id + " .task_str").click();
//         // });

//         // // hovering over a marker temp. highlights the item in list
//         // google.maps.event.addListener(marker, 'mouseover', function() {
//         //     $("#tr_" + this.id + " .task_str").prev().addClass("dep_hovered");
//         // });
//         // google.maps.event.addListener(marker, 'mouseout', function() {
//         //     $("#tr_" + this.id + " .task_str").prev().removeClass("dep_hovered");
//         // });

//         marker.setMap(map);
//         waypoints.push(marker);
                
//         zoomToFit();
//     }
// }

// function zoomToFit() { 
//     if (waypoints.length == 0) {
//         map.panTo(NYC_LATLNG);
//         map.setZoom(ZOOM_DEFAULT);
//         return;
//     }
    
//     var bounds = smallestBound();

//     // Fit these bounds to the map
//     map.fitBounds(bounds);
// }

// function smallestBound() {    
//     // Create a new viewpoint bound
//     var bounds = new google.maps.LatLngBounds();
//     // Go through each...
//     for (var i = 0; i < waypoints.length; i++) {
//         var marker = waypoints[i];
//         // And increase the bounds to take this point
//         bounds.extend(marker.position);
//     }
    
//     return bounds;
// }

//     // when you hover over a location's text, it will change the color
//     // of the marker corresponding to it
//     // NOT IMPLEMENTED IN BACKBONE
//     // $("#tr_" + id + " .task_str").hover(function() {
//     //     var marker = find_marker(id);
//     //     marker.prev = marker.path;
//     //     marker.path = MARKER_HOVER_PATH;
//     //     marker.setIcon(iconPath(marker.path, marker.letter));
//     // }, function () {
//     //     var marker = find_marker(id);
//     //     marker.path = marker.prev;
//     //     marker.setIcon(iconPath(marker.path, marker.letter));
//     // });

// function find_marker(id) {
//     // return the marker in @waypoints with the given id
//     // returns null if not found

//     for (var i = 0; i < waypoints.length; i++) {
//         if (waypoints[i].id == id) {
//             return waypoints[i];
//         }
//     }
//     return null;
// }



// // submit to server
// function submitTasks(local) {
//     console.log("submit");

//     // create list of task ids
//     ids = waypoints.map(function(m) {
//         return m.id
//     });
    
//     // create a dict of id : periods
//     // periods is an array of opening periods covering seven days, starting from Sunday, in chronological order.
//     // https://developers.google.com/maps/documentation/javascript/places#place_details_responses
//     // periods can be undefined
//     hours = {};
//     for (var i = 0; i < waypoints.length; i++) {
//         hours[waypoints[i].id] = allToMinutes(Tasks.get(waypoints[i].id));
//     }

//     deps = {};
//     Tasks.each(function(task) {
//         deps[task.get("id")] = task.dependencies.map(function(dep) {
//             return dep.get("id");
//         });
//     });

//     // for every unique pair of nodes, if we don't already have the distance info, call Google Maps API to get it
//     var reqs_to_get = [];
//     for (var i = 0; i < waypoints.length; i++) {
//         for (var j = i + 1; j < waypoints.length; j++) {
//             var key = waypoints[i].id + "," + waypoints[j].id
            
//             // already have the distance value for this pair
//             if (distances[key] != undefined)
//                 continue

//             var to_get = {
//                 key: key,
//                 request: {
//                     origin: waypoints[i].position,
//                     destination: waypoints[j].position,
//                     travelMode: google.maps.TravelMode.DRIVING
//                 }
//             };
            
//             reqs_to_get.push(to_get);
//         }
//     }
    
//     deferreds = [];
//     _.each(reqs_to_get, function(to_get) {
//         var def = $.Deferred();
//         def.key = to_get.key;
//         deferreds.push(calcDistance(to_get, def));
//     });

//     if (local) {
//         // once we have everything, submit to server
//         $.when.apply($, deferreds).done(function() {
//             local_submit();
//         });
//     } else {
//         // once we have everything, submit to server
//         $.when.apply($, deferreds).done(function() {
//             submit();
//         });
//     }
// }

// function calcDistance(to_get, defer) {
//     console.log("fetching dist");
//     directionsService.route(to_get.request, function(response, status) {
//         if (status == google.maps.DirectionsStatus.OK) {    
//             directions[defer.key] = response;
//             distances[defer.key] =  response.routes[0].legs[0].distance.value;
//             defer.resolve(response);
//         } else {
//             defer.reject(status);
//         }
//     });
//     return defer;
// }

// function submit() {
//     console.log("submitting");

//     // there will always be (n choose 2) unordered pairs of nodes
//     // where n is the number of waypoints
//     // console.log(_.size(distances) >= choose(waypoints.length, 2));
//     $.ajax({
//         type : "POST",
//         url : "/submit",
//         data: JSON.stringify({
//             "ids" : ids,
//             "distances" : distances,
//             "hours" : hours,
//             "dependencies" : deps
//         }),
//         contentType: 'application/json; charset=UTF-8',
//         success: renderTSPRoute
//     });
// }

// function local_submit() {
//     var data = find_itinerary(hours, distances, deps);
//     renderTSPRoute(data);
// }

// function renderTSPRoute(data) {
//     console.log("got response");
//     var sched = data["schedule"];
//     var legs = [];
//     for (var i = 0; i < sched.length - 1; i++) {
//         var leg = find_directions(sched[i], sched[i+1]);
//         legs.push(leg);
//     }

//     var combined = combine_directions(legs);

//     directionsDisplay.setDirections(combined);
// }

// Utils
function choose(n, k) {
    return fact(n) / (fact(k) * fact(n - k));
}

function fact(n) {
   return (n<2) ? 1 : n * fact(n-1);
}

function iconPath(prefix, letter) {
    return prefix 
        + (letter == "-" ? "" : letter) 
        + '.png';
}

function find_directions(f, s) {
    var maybe = directions[f + "," + s];
    if (maybe == undefined) 
        return directions[s + "," + f];
    return maybe
}

function combine_directions(legs) {
    var route = $.extend(true, {}, legs[0]);
    for (var i = 1; i < legs.length; i++) {
        route.routes[0].legs = route.routes[0].legs.concat(legs[i].routes[0].legs);
    }
    return route;
}

function allToMinutes(taskModel) {
    // Input : a Task model
    //
    //         model.get("earliest") -> xxyy
    //         model.get("duration") -> m
    //         model.get("latest") -> xxyy
    //         
    //     xxyy is an int and xx represents the hour and yy the minutes
    //          on a 24-hour clock, so 22:30 is 10:30 PM
    //     m is an int and represents the minutes, so 185 is
    //       185 minutes, or 3 hours and 5 minutes        
    //
    //
    // Output : all keys in minutes, so really just converting xxyy to minutes

    var earliest = taskModel.get("earliest");
    var latest = taskModel.get("latest");
    
    // same as Math.floor but handles negatives correctly
    var e_hour = (earliest / 100) >> 0;
    var e_min = (earliest % 100);
    earliest = e_hour * 60 + e_min;
    
    var l_hour = (latest / 100) >> 0;
    var l_min = (latest % 100);
    latest = l_hour * 60 + l_min;
    
    // return {
    //     "earliest" : earliest,
    //     "duration" : taskModel.get("duration"),
    //     "latest" : latest
    // };
    return [earliest, taskModel.get("duration"), latest];
}







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

    _.each(Object.keys(nodes), function(key) {
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
    // """
    // tasks : dictionary of { id: (available, duration, deadline) }
    // dists : dictionary of { (from_id, to_id) : distance }
    // scheds : list of schedules where a schedule is a list of task ids
    // """
    var shortest_dist = -1;
    var shortest = null;
    _.each(scheds, function(sched) {
        var dist = 0;
        
        for (var i = 0; i < sched.length -1; i++) {
            var a = sched[i];
            var b = sched[i + 1];
            console.log("get: " + get_dist(dists, a, b));
            dist += get_dist(dists, a, b);
        }
        
        console.log(dist);

        if (shortest == null || dist < shortest_dist) {
            shortest_dist = dist;
            shortest = sched;
        }
        console.log("yum: " + dist + " " + shortest);
    });
    
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


//from heapq import heappop, heappush 
//from collections import defaultdict





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


G = {
    "a" : {"b":1, "c":1, "d":1, "e":2}, // a 
    "b" : {"a":1, "c":1, "d":2, "e":1}, // b 
    "c" : {"a":1, "b":1, "d":1, "e":1}, // "c" 
    "d" : {"a":1, "b":2, "c":1, "e":1}, // "d" 
    "e" : {"a":2, "b":1, "c":1, "d":1}  // e 
}
    
deps = { "a": [],  // 0
         "b": ["c"], // 1 
         "c": [],  // 2
         "d": [], // 3
         "e": []   // 4
       }

c = adjust(approximate_tsp(G, "a"), deps)
console.log( c);
