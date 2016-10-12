/**
 * Created by Administrator on 2016/10/12.
 */
var config = require('../config/config');
var redis = require('redis'),
    client = redis.createClient(config.redis.port, config.redis.host,{});
client.on('connect',function () {
    global.redis = client;
    console.log('connect redis  success!');
})