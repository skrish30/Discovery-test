// Author: Oliver Rodriguez

// Modules to import
const express = require("express");
const rp = require("request-promise");
const cfenv = require("cfenv");
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);
const fs=require('fs').promises;
const fsPromises=require('fs').promises;
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
function queryDiscovery(query,callback){
  //function to query Discovery
  let queryParams ={
    environment_id: process.env.ENVIRONMENT_ID,
    collection_id: process.env.COLLECTION_ID,
    aggregation: query
  };
  console.log(queryParams);
  discovery.query(queryParams)
    .then(queryResponse =>{
      //console.log(JSON.stringify(queryResponse, null, 2));
      /*
      fsPromises.writeFile("data.txt", JSON.stringify(queryResponse, null, 2))
        .then(()=> console.log("success"))
        .catch(()=> console.log("failure"))
      */
      console.log('successful query');
      callback(null,queryResponse);
    })
    .catch(err =>{
      console.log('error',err);
      callback(err,null);
    });
};

function findBestHotels(queryResults,callback){
  //Function to find the best hotel

  let highestSent =0;
  let currentSent;
  let bestHotel;
  for (let index = 0; index < queryResults.length; index++) {
    currentSent = queryResults[index].aggregations[0].value;
    if(currentSent > highestSent){
      highestSent = currentSent;
      bestHotel = queryResults[index].key;
    }
  }
  callback(bestHotel, highestSent);
}

/*
queryDiscovery("term(hotel,count:50).average(enriched_text.sentiment.document.score)", (err,queryResults) =>{
  console.log(err+"I am here");
  if(err){
    console.log(err);
  }

  queryResults = queryResults.aggregations[0].results;
  console.log(queryResults)
  findBestHotels(queryResults, (hotel,sentiment)=>{
      console.log( "The best hotel overall is " + hotel.replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase())  
        + "with an average sentiment of " + sentiment.toFixed(2));
  });
});

  
switch(context.best){
  case "All":
    break;
  case "new-york-city":
    break;
  case "san-francisco":
    break;
  case "chicago":
    break;
}
*/

context={
  best: 'san-francisco'
}

queryDiscovery("filter(city::"+context.best+").term(hotel,count:50).average(enriched_text.sentiment.document.score)", (err,queryResults) =>{
  console.log(err+"I am here");
  console.log(queryResults);

  if(err){
    console.log(err);
  }

  queryResults = queryResults.aggregations[0].aggregations[0].results;
  console.log(queryResults)
  findBestHotels(queryResults, (hotel,sentiment)=>{
      console.log( "The best hotel overall is " + hotel.replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase())  
        + "with an average sentiment of " + sentiment.toFixed(2));
  });
});
