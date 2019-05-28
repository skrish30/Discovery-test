// Author: Oliver Rodriguez

// Modules to import
const express = require("express");
const rp = require("request-promise");
const cfenv = require("cfenv");
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);
const fsPromises=require('fs').promises;
const fs = require('fs');
require('dotenv').config({silent: true});

//modules for V2 assistant
var bodyParser = require('body-parser'); // parser for post requests


//Import Watson Developer Cloud SDK
var AssistantV2 = require('watson-developer-cloud/assistant/v2'); // watson sdk
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');


// Get the environment variables from Cloud Foundry
const appEnv = cfenv.getAppEnv();

// Serve the static files in the /public directory
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());


// Create the Discovery object
const discovery = new DiscoveryV1({
  version: '2017-08-01',
  url: process.env.DISCOVERY_URL || 'https://gateway.watsonplatform.net/discovery/api',
});

const environmentID = process.env.ENVIRONMENT_ID;
const collectionID = process.env.COLLECTION_ID;

// start server on the specified port and binding host
server.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});


app.get('/', function(req, res){
  res.sendFile('index.html');
});


/*****************************
    Function Definitions
******************************/

const addDocumentParams = {
  environment_id: environmentID,
  collection_id: collectionID,
  file: fs.createReadStream('./doc.json'),
};
console.log(addDocumentParams);

discovery.addDocument(addDocumentParams)
  .then(documentAccepted => {
    console.log(JSON.stringify(documentAccepted, null, 2));
  })
  .catch(err => {
    console.log('error:', err);
  });