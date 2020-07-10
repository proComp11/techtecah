var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'edutech'
});
connection.connect(function(error) {
	if(!!error) {
		console.log(error);
	} else {
		console.log('connection established Successfully');
	}
});

module.exports = connection;