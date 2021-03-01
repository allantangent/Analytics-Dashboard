const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const port = 3004;
const helmet = require('helmet');
const mongodb = require('mongodb');

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
	next();
});

app.options('*', function(req, res) {
	res.sendStatus(200);
});

// endpoints
const endpointRoutes = require('./endpointRouter');
app.use('/users', endpointRoutes);

server.listen(port, (err) => {
	if (err) {
		throw err;
	}
	console.log('Node Endpoints working :)');
});

module.exports = server;

