/**
 * Created by Administrator on 2016/10/24.
 */
var pingConfig = require('../config/pingconfig');
var key = pingConfig.testKey
var pingpp = require('pingpp')(key)
exports.chargeCreate = function *(opt) {
    return new Promise(function (resolve,reject) {
        pingpp.charges.create(opt,function (err,charge) {
            if(err) reject(err);
            else resolve(charge);
        })
    })
}
/*
var opt = {
    subject:"22",
    body : "plag test",
    amount:1000,
    order_no:"4892374839543",
    channel:"alipay",
    currency:"cny",
    client_ip:"0.0.0.0",
    app:{id:pingConfig.appID}
}
pingpp.charges.create(opt,function (err,charge) {
    if(err){
        console.log(err);
    }else{
        console.log(charge);
    }
})*/
