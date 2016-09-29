/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
/*eslint-env node */
'use strict';

var sys = require('util');
var nats = require('nats').connect();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var soap = require('soap');
var crypto = require('crypto');
var net = require('net');
var fs = require('fs');
var Buffer = require('buffer').Buffer;
var path = require('path');
var watson = require('watson-developer-cloud');
//var Sound   = require('node-aplay'); 
var HumixSense = require('humix-sense');
var log = require('humix-logger').createLogger('humix-dialog-module', {
  consoleLevel : 'debug'
});

var HumixSpeech = require('./lib/HumixSpeech').HumixSpeech;
var config = require('./config');

var voice_path = path.join(__dirname, 'voice');
var url = 'http://tts.itri.org.tw/TTSService/Soap_1_3.php?wsdl';
var kGoogle = 0;
var kWatson = 1;

var OpenCC = require('opencc');
var opencc = new OpenCC('s2t.json');

var engineIndex = {
  'google' : kGoogle,
  'watson' : kWatson
};

var ttsWatson;
var retry = 0;

//iflytec flag
var TTS_busy = false;

if (config['tts-engine'] === 'watson') {
  ttsWatson = watson.text_to_speech({
    username : config.tts.watson.username,
    password : config.tts.watson.passwd,
    version : 'v1',
  });
}

var moduleConfig = {
  moduleName : 'humix-dialog',
  commands : [ 'say' ],
  events : [ 'speech' ],
  debug : true
}

var humix = new HumixSense(moduleConfig);
var hsm;

humix.on('connection', function(humixSensorModule) {

  hsm = humixSensorModule;
  log.debug('Communication with humix-sense is now ready.');
  hsm.on('say', function(data) {
    log.debug('data:', data);
    text2Speech(data);
  }); // end of say command
});

/* 
 * Speech To Text Processing
 */

//start HumixSpeech here
var hs;
var commandRE = /---="(.*)"=---/;

/**
 * callback function that is called when
 * HumixSpeech detect a valid command/sentence
 * @param cmdstr a command/sentence in this format:
 *         '----="command string"=---'
 */
function receiveCommand(cmdstr) {
  cmdstr = cmdstr.trim();
  if (config['stt-engine']) {
    log.debug('command found:', cmdstr);

    if (hsm) {
      if (config.lang == 'cht')
        hsm.event('speech', opencc.convertSync(cmdstr));
      else
        hsm.event('speech', cmdstr)
    }
  } else {
    log.debug('No stt engine configured. Skip');
  }
}

try {
  var defaultOpts = {
    vad_threshold: '3.5',
    upperf: '1000',
    hmm: './deps/pocketsphinx-5prealpha/model/en-us/en-us',
    //http://www.speech.cs.cmu.edu/tools/lmtool.html use this website
    //to generate lm and dict file based on your keyword-name
    lm: './lm/humix.lm',
    dict: './lm/humix.dic',
    'keyword-name': 'HUMIX', //all capital characters
    samprate: '16000',
    maxwpf: '5',
    topn: '2',
    maxhmmpf: '3000',
    pl_window: '7',
    ds: '2',
    cmdproc: './util/processcmd.sh',
    lang: 'zh-tw',
    'wav-proc': './voice/interlude/beep2.wav',
    'wav-bye': './voice/interlude/beep1.wav',
    logfn: '/dev/null'
  };
  var options = config.options || {};
  for(var option in options) {
    defaultOpts[option] = options[option];
  }
  hs = new HumixSpeech(defaultOpts);
  var engine = config['stt-engine'] || 'watson';
  hs.engine(config.stt[engine].username, config.stt[engine].passwd,
      engineIndex[engine], require('./lib/' + engine).startSession);
  hs.start(receiveCommand);
} catch (error) {
  console.log('catch this error');
  log.error(error);
}

/* 
 * Text To Speech Processing
 */
function text2Speech(msg) {
  log.debug('Received a message:', msg);
  var text
  var wav_file = '';
  try {
    text = JSON.parse(msg).text;
  } catch (e) {
    log.error('invalid JSON format,', e);
    return;
  }

  if (!text) {
    return log.error('Missing property: msg.text');
  }

  //for safe
  text = text.trim();

  var person = 'xiaoyan'
  if (config['tts-engine'] === 'iflytek') {
    try {
      person = JSON.parse(msg).person;
    } catch (e) {
      person = 'xiaoyan';
    }
    IflytekTTS(text, person);
    return;
  }

  var hash = crypto.createHash('md5').update(text).digest('hex');
  var filename = path.join(voice_path, 'text', hash + '.wav');

  if (fs.existsSync(filename)) {
    log.debug('Wav file exist. Play cached file:', filename);
    sendAplay2HumixSpeech(filename);
  } else {
    log.debug('Wav file does not exist');
    var ttsEngine = config['tts-engine'];

    log.debug('tts-engine:', engine);
    if (ttsEngine === 'itri') {
      log.debug('username :', config.tts.itri.username);
      ItriTTS(text, function(err, id) {
        if (err) {
          log.error('failed to download wav from ITRI. Error:', err);
        } else {
          retry = 0;
          setTimeout(ItriDownload, 1000, id, filename);
        }
      });
    } else if (ttsEngine === 'watson') {
      WatsonTTS(text, filename);
    }
  }
}

