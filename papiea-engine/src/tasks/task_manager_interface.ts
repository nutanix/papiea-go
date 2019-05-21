// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import { Diff, Entity_Reference, Kind, Spec } from "papiea-core";
import { Papiea } from "../papiea";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-766][task-manager-interface]]
export interface Task {
    wait():any;
    register_delta(diffs: Diff[]):boolean;
} 

export interface Task_Creator {
    new_task (): Task;
    new_intentful_task (papiea: Papiea, entity: Entity_Reference, kind: Kind, spec: Spec): Task;
}

export interface Task_Manager {
// Not yet defined..
}

// task-manager-interface ends here
// /src/tasks/task_manager_interface.ts:1 ends here
