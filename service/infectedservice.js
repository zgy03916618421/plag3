/**
 * Created by Administrator on 2016/9/21.
 */
var md5 = require('MD5')
var underscore = require('underscore');
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
    yield mongodb.collection('order').insertOne(doc);
    yield mongodb.collection('action').insertOne({'userid':userid,'vid':vid,'action':'spread','createtime':Date.parse(new Date())});
}
exports.disfavor = function *(userid,vid) {
    yield mongodb.collection('action').insertOne({'userid':userid,'vid':vid,'action':'skip','createtime':Date.parse(new Date())});
}
exports.recharge = function *(money,userid) {
    yield mongodb.collection('user').updateOne({'openid':userid},{$inc:{'balance':money*10}});
    var user = yield mongodb.collection('user').find({'openid':userid}).toArray();
    yield mongodb.collection('deallog').insertOne({'userid':userid,'price':money,'createtime':Date.parse(new Date())});
    return user[0].balance;
}
exports.speedv2 = function *(vid,userid) {
    var user = yield mongodb.collection('user').find({'openid':userid}).toArray();
    if(user[0].balance < 100){
        return {'head':{code:600,msg:'no balance'},'data':{balance:user[0].balance}};
    }else{
        yield mongodb.collection('user').updateOne({'openid':userid},{$inc:{'balance':-100}});
        var path = [];
        while (1){
            var parentInfect = yield mongodb.collection('infected').find({'infectid':userid,'vid':vid}).toArray();
            console.log(parentInfect);
            var parentOrder = yield mongodb.collection('order').find({'userid':parentInfect[0].carryid,'vid':vid}).toArray();
            console.log(parentOrder);
            if(parentInfect[0].carryid == parentInfect[0].infectid){
                path.push(parentOrder[0].userid);
                break;
            }
            if(parentOrder[0].speed == true){
                path.push(parentOrder[0].userid);
            }
            userid = parentInfect[0].carryid;
        }
        console.log(path);
        if(path.length ==1){
            yield mongodb.collection('user').updateOne({'openid':path[0]},{$inc:{'income':100,'balance':100}});
        }else{
            yield mongodb.collection('user').updateOne({'openid':path[path.length-1]},{$inc:{'income':50,'balance':50}});
            for (var i =0;i<path.length-1;i++){
                yield mongodb.collection('user').updateOne({'openid':path[i]},{$inc:{'income':parseInt(50/(path.length-1)),'balance':parseInt(50/(path.length-1))}});
            }
        }
        return {'head':{code: 200,msg:'success'},'data':{balance:user[0].balance-100}};
    }
}
exports.speedV3 = function *(vid,userid) {
    var user = yield mongodb.collection('user').find({'openid':userid}).toArray();
    if(user[0].balance < 100){
        return {'head':{code:600,msg:'no balance'},'data':{balance:user[0].balance}};
    }else{
        mongodb.collection('user').updateOne({'openid':userid},{$inc:{'balance':-100}});
        var time = Date.parse(new Date());
        console.log(time);
        var carriers = yield mongodb.collection('infected').find({'vid':vid,'createtime':{$lt:time}}).toArray();
        console.log(carriers);
        var users = [];
        for (var cid=0;cid<carriers.length;cid ++){
             var order = yield mongodb.collection('order').find({'vid':vid,'userid':carriers[cid].infectid}).toArray();
            console.log(order);
            if(order.length&&order[0].speed){
                    users.push(order.userid);
            }
        }

        console.log(users);
        var source = yield mongodb.collection('virus').find({'vid':vid}).toArray();
        var sourceid = source[0].userid;
        console.log(sourceid)
        if (!users.length){
            yield mongodb.collection('user').updateOne({'openid':sourceid},{$inc:{'income':100,'balance':100}});
        }else{
            yield mongodb.collection('user').updateOne({'openid':sourceid},{$inc:{'income':50,'balance':50}});
            for (var n =0;n<users.length;n++){
                yield mongodb.collection('user').updateOne({'openid':users[n]},{$inc:{'income':parseInt(50/(users.length)),'balance':parseInt(50/(users.length))}});
            }
        }
        return {'head':{code: 200,msg:'success'},'data':{balance:user[0].balance-100}};
    }
}
exports.actionLog = function *(vid) {

}