/**
 * call the underlying HumixSpeech to play wave file
 * @param file wave file
 */
function sendAplay2HumixSpeech(file) {
  if (hs) {
    hs.play(file);
  }
}

/* 
 * Watson TTS Processing
 */
function WatsonTTS(text, filename) {
  console.log('enter the TTS and the text is : ' + text);
  ttsWatson.synthesize({
    text : text,
    accept : 'audio/wav'
  }, function(err) {
    if (err) {
      log.error('error:', err);
      return;
    }
    fs.writeFileSync(filename, new Buffer(arguments[1]));
    sendAplay2HumixSpeech(filename);
  });
}

/* 
 * Iflytek TTS Processing
 */
function IflytekTTS(text, person) {
  if (!TTS_busy) {
    TTS_busy = true;
    var execFile = './tts';
    var spawn = require('child_process').spawn;
    var free = spawn(execFile, [ text, 'tts.wav', person ]);
    free.stdout.on('data', function(data) {
      log.debug('out', data);
    });
    free.stderr.on('data', function(data) {
      log.debug('err', data);
    });
    free.on('exit', function(code, signal) {
      TTS_busy = false;
      log.debug('exit', code);
    });
  } else {
    log.error('TTS is Busy!');
  }
}

/* 
 * ITRI TTS Processing
 */
function ItriTTS(text, callback) {
  var args = {
    accountID : config.tts.itri.username,
    password : config.tts.itri.passwd,
    TTStext : text,
    TTSSpeaker : config.tts.itri.speaker,
    volume : 50,
    speed : -2,
    outType : 'wav'
  };
  soap.createClient(url, function(err, client) {
    client.ConvertText(args, function(err, result) {
      if (err) {
        log.error('err:', err);
        callback(err, null);
      }
      try {
        var id = result.Result.$value.split('&')[2];
        if (id) {
          log.debug('get id:', id);
          callback(null, id);
        } else {
          throw 'failed to convert text!';
        }
      } catch (e) {
        log.error(error);
        callback(error, null);
      }
    });
  });
}

function ItriGetConvertStatus(id, filename, callback) {
  var args = {
    //accountIDhasOwnProperty: config.tts.itri.username,
    accountID : config.tts.itri.username,
    password : config.tts.itri.passwd,
    convertID : id
  };
  soap.createClient(url, function(err, client) {
    log.debug('msg_id', id);
    client.GetConvertStatus(args, function(err, result) {
      if (err) {
        log.error('err:', err);
        callback(err, null);
      }
      var downloadUrl = result.Result.$value.split('&')[4];
      if (downloadUrl) {

        log.debug(id, downloadUrl);
        execSync('wget ' + downloadUrl + ' -O ' + filename, {
          stdio : [ 'ignore', 'ignore', 'ignore' ]
        });
        callback(null, filename);
      } else {
        var error = 'Still converting! result: ' + JSON.stringify(result);
        log.error(error);
        callback(error, null);
      }
    });
  });
}

function ItriDownload(id, filename) {
  retry++;
  ItriGetConvertStatus(id, filename, function(err) {
    if (err) {
      log.error('err:', err);
      if (retry < 10) {
        log.debug('retry', retry);
        setTimeout(ItriDownload, 2000, id, filename);
      }
    } else {
      log.debug('Play wav file:', filename);
      sendAplay2HumixSpeech(filename);
    }
  });
}

/* 
 * Signal Handling
 */

process.stdin.resume();
function cleanup() {
  if (hs) {
    hs.stop();
  }
}
process.on('SIGINT', function() {
console.log('prcess interupt');  
//cleanup();
//process.exit(1);
process.abort()
//  process.exit(0);
});
process.on('SIGHUP', function() {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', function() {
  cleanup();
  process.exit(0);
});
process.on('exit', function() {
  cleanup();
});
process.on('error', function() {
  cleanup();
});

process.on('uncaughtException', function(err) {
  if (err.toString().indexOf('connect ECONNREFUSED')) {
    //log.error('exception,', JSON.stringify(err));
    //cleanup();
    //process.exit(0);
  }
});
