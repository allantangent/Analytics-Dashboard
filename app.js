const express = require("express");
const session = require("express-session");
const body    = require("body-parser");
const app = express();
const mongodb = require('mongodb');
const port = 3003;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// init mongodb
const MongoClient = mongodb.MongoClient;
const url = 'mongodb://127.0.0.1:27017/';

function findUser(username, func) {
  let isEmail = false;
  if(username.includes('@')) {
    isEmail = true;
  }

  MongoClient.connect(url, (err, db) => {
      let dbase = db.db('hw4db');
      if(err) {
      console.log('db connection error', err);
    } else {
      let query = {};
      isEmail ? query = { "email": username } : query = { "username": username };
      dbase.collection('users').findOne( query, (err, result) => {
        if(err || result == null) {
          return func(null, null);
        } else {
          return func(null, result);
        }
      });
    }
    db.close();
  });
}

passport.serializeUser(function(user, done) {
    done(null, user.username);
});
passport.deserializeUser(function(username, done) {
    findUser(username, function(err, user) {
        done(err, user);
    });
});

passport.use( new LocalStrategy({ usernameField: 'username',
                                  passwordField: 'password' },
    function(username, password, done) {
        findUser(username, function(err, user) {
            if ( err ) { return done(err); }
            if ( !user || user.password != password ) {
            return done(null, false, {
                    'message': 'User/password does not match'
                });
            }
            return done(null, user);
        });
    }
));

app.use(express.json());
app.use(session({ secret: 'nyan cat', resave: false, 
                  saveUninitialized: false }));
app.use(body());
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
    if ( req.isAuthenticated() ) { return next(); }
    res.redirect('login');
}

function isAdmin(req, res, next) {
  let adminCheck = false;
  let isEmail = false;
  if(req.user.username.includes('@')) {
    isEmail = true;
  }
  MongoClient.connect(url, (err, db) => {
    let dbase = db.db('hw4db');
    if(err) {
    console.log('db connection error', err);
  } else {
    let query = {};
    isEmail ? query = { "email": req.user.username } : query = { "username": req.user.username };
    dbase.collection('users').findOne( query, (err, result) => {
      if(err || result == null) {
        return;
      } else {
        if(JSON.parse(result.admin)) {
          adminCheck = true;
        }
      }

      if(adminCheck) {
        return next();
      }
      res.status(403).end('Permission denied. Page is only available to site admins.')
    });
  }
    db.close();
  }); 
}

////////////////////////////////////////////////////////////////////////////

// Public side: Login page
app.get('/login', function(req, res) {
    res.sendFile('public_html/login.html', { root: __dirname });
});
app.post('/login', passport.authenticate('local', 
    { successRedirect: 'home', failureRedirect: 'login'}
));

// In between: Logout
app.get('/logout', function(req, res) {
        req.logout();
        res.sendFile('/logout.html', { root: __dirname });
});

// Private side: Home page
app.get('/home', ensureAuthenticated, function(req, res) {
        res.sendFile('index.html', { root: __dirname });
});

app.get('/errors', ensureAuthenticated, function(req, res) {
  res.sendFile('errors.html', { root: __dirname });
});

app.get('/users', ensureAuthenticated, isAdmin, (req, res) => {
  res.sendFile('users.html', { root: __dirname });
});

app.listen(port);

module.exports = isAdmin;