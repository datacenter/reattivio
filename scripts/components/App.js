/*
  App
*/
import React from 'react';
import Tenant from './Tenant';
import ConfigurationHelper from './ConfigurationHelper';
import Catalyst from 'react-catalyst';
import reactMixin from 'react-mixin';
import autobind from 'autobind-decorator';
import $ from 'jquery';
import FontIcon from 'material-ui/lib/font-icon';
import { History } from 'react-router';


// Firebase
//import Rebase from 're-base';
//var base = Rebase.createClass('https://catch-of-the-day-tim.firebaseio.com/');

import AppBar from 'material-ui/lib/app-bar'
import Paper from 'material-ui/lib/paper';


import LeftNav from 'material-ui/lib/left-nav';
import MenuItem from 'material-ui/lib/menu/menu-item';
import Divider from 'material-ui/lib/menus/menu-divider';


import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Colors from 'material-ui/lib/styles/colors';
const FlatButton = require('material-ui/lib/flat-button');
const Dialog = require('material-ui/lib/dialog');

import Immutable from 'immutable'

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

@
autobind
class App extends React.Component {

  constructor(){
    super();

    const tenant = {
      attributes: {
        name: "common"
      },
      children: []
    };
    this.state = {
      serverTimeZoneOffset: 0,
      ws: {},
      muiTheme: ThemeManager.getMuiTheme(LightRawTheme),
      tenantDialogOpen: false,
      showTenantHeader: true,
      fvTenant: tenant,
      fvTenants: [],
      configStack: [],
      miniConfigHelper: false,
      fabric: {},
      baseURL: '',
      refreshJobId: null,
      apicCookie: null
    };

    this.handleAppBarClick = this.handleAppBarClick.bind(this);
  }

  componentWillMount(){

    let newMuiTheme = ThemeManager.modifyRawThemePalette(this.state.muiTheme, {
      accent1Color: Colors.lightBlue700,
      primary1Color: Colors.blueGrey400
    });


    this.setState({
      muiTheme: newMuiTheme,
    });

    let fabrics = JSON.parse(localStorage.getItem('fabrics'))
    let fabric = fabrics[ this.props.params.fabricId ];
    let baseURL = `https://${fabric.address}/api`

    if(!fabric) {
      this.context.history.pushState(null, '/');
      return
    }

    this.setState({
      fabric: fabric,
      baseURL: baseURL
    });


    let miniConfigHelper = JSON.parse(localStorage.getItem('miniConfigHelper'))
    if(miniConfigHelper == null) {
      miniConfigHelper = false
      localStorage.setItem('miniConfigHelper', JSON.stringify(miniConfigHelper));
    }
    this.setState({
      miniConfigHelper
    })
  }

  getChildContext(){
    return {
      muiTheme: this.state.muiTheme,
      pushConfiguration: this.pushConfiguration,
      fabric: this.state.fabric
    };
  }

  pushConfiguration(dn, data){
    var cs = this.state.configStack
    cs.push([
      dn,
      data
    ])
    this.setState({
      configStack: cs
    })
  }
  finishedConfiguration(){
    this.setState({
      configStack: []
    })
    // Unfortunately because Websocket.subscribe will not recurse the 
    // configuration tree only top level modifications to the fvTenant object
    // fire off an event. Ideally the APIC API would send a delta with the 
    // required tree structure to merge the server side changes into our 
    // client side representation of the fvTenant object.
    //
    // For now we will just refresh the entire fvTenant object
    this.setTenant()
  }

  /*esfmt-ignore-start*/
  updateACIObject(object){
    object = object.imdata[ 0 ]
    var key = Object.keys(object)[ 0 ]
    var object = object[ key ]
    var currentState = Immutable.fromJS(this.state[ key ])
    var newState = Immutable.fromJS(object)


    var mergedState = currentState.mergeDeep(newState)

    this.setState({
      [key]: mergedState.toJS()
    })
  }

  setACIObject(object) {
    object = object.imdata[0]
    var key = Object.keys(object)[0]
    var object = object[key]
    console.log(key, object)
    this.setState({
      [key]: object
    })
  }

  setACIClass(objects) {
    objects = objects.imdata
    var key = Object.keys(objects[0])[0];
    this.setState({
      [`${key}s`]: objects
    })
  }
  /*esfmt-ignore-end*/

  receiveWSEvent(event){
    var object = JSON.parse(event.data)
    console.log(object)
    this.updateACIObject(object)
  }

  refreshAAAToken(){
    $.ajax({
      url: `${this.state.baseURL}/aaaRefresh.json`,
      type: "GET",
      success: response => {
        this.setState({
          apicCookie: response.imdata[ 0 ].aaaLogin.attributes.token
        });
      }
    })
  }

