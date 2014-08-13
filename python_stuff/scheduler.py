from topsort import topsort
from itertools import izip
from datetime import datetime

def process_then_run(ids, hours, distances, deps):
    """
    process the two JSON dicts and returns the best schedule
    
    operating_hours is not guaranteed to be complete 
    (in the case that some locations don't have operating hours)
    
    If user didn't specify duration for a certain location, 1 hour is assumed
    """
    # assumes tasks must be scheduled today so figure out the operating hours of the location today
    
    # times_dict is complete (every task has a value for (available, duration, closing) times
    
    times_dict = hours #process_times(ids, hours)
  
    print "times", times_dict
    edge_weights = process_distances(distances)
    print "distances", edge_weights
 
    # TODO : make this unnecessary 
    # important to initalize deps so that every task has a value 
    # otherwise the algorithm throws KeyError
    dependencies = {}
    for task_id in times_dict.keys():
        if task_id in deps:
            dependencies[task_id] = deps[task_id]
        else:
            dependencies[task_id] = []
        
    return find_itinerary(times_dict, edge_weights, dependencies)

def process_times(ids, hours):
    times_dict = {}
    """
    this stuff is done client side now

    # today's weekday ; datetime.weekday() uses Monday as 0 and Sunday as 6 
    # but Google Maps uses Sunday as 0 and Saturday as 6, hence the math
    weekday = (datetime.now().weekday() + 1) % 7
    for id in ids:
        # default 
        entry = (0, 1, 2400) 
        try:
            hours = operating_hours[id]
            day = find_day(hours, weekday)
            
            # I represent times as HHMM, so 10:30 is 1030; 
            opens = day['open']['hours'] * 100 + day['open']['minutes']
            closes = day['close']['hours'] * 100 + day['close']['minutes']
            duration = 1
            entry = (opens, duration, closes)
        except KeyError:
            pass
        times_dict[id] = entry
    """
    for id in ids:
        opens = hours[id]["earliest"]
        closes = hours[id]["latest"]
        duration = hours[id]["duration"]
        times_dict[id] = (opens, duration, closes)
    
    return times_dict

def process_distances(distances):
    """
    distances is a dictionary where the keys are the two ids of the 
    from and to nodes seperated by a comma. 

    The values are dictionaries with keys 'text' and 'value' where text is 
    textual representaiton of the distance in miles and 
    value is the numeric value in meters
    
    You can think of this function as merely mapping the keys from "x,y" to (x,y) 
    and the values from a dict to just the value of 'value' (distance in meters)
    """
    
    dist_dict = {}
    for from_to, distance in distances.items():
        from_id, to_id = from_to.split(',')
        dist_dict[(from_id, to_id)] = distance

    return dist_dict

def find_day(times, day):
    """ 
    times is a list of dicitonaries. Each dict is for a day of the week. Each dict contains two keys, 'close' and 'open' and each of those values is a dict with keys 'hours', 'nextDate', 'minutes, 'day', 'time'
    
    day is 0 - 6 -> Sunday - Saturday

    This function returns the dict in list where the 'day' has a value of @day.
    
    We can't simply do times[day] because if there is no hour info for a given day (probably b/c it's closed), it is completely omitted.
    
    If there's no entry for @day, returns None
    """
    for time in times:
        # presumably 'close' and 'open' have the same day, 
        # otherwise data is corrupted, but this makes it fault-tolerant
        if time['close']['day'] == day or time['open']['day'] == day:
            return time
    return None
    

def find_itinerary(tasks, distances, deps):
    valid_scheds = valid_schedules(tasks, deps)
    return shortest_path(tasks, distances, valid_scheds)

def valid_schedules(tasks, deps):
    """
    Returns a list of valid orderings based on dependencies and time constraints

    Can assume that for every task, deadline - available >= duration
    """
    # just to print out some stats
    valids = 0
    failed = 0

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
                failed += 1
                break

            time_now = available + duration
        else:
            valids += 1
            print "valid: ", schedule
            result.append(schedule)
    print "time constraints => failed: " + str(failed), "success: " + str(valids)
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
     #   print "sp", sched, dist
        if shortest is None or dist < shortest_dist:
            shortest_dist = dist
            shortest = sched
        print "yum => ", dist, sched
        
    print shortest_dist, shortest
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
    tasks = { "1": (10, 2, 24),
              "2": (11, 1, 14),
              "3": (13, 1, 15),
              "4": (14, 4, 18) }
    
    distances = { ("1", "2") : 10,
                  ("1", "3") : 12,
                  ("1", "4") : 10,
                  ("2", "3") : 5,
                  ("2", "4") : 19,
                  ("3", "4") : 16 }

    deps = { "1": [],
             "2": ["1"],
             "3": [],
             "4": ["3"] }
    
    print find_itinerary(tasks, distances, deps)

