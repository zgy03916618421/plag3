/**
 * Created by Administrator on 2016/10/26.
 */
var md5 = require('MD5');
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://plag:xLuYMSgJ@192.168.200.22:27017/plag',function (err,db) {
    var cursor = db.collection('user').find();
    cursor.each(function (err,doc) {
        db.collection('user').updateOne({'_id':doc._id},{$set:{'user_id':md5(new Date().valueOf()+Math.random())}})
    })
})