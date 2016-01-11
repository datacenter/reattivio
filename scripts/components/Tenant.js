/*
  Tenant
*/

import React from 'react';
import autobind from 'autobind-decorator';
import $ from 'jquery';
import scrollto from 'jquery.scrollto';
import Paper from 'material-ui/lib/paper';
import BridgeDomains from './networking/BridgeDomains';
import PrivateNetworks from './networking/PrivateNetworks';
import Applications from './Applications';
import USegEpg from './epg/USegEpg';
import EpgConnections from './epg/Epgs';

import Card from 'material-ui/lib/card/card';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardTitle from 'material-ui/lib/card/card-title';
import CardText from 'material-ui/lib/card/card-text';

import Badge from 'material-ui/lib/badge';

import List from 'material-ui/lib/lists/list';
import Divider from 'material-ui/lib/divider';
import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';
import Colors from 'material-ui/lib/styles/colors';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import helpers from '../helpers';



@autobind
class Tenant extends React.Component {

  constructor(){
    super();
    this.state = {
      newUSegEpg: false,
      selectedVrf: '',
      selectedBd: '',
      selectedEpg: '',
      selectedAp: '',
      selectEpgConnections: false,
      showBDDetail: false,
      headerImageSrc: '',
      tenantHealth: 100,
      hideHeader: false
    };
  }

  updateHealthScore(result){
    result = result.imdata[ 0 ]
    var tenantHealth = result.fvTenant.children[ 0 ].healthInst.attributes.cur
    console.log('Tenant has health score of', tenantHealth)
    this.setState({
      tenantHealth
    })
  }

  getHealthScore(tenant){
    $.ajax({
      url: `https://${this.props.fabric.address}/api/mo/uni/tn-${tenant}.json?query-target=self&rsp-subtree-include=health`,
      type: "GET",
      dataType: "json",
      xhrFields: {
        withCredentials: true
      },
      success: this.updateHealthScore
    })
  }

  componentWillReceiveProps(nextProps){
    let tenant = this.props.tenant.attributes.name
    let nextTenant = nextProps.tenant.attributes.name

    if(tenant != nextTenant) {
      setTimeout(this.getHealthScore.bind(this, nextTenant), 500)
      this.onSelectEpg('', '', '')
    }
  }

  componentWillMount(){
    var headerImageID = helpers.getRandomIntInclusive(1, 3)
    var headerImageSrc = `/build/media/header_${headerImageID}.jpg`
    this.setState({
      headerImageSrc
    })

    const hideHeader = JSON.parse(localStorage.getItem('hideHeader'))

    this.setState({
      hideHeader
    })
  }

  componentDidMount(){
    setTimeout(this.getHealthScore.bind(this, this.props.tenant.attributes.name), 500)
  }

  _createUSegEpg(application){
    this.setState({
      newUSegEpg: application
    });
    $(window).scrollTo(0, 700)
  }
  hideUSegEpgDialog(){
    this.setState({
      newUSegEpg: false
    });
  }
  onSelectEpgConnection(event){
    event.preventDefault()
    event.stopPropagation()
    this.setState({
      selectEpgConnections: true,
    });
    $(window).scrollTo(0, 700)
    return false
  }
  onSelectEpg(ap, epg, bd){
    if(epg == '') {
      var selectEpgConnections = false
    }

    this.setState({
      selectedAp: ap,
      selectedEpg: epg,
      selectedBd: bd,
      selectedVrf: '',
      selectEpgConnections: selectEpgConnections
    });
  }
  onSelectBD(bd, vrf){
    if(this.state.selectedEpg) {
      console.log('Relating EPG to BD')
      let appDn = `${this.props.tenant.attributes.dn}/ap-${this.state.selectedAp}`

      let data = {
        fvAEPg: {
          attributes: {
            name: this.state.selectedEpg
          },
          children: [
            {
              "fvRsBd": {
                "attributes": {
                  "tnFvBDName": bd
                }
              }
            }
          ]
        }
      };

      this.context.pushConfiguration(appDn, data)
      this.setState({
        selectedBd: bd
      })
    } else {
      console.log('Selecting BD')
      this.setState({
        selectedEpg: '',
        selectedBd: bd,
        selectedVrf: vrf,
      });
    }
  }
  onShowBDDetail(){
    this.setState({
      showBDDetail: !this.state.showBDDetail
    })
  }

  onSelectVrf(vrf){
    console.log(vrf)
    if(this.state.selectedBd) {
      console.log('Relating VRF to BD')
      var bdDn = `${this.props.tenant.attributes.dn}`

      var data = {
        "fvBD": {
          "attributes": {
            "name": this.state.selectedBd,
          },
          "children": [
            {
              "fvRsCtx": {
                "attributes": {
                  "tnFvCtxName": vrf
                }
              }
            }
          ]
        }
      };

      this.context.pushConfiguration(bdDn, data)

      this.setState({
        selectedVrf: vrf
      })

    } else {
      this.setState({
        selectedEpg: '',
        selectedBd: '',
        selectedVrf: vrf,
      });
    }
  }
  onSelectAp(ap){
    console.log(ap.props.label)
    this.setState({
      selectedEpg: '',
      selectedAp: ap.props.label,
    });
  }