  apiSuccess(aaaLogin){

    // Refresh AAA token every minute
    this.state.refreshJobId ? clearInterval(this.state.refreshJobID) : null
    let refreshJobId = setInterval(this.refreshAAAToken, 1000 * 60)
    this.setState({
      refreshJobId
    })

    console.log(aaaLogin);
    var token = aaaLogin.imdata[ 0 ].aaaLogin.attributes.token
    this.setState({
      apicCookie: token
    });

    this.state.ws = new WebSocket(`wss://${this.state.fabric.address}/socket${token}`);
    var ws = this.state.ws;

    ws.onmessage = this.receiveWSEvent

    ws.onopen = () => {
      this.setTenant('common')
      $.ajax({
        url: `${this.state.baseURL}/node/class/fvTenant.json?subscription=yes&order-by=fvTenant.name`,
        type: "GET",
        dataType: "json",
        xhrFields: {
          withCredentials: true
        },
        success: this.setACIClass
      })
    }
    this.setState({
      ws: this.state.ws
    });


    $.ajax({
      url: `${this.state.baseURL}/mo/info.json`,
      type: "GET",
      dataType: "json",
      contentType: "text/plain",
      headers: {
        devcookie: this.state.apicCookie
      },
      success: info => this.setState({
          serverTimeZoneOffset: new Date(info.imdata[ 0 ].topInfo.attributes.currentTime).getTimezoneOffset()
        })
    })
  }

  setTenant(tenant){
    tenant = tenant || this.state.fvTenant.attributes.name
    $.ajax({
      url: `${this.state.baseURL}/api/mo/uni/tn-${tenant}.json?subscription=yes&query-target=self&rsp-subtree=full&rsp-prop-include=config-only&rsp-subtree-class=fvCtx,fvBD,fvAp`,
      type: "GET",
      dataType: "json",
      xhrFields: {
        withCredentials: true
      },
      success: this.setACIObject
    })
  }

  componentDidMount(){
    // If we maybe want to let people attach their 
    // Fabrics via Google login
    //
    //base.syncState(this.props.params.storeId + '/fishes', {
    //  context: this,
    //  state: 'fishes'
    //});


    var data = JSON.stringify({
      "aaaUser": {
        "attributes": {
          "name": this.state.fabric.username,
          "pwd": this.state.fabric.password
        }
      }
    });


    $.ajax({
      url: `${this.state.baseURL}/aaaLogin.json`,
      type: "POST",
      data: data,
      dataType: "json",
      success: this.apiSuccess,
    })
  }

  handleAppBarClick(event){
    this.refs.leftNav.toggle();
  }

  renderTenantDialog(){
    let standardActions = [
      {
        text: 'Done'
      },
    ];

    return (
    <Dialog title={ `Tenant ${this.state.fvTenant.attributes.name}` } actions={ standardActions } actionFocus="submit"
    open={ this.state.tenantDialogOpen } onRequestClose={ this._handleRequestClose }>
      { this.state.fvTenant.attributes.descr } </Dialog>
    )
  }


  _openTenantDialog(){
    this.setState({
      tenantDialogOpen: true
    })
  }
  _handleRequestClose(){
    this.setState({
      tenantDialogOpen: false
    })
  }

  onLeftNavChange(e, key, payload){
    if(payload.type == 'fvTenant') {
      this.setTenant(payload.text)
    } else if(payload.type == 'link') {
      this.context.history.pushState(null, payload.route);
    } else if(payload.type == 'toggleConfigHelper') {
      const newState = !this.state.miniConfigHelper
      this.setState({
        miniConfigHelper: newState
      })
      localStorage.setItem('miniConfigHelper', JSON.stringify(newState));
    }
  }


  render(){



    var menuItems = [
      {
        type: 'link',
        text: 'Switch Fabric',
        route: '/'
      },
      {
        type: MenuItem.Types.SUBHEADER,
        text: 'Tools'
      },
      {
        type: 'toggleConfigHelper',
        text: this.state.miniConfigHelper ? 'Enable Config Helper' : 'Disable Config Helper'
      },
      {
        type: 'link',
        text: 'Dashboard'
      },
      {
        type: 'link',
        text: 'Administration'
      },
      {
        type: 'link',
        text: 'Underlay Management'
      },
      {
        type: MenuItem.Types.SUBHEADER,
        text: 'Tenants'
      }
    ];

    this.state.fvTenants.map((object) => menuItems.push({
        type: 'fvTenant',
        text: object.fvTenant.attributes.name
      }))

    /*esfmt-ignore-start*/
    return (
    <div style={{margin: 10}}>
      { this.renderTenantDialog() }
      <LeftNav 
        ref="leftNav" 
        docked={ false } 
        menuItems={ menuItems }
        onChange={ this.onLeftNavChange } />

      <AppBar 
        title="Reattiv.io"
        onLeftIconButtonTouchTap={ this.handleAppBarClick } 
        onRightIconButtonTouchTap={ this._openTenantDialog }
        isInitiallyOpen={ true } 
        iconElementRight={ <FlatButton label={ this.state.fvTenant.attributes.name } onClick={ this._openTenantDialog } /> } />

      <Tenant 
        tenant={ this.state.fvTenant } 
        showHeader={ true } fabric={this.state.fabric} />


      <ConfigurationHelper 
        configStack={ this.state.configStack } 
        finishedConfiguration={ this.finishedConfiguration }
        mini={ this.state.miniConfigHelper }
        serverTimeZoneOffset={this.state.serverTimeZoneOffset}
        fabric={this.state.fabric}
        setTenant={this.setTenant}
      />
    </div>
    )
    /*esfmt-ignore-end*/
  }
}

App.childContextTypes = {
  muiTheme: React.PropTypes.object,
  pushConfiguration: React.PropTypes.func,
  fabric: React.PropTypes.object
};


reactMixin.onClass(App, History);
export default App;
