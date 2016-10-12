/**
 * Created by Administrator on 2016/9/27.
 */
var underscore = require('underscore');
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://plag:xLuYMSgJ@192.168.200.22:27017/plag',function (err,db) {
    var virus = []
    var cursor = db.collection('shareinfected').find();
    cursor.each(function (err,doc) {
        if(doc!=null){
            virus.push(doc.vid);
        }else{
            console.log('over');
            var v  = underscore.uniq(virus);
            console.log(v);
            v.forEach(function (doc) {
                db.collection('node').insertOne({'label':doc})
            })
        }
    })


})