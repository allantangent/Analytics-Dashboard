const express = require('express');
const router = express.Router();
const fs = require('fs');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectID;
const isAdmin = require('./app');

// init mongodb
const MongoClient = mongodb.MongoClient;
const url = 'mongodb://127.0.0.1:27017/';

router.all('/:id', (req, res, next) => {
  try {
    ObjectId(req.params.id)
  } catch(err) {
    res.status(404).end('404 error. Try again.');
    return;
  }
  if(req.method === 'GET') {
    MongoClient.connect(url, (err, db) => {
      if(err) {
        console.log('db connection error', err);
      } else {
        let dbase = db.db('hw4db');
        dbase.collection('users').findOne( { "id": ObjectId(req.params.id) }, (err, result) => {
          if(err || result == null) {
            res.status(404).end('404 error. Try again.');
            console.log('get error', err);
          } else {
            res.status(200);
            delete result._id;
            res.json(result);
          }
        });
      }
    });
  } else if(req.method === 'DELETE') {
    MongoClient.connect(url, (err, db) => {
      if(err) {
        console.log('db connection error', err);
      } else {
        let dbase = db.db('hw4db');
        dbase.collection('users').findOneAndDelete({ "id": ObjectId(req.params.id) }, (err, result) => {
          if(err) {
            res.status(404).end('404 error. Try again.');
            console.log('delete error', err);
          } else {
            res.status(200);
            res.json(result.value);
          }
        });
      }
    });
  } else if(req.method === 'PUT' || req.method === 'PATCH') {
    MongoClient.connect(url, (err, db) => {
      if(err) {
        console.log('db connection error', err);
      } else {
        let dbase = db.db('hw4db');
        let newVal = {
          $set: {}
        };
        for(let prop in req.body) {
          newVal.$set[prop] = req.body[prop];
        }
        let options = {
          returnOriginal: false
        }
        dbase.collection('users').findOneAndUpdate( {"id": ObjectId(req.params.id) }, 
        newVal, options, (err, result) => {
          if(err) {
            res.status(404).end('404 error. Try again.');
            console.log('put error', err);
          } else {
            res.status(202);
            res.json(result.value);
          }
        });
      }
    });
  }
});

router.all('/', (request, response, next) => {
	if(request.method === 'GET') {
    MongoClient.connect(url, (err, db) => {
      if(err) {
        console.log('DB error', err);
      } else {
        let dbase = db.db("hw4db");
        dbase.collection('users').find().toArray((err, result) => {
          if(err) {
            console.log('toarr error', err);
          } else {
            for(let obj in result) {
              delete result[obj]._id;
            }
            response.json(result);
          }
        });
      }
      db.close();
    });
	} else if(request.method === 'POST') {
    MongoClient.connect(url, (err, db) => {
      if(err) {
        console.log('DB error', err);
      } else {
        let dbase = db.db("hw4db");
        let insertedData = request.body;
        delete insertedData._id;
        insertedData["id"] = ObjectId();
        dbase.collection('users').insertOne(insertedData, (err, res) => {
          if(err) {
            console.log('insert error', err);
          } else {
            delete insertedData._id;
            response.json(insertedData);
          }
        });
      }
      db.close();
    });
	}
});

module.exports = router;