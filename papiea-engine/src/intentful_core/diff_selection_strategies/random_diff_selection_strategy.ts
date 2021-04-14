import { DiffSelectionStrategyInterface } from "./diff_selection_strategy_interface";
import { Diff } from "papiea-core";
import * as assert from "assert";

export class RandomDiffSelectionStrategy implements DiffSelectionStrategyInterface {

    selectOne(diffs: Diff[]): Diff {
        assert(diffs.filter(diff => diff?.intentful_signature?.procedure_callback).length > 0, "No valid diffs to choose from")
        const chosen_diff = diffs[Math.floor(Math.random() * diffs.length)]
        return chosen_diff
    }
}
