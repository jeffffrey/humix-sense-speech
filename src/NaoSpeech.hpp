/*******************************************************************************
* Copyright (c) 2015,2016 IBM Corp.
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

#ifndef SRC_NAOSPEECH_HPP_
#define SRC_NAOSPEECH_HPP_

#include "nan.h"
#include <alproxies/altexttospeechproxy.h>

class NaoSpeech {
public:
    static void sSay(const char* str);
    static void sInitNaoSpeech(const v8::FunctionCallbackInfo<v8::Value>& info);

private:
    static AL::ALTextToSpeechProxy* sSpeechProxy;
    static uv_mutex_t sAlSpeechQueueMutex;
};


#endif /* SRC_NAOSPEECH_HPP_ */
