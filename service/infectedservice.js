/**
 * Created by Administrator on 2016/9/21.
 */
var cryPto = require('crypto');
var md5 = require('MD5')
var underscore = require('underscore')
var ObjectID = require('mongodb').ObjectID
var redisTemplate = require('../db/redisTemplate');
var pingUtil = require('./pingppUtil');
var pingConfig = require('../config/pingconfig');
exports.getVirus = function *(userid) {
    var total = yield mongodb.collection('order').find().toArray();
    var orders = underscore.filter(total,function (data) {
        if(data.speed){
            return data.fullfill < 16;
        }else{
            return data.fullfill < 4;
        }

    })
    if (!orders.length){
        var data = {'head':{code: 1000,msg:'no virus'}};
        return data
    }else{
        var user = yield  mongodb.collection('infected').find({"infectid":userid}).toArray();
        var Ovids = [];
        var Uvids = [];
        orders.forEach(function (value,index,arry) {
            Ovids.push(value.vid);
        })
        user.forEach(function (value,index,arry) {
            if(value.vid !== undefined){
                Uvids.push(value.vid);
            }
        })
        var virusids = underscore.difference(Ovids,Uvids);
        if(virusids.length){
            var virusid = underscore.sample(virusids);
            var order = yield mongodb.collection('order').find({'vid':virusid}).toArray();
            var selectOrder = underscore.sample(order);
            var doc = selectOrder;
            yield mongodb.collection('order').updateOne({'orderid':doc.orderid},{$set:{'fullfill':doc.fullfill+1}});
            yield mongodb.collection('infected').insertOne({'carryid':doc.userid,'vid':virusid,'infectid':userid,'orderid':doc.orderid,'createtime':Date.parse(new Date())});
            var virus = yield mongodb.collection('virus').find({'vid':virusid}).toArray();
            var userinfo = yield mongodb.collection('user').find({'openid':virus[0].userid}).toArray();
            var patients = yield mongodb.collection('infected').find({'vid':virusid}).toArray();
            var favor = yield mongodb.collection('action').find({'vid':virusid,'action':'spread'}).toArray();
            var favorCount = favor.length;
            var patientNumber = patients.length;
            var data ={};
            //  data.order = doc
            data.virus = virus[0];
            data.userinfo = userinfo[0];
            data.patientNumber = patientNumber;
            data.favorCount = favorCount;
            return {'head':{code:200,msg:'success'},'data':data};
        }else{
            return {'head':{code: 1000,msg:'no virus'}};
        }
    }
}
exports.favor = function *(userid,vid,speed) {
    var doc = {};
    doc.orderid = md5(new Date().valueOf()+Math.random());
    doc.userid = userid;
    doc.vid = vid;
    doc.fullfill = 0 ;
    doc.speed = speed;
    doc.createtime = Date.parse(new Date());
    doc.rnd = Math.random();
    yield mongodb.collection('order').insertOne(doc);
    yield mongodb.collection('action').insertOne({'userid':userid,'vid':vid,'action':'spread','createtime':Date.parse(new Date())});
}
exports.disfavor = function *(userid,vid) {
    yield mongodb.collection('action').insertOne({'userid':userid,'vid':vid,'action':'skip','createtime':Date.parse(new Date())});
}
exports.recharge = function *(money,userid) {
    yield mongodb.collection('user').updateOne({'user_id':userid},{$inc:{'balance':money}});
    var user = yield mongodb.collection('user').findOne({'user_id':userid});
    yield mongodb.collection('deallog').insertOne({'userid':userid,'price':money,'createtime':Date.parse(new Date())});
    return user.balance;
}
exports.share = function *(userid) {
    var shareCount = parseInt(yield redisTemplate.get('share'));
    console.log(shareCount);
    yield mongodb.collection('user').updateOne({'user_id':userid},{$inc:{'balance':shareCount}});
}
exports.getVirusV2 = function *(userid) {
    var infects = yield mongodb.collection('infected').find({$or: [{infectid: userid}, {carryid: userid}]},{vid:1}).toArray();
    var ifs = infects.map(function (doc) {
        return doc.vid;
    })
    var order = yield mongodb.collection('order').findOne({$and: [{vid: {$nin: ifs}},
        {$or: [{$and: [{speed: true}, {fullfill: {$lt: 16}}]},
            {$and: [{speed: false}, {fullfill: {$lt: 4}}]}
        ]}]}
    );
    if (!order){
        var data = {'head':{code: 1000,msg:'no virus'}};
        return data
    }else{
       yield mongodb.collection('order').updateOne({'orderid':order.orderid},{$inc:{'fullfill':1}});

       yield mongodb.collection('infected').insertOne({'carryid':order.userid,'vid':order.vid,'infectid':userid,'orderid':order.orderid,'createtime':Date.parse(new Date())});

        var virus = yield mongodb.collection('virus').findOne({'vid':order.vid});

        var userinfo = yield mongodb.collection('user').findOne({'user_id':virus.userid});

        //var patients = yield mongodb.collection('infected').find({'vid':order.vid}).toArray();
        var patients = yield mongodb.collection('infected').aggregate([
            {$match:{"vid":order.vid}},
            {$group:{"_id":null,"count":{$sum:1}}}
        ]).toArray();
        var favor = yield mongodb.collection('action').aggregate([
            {$match:{"vid":order.vid,"action":"spread"}},
            {$group:{"_id":null,"count":{$sum:1}}}
        ]).toArray();
        var speed = yield mongodb.collection('order').aggregate([
            {$match:{"vid":order.vid,"speed":true}},
            {$group:{"_id":null,"count":{$sum:1}}}
        ]).toArray();
        //var favor = yield mongodb.collection('action').find({'vid':order.vid,'action':'spread'}).toArray();
        var data ={};
        data.virus = virus;
        data.userinfo = userinfo;
        if(patients.length){
            data.virus.scanCount = patients[0].count;
            data.patientNumber = patients[0].count;
        }else{
            data.virus.scanCount = 0;
            data.patientNumber = 0;
        }
        if(favor.length){
            data.virus.favorCount = favor[0].count;
            data.favorCount = favor[0].count;
        }else{
            data.virus.favorCount = 0;
            data.favorCount = 0;
        }
        if(speed.length){
            data.virus.speedCount = speed[0].count;
        }else{
            data.virus.speedCount = 0
        }
        
        return {'head':{code:200,msg:'success'},'data':data};
    }
}
/*exports.speedV4 = function *(vid,userid) {
    var user = yield mongodb.collection('user').findOne({'user_id':userid});
    if(user.balance < 100){
        return {'head':{code:600,msg:'no balance'},'data':{balance:user.balance}};
    }else{
        mongodb.collection('user').updateOne({'user_id':userid},{$inc:{'balance':-100}});
        var time = Date.parse(new Date());
        
        var users = yield mongodb.collection('order').find({$and:[{vid:vid},{speed:true},{createtime:{$lt:time}}]},{userid:1}).toArray();
        var us = users.map(function (doc) {
            return doc.userid;
        })
        var source = yield mongodb.collection('virus').findOne({'vid':vid});
        if(us.length){
            yield mongodb.collection('user').updateMany({'user_id':{$in:us}},{$inc:{'income':parseInt(50/(users.length)),'balance':parseInt(50/(users.length))}});
            yield mongodb.collection('user').updateOne({'user_id':source.userid},{$inc:{'income':50,'balance':50}});
        }else{
            yield mongodb.collection('user').updateOne({'user_id':source.userid},{$inc:{'income':100,'balance':100}});
        }
        return {'head':{code: 200,msg:'success'},'data':{balance:user.balance-100}}
    }
}*/
/*exports.speedV4 = function *(vid,userid) {
    var user = yield mongodb.collection('user').findOne({'user_id':userid});
    var time = Date.parse(new Date());
    var source = yield mongodb.collection('virus').findOne({'vid':vid});
    if(user.balance < 100){
        return {'head':{code:600,msg:'no balance'},'data':{balance:user.balance}};
    }else{
        yield mongodb.collection('user').updateOne({'openid':userid},{$inc:{'balance':-100}});
        var path = [];
        while (1){
            var parentInfect = yield mongodb.collection('infected').findOne({'infectid':userid,'vid':vid,'carryid':{$ne:null}});
            
            var parentOrder = yield mongodb.collection('order').findOne({'userid':parentInfect.carryid,'vid':vid});
            
            if(parentInfect.carryid == parentInfect.infectid){
                break;
            }
            if(parentOrder.speed == true){
                path.push(parentOrder.userid);
                break
            }
            userid = parentInfect.carryid;
        }
        if(!path.length){
            var users = yield mongodb.collection('order').find({$and:[{vid:vid},{speed:true},{createtime:{$lt:time}}]},{userid:1}).toArray();
            var us = users.map(function (doc) {
                return doc.userid;
            })
            yield mongodb.collection('user').updateMany({'user_id':{$in:us}},{$inc:{'income':parseInt(50/(users.length)),'balance':parseInt(50/(users.length))}});
            yield mongodb.collection('user').updateOne({'user_id':source.userid},{$inc:{'income':50,'balance':50}});
        }else{
            var users = yield mongodb.collection('order').find({$and:[{vid:vid},{speed:true},{createtime:{$lt:time}}]},{userid:1}).toArray();
            var us = users.map(function (doc) {
                return doc.userid;
            })
            yield mongodb.collection('user').updateMany({'user_id':{$in:us}},{$inc:{'income':parseInt(30/(users.length)),'balance':parseInt(30/(users.length))}});
            yield mongodb.collection('user').updateOne({'user_id':source.userid},{$inc:{'income':20,'balance':20}});
            yield mongodb.collection('user').updateOne({'user_id':path[0]},{$inc:{'income':50,'balance':50}});
        }
        return {'head':{code: 200,msg:'success'},'data':{balance:user.balance}};
    }
}*/
exports.speedV4 = function *(vid,userid) {
    var user = yield mongodb.collection('user').findOne({'user_id':userid});
    if(user.balance < 100){
        return {'head':{code:600,msg:'no balance'},'data':{balance:user.balance}};
    }else{
        var time = Date.parse(new Date());
        var source = yield mongodb.collection('virus').findOne({'vid':vid});
        yield mongodb.collection('user').updateOne({'openid':userid},{$inc:{'balance':-100}});
        var path = [];
        while (1){
            var parentInfect = yield mongodb.collection('infected').findOne({'infectid':userid,'vid':vid,'carryid':{$ne:null}});

            var parentOrder = yield mongodb.collection('order').findOne({'userid':parentInfect.carryid,'vid':vid});

            if(parentInfect.carryid == parentInfect.infectid){
                break;
            }
            if(parentOrder.speed == true){
                path.push(parentOrder.userid);
                break
            }
            userid = parentInfect.carryid;
        }
        if(!path.length){
            var users = yield mongodb.collection('order').find({$and:[{vid:vid},{speed:true},{createtime:{$lt:time}}]},{userid:1}).toArray();
            var us = users.map(function (doc) {
                return doc.userid;
            })
            if(!us){
                yield mongodb.collection('user').updateOne({'openid':source.userid},{$inc:{'income':100,'balance':100}});
            }else{
                yield mongodb.collection('user').updateMany({'openid':{$in:us}},{$inc:{'income':parseInt(50/(us.length)),'balance':parseInt(50/(us.length))}});
                yield mongodb.collection('user').updateOne({'openid':source.userid},{$inc:{'income':50,'balance':50}});
            }
        }else{
            var users = yield mongodb.collection('order').find({$and:[{vid:vid},{speed:true},{createtime:{$lt:time}}]},{userid:1}).toArray();
            var us = users.filter(function (doc) {
                return doc.userid!=path[0];
            })
            us = us.map(function (doc) {
                return doc.userid;
            })
            if(!us){
                yield mongodb.collection('user').updateOne({'openid':source.userid},{$inc:{'income':50,'balance':50}});
                yield mongodb.collection('user').updateOne({'openid':path[0]},{$inc:{'income':50,'balance':50}});
            }else{
                yield mongodb.collection('user').updateMany({'openid':{$in:us}},{$inc:{'income':parseInt(30/(us.length)),'balance':parseInt(30/(us.length))}});
                yield mongodb.collection('user').updateOne({'openid':source.userid},{$inc:{'income':20,'balance':20}});
                yield mongodb.collection('user').updateOne({'openid':path[0]},{$inc:{'income':50,'balance':50}});
            }
        }
        return {'head':{code: 200,msg:'success'},'data':{balance:user.balance}};
    }
}
exports.tree = function *(vid) {
    var data = yield mongodb.collection('infected').aggregate([
        {$match:{'vid':vid}},
        {$project:{'name':"$infectid",'parent':'$carryid','_id':0}}
    ]).toArray();
    var data1 = data.map(function (item) {
        if(item.name==item.parent){
            delete  item.parent
        }
    })
    console.log(data);
    var dataMap = data.reduce(function(map, node) {
        map[node.name] = node;
        return map;
    }, {});
    var treeData = [];
    for(var i =0;i <data.length; i ++){
        var parent = dataMap[data[i].parent];
        if (parent) {
            // create child array if it doesn't exist
            (parent.children || (parent.children = []))
            // add node to child array
                .push(data[i]);
        } else {
            // parent is null or missing
            treeData.push(data[i]);
        }
    }
    return treeData;
    
}
exports.getshareVirus = function *(carryid,vid,userid) {
    var virus = yield mongodb.collection('virus').findOne({'vid':vid});
    var userinfo = yield mongodb.collection('user').findOne({'user_id':virus.userid});
    var patients = yield mongodb.collection('infected').find({'vid':vid}).toArray();
    var favor = yield mongodb.collection('action').find({'vid':vid,'action':'spread'}).toArray();
    var carry = yield mongodb.collection('user').findOne({'_id':ObjectID.createFromHexString(carryid)})
    if(carry.user_id!=userid){
        var has = yield mongodb.collection('shareinfected').findOne({'carryid':carry.user_id,'vid':vid,'infectid':userid});
        if(!has){   
            yield mongodb.collection('user').updateOne({'user_id':carry.user_id},{$inc:{'balance': 100}});
        }
    }

    mongodb.collection('shareinfected').insertOne({'carryid':carry.user_id,'vid':vid,'infectid':userid,'createtime':Date.parse(new Date())});
    var data = {};
    data.virus = virus;
    data.userinfo = userinfo;
    data.patientNumber = patients.length;
    data.favorCount = favor.length;
    return {'head':{code:200,msg:'success'},'data':data};
}
exports.graph = function *(vid) {
    var edges = yield mongodb.collection('shareinfected').aggregate([
        {$match:{'vid':vid}}
    ]).toArray();
    var data =[];
    for (var i =0; i<edges.length;i++){
        var edge = {};
        var carryid = edges[i].carryid;
        var infectid = edges[i].infectid;
        var carry = yield mongodb.collection('user').findOne({'openid':carryid});
        var infect = yield mongodb.collection('user').findOne({'openid':infectid});
        edge.source=carry.nickname;
        edge.target= infect.nickname;
        edge.label = vid;
        data.push(edge);
    }
    return data;
}
exports.hotvirus = function *() {
    var vids = yield mongodb.collection('action').aggregate([
        {$match:{action:"spread"}},
        {$group:{_id:{vid:"$vid"},count:{$sum:1}}},
        {$sort:{count:-1}},
        {$limit:5}
    ]).toArray();
    return vids;
}
exports.getVirusById = function *(vid) {
    var virus = yield mongodb.collection('virus').findOne({'vid':vid});
    var user = yield mongodb.collection('user').findOne({'user_id':virus.userid});
    var patients = yield mongodb.collection('infected').aggregate([
        {$match:{"vid":vid}},
        {$group:{"_id":null,"count":{$sum:1}}}
    ]).toArray();
    var favor = yield mongodb.collection('action').aggregate([
        {$match:{"vid":vid,"action":"spread"}},
        {$group:{"_id":null,"count":{$sum:1}}}
    ]).toArray();
    var speed = yield mongodb.collection('order').aggregate([
        {$match:{"vid":vid,"speed":true}},
        {$group:{"_id":null,"count":{$sum:1}}}
    ]).toArray();
    var data ={};
    data.virus = virus;
    data.userinfo = user;
    if(patients.length){
        data.virus.scanCount = patients[0].count;

    }else{
        data.virus.scanCount = 0;

    }
    if(favor.length){
        data.virus.favorCount = favor[0].count;
    }else{
        data.virus.favorCount = 0;
    }
    if(speed.length){
        data.virus.speedCount = speed[0].count;
    }else{
        data.virus.speedCount = 0
    }

    return {'head':{code:200,msg:'success'},'data':data};
}
exports.myViruslist = function *(userid,skip,limit) {
    var virusList = yield mongodb.collection('virus').aggregate([
        {$match:{"userid":userid}},
        {$skip:skip},
        {$limit:limit}
    ]).toArray();
    for (var i =0;i<virusList.length;i++){
        var vid = virusList[i].vid;
        var scan =  yield mongodb.collection('infected').aggregate([
            {$match:{"vid":vid}},
            {$group:{"_id":null,"count":{$sum:1}}}
        ]).toArray();
        if(scan.length){
            virusList[i].scanCount = scan[0].count;
        }else{
            virusList[i].scanCount = 0;
        }
        var speed = yield mongodb.collection('order').aggregate([
            {$match:{'vid':vid,"speed":true}},
            {$group:{'_id':null,"count":{$sum:1}}}
        ]).toArray();
        if(speed.length){
            virusList[i].speedCount = speed[0].count;
        }else{
            virusList[i].speedCount = 0;
        }
        var favor = yield mongodb.collection('action').count({'vid':vid,'action':'spread'});
        virusList[i].favorCount = favor;
    }
    return virusList;
}
exports.mySpeedlist = function *(userid,skip,limit) {
    var speedList = yield mongodb.collection('order').aggregate([
        {$match:{"userid":userid,"speed":true}},
        {$skip:skip},
        {$limit:limit},
        {$project:{"vid":1,"_id":0}}
    ]).toArray();
    var list = speedList.map(function (doc) {
        return doc.vid;
    })
    var speedVirus = yield mongodb.collection('virus').find({'vid':{$in:list}}).toArray();
    for (var i =0;i<speedVirus.length;i++){
        var vid = speedVirus[i].vid;
        var scan =  yield mongodb.collection('infected').aggregate([
            {$match:{"vid":vid}},
            {$group:{"_id":null,"count":{$sum:1}}}
        ]).toArray();
        if(scan.length){
            speedVirus[i].scanCount = scan[0].count;
        }else{
            speedVirus[i].scanCount = 0;
        }
        var speed = yield mongodb.collection('order').aggregate([
            {$match:{'vid':vid,"speed":true}},
            {$group:{'_id':null,"count":{$sum:1}}}
        ]).toArray();
        if(speed.length){
            speedVirus[i].speedCount = speed[0].count;
        }else{
            speedVirus[i].speedCount = 0;
        }
        var favor = yield mongodb.collection('action').count({'vid':vid,'action':'spread'});
        speedVirus[i].favorCount = favor;
        speedVirus[i].userinfo = yield mongodb.collection('user').findOne({'user_id':speedVirus[i].userid});
    }
    return speedVirus;
}
exports.speedComment = function *(userid,vid,commemt) {
    mongodb.collection('speedcomment').insertOne({'userid':userid,'vid':vid,'comment':commemt});
}
exports.pingPay = function *(amount,userid) {
    console.log('here');
    var opt = {
        subject:"test",
        body : userid,
        amount:amount,
        order_no:md5(new Date()),
        channel:"wx",
        currency:"cny",
        client_ip:"127.0.0.1",
        app:{id:pingConfig.appID}
    }
    var result = yield pingUtil.chargeCreate(opt);
    return result;
}
exports.webHooks = function *(type,order) {
    console.log('here');
    var userid = order.object.body;
    var amount = parseInt(order.object.amount);
    if(type == "charge.succeeded"){
        console.log('here')
        yield mongodb.collection('user').updateOne({'user_id':userid},{$inc:{"balance":amount*10}});
        return {'head':{code: 200,msg:'success'}};
    }
}
exports.path = function *(vid,userid) {
    var path = [];
    path.push(userid)
    while (1){
        var parentInfect = yield mongodb.collection('infected').findOne({'infectid':userid,'vid':vid});
        if(parentInfect.carryid == parentInfect.infectid){
            break;
        }
        path.push(parentInfect.carryid);
        userid = parentInfect.carryid;
    }
    var users = yield mongodb.collection('user').find({'user_id':{$in:path}}).toArray();
    var list = [];
    var loop = path.map(function (item) {
        var user = users.filter(function (doc) {
            return doc.user_id == item
        })
        list.push(user[0]);
    })
    for (var i =0;i<list.length;i++){
        var order = yield mongodb.collection('order').findOne({"userid":list[i].openid,"vid":vid});
        console.log(order);
        list[i].speed = order ? false : order.speed;
    }
    return list.reverse();
}