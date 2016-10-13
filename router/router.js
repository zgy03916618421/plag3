/**
 * Created by Administrator on 2016/9/20.
 */
var parse = require('co-busboy');
var router = require('koa-router')();
var C = require('../controller/controller');
var fs = require('fs');
router.post('/suriv/login',C.login);
router.get('/suriv/oauth',C.oauth);
router.post('/suriv/uploadpic',C.upPic);
router.post('/suriv/virus',C.createVirus);
router.get('/suriv/virus/:userid',C.fightVirus);
router.put('/suriv/favor',C.favor);
router.put('/suriv/disfavor',C.disfavor);
router.post('/suriv/speed',C.speed);
router.post('/suriv/recharge',C.recharge);
router.get('/suriv/getuser/:userid',C.getUserInfo)
router.get('/suriv/path/:userid/:vid',C.path);
router.get('/suriv/tree/:vid',C.tree);
router.get('/suriv/getshare/:carryid/:vid/:userid',C.shareVirus);
router.get('/suriv/graph/:vid',C.graph)
module.exports = router