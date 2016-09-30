// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var async = require('async');
var fs = require('fs');
var config = require ("../config.js");
var path = require('path');
var grpc = require('grpc');
var googleProtoFiles = require('google-proto-files');
var googleAuth = require('google-auto-auth');
var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 
var Transform = require('stream').Transform;
var process=require("process");
// [START proto]

var PROTO_ROOT_DIR = googleProtoFiles('..');
var the_stream = new Transform({
  objectMode: true,
   transform:function(chunk,enc,cb){
      var content = {
        audioContent: chunk
      }
      this.push(content);
      cb();
        
    }
});

var protoDescriptor = grpc.load({
  root: PROTO_ROOT_DIR,
  file: path.relative(PROTO_ROOT_DIR, googleProtoFiles.speech.v1beta1)
}, 'proto', {
  binaryAsBase64: true,
  convertFieldsToCamelCase: true
});
var speechProto = protoDescriptor.google.cloud.speech.v1beta1;
// [END proto]

// [START authenticating]
function getSpeechService (host, callback) {
  var googleAuthClient = googleAuth({
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform'
    ]
  });

  googleAuthClient.getAuthClient(function (err, authClient) {
    if (err) {
      return callback(err);
    }

    var credentials = grpc.credentials.combineChannelCredentials(
      grpc.credentials.createSsl(),
      grpc.credentials.createFromGoogleCredential(authClient)
    );

    console.log('Loading speech service...');
    var stub = new speechProto.Speech(host, credentials);
    return callback(null, stub);
  });
}
// [END authenticating]

exports.startSession=function (username,passwd,model,callback) {
  if(model instanceof Function){
	callback = model;
}  
  //var rStream;
  process.env.GOOGLE_APPLICATION_CREDENTIALS = config.stt.google.googleCredentialFile;
  process.env.GCLOUD_PROJECT = config.stt.google.googleProjectName;
  waterFall(callback);
    
    console.log('the stream is '+the_stream);
    return the_stream;
  


}
function waterFall (callback)
{

 async.waterfall([
    function (cb) {
      getSpeechService('speech.googleapis.com', cb);
    }],
    // [START send_request]
    function sendRequest (err,speechService) {
      console.log('Analyzing speech...');
      var responses = [];
      var call = speechService.streamingRecognize();
      the_stream.pipe(call);
      console.log('start to sent to google');
      //event.emit('connect',call);
      // Listen for various responses
      //call.on('error', cb);
      call.on('data', function (recognizeResponse) {

        console.log('google recive data');
        if (recognizeResponse) {
          responses.push(recognizeResponse);
          if (recognizeResponse.results && recognizeResponse.results.length) {
            console.log(JSON.stringify(recognizeResponse.results, null, 2));
             callback(recognizeResponse.results[0].alternatives[0].transcript);
          }
        }
      });
      call.on('end', function () {
      console.log('服務終止  重新連線');
      the_stream.unpipe(call);
      waterFall(callback);
      });
      call.on('error',function(data){
       console.log('err catch ' + data );
      the_stream.unpipe(call);
      waterFall(callback);

      });


      // Write the initial recognize reqeust
      call.write({
        streamingConfig: {
          config: {
            encoding: 'LINEAR16',
            sampleRate: 16000,
            languageCode: config.stt.google.googleLan
          },
          interimResults: false,
          singleUtterance: false
        }
      });

    

    }
    );


}



    
//     var speech_to_text = watson.speech_to_text({
//       'username': "4aeb4b5e-538f-4b37-9121-fefd04ea4948",
//       'password': "JzGfsfH2UYGc",
//       version: 'v1',
//       url: 'https://stream.watsonplatform.net/speech-to-text/api'
//   });

//     var rev = speech_to_text.createRecognizeStream({
//       'content_type': 'audio/l16;rate=16000',
//     //{   'content_type': 'audio/flac;rate=16000',
//       'interim_results': true,
//       'continuous': true,
//       'inactivity_timeout': -1,
//       'model': model
//   });

//     rev.on('results', function(data) {
//       var index = data.results.length ? data.results.length - 1 : 0;
//       if (data.results[index] && data.results[index].final
//         && data.results[index].alternatives && callback) {
//         callback(data.results[index].alternatives[0].transcript);
//         console.log(data.results[index].alternatives[0].transcript);
//     }
//   });

//     rev.on('connection-close', function(code, description) {
//       console.info('Watson STT WS connection-closed,', code, description);
//   });

//     rev.on('connect', function(conn) {
//       console.info('Watson STT WS connected');
//   });

//     return rev;
// }
