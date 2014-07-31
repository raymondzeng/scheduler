from topsort import topsort

def valid_schedules(tasks, deps):
    """
    Returns a list of valid orderings based on dependencies and time constraints

    Can assume that for every task, deadline - available >= duration
    """
    # each schedule is a list of task_ids
    schedules = topsort(tasks, deps)
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
            print schedule
            

# <task_id> : (available, duraction, deadline)
# the task can be done anytime between available and deadline
tasks = { 1: (10, 2, 24),
          2: (11, 1, 14),
          3: (13, 1, 15),
          4: (14, 4, 18)}

deps = { 1: [],
         2: [1],
         3: [],
         4: [3]}

valid_schedules(tasks, deps)
