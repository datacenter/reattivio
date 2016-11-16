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
import cookie from 'cookie'
import FontIcon from 'material-ui/lib/font-icon';
import { History } from 'react-router';

import AppBar from 'material-ui/lib/app-bar'
import Paper from 'material-ui/lib/paper';

import FMUI from 'formsy-material-ui';
const {FormsyText} = FMUI;

import LeftNav from 'material-ui/lib/left-nav';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Divider from 'material-ui/lib/divider';

import Snackbar from 'material-ui/lib/snackbar';

import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Colors from 'material-ui/lib/styles/colors';
import FlatButton from 'material-ui/lib/flat-button';
import Dialog from 'material-ui/lib/dialog';
import TextField from 'material-ui/lib/text-field';

import Immutable from 'immutable'

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

@autobind
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
      addTenant: false,
      leftNav: false,
      badCredentials: false,
      refreshingCredentials: false,
      timeout: false,
      app: false
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

    // If we encounter the app center cookie instantly redirect
    var cookies = cookie.parse(document.cookie || '')
    if (cookies.app_Cisco_Reattivio_token){
      console.log('Reattivio running in App Center mode')

      let fabric = {
        protocol: window.location.protocol == 'http:' ? 'http' : 'https',
        address: window.location.hostname,
        username: null,
        password: null,
      }

      let baseURL = `${fabric.protocol}://${fabric.address}/api`
      this.setState({
        fabric: fabric,
        baseURL: baseURL,
        app: cookies.app_Cisco_Reattivio_token
      });

    }

    // Otherwise, continue normal auth route
    else {

      let fabrics = JSON.parse(localStorage.getItem('fabrics'))
      let fabric = fabrics[ this.props.params.fabricId ];
      fabric.protocol = fabric.protocol || "http"
      let baseURL = `${fabric.protocol}://${fabric.address}/api`

      if(!fabric) {
        this.context.history.pushState(null, '/');
        return
      }

      this.setState({
        fabric: fabric,
        baseURL: baseURL
      });

    }

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
    console.log('Updating state key=', key, 'object=', object)
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
      success: result => {
        var token = result.imdata[ 0 ].aaaLogin.attributes.token
        $.ajaxSetup(Object.assign(this.defaultAjaxProps, {
          headers: {
            devcookie: token
          }
        })
        )

        this.setState({
          badCredentials: false,
          refreshingCredentials: false,
          timeout: false,
        })
      }
    })
  }

  apiSuccess(result){

    var token = result

    var wsProtcol = this.state.fabric.protocol == 'https' ? 'wss' : 'ws'

    this.state.ws = new WebSocket(`${wsProtcol}://${this.state.fabric.address}/socket${token}`);
    var ws = this.state.ws;

    ws.onmessage = this.receiveWSEvent

    ws.onopen = () => {
      this.setTenant('common')
      $.ajax({
        url: `${this.state.baseURL}/node/class/fvTenant.json?subscription=yes&order-by=fvTenant.name`,
        type: "GET",
        dataType: "json",
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
      success: this.setACIObject
    })
  }

  ajaxError(error){
    if(error.statusText == "timeout" || error.statusText == "error") {
      this.setState({
        timeout: true,
        configStack: []
      })
      // Refresh AAA token every minute
      if(!this.state.refreshJobId) {
        let refreshJobId = setInterval(this.refreshAAAToken, 1000 * 30)
        this.setState({
          refreshJobId
        })
      }
    }
  }

  tryAuth(callback){


    // If we're in app mode, return existing token
    if (this.state.app){
        if(callback)callback(this.state.app)
        return
    }

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
      headers: {},
      type: "POST",
      data: data,
      dataType: "json",
      success: (result) => {
        // Refresh AAA token every minute
        if(!this.state.refreshJobId) {
          let refreshJobId = setInterval(this.refreshAAAToken, 1000 * 30)
          this.setState({
            refreshJobId
          })
        }

        // Check login
        result = result.imdata[ 0 ]
        if(result.error) {
          this.setState({
            badCredentials: true
          })
          console.log('Could not auth')
          return

        } else {
          var token = result.aaaLogin.attributes.token
          $.ajaxSetup(Object.assign(this.defaultAjaxProps, {
            headers: {
              devcookie: token
            }
          })
          )

          this.setState({
            badCredentials: false,
            refreshingCredentials: false,
            timeout: false,
          })

          if(callback)callback(result.aaaLogin.attributes.token)
        }
      },
    })
  }

  statusCodeHandlers ={
        400: (result) => {
          console.log(result)
        },
        403: (result) => {
          // We need to reauth if the token has timed out
          this.setState({refreshingCredentials: true})
          this.setState({configStack: []})
          this.tryAuth()
        }
  };

  defaultAjaxProps = {
    statusCode: this.statusCodeHandlers,
    timeout: 5000,
    error: this.ajaxError,
    headers: {}
  };

  componentWillUnmount(){
    if(this.state.refreshJobId) {
      clearInterval(this.state.refreshJobId)
    }
  }

  componentDidMount(){
    $.ajaxSetup(this.defaultAjaxProps)

    this.tryAuth(this.apiSuccess)
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


      <Snackbar
        open={this.state.badCredentials}
        message="Dang, looks like you are disconnected from the fabric due to bad credentials"
        action="Switch Fabric"
        autoHideDuration={0}
        onActionTouchTap={this.switchFabric}
        onRequestClose={()=> {return}}
      />

      <Snackbar
        open={this.state.refreshingCredentials}
        message="Huh, that last request was refused. Hold on, I'll fresh your credentials"
        action="Switch Fabric"
        autoHideDuration={5000}
        onActionTouchTap={this.switchFabric}
        onRequestClose={() => {
          this.setState({refreshingCredentials: false})
          }
        }
      />

      <Snackbar
        open={this.state.timeout}
        message="Connection timeout. Retrying in under 30 seconds... Fix on the front page"
        action="Switch Fabric"
        autoHideDuration={0}
        onActionTouchTap={this.switchFabric}
        onRequestClose={() => {
          this.setState({timeout: false})
          }
        }
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
