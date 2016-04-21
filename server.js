var express = require('express');
var app = express();

// bodyparser is used to parse html requests
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up database to store login credential
var mongojs = require('mongojs')
var db = mongojs('localhost:27017/solidware_mini_db', ['users'])

// jwt is used to create and manage session token
var jwt = require('jwt-simple');
// TODO(wonjohn): separate this secret out of git respository.
app.set('jwtTokenSecret', 'idU093FHeqN2L1MNC7');

// this is used to create and manage cookie
var cookieParser = require('cookie-parser')
app.use(cookieParser());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
})

// check if given username and password pair is stored in solidware_mini_db:users
login_success = function(username, password, callback) {
    db.users.find(function(err, docs) {
        if (err != null) {
            console.log('In solidware_mini_db:users, an error occurred:', err);
        } else if (docs != null) {
            success = false;
            name = '';
            docs.forEach(function(doc) {
                // TODO(wonjohn): in real life, password shouldn't be stored in db
                // in plain text as in here..
                if (doc['username'] == username
                    && doc['password'] == password) {
                    console.log("login success!");
                    success = true;
                    name = doc['name'];
                }
            });
            callback(success, name);
        }
    });
}

app.post('/login', function(req, res){
    // TODO(wonjohn): handle case in which req.body does not have login or password.
    username = req.body['login'];
    password = req.body['password'];
    console.log('POST username: ' + username);
    console.log('POST password: ' + password);

    login_success(username, password, function(success, name) {
        if (success) {
            // TODO(wonjohn): Add expire time to this token.
            var session_token = jwt.encode({
                id: username,
            }, app.get('jwtTokenSecret'));

            // make coookies expire in one hour
            one_hour_ms = 60 * 60 * 1000;
            res.cookie('name', name, {maxAge: one_hour_ms});
            res.cookie('session_token', session_token, {maxAge: one_hour_ms});
            // 1 hour
            // res.cookie('maxAge', 60 * 60 * 1000);
            res.redirect('/concatString');
        } else {
            res.send('username or password was wrong.');
        }
    });
});

app.get('/concatString', function(req, res) {
    console.log(req.cookies);
    res.sendFile(__dirname + '/concat_string.html');
});

var server = app.listen(8081, function () {
  console.log('listening http://127.0.0.1:8081/');
});
