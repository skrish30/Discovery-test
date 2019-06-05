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
require("./data.json")

//modules for V2 assistant
var bodyParser = require('body-parser'); // parser for post requests


//Import Watson Developer Cloud SDK
var AssistantV2 = require('watson-developer-cloud/assistant/v2'); // watson sdk
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js');



// Get the environment variables from Cloud Foundry
const appEnv = cfenv.getAppEnv();

// Serve the static files in the /public directory
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());


// Create the Discovery object
const discovery = new DiscoveryV1({
  version: '2019-04-02',
  url: process.env.DISCOVERY_URL || 'https://gateway.watsonplatform.net/discovery/api',
});

//Create the NLU object
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: '2018-11-16',
    iam_apikey: process.env.NATURAL_LANGUAGE_UNDERSTANDING_IAM_APIKEY,
    url: process.env.NATURAL_LANGUAGE_UNDERSTANDING_URL
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
const discoveryUpload = (docName)=>{
const addDocumentParams = {
  environment_id: environmentID,
  collection_id: collectionID,
  file: fs.createReadStream(docName),
};

discovery.addDocument(addDocumentParams)
  .then(documentAccepted => {
    console.log(JSON.stringify(documentAccepted, null, 2));
  })
  .catch(err => {
    console.log('error:', err);
  });
};

//upload doc.json in the current directory
//discoveryUpload('./doc.json')

const queryParams = {
  environment_id: process.env.DISCOVERY_ENVIRONMENT_ID,
  collection_id: process.env.DISCOVERY_COLLECTION_ID,
  filter: "id::\"39f38b9c1cd046d3ac50d7f8ace63fe0\""
};

// discovery.query(queryParams)
//   .then(queryResponse => {
//     console.log(JSON.stringify(queryResponse, null, 2));
//   data = JSON.stringify(queryResponse, null, 2);
//     fsPromises.writeFile("data.txt", data)
// 	.then(()=> console.log("success"))
// 	.catch(()=> console.log("failure"))
//   })
//   .catch(err => {
//     console.log('error:', err);
//   });

fsPromises.writeFile("categories.json",'')
          .then(()=> console.log("file created"))
          .catch(()=> console.log("failure"))


//reads file and returns the JSON object
function readJson(fileName){
var readableStream = fs.createReadStream(fileName);
var data = '';
// Return new promise 
return new Promise(function(resolve, reject) {
    readableStream.on('data', function(chunk) {
        data+=chunk;
    });
    readableStream.on('end', function() {
        data = JSON.parse(data)
        elements = [];
        data.results[0].enriched_text.concepts.forEach(element => {
            elements.push(element.text);
        });
        resolve(elements)
    });
    readableStream.on('error', function(err){
        reject(err);
    });
})
};

readJson('data.json')
.then((res)=> {
    elements = [];
    res.forEach(concepts=>{
    const analyzeParams = {
        'text':'I am interested in ' + concepts,
        'features': {
          'categories': {
            'limit': 3
          }
        }
      };
      console.log(analyzeParams.text);
      
      naturalLanguageUnderstanding.analyze(analyzeParams)
        .then(analysisResults => {
            analysisResults.concepts = analyzeParams.text;
            elements.push(analysisResults)
        })
        .catch(err => {
          console.log('error:', err);
        });
    });
    // setTimeout(function() {
    //     data = JSON.stringify(elements,null,2);
    //     fsPromises.appendFile("categories.json", data)
    //     .then(()=> console.log("success"))
    //     .catch(()=> console.log("failure"))
    // }, 5000);
    setTimeout(function() {
            //console.log(elements[0].categories[0].label)
            console.log('matched interests')
            userInterest = 'science';
            elements.forEach((concept)=>{
                let interest = concept.categories[0].label;
                if(interest === userInterest){
                    console.log( console.log(concept.concepts))
                };
                //console.log(concept.categories[0].label.slice(1) + "\/")
                interest = concept.categories[0].label.slice(1) + "\/";
                num = interest.search('\/')
                interest =interest.slice(0,num);
                console.log(interest)
            });
        }, 5000);
})
.catch((err)=> console.log("error:",err))





// readJson('data.json', (queryResults,callback)=>{
//     elements = [];
//     queryResults.forEach(element=>{
//     const analyzeParams = {
//         'text':'I am interested in ' + element,
//         'features': {
//           'categories': {
//             'limit': 3
//           }
//         }
//       };

//       console.log(analyzeParams.text);
      
//       naturalLanguageUnderstanding.analyze(analyzeParams)
//         .then(analysisResults => {
//             elements.push(analysisResults)
//             //let data = analyzeParams.text + "\n" + JSON.stringify(analysisResults, null, 2);
//         })
//         .catch(err => {
//           console.log('error:', err);
//         });
//     });
// });









