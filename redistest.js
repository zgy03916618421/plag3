/**
 * Created by Administrator on 2016/10/24.
 */
var redis =require('redis');
var client = redis.createClient(6379,'192.168.100.2',{});
/*client.hset('hashkey','hashtest 1','1');
client.hset('hashkey','hashtest 2','2');*/
var userinfo = {
    'openid':''
}
client.hmset('user:1234',userinfo)
client.hgetall('hashkey',function (err,reply) {
    console.log(reply);
})