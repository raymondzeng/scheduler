Scheduler
===
Scheduler is a solver for the Traveling-Salesman-Problem (TSP) with additional time and ordering constraints. 

The Problem
===
Imagine you're traveling somewhere and you have a bunch of places you want to visit. Placeso open and close at different times, you may want to visit a place in a specific time frame, or attend an event that has a fixed time frame. Sometimes you need to visit places in a specific order - maybe you want to get that famous cheesecake from that famous place, but you just don't feel right eating dessert before getting lunch at that other place. 

Manually finding the optimal itinerary that accounts for all these constraints is tedious, if not impossible. Scheduler is a solution for automating the process.

How to Use
===
Start typing the name or address of a destination in the search bar and select from the dropdown.

The operating hours are automatically fetched for you, if Google Maps knows about it. You can edit the 'earliest', 'duration', and 'latest' fields by double clicking them. 'earliest' is the earliest time that you want to arrive, 'duration' is how long you want to spend there, and 'latest' is the latest time you want to leave by; so it doesn't make sense if (latest - earliest < duration).

Specify order constraints, or dependencies, by first selecting the 'dependency' by clicking on it. Clicking the green '+' button next to a location will add all selected 'dependeny's to that location. This means that all those 'dependency's you added must be visited before the one you added them to. Be careful with circular dependencies and impossible constraints.

How it Works
===
All place-related info (operating hours, name, address, etc.) and distance between two places is from the Google Maps API. 

With that info and user-specified info, we use two solutions to the TSP.

1. Naive algorithm
   - First, use topological sort to generate all schedules that satisfy all ordering constraints
   - Next, filter those possible schedules by removing the ones that don't satisfy all time constraints
   - Finally, pick from the remaining schedules the one with the shortest overall traveling distance

2. Optimized
   - If there are more than 3 dependencies, we just use the naive algorithm
   - Otherwise:
      - Use Prim's algorithm to find a minimum spanning tree
      - From that MST, create a linear path
         - If there is only **one** dependency, see if the linear path already satisfies it, otherwise just reverse the path
         - If there are **two** dependencies, if both deps. failed, reverse the path; if both succeed, we're done; otherwise resort to naive algorithm
         - If there are **three** dependencies, if all failed or succeeded, we either reverse or keep it; otherwise, resort to naive

Known Issues
===
- Google maps occassionally throws a OVER_QUERY_LIMIT error in which case you have to keep trying to 'Go'. 
- Adding a location fails if Google doesn't have the proper operating hours info
- We assume all things open after 12AM and close before 12AM (max range is 0 - 2400) but this is not true (Central Park closes at 1AM)
- We don't check or sanitize edits to the times
- If the data isn't exactly in the format it expects, it'll think there's no solution and/or crash

Finally, JS is not a good environment for intense computation. I literally only ported the algos to JS so the whole project could be hosted on gh pages. So if you use 9+ nodes, or upwards of 3million possible tours, with the naive algorithm, the UI becomes unresponsive (single-threaded woohoo) and the page can crash.

We have the algorithms implemented in Python so you can test with those more reliably.


