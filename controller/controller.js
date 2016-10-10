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
    redircetUrl = redircetUrl.split("/");
    var _id = redircetUrl[3];
    var vid = redircetUrl[4];
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
        userinfo.viruscount = 0;
        mongodb.collection('user').insertOne(userinfo);
    }
    this.response.redirect(redircetUrl[0]+'/'+redircetUrl[1]+'/'+redircetUrl[2]+'/'+'?userid='+userinfo.openid+'&vid='+vid+'&_id='+_id);

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
    var orderid = md5(new Date().valueOf()+Math.random());
    mongodb.collection('user').updateOne({'openid':virus.userid},{$inc:{'viruscount':1}});
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
        'createtime':Date.parse(new Date())
    });
    this.body = {'head':{code: 300,msg:'success'}};
}
exports.fightVirus = function *() {
    var userid = this.params.userid;
    var data = yield infectservice.getVirusV2(userid);
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
    var data = yield infectservice.speedV4(vid,userid);
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
exports.path = function *() {
    var vid = this.params.vid;
    var userid = this.params.userid;
    console.log(vid);
    console.log(userid);
    var path = yield infectservice.path(vid,userid);
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