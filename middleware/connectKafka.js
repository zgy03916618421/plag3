/**
 * Created by Administrator on 2016/11/2.
 */
var kafka = require('kafka-node'),
    Producer = kafka.Producer,
    client = new kafka.Client('192.168.100.2:2181'),
    producer = new Producer(client)
var msg = {"userId":"7363ebce6fbf31d59559810a23cce220","type":"text","content":"瑞珊你好","vid":"12ca067c2f1a1f75b21494bbec54984d","timeCreated":1477641462000};
var payloads = [
    {topic:'content',messages:JSON.stringify(msg)}
]
producer.on('ready',function () {
    producer.send(payloads,function (err,data) {
        console.log(data);
    })
})
producer.on('error',function (err) {
    console.log(err);
})