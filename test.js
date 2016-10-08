/**
 * Created by Administrator on 2016/9/27.
 */
var underscore = require('underscore');
var MongoClient = require('mongodb').MongoClient;
function infected(uid) {
    return db.infected.find({$or: [{infectid: uid}, {carryid: uid}]}, {vid: 1}).map(function(doc) {return doc.vid})
}

function getVirus(uid) {
    return db.order.findOne({$and: [{vid: {$nin: infected(uid)}},
        {$or: [{$and: [{speed: true}, {fullfill: {$lt: 16}}]},
            {$and: [{speed: false}, {fullfill: {$lt: 4}}]}
        ]}]}
    )
}
var data = [1,2,3,4,5];
var b = data[2];
b = 'zgy';
console.log(data)