/**
 * Created by Administrator on 2016/9/22.
 */
var config = {
    mongo : {
        host: process.env.BS_MONGOHOST || '192.168.100.2',
        port: process.env.BS_MONGOPORT || '27017',
        db: process.env.BS_MONGODBNAME || 'plag',
        user : process.env.BS_MONGOUSER || 'rio',
        pass : process.env.BS_MONGOPASS || 'VFZPhT7y'
    },
    weixin : {
        appID : 'wxdc041c85f0bf7b6f',
        appsecret : '5bcb2ec82178f7085b449fcffe8b3816'
    },
    redis : {
        host: process.env.BS_REDISHOST || '192.168.100.2',
        port : process.env.BS_REDISPORT || 6379
    }
}
module.exports = config;