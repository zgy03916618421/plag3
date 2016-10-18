/**
 * Created by Administrator on 2016/9/20.
 */
var parse = require('co-busboy');
var router = require('koa-router')();
var C = require('../controller/controller');
var fs = require('fs');
router.post('/login',C.login);
router.get('/oauth',C.oauth);
router.post('/uploadpic',C.upPic);
router.post('/virus',C.createVirus);
router.get('/virus/:userid',C.fightVirus);
router.put('/favor',C.favor);
router.put('/disfavor',C.disfavor);
router.post('/speed',C.speed);
router.get('/share/:userid',C.share);
router.post('/recharge',C.recharge);
router.get('/getuser/:userid',C.getUserInfo)
router.get('/path/:userid/:vid',C.path);
router.get('/tree/:vid',C.tree);
router.get('/getshare/:carryid/:vid/:userid',C.shareVirus);
router.get('/graph/:vid',C.graph);
router.get('/hotvirus',C.hotvirus);
router.get('/virusdetail/:vid')
module.exports = router