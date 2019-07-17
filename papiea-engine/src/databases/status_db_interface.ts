// [[file:~/work/papiea-js/Papiea-design.org::*/src/databases/status_db_interface.ts][/src/databases/status_db_interface.ts:1]]
import { Entity_Reference, Status, Metadata } from "papiea-core";
import { SortParams } from "../entity/entity_api_impl";

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-548][status-db-interface]]

export interface Status_DB {

    // Update the status in the status db. As long as the input is
    // correct this always succeeds.
    replace_status(entity_ref: Entity_Reference, status: Status): Promise<void>;

    // Gets the status of a particular entity from the db. Returns
    // both current metadata and status of the entity.
    get_status(entity_ref: Entity_Reference): Promise<[Metadata, Status]>;

    // List all status that have their fields match the ones given in
    // fields_map. E.g. we could look for all statuses for `vm` kind that
    // have a certain ip:
    // list_status({"metadata": {"kind": "vm"},
    //              "status":   {"ip":   "10.0.0.10"}})
    //
    // We could come up with command such as greater-than etc at some
    // later point, or we could use a similar dsl to mongodb search
    // dsl.
    list_status(fields_map: any, sortParams?: SortParams): Promise<([Metadata, Status])[]>;

    delete_status(entity_ref: Entity_Reference): Promise<void>

    update_status(entity_ref: Entity_Reference, status: Status): Promise<void>
}

// status-db-interface ends here
// /src/databases/status_db_interface.ts:1 ends here
