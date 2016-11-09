/**
 * Created by Administrator on 2016/11/9.
 */
var config = require('../config/config');
var cryPto = require('crypto');
var httpUtils = require('./httpUtils')
exports.GetToken = function *() {
    var opts = {
        'method' : 'GET',
        'url' : 'https://api.weixin.qq.com/cgi-bin/token',
        'qs' : {
            'grant_type': 'client_credential',
            'appid' : config.weixin.appID,
            'secret' : config.weixin.appsecret
        }
    };
    var res = yield httpUtils.request(opts);
    console.log(res);
    var token = JSON.parse(res).access_token;
    return token;
}
exports.GetTicket = function *(token) {
    var opts = {
        'method' : 'GET',
        'url':'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
        'qs':{
            'type':'jsapi',
            'access_token':token
        }
    }
    var res = yield httpUtils.request(opts);
    console.log(res)
    var ticket = JSON.parse(res).ticket;
    console.log(ticket);
    return ticket;
}
exports.GetSignature = function *(ticket,URL) {
    var timastamp = Date.parse(new Date());
    var jsapi_ticket = ticket;
    var url = URL;
    var noncestr = RandomString(16);
    var sigString = 'jsapi_ticket='+ticket+'&noncestr='+noncestr+'&timestamp='+timastamp+'&url='+url;
    var sha1=cryPto.createHash('sha1');
    sha1.update(sigString,'utf8');
    var signature = sha1.digest('hex');
    return {
        "timestamp" : timastamp,
        "jsapi_ticket" : jsapi_ticket,
        "noncestr" : noncestr,
        "url" : url,
        "signature" : signature
    }
}
function RandomString(length) {
    var str = '';
    for ( ; str.length < length; str += Math.random().toString(36).substr(2) );
    return str.substr(0, length);
}
