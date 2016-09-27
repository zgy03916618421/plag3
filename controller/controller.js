/**
 * Created by Administrator on 2016/9/20.
 */
'use strict'
var parse = require('co-busboy');
var qiniuUtil = require('../service/qiniuUtil');
var md5 = require('MD5')
var util = require('../service/utilservice');
var infectservice = require('../service/infectedservice');
exports.oauth = function *() {
    var code = this.query.code;
    var redircetUrl = this.query.state;
    console.log(redircetUrl);
    var token = yield client.getAccessToken(code);
    var accessToken = token.data.access_token;
    var openid = token.data.openid;
    var userinfo = yield client.getUser(openid);
    var user = yield mongodb.collection('user').find({'openid':userinfo.openid}).toArray();
    if (!user.length){
        userinfo.createtime = Date.parse(new Date());
        userinfo.balance = 200;
        userinfo.income = 0;
        mongodb.collection('user').insertOne(userinfo);
    }
    this.response.redirect(redircetUrl+'?userid='+userinfo.openid);

}
exports.upPic = function *() {
        try{
            var parts = parse(this,{limit:'5mb',autoFields: true});
            var part;
            while (part = yield parts){
                if (part != undefined){
                    var name = md5(new Date().valueOf()+Math.random());
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
    //var speed = bodyparse.speed;
    var carryid = bodyparse.userid;
    var orderid = md5(new Date().valueOf()+Math.random());
    mongodb.collection('order').insertOne({
        "orderid":orderid,
        "userid" : carryid,
        "vid" : virus.vid,
        "createtime": Date.parse(new Date()),
        "fullfill" : 0,
        "speed" :false
    })
    mongodb.collection('infected').insertOne({
        "carryid":carryid,
        "vid":virus.vid,
        "infectid":carryid,
        "orderid":orderid,
        'createtime':Date.parse(new Date()),
        'source':true
    });
    this.body = {'head':{code: 300,msg:'success'}};
}
exports.fightVirus = function *() {
    var userid = this.params.userid;
    var data = yield infectservice.getVirus(userid);
    this.body = data;
}
exports.favor = function *() {
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
    var data = yield infectservice.speedV3(vid,userid);
    this.body = data;
}
exports.recharge = function *() {
    var money = this.request.body.money;
    var userid = this.request.body.userid;
    var data = yield infectservice.recharge(money,userid);
    this.body = {'head':{code: 200,msg:'success'},'data':{balance:data}};
}
exports.getUserInfo = function *() {
    var userid = this.params.userid;
    var userinfo = yield  mongodb.collection('user').find({'openid':userid}).toArray();
    this.body = {'head':{code:200,msg:'success'},'data':userinfo[0]}
}