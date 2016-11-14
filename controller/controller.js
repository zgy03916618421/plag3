/**
 * Created by Administrator on 2016/9/20.
 */
'use strict'
var parse = require('co-busboy');
var qiniuUtil = require('../service/qiniuUtil');
var md5 = require('MD5')
var util = require('../service/utilservice');
var infectservice = require('../service/infectedservice');
var jssdkservice = require('../service/jssdkservice');
var redisTemplate = require('../db/redisTemplate');
exports.androidConfig = function *() {
    var data = yield redisTemplate.get('androidconfig');
    this.body = {'head':{code: 200,msg:'new user create success'},'data':data};
}
exports.anonyLogin = function *() {
    var userid = this.request.body.userid;
    var user = yield mongodb.collection('user').findOne({'user_id':userid});
    if(!user){
        var userinfo = {};
        userinfo.user_id = md5(new Date().valueOf()+Math.random());
        userinfo.openid = userinfo.user_id;
        userinfo.headimgurl = '';
        userinfo.nickname = '匿名';
        mongodb.collection('user').insertOne(userinfo);
        this.body = {'head':{code: 200,msg:'user has exist'},'data':userinfo};
    }else{
        this.body = {'head':{code: 200,msg:'user has exist'},'data':user};
    }
}
exports.login = function *() {
    var userInfo = this.request.body;
    if(userInfo.comefrom == 'bf'){
        var user = yield mongodb.collection('user').findOne({'user_id':userInfo.user_id})
        if(!user){
            if(!userInfo.openid){
                userInfo.openid = userInfo.user_id;
            }
            userInfo.headimgurl = userInfo.avatar;
            userInfo.createtime = new Date();
            userInfo.balance = parseInt(yield redisTemplate.get("balance"));
            userInfo.income = 0;
            userInfo.viruscount = 0;
            mongodb.collection('user').insertOne(userInfo);
            this.body = {'head':{code:200,msg:'success'},'data':userInfo}
        }else{
            this.body =  {'head':{code:200,msg:'success'},'data':user}
        }
    }else{
        var userid = userInfo.unionid;
        var has = yield mongodb.collection('user').findOne({'unionid':userid});
        if(!has){
            userInfo.user_id = md5(new Date().valueOf());
            userInfo.createtime = new Date();
            userInfo.balance = parseInt(yield redisTemplate.get("balance"));
            userInfo.income = 0;
            userInfo.viruscount = 0;
            mongodb.collection('user').insertOne(userInfo);
            this.body = {'head':{code: 200,msg:'new user create success'},'data':userInfo};
        }else{
            this.body = {'head':{code: 300,msg:'user has exist'},'data':has};
        }
    }

}
/*exports.oauth = function *() {
    var code = this.query.code;
    var redircetUrl = this.query.state;
    var url = redircetUrl.split('/');

    console.log(url);
    var _id = url[5];
    var vid = url[6];
    var token = yield client.getAccessToken(code);
    var accessToken = token.data.access_token;
    var openid = token.data.openid;
    var userinfo = yield client.getUser(openid);
    var user = yield mongodb.collection('user').findOne({'openid':userinfo.openid});
    if (!user){
        userinfo.user_id = md5(new Date().valueOf()+Math.random());
        userinfo.createtime = Date.parse(new Date());
        userinfo.balance = parseInt(yield redisTemplate.get("balance"));
        userinfo.income = 0;
        userinfo.viruscount = 0;
        userinfo.createdate = new Date(userinfo.createtime);
        mongodb.collection('user').insertOne(userinfo);
        if(url.length<6){
            this.response.redirect(redircetUrl+'?userid='+userinfo.user_id);
        }else{
            this.response.redirect(url[0]+'//'+url[2]+'/'+url[3]+'/'+url[4]+'/'+'?userid='+userinfo.user_id+'&vid='+vid+'&_id='+_id);
        }
    }else{
        if(url.length<6){
            this.response.redirect(redircetUrl+'?userid='+user.user_id);
        }else{
            this.response.redirect(url[0]+'//'+url[2]+'/'+url[3]+'/'+url[4]+'/'+'?userid='+user.user_id+'&vid='+vid+'&_id='+_id);
        }
    }
}*/
exports.oauth = function *() {
    var code = this.query.code;
    var redircetUrl = this.query.state;
    var index = redircetUrl.indexOf('source=');
    if(index==-1){
        var source = 'unkown';
        var redurl = redircetUrl;
    }else{
        source = redircetUrl.substr(index+7);
        redurl = redircetUrl.substr(0,index-2);
    }
    console.log(source);
    var source = redircetUrl.substr(index+1);
    var token = yield client.getAccessToken(code);
    var accessToken = token.data.access_token;
    var openid = token.data.openid;
    var userinfo = yield client.getUser(openid);
    var user = yield mongodb.collection('user').findOne({'openid':userinfo.openid});
    if(!user){
        userinfo.user_id = md5(new Date().valueOf()+Math.random());
        userinfo.createtime = Date.parse(new Date());
        userinfo.balance = parseInt(yield redisTemplate.get("balance"));
        userinfo.income = 0;
        userinfo.viruscount = 0;
        userinfo.createdate = new Date(userinfo.createtime);
        userinfo.comefrom = source;
        mongodb.collection('user').insertOne(userinfo);
        this.response.redirect(redurl+'?userid='+userinfo.user_id);
    }else{
        this.response.redirect(redurl+'?userid='+user.user_id);
    }
}
exports.upPic = function *() {
        try{
            var parts = parse(this,{limit:'5mb',autoFields: true});
            var part;
            while (part = yield parts){
                if (part != undefined){
                    var names = part.filename.split('.'),
                        ext = names[names.length-1];
                    var name = md5(new Date().valueOf()+Math.random())+'.'+ext;
                    var rs = yield qiniuUtil.pipe(name,part);
                    var url = qiniuUtil.qiniuhost + name;
                }
            }
            this.body = {"head":{code:200,msg:'success'},"data":url};
        }catch (err){
            console.log(err.stack);
            this.body = {'head':{code: 500,msg:err.stack}};
        }
}
exports.createVirus = function *() {
    var bodyparse = this.request.body;
    var virus = {};
    virus.userid = bodyparse.userid;
    virus.type = bodyparse.type;
    if (virus.type == 'img'){
        virus.url = bodyparse.url;
    }
    virus.content = bodyparse.content;
    virus.vid = md5(new Date().valueOf()+Math.random());
    virus.createtime = Date.parse(new Date());
    mongodb.collection('virus').insertOne(virus);
    var carryid = bodyparse.userid;
    mongodb.collection('user').updateOne({'user_id':virus.userid},{$inc:{'viruscount':1}});
    var data = {};
    data.virus = virus;
    data.userinfo = yield mongodb.collection('user').findOne({'user_id':virus.userid});
    mongodb.collection('infected').insertOne({
        "carryid":carryid,
        "vid":virus.vid,
        "infectid":carryid,
        'createtime':Date.parse(new Date())
    });
    this.body = {'head':{code: 300,msg:'success'},'data':data};
}
exports.fightVirus = function *() {
    var userid = this.params.userid;
    console.log(userid);
    var data = yield infectservice.getVirusV2(userid);
    this.body = data;
}
exports.favor = function *() {
    console.log(this.request.body);
    var userid = this.request.body.userid;
    var vid = this.request.body.vid;
    var speed = this.request.body.speed;
    yield infectservice.favor(userid,vid,speed);
    this.body = {'head':{code: 300,msg:'success'}};
}
exports.disfavor = function *() {
    var userid = this.request.body.userid;
    var vid = this.request.body.vid;
    yield infectservice.disfavor(userid,vid);
    this.body = {'head':{code: 300,msg:'success'}};
}
exports.speed = function *() {
    var vid = this.request.body.vid;
    var userid = this.request.body.userid
    var data = yield infectservice.speedV4(vid,userid);
    this.body = data;
}
exports.share = function*(){
    var userid = this.params.userid;
    console.log(userid);
    yield infectservice.share(userid);
    this.body = {'head':{code: 300,msg:'success'}};
}
exports.recharge = function *() {
    var money = parseInt(this.request.body.money);
    var userid = this.request.body.userid;
    var data = yield infectservice.recharge(money,userid);
    this.body = {'head':{code: 200,msg:'success'},'data':{balance:data}};
}
exports.getUserInfo = function *() {
    var data = {}
    var userid = this.params.userid;
    var userinfo = yield  mongodb.collection('user').findOne({'user_id':userid});
    var speedCount = yield mongodb.collection('order').aggregate([
        {$match:{"userid":userid,"speed":true}},
        {$group:{"_id":null,"count":{$sum:1}}}
    ]).toArray();
    if(!speedCount.length){
        data.speedCount = 0;
    }else{
        data.speedCount = speedCount[0].count;
    }
    data.userinfo = userinfo
    this.body = {'head':{code:200,msg:'success'},'data':data};
}
exports.path = function *() {
    var vid = this.params.vid;
    var userid = this.params.userid;
    console.log(vid);
    console.log(userid);
    var path = yield infectservice.path(vid,userid)
    this.body = {'path':path};
}
exports.tree = function *() {
    var vid = this.params.vid;
    console.log(vid);
    var data = yield infectservice.tree(vid);
    this.body = data;
}
exports.shareVirus = function *() {
    var vid = this.params.vid;
    var carryid = this.params.carryid;
    var userid = this.params.userid;
    var data = yield infectservice.getshareVirus(carryid,vid,userid);
    this.body = data;
}
exports.graph = function *() {
    var vid = this.params.vid;
    var data = yield infectservice.graph(vid);
    this.body = data;
}
exports.hotvirus = function *() {
    var data = yield infectservice.hotvirus();
    this.body=data;
}
exports.myViruslist = function *() {
    var userid = this.query.userid;
    var skip = parseInt(this.query.skip);
    var limit = parseInt(this.query.limit);
    var data = yield infectservice.myViruslist(userid,skip,limit);
    this.body = {'head':{code:200,msg:'success'},'data':data};
}
exports.mySpeedlist = function *() {
    var userid = this.query.userid;
    var skip = parseInt(this.query.skip);
    var limit = parseInt(this.query.limit);
    var data = yield infectservice.mySpeedlist(userid,skip,limit);
    this.body = {'head':{code:200,msg:'success'},'data':data};
}
exports.speedComment = function *() {
    var userid = this.request.userid;
    var vid = this.request.vid;
    var comment = this.request.comment;
    yield infectservice.speedComment(userid,vid,comment);
    this.body = {'head':{code:200,msg:'success'}};
}
exports.getVirusById = function *() {
    var vid = this.params.vid;
    var data = yield infectservice.getVirusById(vid);
    this.body = data;
}
exports.pingPay = function *() {
    var amount = parseInt(this.request.body.amount);
    var userid = this.request.body.userid;
    var result = yield infectservice.pingPay(amount,userid);
    console.log(result);
    var data = {};
    data.charge = JSON.stringify(result);
    this.body = {'head':{code: 200,msg:'success'},'data':data};
}
exports.webHooks = function *() {
    var bodyParse = this.request.body;
    var type = bodyParse.type;
    var order = bodyParse.data;
    var data = yield infectservice.webHooks(type,order);
    this.body = data;
}
exports.usercontent = function *() {
    var users = yield mongodb.collection('user').find({createtime: {$exists: true}}, {_id: 0, createtime: 1})
        .sort({ createtime: 1}).toArray();
    users = users.map(function (doc) {
        return doc.createtime;
    })
/*    var n = 104174;
    var num = range2(n).map(function (n) {
        if(n == Math.pow(2,17)){
            return  Date.parse(users[users.length-1]);
        }else{
            return users[n];
        }

    });
    console.log(num);*/
    for(let i =13020 ;i<users.length;i++){
        let doc = yield infects_stats_before_ts(users[i]);
        yield mongodb.collection('usercontent').insertOne(doc);
    }

}
exports.dayofdata = function *() {
    var ts  = 1474732800000 + 28800000;
    for (var i=0;i<36;i++){
        var usercount = yield mongodb.collection('user').count({createtime: {$lt: ts}});
        var viruscount = yield mongodb.collection('virus').count({createtime: {$lt: ts}});
        var infectcount = yield mongodb.collection('infected').count({createtime: {$lt: ts}});
        var actioncount = yield mongodb.collection('action').count({createtime: {$lt: ts}});
        var ifs = yield mongodb.collection('infected').aggregate([
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
            }
        ]).toArray();
        var infects = ifs.map(function (doc) {
            return doc.count;
        })
        var date = new Date(ts);
        yield mongodb.collection('dayofdata').insertOne({'user-count':usercount,'virus-count':viruscount,'infect-count':infectcount,'max-infect':infects[1],'action-count':actioncount,'date':date});
        ts = ts + 86400000;
    }
}
exports.getJssdk = function *() {
    var url = this.query.url;
    console.log(url)
    var key = 'jssdk:' + url;
    var data = yield redisTemplate.get(key);
    if(!data){
        var token = yield redisTemplate.get('jssdk:token');
        console.log(token);
        if(!token){
            token = yield jssdkservice.GetToken();
            yield redisTemplate.set('jssdk:token',token);
            yield redisTemplate.expire("jssdk:token",6500);
        }
        var ticket = yield jssdkservice.GetTicket(token);
        data = yield jssdkservice.GetSignature(ticket,url);
        data = JSON.stringify(data);
        yield redisTemplate.set(key,data);
        yield redisTemplate.expire(key,6500);
    }
    this.body = JSON.parse(data);
}
function *virus_before_ts(ts) {
    var count = yield mongodb.collection('virus').count({createtime: {$lt: ts}})
    return count
}
function *infects_stats_before_ts(ts) {
    var ifs = yield mongodb.collection('infected').aggregate([
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
        }
    ]).toArray();
    let infects = ifs.map(function (doc) {
        return doc.count;
    })
    var count = yield virus_before_ts(ts);
    var userCount = yield mongodb.collection('user').count({'createtime':{$lt:ts}});
    var spread = yield mongodb.collection('action').count({'createtime':{$lt:ts},'action':'spread'});
    var skip = yield mongodb.collection('action').count({'createtime':{$lt:ts},'action':'skip'});
    var speed = yield mongodb.collection('order').count({'createtime':{$lt:ts},'speed':true});
    return {
        "time-stamp": ts,
        "users-count": userCount,
        "total-virus": count,
        "average-infected": infects.reduce(function(a, b) {return a + b}) / (infects.length || 1),
        "max-infected": infects[1],
        "spread-count": spread,
        "skip-count" : skip,
        "speed-count" : speed
    }
}
function range2(n) {return n? range2(n-1).concat(Math.pow(2,n)):[]}
function *stats(n) {
    return range2(n)
        .map(function(n) {return users_ts[n]})
        .map(function(ts) {return infects_stats_before_ts(ts)})
}
