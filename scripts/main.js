import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route } from 'react-router';
import { createHashHistory } from 'history';

import NotFound from './components/NotFound';
import FabricPicker from './components/FabricPicker';
import App from './components/App';

/*
  Routes
*/

var routes = (
<Router history={ createHashHistory() }>
  <Route path="/" component={ FabricPicker } />
  <Route path="/fabric/:fabricId" component={ App } />
  <Route path="*" component={ NotFound } />
</Router>
)

ReactDOM.render(routes, document.querySelector('#main'));
