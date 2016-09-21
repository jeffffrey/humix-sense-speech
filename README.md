# humix-sense-speech
speech-to-text and text-to-speech enabling project for Humix

# dependencies:
- nodejs >= 4.2
- gcc >= 4.8  
  instructions could be found here https://somewideopenspace.wordpress.com/2014/02/28/gcc-4-8-on-raspberry-pi-wheezy/
- packages
    - sudo apt-get install bison
    - sudo apt-get install libasound2-dev
    - sudo apt-get install swig
    - sudo apt-get install python-dev
    - sudo apt-get install mplayer
    - sudo apt-get install flac
    - sudo apt-get install libsndfile1-dev
    - sudo apt-get install libflac++-dev

- nodes modules:
    - npm install nats soap

- [natsd](https://github.com/nats-io/gnatsd)

# Run the application
Make sure **gnatsd** server is running and you are on the project's root folder. Then issue the following command:
```
    node .
```

# Configuration
```(javascript)
module.exports = {

  //settings inside options here are optional
  //you may need these settings to fine tune the underlying poketphinx
  options : {
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
    'wav-proc': './voice/interlude/beep2.wav',
    'wav-bye': './voice/interlude/beep1.wav',
  },

  //language setting for stt/tts engine
  lang: 'en', // 'en', 'cht' or 'chs'
  //specify the stt-engine, then use the corresponding credential bellow
  'stt-engine': 'watson', // 'watson' or 'google',
  //specify the tts-engine, then use the corresponding credential bellow
  'tts-engine': 'watson', // 'watson' or 'itri' or 'iflytek'

  //credential of different stt-engines
  stt: {
    watson: {
      username: '<your_username>',
      passwd: '<your_password>'
    },
    google: {
      username: 'xxxxx',
      passwd: '<replace as your appid>'
    }
  },
  
  //credential of different tts-engines
  tts: {
    watson: {
      username: '<your_username>',
      passwd: '<your_password>'
    },
    iflytek: {
      appid: '<app_id>'
    },
    itri: {
      username: '<your_username>',
      passwd: '<your_password>',
      speaker: 'Bruce',
    }
  }
};
```

### STT & TTS credentials
At least, you have to specify which tts-engine and stt-engine you want to use and the corresponding credential for the stt/tts engine that you use. For watson tts/stt service, please see detail information [here](https://github.com/project-humix/humix-sense#config-stt--tts-credentials)

### Keyword
By default, 'humix' is the keyword to trigger the dialog module to process the speech data. 
If you want to change the 'humix' keyword, go to [lm online tool](http://www.speech.cs.cmu.edu/tools/lmtool-new.html)
and upload a text file which contains your own keyword. Then download the `*.lm` and `*.dic`. And modify the following
settings in `config.js` to point to these 2 files for your own keyword.
```
    lm: './lm/humix.lm',
    dict: './lm/humix.dic',
```
And change the following setting as well:
```
    'keyword-name': 'HUMIX', //all capital characters
```


