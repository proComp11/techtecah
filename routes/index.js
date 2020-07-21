var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var connection = require('../lib/db');
var mysql = require('mysql');
const { body, validationResult } = require('express-validator');

// a middleware function with no mount path. This code is executed for every request to the router
router.use(function (req, res, next) {
  console.log('Time:', Date.now())
  res.locals.users = req.session.name; //set session user name in middleware 
  console.log(res.locals.users)
  next()
})

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
	console.log('middleware call for notLoggedIn')
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
	console.log('middleware call for ifLoggedin')
    if(req.session.isLoggedIn){
        return res.redirect('/home');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

/* Get login view page */
router.get('/', function(req, res, next) {
	res.render('login', { login_errors:''})
})

/* get Dashboard view*/
router.get('/home', ifNotLoggedin, function(req, res, next) {
	res.render('index', {title: 'TechTeach Admin Dashboard', bread_camp: 'Dashboard', user: req.session.name})
})

// login function
router.post('/login', ifLoggedin, [
		body('userid','userid is empty!').trim().not().isEmpty(),
		body('pass','Password is empty!').trim().not().isEmpty()
	], function(req, res, next) {
		const validation_result = validationResult(req);
    	const {userid, pass} = req.body;
    	if(validation_result.isEmpty()){
    		connection.query("SELECT * FROM users WHERE userid=? AND password=?",[userid,pass], function(err, results, fields){
    			if(results.length > 0 ) {
    				req.session.isLoggedIn = true;
    				req.session.id = results[0].us_id;
    				req.session.name = results[0].name;
    				res.redirect('/home');
    			} else {
    				res.render('login',{
                        login_errors:['Invalid Password!']
                    });
    			}
    		});
    	} else {
    		let allErrors = validation_result.errors.map((error) => {
            	return error.msg;
	        });
	        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
	        res.render('login',{
	            login_errors:allErrors
	        });
    	}
})

//logout function 
router.get('/logout', function(req, res) {
	//session destroy
	req.session.destroy();
	res.redirect('/');
})
// end of logout

// menu router 
router.get('/menu', ifNotLoggedin, function(req, res, next) {
    res.render('index', {title: 'TechTech Admin Dashboard', bread_camp: 'Menu', user: req.session.name, msg_err: ''})
})

var multerStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, 'uploads/');
    },
    filename: function(req, file, callback) {
        callback(null, Date.now() + '_' + path.extname(file.originalname));
    }
});

// check file type
function checkFileType(req, file, callback) {
    console.log(file.originalname);
    //file types
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        //callback('Error!! Image Only');
        req.fileValidationError = 'Only image files are allowed!';
        return callback(new Error('Only image files are allowed!'), false);
    }else {
        return callback(null, true);
    }
}

router.post('/create', ifNotLoggedin, function(req, res, next) {
    // INITIAL UPLOAD FUNCTION
    const upload = multer({
        storage: multerStorage,
        limits:{filesize: 1000000},
        fileFilter: function(req, file, callback)  {
            checkFileType(req, file, callback);
        }
    }).single('menuImage');

    upload(req, res, function(err){
        if(req.fileValidationError){
            req.flash('err_info', req.fileValidationError);
            res.render('index', {title:'TechTech Admin Dashboard', bread_camp: 'Menu', user: req.session.name, msg_err: ''})
            //return res.send(req.fileValidationError);
        } else if(!req.file) {
            req.flash('err_info', 'Please select an image to upload');
            res.render('index', {title:'TechTech Admin Dashboard', bread_camp: 'Menu', user: req.session.name, msg_err: ''})
            //return res.send('Please select an image to upload');
        } else if(err instanceof multer.MulterError) {
            req.flash('err_info', err);
            res.render('index', {title:'TechTech Admin Dashboard', bread_camp: 'Menu', user: req.session.name, msg_err: ''})
            //return res.send(err);
        } else if(err){
            req.flash('err_info', err);
            res.render('index', {title:'TechTech Admin Dashboard', bread_camp: 'Menu', user: req.session.name, msg_err: ''})
            //return res.send(err);
        } else {
            const fileinfo = req.file.filename;
            const name = req.body.menuname;
            const img_path = req.file.path;
            var info = {
                        m_name: name,
                        image: fileinfo,
                        image_path: img_path
                    }
            connection.query('INSERT INTO menus SET ?', info, function(err,result) {
                if(err) {
                    req.flash('err_info', err)
                    res.render('index', {title:'TechTech Admin Dashboard', bread_camp: 'Menu', user: req.session.name, msg_err: ''})
                } else {
                    req.flash('success', 'Data Successfully Inserted!')
                    res.render('index', {title:'TechTech Admin Dashboard', bread_camp: 'Menu', user: req.session.name, msg_err: ''})        
                }
            })        
        }
    });
})

// content page function
router.get('/contentmenu', ifNotLoggedin, function(req, res, next) {
    var sqlstr = "SELECT * FROM menus";
    connection.query(sqlstr, function(err, data, field) {
        if(err) {
            throw err;
        }else {
            res.render('index', {title: 'TechTech Admin Dashboard', bread_camp: 'content_Menu', user: req.session.name, menuList: data, msg_err: ''});            
        }
    })  
})

//route for containt details page
router.get('/createdetails', ifNotLoggedin, function(req, res, next) {
    let sqlstr = "SELECT * FROM menus";
    connection.query(sqlstr, function(err, data, field) {
        if(err) {
            throw err;
        } else {
            res.render('index', {title: 'TechTech Admin Dashboard', bread_camp: 'Add_Details', user: req.session.name, menuList: data, msg_err: '' });
        }
    })
})


// sub-content function
router.post('/sbtcontent', ifNotLoggedin, function(req,res,next) {
    const menu = req.body.m_name;
    const smenu = req.body.content_name;
    var id = 0;
    var succFlag;
    const iterator = smenu.values();
    //console.log(menu);
    //console.log(smenu);
    //console.log(smenu.length);
    // fetch id by menu name
    let sqlque = 'SELECT m_id FROM menus WHERE m_name = ' +mysql.escape(menu);
    connection.query(sqlque, function(err, data, fields) {
        if(err) {
            throw err;
        } else {
            //console.log(data);
            //console.log(fields);
            //id = data.m_id;
            for (const value of iterator) {
                //console.log(value);
                var info = {
                    con_name : value,
                    m_id : data[0].m_id,
                    course_name : menu
                }
                connection.query('INSERT INTO content SET ?', info, function(error, result) {
                    if(error) {
                        throw error;
                    } else {
                        if(result.affectedRows > 0) {
                            succFlag = result.affectedRows;
                            //console.log(succFlag);
                        }
                    }
                })
            }
        }
    })
    //console.log(succFlag);
    if(succFlag != 0) {
        res.json({
            code: '1',
            status: 'Data Successfully Saved'
        })
    }else {
        res.json({
            code: '0',
            status:'Failed To Save Data'
        })
    }
})

//fetching subcontent menu by menu id
router.post('/fetchSbtContent', ifNotLoggedin, function(req, res, next) {
    const menu_id = req.body.selectedItem;
    console.log(menu_id);

    let sqlque = 'SELECT * FROM content WHERE m_id= ' + mysql.escape(menu_id) +'AND isComplete=0';
    connection.query(sqlque, function(err, data, fields) {
        if(err) {
            throw err;
        } else {
            res.json({
                code : '1',
                status: data
            })
        }
    })
})

module.exports = router;