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
