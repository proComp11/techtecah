var express = require('express')
var router = express.Router();
var connection = require('../lib/db');
const { body, validationResult } = require('express-validator');


// a middleware function with no mount path. This code is executed for every request to the router
router.use(function (req, res, next) {
  console.log('Time:', Date.now())
  console.log('mainpage called')
  next()
})

router.get('/', function(req, res, next) {
	var sqlstr = 'SELECT * FROM menus WHERE active=1';
	connection.query(sqlstr, function(err, data, fields) {
		if(err){
			throw err;
		} else {
			res.render('mainindex', {title:'TechTeach', bread_camp: 'Home', menuList: data})
		}
	});
})

router.get('/tuto/:id', function(req, res){
	var id = req.params.id;
	var sqlstr = "SELECT * FROM content WHERE course_name='"+id+"'";
	connection.query(sqlstr, function(err, data, fields) {
		if(err){
			throw err;
		}else{
			res.render('mainindex', {title:'TechTeach', bread_camp: 'content', contentList: data, category: id});
		}
	})
})

// getting details contents
router.get('/detail/:text', function(req, res) {
	var con_detls = req.params.text;
	console.log(con_detls);
	res.send({
		message:con_detls
	})
})

module.exports = router;