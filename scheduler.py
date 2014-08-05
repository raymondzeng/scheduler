from topsort import topsort
from itertools import izip
from datetime import datetime

def process_then_run(hours, distances):
    """
    process the two JSON dicts and return the best schedule
    """
    # assumes tasks must be scheduled today so figure out the operating hours of the location today
    
    # today's weekday ; datetime.weekday() uses Monday as 0 and Sunday as 6 
    # but Google Maps uses Sunday as 0 and Saturday as 6, hence the math
    
    # TODO not sure if correct, 
    weekday = (datetime.now().weekday() + 1) % 7

    for task_id, times in hours.items():
        print times[weekday]
    
def valid_schedules(tasks, deps):
    """
    Returns a list of valid orderings based on dependencies and time constraints

    Can assume that for every task, deadline - available >= duration
    """
    # each schedule is a list of task_ids
    schedules = topsort(tasks, deps)
    result = []
    for schedule in schedules:
        time_now = 0
        # TODO : empty list?
        for task_id in schedule:
            available, duration, deadline = tasks[task_id]
            
            # unable to get to this task with this schedule so this sched is invalid
            if deadline < time_now + duration:
                print "failed", schedule
                break

            time_now = available + duration
        else:
            print "vs", schedule
            result.append(schedule)
    return result
            
def shortest_path(tasks, dists, scheds):
    """
    tasks : dictionary of { id: (available, duration, deadline) }
    dists : dictionary of { (from_id, to_id) : distance }
    scheds : list of schedules where a schedule is a list of task ids
    """
    shortest_dist = -1
    shortest = None
    for sched in scheds:
        dist = sum(get_dist(dists, a, b) for a, b in izip(sched, sched[1:]))
        print "in", sched, dist
        if shortest is None or dist < shortest_dist:
            shortest_dist = dist
            shortest = sched
        
    return (shortest_dist, shortest)

def get_dist(dists, a, b):
    """ 
    dists is a dictionary where keys are tuples of (from_id, to_id) and the values are the distance from from_id to to_id. 

    This function returns the value with key (a,b) or (b,a) since they are the same distance.

    We need this function so we don't need to duplicate the dictionary with both keys (a,b) and (b,a)
    
    Will still throw an error if neither key exist
    """
    try:
        return dists[(a,b)]
    except KeyError:
        return dists[(b,a)]
        
# <task_id> : (available, duraction, deadline)
# the task can be done anytime between available and deadline
if __name__ == "__main__":
    tasks = { 1: (10, 2, 24),
              2: (11, 1, 14),
              3: (13, 1, 15),
              4: (14, 4, 18) }
    
    distances = { (1, 2) : 10,
                  (1, 3) : 12,
                  (1, 4) : 10,
                  (2, 3) : 5,
                  (2, 4) : 19,
                  (3, 4) : 16 }

    deps = { 1: [],
             2: [1],
             3: [],
             4: [3] }
    
    vs = valid_schedules(tasks, deps)
    print shortest_path(tasks, distances, vs)
