
export function datestringToFilter(datestring: string): any {
    if (datestring == "papiea_one_hour_ago") {
        return { "$gte": new Date(Date.now() - 60 * 60 * 1000) }
    } else if (datestring == "papiea_one_day_ago") {
        return { "$gte": new Date(Date.now() - 24 * 60 * 60 * 1000) }
    } else if (!datestring) {
        return null;
    }
}