# Reattiv.io

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
