# Reattiv.io

Reattiv.io is a modern, reactive, open source ACI GUI 

It's simple to use:

![Mini clip of main interface](readme/reattivio-intro.gif?raw=true "Reattiv.io main interface")

Has a drag-n-drop microsegmentation interface:

![Mini clip of dropping a match item in a microsegmentation bucket](readme/reattivio-useg.gif?raw=true "Reattiv.io drag-n-drop interface")

Can help you understand the ACI configuration, faults and Rest API

![Mini clip of configuration helper](readme/reattivio-ch.gif?raw=true "Reattiv.io configuration helper")

A hosted version of Reattiv.io can be found at [reattivio.cisco.com](http://reattivio.cisco.com/)

## How to install and run your own local version

Copy index.html and build/ folder to a front end webserver (apache2, nginx)

## Developing

First ensure that NodeJS and the node package manager (npm) are installed in your environment

`node --version`

`npm --version`

Clone the repository and change to repo directory

`git clone http://gitlab.cisco.com/tigarner/reattivio.git`  

`cd reattivio`

Install the required dependencies

`npm install`

Launch the development server

`gulp`

Navigate to `http://127.0.0.1:8000`

## Building

The default gulp task does not produce production javascript.

To produce a production, minified version, run the following task

`npm build`


## License

Copyright 2016 Cisco Systems, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

