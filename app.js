var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var flash = require('express-flash');
var session = require('express-session');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var connection = require('./lib/db');
// add route
var indexRouter = require('./routes/index');
//var userRouter = require('./routes/users');
var mainRouter = require('./routes/mainpage');
 
const { body, validationResult } = require('express-validator');
var app = express();
const port = 3000;

// setup view engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs');

// app use
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'uploads/')));
app.use(session({
	secret:'connectProcat',
	resave: false,
	saveUninitialized: true,
	cookie: {maxAge: 1800000 }
}))

app.use(flash());

app.use('/',indexRouter);
app.use('/main', mainRouter);

//catch 404 and forward ti error handler
app.use(function(req, res, next) {
	// next(createError(404));
	return res.status(404).render('404', {title: 'Not Found'})
});

app.listen(port, () => console.log(`app listening at http://localhost:${port}`))
