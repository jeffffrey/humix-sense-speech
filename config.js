module.exports = {
  lang: 'en', // 'en', 'cht' or 'chs'
  'stt-engine': 'google', // 'watson' or 'google',
  'tts-engine': 'watson', // 'watson' or 'itri' or 'iflytek'
  stt: {
    watson: {
      username: '',
      passwd: ''
    },
    google: {
      googleCredentialFile: '',//the location of your google auth credential file.
      googleProjectName: '',//the project name which create your credential file. 
      googleLan:'en-US',// en-Us or cmn-Hant-TW
    }
  },
  tts: {
    watson: {
      username: '',
      passwd:'' 
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
