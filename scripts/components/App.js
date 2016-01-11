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

import FMUI from 'formsy-material-ui';
const {FormsyText} = FMUI;

import LeftNav from 'material-ui/lib/left-nav';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Divider from 'material-ui/lib/divider';


import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Colors from 'material-ui/lib/styles/colors';
import FlatButton from 'material-ui/lib/flat-button';
import Dialog from 'material-ui/lib/dialog';
import TextField from 'material-ui/lib/text-field';

import Immutable from 'immutable'

//import injectTapEventPlugin from 'react-tap-event-plugin';
//injectTapEventPlugin();

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
      apicCookie: null,
      addTenant: false,
      leftNav: false,
    };
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
    this.setState({
      leftNav: !this.state.leftNav
    })
  }

  renderTenantDialog(){
    let standardActions = [
      <FlatButton label="Done" onTouchTap={ this._handleRequestClose } keyboardFocused={ true }
      />,
    ]

    return (
    <Dialog title={ `Tenant ${this.state.fvTenant.attributes.name}` } actions={ standardActions } open={ this.state.tenantDialogOpen }
    onRequestClose={ this._handleRequestClose }>
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

  showAddTenant(){

    this.setState({
      addTenant: true
    })
  }

  cancelAddTenant(){
    console.log('Closing Add Tenant')
    this.setState({
      addTenant: false
    })
  }

  renderAddTenant(){
    let standardActions = [
      <FlatButton label="Cancel" onTouchTap={ this.cancelAddTenant } />,
      <FlatButton label='Add Tenant' primary={ true } onTouchTap={ this.addTenant }
      keyboardFocused={ true } />
    ];

    return (
    <Dialog title="Add a new Tenant" actions={ standardActions } open={ this.state.addTenant }
    onRequestClose={ null }>
      Please give your new Tenant a name
      <br />
      <br />
      <Formsy.Form onValidSubmit={ this.addTenant }>
        <FormsyText required={ true } name="tenantName" hintText={ "Tenant Name" }
        ref="tenantName" style={ {  marginTop: 5,  width: 400} } />
      </Formsy.Form>
    </Dialog>
    )
  }

  addTenant(){
    this.setState({
      addTenant: false
    })
    let tenantName = this.refs.tenantName.getValue()
    this.pushConfiguration(
      `uni/tn-${tenantName}`, {
        fvTenant: {
          attributes: {
            name: this.refs.tenantName.getValue(),
            status: "created,modified"
          },
          children: [
            {
              fvCtx: {
                attributes: {
                  name: "default",
                  status: "created,modified"
                }
              }
            }
          ]
        }
      })
  }


  switchTenant(event){
    this.setTenant(event.target.textContent)
    this.setState({
      leftNav: !this.state.leftNav
    })
  }

  switchFabric(){
    this.context.history.pushState(null, "/")
  }


  toggleConfigHelper(){
    const newState = !this.state.miniConfigHelper
    this.setState({
      miniConfigHelper: newState
    })
    localStorage.setItem('miniConfigHelper', JSON.stringify(newState));
  }

  toggleLeftNav(open){
    this.setState({
      leftNav: open
    })
  }

  render(){

    const tenants = this.state.fvTenants.map((object) => {
      var tenant = object.fvTenant.attributes.name
      return (<MenuItem key={ tenant } onTouchTap={ this.switchTenant } tenant={ tenant }>
                { tenant }
              </MenuItem>)
    })

    var leftNav = (
    <LeftNav docked={ false } open={ this.state.leftNav } onRequestChange={ this.toggleLeftNav }>
      <MenuItem onTouchTap={ this.switchFabric } route="/">Switch Fabric</MenuItem>
      <Divider/>
      <MenuItem disabled={ true }>Options</MenuItem>
      <MenuItem onTouchTap={ this.toggleConfigHelper }>
        { this.state.miniConfigHelper ? 'Enable Config Helper' : 'Disable Config Helper' }
      </MenuItem>
      <Divider />
      <MenuItem disabled={ true }>Tools</MenuItem>
      <MenuItem>Dashboard</MenuItem>
      <MenuItem>Administration</MenuItem>
      <MenuItem>Underlay Management</MenuItem>
      <Divider />
      <MenuItem disabled={ true }>Tenants</MenuItem>
      <MenuItem onTouchTap={ this.showAddTenant }>+ Add Tenant</MenuItem>
      { tenants }
    </LeftNav>


    )


    /*esfmt-ignore-start*/
    return (
    <div style={{margin: 10}}>
      { this.renderTenantDialog() }
      { this.renderAddTenant() }

      {leftNav}

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