  hideSelectEpgConnections(){
    this.setState({
      selectEpgConnections: false
    })
  }

  toggleHeader(){
    const newHeader = !this.state.hideHeader
    this.setState({
      hideHeader: newHeader
    })
    localStorage.setItem('hideHeader', JSON.stringify(newHeader));
  }

  renderUSegEpg(){
    if(this.state.newUSegEpg) {
      const ap = helpers.parseType(this.props.tenant.children, 'fvAp').filter(ap => ap.attributes.name == this.state.selectedAp)[ 0 ];
      const epg = helpers.parseType(ap.children, 'fvAEPg').filter(epg => epg.attributes.name == this.state.selectedEpg)[ 0 ];

      return (
      <div className="row">
        <div className="col-lg-12">
          <ReactCSSTransitionGroup transitionAppear={ true } transitionName="longer"
          transitionAppearTimeout={ 800 } transitionEnterTimeout={ 800 }
          transitionLeaveTimeout={ 500 }>
            <USegEpg onClose={ this.hideUSegEpgDialog } pushConfiguration={ this.context.pushConfiguration } selectedEpg={ this.state.selectedEpg }
            tenantDn={ this.props.tenant.attributes.dn } selectedAp={ this.state.selectedAp } fabric={ this.context.fabric }
            epg={ epg } />
          </ReactCSSTransitionGroup>
        </div>
      </div>
      )
    }
  }

  renderEpgConnections(){
    return (
    <div className="row">
      <div className="col-lg-12">
        <ReactCSSTransitionGroup transitionAppear={ true } transitionName="longer"
        transitionAppearTimeout={ 800 } transitionEnterTimeout={ 800 }
        transitionLeaveTimeout={ 500 }>
          { this.state.selectEpgConnections ? <EpgConnections key={ 0 } selectedEpg={ this.state.selectedEpg } close={ this.hideSelectEpgConnections }
                                              tenantDn={ this.props.tenant.attributes.dn } selectedAp={ this.state.selectedAp } /> : null }
        </ReactCSSTransitionGroup>
      </div>
    </div>
    )
  }

  render(){
    var application_objects = helpers.parseType(this.props.tenant.children, 'fvAp') || [];
    var bd_objects = helpers.parseType(this.props.tenant.children, 'fvBD');
    var privateNetorks = helpers.parseType(this.props.tenant.children, 'fvCtx');


    var title = (
    <div style={ {  display: 'inline'} }>
      <Badge badgeStyle={ {  width: 30,  height: 30,  backgroundColor: Colors.green500,  color: Colors.fullWhite} } style={ {  paddingLeft: 0} } badgeContent={ this.state.tenantHealth }>
        { `Tenant ${this.props.tenant.attributes.name}` }
      </Badge>
    </div>
    )

    var subtitle = (
    <div style={ {  display: 'inline'} }>
      "Everything looks healthy right now"
      <div style={ {  float: "right",  display: 'inline'} }>
        { `Currently Selected: ${this.state.selectedEpg}` }
      </div>
    </div>
    )

    var cardTitle = <CardTitle title={ title } subtitle={ subtitle } />

    return (

    <div className="row" style={ {  marginTop: 10} }>
      <div className="col-lg-12 ">
        { this.renderUSegEpg() }
        { this.renderEpgConnections() }
        <div className="row" style={ {  marginTop: 10} }>
          <div className="col-lg-8 col-md-8">
            <div className="row">
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <Card>
                  <CardMedia onClick={ this.toggleHeader } style={ this.state.hideHeader ? {
                                                                     maxHeight: 120
                                                                   } : {} } overlay={ cardTitle }>
                    <img style={ {  minHeight: 400} } src={ this.state.headerImageSrc } />
                  </CardMedia>
                </Card>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <Applications applications={ application_objects } _createUSegEpg={ this._createUSegEpg }
                selectedBd={ this.state.selectedBd } onSelectEpg={ this.onSelectEpg } selectedEpg={ this.state.selectedEpg }
                onSelectEpgConnection={ this.onSelectEpgConnection } tenantDn={ this.props.tenant.attributes.dn }
                onSelectAp={ this.onSelectAp } />
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <div className="row" style={ {  marginBottom: 15} }>
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <BridgeDomains bds={ bd_objects } selectedBd={ this.state.selectedBd } onSelectBD={ this.onSelectBD }
                linkToEpg={ this.state.selectedEpg != '' ? true : false } onShowBDDetail={ this.onShowBDDetail }
                selectedVrf={ this.state.selectedVrf } showBDDetail={ this.state.showBDDetail }
                onSelectEpg={ this.onSelectEpg } tenantDn={ this.props.tenant.attributes.dn } />
              </div>
            </div>
            <div className="row" style={ {  marginBottom: 15} }>
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                <PrivateNetworks vrfs={ privateNetorks } selectedVrf={ this.state.selectedVrf } onSelectVrf={ this.onSelectVrf }
                linkToBD={ this.state.selectedBd != '' ? true : false } tenantDn={ this.props.tenant.attributes.dn } />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }
}

Tenant.contextTypes = {
  pushConfiguration: React.PropTypes.func,
  fabric: React.PropTypes.object
};

export default Tenant;
