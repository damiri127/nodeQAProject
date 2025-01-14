'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
// variable for MongoDB 
const {ObjectID} = require('mongodb');
// variable for authenticate strategies (Passport)
const LocalStrategy = require('passport-local'); 

const app = express();

app.set('view engine', 'pug');
app.set('views', './views/pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure: false}
}));

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// function connect to database
myDB(async client=>{
  const myDataBase = await client.db('database').collection('user');

  // direct to index
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database', 
      message: "Please login"
    });
  });

  // function serialized user
  passport.serializeUser((user, done)=>{
    done(null, user._id);
  });

  // function deserialized user
  passport.deserializeUser((id, done)=>{
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  // function localstrategy
  passport.use(new LocalStrategy((username, password, done)=>{
    myDataBase.findOne({username: username}, (err, user)=>{
      console.log('User ${username} attemped to log in.');
      if (err) return done(err);
      if (!user) return done(null, false);
      if (password !== user.password) return done(null, false);
      return done(null, user);
    });
  }));

  // Error handling
}).catch(e =>{
  // direct to index
  app.route('/').get((req, res) => {
    res.render('index', {
      title: e, 
      message: 'Failed to Connect Database'
    });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
