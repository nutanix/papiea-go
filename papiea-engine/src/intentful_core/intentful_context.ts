import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"
import { IntentfulStrategy } from "./intentful_strategy_interface"
import { BasicIntentfulStrategy } from "./basic_intentful_strategy"
import { IntentfulBehaviour } from "papiea-core"

export type BehaviourStrategyMap = Map<IntentfulBehaviour, IntentfulStrategy>

export class IntentfulContext {
    private readonly specDb: Spec_DB
    private readonly statusDb: Status_DB
    private readonly behaviourStrategy: BehaviourStrategyMap

    constructor(specDb: Spec_DB, statusDb: Status_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.behaviourStrategy = new Map<IntentfulBehaviour, IntentfulStrategy>()
        this.behaviourStrategy.set(IntentfulBehaviour.Basic, new BasicIntentfulStrategy(specDb, statusDb))
    }

    getIntentfulStrategy(behaviour: IntentfulBehaviour): IntentfulStrategy {
        const strategy = this.behaviourStrategy.get(behaviour)
        if (strategy === undefined) {
            throw new Error(`Strategy associated with behaviour: ${behaviour} not found`)
        }
        return strategy
    }
}