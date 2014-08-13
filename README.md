scheduler
=========

Consumer description: Itinerary planner. Add destinations + time constraints (when things open, how long you want to spend there) and order constraints (I want to go to A and B before C). 

Technical: A solver for the TSP with topological sort for the dependencies. 

Two implementations of the algorithm: 
1. Naive:
   - First resolve dependencies
   - Next filter out the paths that don't meet the time req.s
   - finally compute the best distance of the remaining
   
   Guaranteed best solution
   Worst Case: No additional constraints given so == Naive TSP == O(n!)

2. Approximation:
   - find a MST
   - create a linear path with that MST
   - check to see if dependencies satisfied
     - in the case of one dep., we can just reverse any path to get a solution
     - in the case of two dependencies, if both failed, we can also reverse
   - in all other cases, we have to use naive solution

   Not guaranteed best solution
   Worst Case: same as naive    


KNOWN ISSUES:
Google maps occassionally throws a OVER_QUERY_LIMIT error in which case you have to keep trying to 'Go'. Look at console to see this error message.  

JS is not a good environment for intense computation. I literally only ported the algos to JS so the whole project could be hosted on gh pages. So if you use 9+ nodes, or upwards of 3million possible tours, the UI becomes unresponsive (single-threaded woohoo) and the page can crash.

UI quirks and very little error handling (not important)