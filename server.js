var express = require('express');
var bodyParser = require("body-parser");
var app = express();

var mongojs = require('mongojs')
var db = mongojs('localhost:27017/solidware_mini_db', ['users'])



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
            res.
        } else {
            res.send('username or password was wrong.');
        }
    });
});


var server = app.listen(8081, function () {
  console.log('listening http://127.0.0.1:8081/');
})
