/**
 * Created by Administrator on 2016/10/25.
 */
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb://plag:xLuYMSgJ@192.168.200.22:27017/plag',function (err,db) {
    db.collection('infected').aggregate([
        {$group:{_id:"$vid",scancount:{$sum:1}}}
    ]).toArray(function (err,result) {
        result.forEach(function (doc) {
            if(doc==null){
                console.log('over');
            }else{
                db.collection('order').aggregate([
                    {$match:{vid:doc._id,speed:true}}
                ]).toArray(function (err,item) {
                    if(item.length){
                        doc.speedcount = item.length;
                    }else{
                        doc.speedcount = 0;
                    }
                    db.collection('action').aggregate([
                        {$match:{vid:doc._id,action:'spread'}}
                    ]).toArray(function (err,item2) {
                        if(item2.length){
                            doc.spreadcount = item2.length;
                        }else{
                            doc.spreadcount = 0;
                        }
                        db.collection('unclehai').insertOne(doc);
                    })
                })

            }
        })
    })
})