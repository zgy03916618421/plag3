/**
 * Created by Administrator on 2016/10/26.
 */
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://plag:xLuYMSgJ@192.168.200.22:27017/plag',function (err,db) {
    var cursor =  db.collection('infected').find();
    cursor.each(function (err,doc) {
        if (doc == null){
            console.log(over);
        }else{
            var carryid = doc.carryid;
            var infectid = doc.infectid;
            
        }
    })
})