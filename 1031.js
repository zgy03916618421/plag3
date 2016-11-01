function range2(n) {return n? range2(n-1).concat(Math.pow(2, n)):[]}

users_ts = db.user.find({createtime: {$exists: true}}, {_id: 0, createtime: 1})
    .sort({ createtime: 1})
    .limit(50000)
    .map(function(doc) {return doc.createtime});

function virus_before_ts(ts) {
    return db.virus.count({createtime: {$lt: ts}})
}

function infects_stats_before_ts(ts) {
    infects = db.infected.aggregate(
        [
            {
                $match: {
                    createtime: {$lt: ts}
                }
            },
            {
                $group: {
                    _id: "$vid",
                    count: {$sum : 1}
                }
            },
            {
                $sort: {
                    count: -1
                }
            },
        ]
    ).map(function(doc) {return doc.count});

    return {
        "time-stamp": ts,
        "users-count": db.user.count({createtime: {$lt: ts}}),
        "total-virus": virus_before_ts(ts),
        "average-infected": infects.reduce(function(a, b) {return a + b}) / (infects.length || 1),
        "max-infected": infects[0],
        //"min-infected": infects.slice(-1)[0]
    };
}

function stats(n) {
    return range2(n)
        .map(function(n) {return users_ts[n]})
        .map(function(ts) {return infects_stats_before_ts(ts)})
}

stats(15)
