/**
 * Created by Administrator on 2016/9/27.
 */
/*
var md5 = require('MD5')
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://plag:xLuYMSgJ@192.168.200.22:27017/plag',function (err,db) {
    var cursor = db.collection('temp').find();
    var count = 1
    cursor.each(function (err,doc) {
        if(doc!=null){
            db.collection('order').findOne({"vid":doc._id},function (err,result) {
                if(!result){
                    console.log(count++);
                    db.collection('virus').findOne({"vid":doc._id},function (err,res) {
                        var t = {};
                        t.orderid = md5(new Date().valueOf()+Math.random());
                        t.userid = res.userid;
                        t.vid = doc._id;
                        t.createtime = res.createtime;
                        t.createdate = new Date(res.createtime);
                        t.fullfill = 0;
                        t.speed = false;
                        t.rnd = Math.random();
                        db.collection('order').insertOne(t,function (err,aa) {
                            
                        })
                    })

                }
            })
        }
    })
})*/
var url = 'http://www.baidu.com/?a=b';
var a = url.indexOf('?');
var b = url.substr(0,a);
console.log(b);
