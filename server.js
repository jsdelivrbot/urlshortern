'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');
var validUrl = require('valid-url');

var utility = require('./config/utility');
var app = express();

var base_url = process.env.BASE_URL || 'http://localhost:8080';//we have set baseUrl, if BASE_URL has existed, baseUrl = BASE_URL, otherwise baseUrl = http://localhost:3000。



var client = new pg.Client({
	user:,
	password:,
	database:,
	port:,
	host:,
	ssl:
});

client.connect(function(err)) {
	if(err)
		throw err;
	else
		console.log("Connected to postgres!");//print out Connected to postgres!
});

var router = express.Router();

app.use(bodyParser.urlencoded({ extended: true})); // Content-Type: application/x-www-form-urlencoded
app.use(bodyParser.json());
app.set('json spaces', 2);
app.set('json replacer', null);

app.set('port', (process.env.PORT || 8080));

app.use(express.static(__dirname + '/views'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//CORS middleware

var allowCrossDomain = function(request, response, next) {
	response.header('Access-Control-Allow-Origin', '*');
	response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	//get:retrieve information; 
	//put:Store an entity at a URI.PUT can create a new entity or update an existing one. 
	//delete:Request that a resource be removed;
	//Post:Request that the resource at the URI do something with the provided entity.
	//options:
	response.header('Access-Control-Allow-Methods', 'Content-Type');
	//intercept OPTIONS method for preflight request from chrome
	if('OPTIONS' === request.method) return response.sendStatus(200);
	else next();
};
router.use(allowCrossDomain);

// display the index.html
router.get('/', function(request, response) {
	response.render('index');
});

router.get('/:shortURLId', function(request, response) {
	var shortURLId = request.params.shortURLId.trim();
	client.query('SELECT longurl FROM shorturlmap WHERE shorturl = $1',[shortURLId], function(err, result) {
		if(err) {
			console.lon(err);
			return response.status(500).json({'err': 'PostgreSQL SELECT ERR!'});

		}
		if(result.rows.length == 0) {
			return response.render('err'); // 404 pages
		}

		var selectedLongURL = result.rows[0];
		console.log(selectedLongURL['longurl']);
		return response.redirect(301, selectedLongURL['longurl']);
	});

});

//shortening: take a url => shorter url
router.post('/longurl', function(request, response) {

	var body = request.body;
	console.log(body);
	var isValid = utility.validateLongURL(body);
	console.log(body.longURL);
	if(isValie != 'succeed') {
		return response.status(400).json({'err': 'Bad Request', 'message': isValid});
	}

	var longURLParams = body.longURL.trim();
	if(!validUrl.isUri(longURLParams)) {
		return response.json({'err': 'Invalid URL!'});

	}

	var shortURLGnrt = utility.hash(longURLParams, new Date().toISOString());
	console.log(shortURLGnrt);
	client.query('INSERT INTO shorturlmap(shortUrl, longUrl, userId, count) VALUES($1, $2, $3, $4)', [shortURLGnrt, longURLParams, 0, 0], function(err, result){
		if(err) {
			console.log(err);
			return response.status(500).json({'err': 'PostgreSQL INSERT ERR!'});

		}
		var shortedURL = base_url +'/' + shortURLGnrt;
		return response.json({'message': 'Short URL Generated!', 'ShortURL': shortendURL});
	});
});

//Redirecting: short url => original url
//custom url
router.post('/custom', function(request, response) {
	var body = request.body;
	var isValid = utility.calidateCustomizeBodyURL(body);
	if(isValide != 'succeed') {
		return response.status(400).json({'err': 'Bad Resquest', 'message': isValid});
	}

	var shortURL = body.customizedshorturl;
	var longURL = body.longURL.trim();
	var userId = body.userId;
	if(!validUrl.usUri(longURL)) {
		return response.json({'err': 'Invalid URL!'});
	}

	client.query('SELECT longurl FROM shorturlmap WHERE shorturl = $1', [shortURL], function(err, result) {
		if(err) {
			console.log(err);
			return response.status(500).json({'err': 'PostgreSQL SELECT ERR!'});
		}

		var found = result.rows.length;
		console.log(found);
		if(found > 0) {
			return response.json({'err': 'The short URL has been used!'});
		}

		client.query('INSERT INTO shorturlmap(shorturl, longUrl, userId, count) VALUE($1, $2, $3, $4)', [shortURL, longURL, userId, 0], function(err, result){
			if(err) {
				console.log(err);
				return response.status(500).json({'err': 'PostgreSQL INSERT ERR!'});
			}

			var shortendURL = base_url + '/' + shortURL;
			return response.json({'message': 'CustomizedURL Generated!', 'ShortURL': shortendURL});
		});
	});
});

app.use(router);

var server = app.listen(app.get('port'), function() {

	var host = server.address().address;
	var port = server.address().port;

	console.log('URL Shortener is running on htto://%s:%s', host, port)
});


