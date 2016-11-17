# Reattiv.io

Reattiv.io is a modern, reactive, open source ACI GUI 

It's simple to use:

![Mini clip of main interface](readme/reattivio-intro.gif?raw=true "Reattiv.io main interface")

Has a drag-n-drop microsegmentation interface:

![Mini clip of dropping a match item in a microsegmentation bucket](readme/reattivio-useg.gif?raw=true "Reattiv.io drag-n-drop interface")

Can help you understand the ACI configuration, faults and Rest API

![Mini clip of configuration helper](readme/reattivio-ch.gif?raw=true "Reattiv.io configuration helper")


## How to install and run your own local version

As this is a client side application you need very little to host your own version:

- A web server (e.g. apache, nginx)

Expecting more? Not here! 

- Grab a copy of this repository (use Git to clone or download the .zip file) 

- Copy index.html and build/ folder to your chosen web servers root directory

If you don't have a webserver readily available, you can even deploy Reattiv.io using docker if you like, after cloning this
repo simply run the following commands on your docker host

```
docker build -t reattivio .
docker run -p 8000:8000 reattivio
```

## Developing

First ensure that NodeJS and the node package manager (npm) are installed in your environment

`node --version`

`npm --version`

Clone the repository and change to reattivio directory

`git clone https://github.com/datacenter/reattivio.git`  

`cd reattivio`

Install the required dependencies

`npm install -g gulp`

`npm install`

Launch the development server

`gulp`

Navigate to `http://127.0.0.1:8000`

## Building

The default gulp task does not produce production javascript.

To produce a production, minified version, run the following task

`npm run build`

## Current Implementation Status

- [x] Save and connect to multiple fabrics
- [x] Delete known fabric credentials
- [x] Warn user of bad credentials
- [x] Warn user of connection timeout
- [x] Resume connection after timeout 
- [x] Display Tenant health
- [x] Display Tenants, Applications, EPGs, BDs, VRFs 
- [x] Filter any list of objects
- [x] Display EPs on EPG hover 
- [x] Create Tenants, Applications, EPGs, BDs, VRFs
- [x] Toggle BD flooding status
- [x] Toggle Vrf flooding status
- [x] Relate BD to VRF
- [x] Relate EPG to BD
- [x] Drag-n-drop microsegmentation
- [x] Create EPG path binding
- [x] Create EPG VMM binding
- [x] Display POST dn and data
- [x] Listen and display faults after config change
- [x] Rollback object attribute changes 
- [x] Disable "Configuration Helper" 
- [ ] Delete objects
- [ ] Create EPG node binding
- [ ] Create EPG phys binding
- [ ] View EPG bindings
- [ ] Contracts
- [ ] L4-7 Services
- [ ] Fabric Management
- [ ] Administration

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

