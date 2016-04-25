var express = require('express');
var app = express();

// start server
var server = app.listen(8081, function () {
  console.log('listening http://127.0.0.1:8081/');
});

// attach socket.io to server
var io = require('socket.io')(server);

// bodyparser is used to parse html requests
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up database to store login credential
var mongojs = require('mongojs')
var db = mongojs('localhost:27017/mini_db', ['users'])

// jwt is used to create and manage session token
var jwt = require('jwt-simple');
// TODO(wonjohn): separate this secret out of git respository.
var jwtSecret = 'idU093FHeqN2L1MNC7';
app.set('jwtTokenSecret', jwtSecret);

// this is used to create and manage cookie
var cookieParser = require('cookie-parser')
app.use(cookieParser());

// set the view engine to ejs
app.set('view engine', 'ejs');

// set up celery message queue
var celery = require('node-celery'),
    client = celery.createClient({
        CELERY_BROKER_URL: 'amqp://guest:guest@localhost:5672//',
        CELERY_RESULT_BACKEND: 'amqp'
    });

client.on('error', function(err) {
    console.log('celery error: ' + JSON.stringify(err));
});

var celeryConnected = false;
client.on('connect', function() {
    console.log('celery client connected');
    celeryConnected = true;
});

// main entrance to this website
app.get('/', function (req, res) {
    console.log('cookies: ' + JSON.stringify(req.cookies));
    // TODO(wonjohn): we should also verify session token if we
    // want to properly check if user is logged in.
    var logged_in = 'name' in req.cookies
        && 'session_token' in req.cookies;
    res.render('pages/index',{
        name: req.cookies['name'], logged_in: logged_in});
})

// check if given username and password pair is stored in mini_db:users
login_success = function(username, password, callback) {
    db.users.find(function(err, docs) {
        if (err != null) {
            // This shouldn't really happen.
            console.log('In mini_db:users, an error occurred:', err);
            callback(false, "");
        } else if (docs != null) {
            var success = false;
            var name = '';
            // loop through user info in db to check if there is
            // a matching username and password.
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
    if (!('login' in req.body)
        || !('password' in req.body)) {
        res.send('incorrect login request');
    }
    var username = req.body['login'];
    var password = req.body['password'];
    console.log('POST login username: ' + username);
    console.log('POST login password: ' + password);

    login_success(username, password, function(success, name) {
        // if login was successful (username and password
        // was verified from database), add user name (from database)
        // and session_id to cookie. Then, redirect to /concatString.
        if (success) {
            // TODO(wonjohn): Add expire time to this token.
            var session_token = jwt.encode({
                id: username,
            }, app.get('jwtTokenSecret'));

            // make coookies expire in one hour
            one_hour_ms = 60 * 60 * 1000;
            res.cookie('name', name, {maxAge: one_hour_ms});
            res.cookie('session_token', session_token, {maxAge: one_hour_ms});
            res.redirect('/concatString');
        } else {
            res.send('username or password was wrong.');
        }
    });
});

// add the given username and password pair to database mini_db:users
signup_success = function(name, username, password, callback) {
    // TODO(wonjohn): I am sure there is more secure way of managing
    // and storing in mongodb but will just do this for now because
    // this is a simple propotype.
    // TODO(wonjohn): Also, check if this method can ever fail.
    // In such case, call callback function with false.

    // TODO(wonjohn): make this restriction more strict.
    if (name == ''
        || username == ''
        || password == '') {
        callback(false);
    } else {
        db.users.insert({name: name,
                         username: username,
                         password: password})
        callback(true);
    }
}

app.post('/signup', function(req, res){
    if (!('login' in req.body)
        || !('password' in req.body)) {
        res.send('incorrect signup request');
    }
    var name = req.body['name'];
    var username = req.body['login'];
    var password = req.body['password'];
    console.log('POST signup name: ' + name);
    console.log('POST signup username: ' + username);
    console.log('POST signup password: ' + password);

    signup_success(name, username, password, function(success) {
        // if signup was successful (username and password
        // are successfully added to database), redirect to /
        // so that the user can login.
        if (success) {
            res.send('Signup succeeded! login with your username'
                    + ' and password <a href="/">here</a>');
        } else {
            res.send('Signup failed. Check that name, username, and '
                     + 'password are not empty.');
        }
    });
});

app.get('/logout', function(req, res){
    res.clearCookie('session_token');
    res.clearCookie('name');
    res.redirect('/');
});

app.get('/concatString', function(req, res) {
    console.log('cookies: ' + JSON.stringify(req.cookies));
    var requestConcat = 'string1' in req.query && 'string2' in req.query;
    res.render('pages/concat_string',{
        name: req.cookies['name'],
        session_token: req.cookies['session_token'],
        string1: req.query['string1'],
        string2: req.query['string2'],
        requestConcat: requestConcat});
});


io.on('connection', function (socket) {
    socket.on('concatString', function(data) {
        if ('string1' in data
            && 'string2' in data
            && 'session_token' in data) {
            var string1 = data['string1'];
            var string2 = data['string2'];

            console.log('concatString socket data: ' + JSON.stringify(data));
            try {
                var decoded = jwt.decode(data['session_token'], jwtSecret);
            } catch(err) {
                console.log('Failed to decode session token. decode err: ' + JSON.stringify(err));
            }

            // If session id is valid,
            if (decoded != undefined) {
                console.log('session token decoded: ' + JSON.stringify(decoded));
                // TODO(wonjohn): check session token expiration time
                // and reject any expired token

                // Make sure celery client is connected to rabbit.
                // If it is not connected, we should abandon this concat request.
                if (celeryConnected) {
                    // request celery worker to concat given strings.
                    client.call('celery_tasks.concat_string', [string1, string2],
                                function(result) {
                                    // Once we get result from celery worker,
                                    // emit the result through socket.
                                    console.log('celery result: ' + JSON.stringify(result));
                                    if ('result' in result) {
                                        var res = result['result'];
                                        socket.emit('concatStringRes',
                                                    { concatStringRes : res });
                                    }
                                });
                }
            }
        }
    });
});
