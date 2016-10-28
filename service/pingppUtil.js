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