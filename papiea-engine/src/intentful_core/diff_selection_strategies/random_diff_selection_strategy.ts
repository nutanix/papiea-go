import { DiffSelectionStrategyInterface } from "./diff_selection_strategy_interface";
import { Diff } from "papiea-core";
import * as assert from "assert";
import axios from "axios"

export class RandomDiffSelectionStrategy implements DiffSelectionStrategyInterface {

    async selectOne(diffs: Diff[]): Promise<Diff> {
        assert(diffs.filter(diff => diff?.intentful_signature?.procedure_callback).length > 0, "No valid diffs to choose from")
        const {data: {diff_ids}} = await axios.get(diffs[0].handler_url!)
        const alive_diffs = diffs.filter(id => diff_ids.includes(id))
        const chosen_diff = alive_diffs[Math.floor(Math.random() * alive_diffs.length)]
        return chosen_diff
    }
}
