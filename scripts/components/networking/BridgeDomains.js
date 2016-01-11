/*
  BridgeDomains
*/

import React, { PropTypes } from 'react';
import reactMixin from 'react-mixin';
import autobind from 'autobind-decorator';
import Paper from 'material-ui/lib/paper';

import LinkedStateMixin from 'react-addons-linked-state-mixin';

import helpers from '../../helpers';
import List from 'material-ui/lib/lists/list';
import Divider from 'material-ui/lib/divider';
import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';
import Colors from 'material-ui/lib/styles/colors';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import FontIcon from 'material-ui/lib/font-icon';

import Card from 'material-ui/lib/card/card';
import CardExpandable from 'material-ui/lib/card/card-expandable';
import CardHeader from 'material-ui/lib/card/card-header';
import CardText from 'material-ui/lib/card/card-text';
import CardTitle from 'material-ui/lib/card/card-title';
import CardActions from 'material-ui/lib/card/card-actions';

import IconButton from 'material-ui/lib/icon-button';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import Menu from 'material-ui/lib/menus/menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import TextField from 'material-ui/lib/text-field';

import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';

import FMUI from 'formsy-material-ui';
const {FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, FormsySelect, FormsyText, FormsyTime, FormsyToggle} = FMUI;
@
autobind
class BridgeDomains extends React.Component {

  constructor(){
    super()
    this.state = {
      filter: ''
    };
  }

  addNewBD(event){
    this.props.onSelectBD('', this.props.selectedVrf)
    this.props.onShowBDDetail()
  }

  render(){
    const bds = this.props.bds.filter(bd => bd.attributes.name.toLowerCase().includes(this.state.filter.toLowerCase()))

    var subtitle = "Layer 2 Broadcast Domains"
    var headerText = "Bridge Domains"

    var badgeIcon = (
    <FloatingActionButton mini={ true } primary={ true } onClick={ this.addNewBD }
    disabled={ this.props.selectedVrf == '' ? true : false }>
      <FontIcon className="material-icons">add</FontIcon>
    </FloatingActionButton>
    )

    var bridgeDomainList = (
    <Card initiallyExpanded={ true }>
      <CardHeader title={ headerText } subtitle={ subtitle } actAsExpander={ false }
      showExpandableButton={ true } avatar={ badgeIcon }>
      </CardHeader>
      <CardText expandable={ true }>
        <List>
          { bds.map(bd => (
            <BridgeDomain onSelectBD={ this.props.onSelectBD } key={ bd.attributes.name } bd={ bd }
            onShowBDDetail={ this.props.onShowBDDetail } selected={ bd.attributes.name == this.props.selectedBd ? true : false } linkToEpg={ this.props.linkToEpg }
            onSelectEpg={ this.props.onSelectEpg } tenantDn={ this.props.tenantDn } />
            )
            ) }
        </List>
      </CardText>
      <Toolbar>
        <ToolbarGroup>
          <TextField hintText="Filter" valueLink={ this.linkState('filter') } />
        </ToolbarGroup>
      </Toolbar>
    </Card>
    )

    if(this.props.showBDDetail) {
      var selectedBdData = this.props.bds.filter(bd => bd.attributes.name == this.props.selectedBd)[ 0 ]
      // If there is no BD data this is a new record so prepopulate it as such
      if(!selectedBdData) {
        selectedBdData = {
          "attributes": {
            "name": "",
            "arpFlood": "no",
            "unkMacUcastAct": "proxy",
            "unkMcastAct": "flood",
            "multiDstPktAct": "bd-flood"
          }
        }
      }
    }

    return (
    <ReactCSSTransitionGroup transitionAppear={ true } transitionName="longer"
    transitionAppearTimeout={ 800 } transitionEnterTimeout={ 800 }
    transitionLeaveTimeout={ 500 }>
      { this.props.showBDDetail ? <div key={ 0 }>
                                    { <BridgeDomainDetail bd={ selectedBdData } {...this.props} /> } </div> : <div key={ 1 }>
                                                                                                                { bridgeDomainList } </div> }
    </ReactCSSTransitionGroup>
    )
  }
}

@
autobind
class BridgeDomain extends React.Component {

  constructor(){
    super()
    this.state = {
      showRowLink: false
    };
  }

  clickLink(){
    console.log('Clicked lnk')
  }


  onMouseEnter(){
    if(!this.props.selected && this.props.linkToEpg)
      this.setState({
        showRowLink: true
      })
  }
  onMouseLeave(){
    this.setState({
      showRowLink: false
    })
  }

  onSelectBD(){
    if(this.props.linkToEpg) {
      this.props.onSelectEpg('', '', this.props.bd.attributes.name)
    } else if(this.props.selected) {
      this.props.onSelectBD('', '')
    } else {
      var vrf = helpers.parseType(this.props.bd.children, 'fvRsCtx')[ 0 ];
      this.props.onSelectBD(this.props.bd.attributes.name, vrf.attributes.tnFvCtxName)
    }
  }

  onSelectLink(event){
    event.preventDefault();
    event.stopPropagation();
    var vrf = helpers.parseType(this.props.bd.children, 'fvRsCtx')[ 0 ];
    this.props.onSelectBD(this.props.bd.attributes.name, vrf.attributes.tnFvCtxName)
  }

  onShowBDDetail(event){
    event.preventDefault();
    event.stopPropagation();
    this.props.onShowBDDetail()
  }

  toggleArpFlood(event){
    event.preventDefault();
    event.stopPropagation();
    var bdDn = `${this.props.tenantDn}/BD-${this.props.bd.attributes.name}`
    console.log(bdDn)

    var dataFlood = {
      "fvBD": {
        "attributes": {
          "arpFlood": "yes",
          "unkMacUcastAct": "flood",
        }
      }
    }
    var dataNoFlood = {
      "fvBD": {
        "attributes": {
          "arpFlood": "no",
          "unkMacUcastAct": "proxy",
        }
      }
    }
    if(this.props.bd.attributes.arpFlood == 'no') {
      console.log('Turning flood on')
      this.context.pushConfiguration(bdDn, dataFlood)
    } else {
      console.log('Turning flood off')
      this.context.pushConfiguration(bdDn, dataNoFlood)
    }
  }

  render(){

    var vrf = helpers.parseType(this.props.bd.children, 'fvRsCtx')[ 0 ];
    var privateNetwork = `Connected to Private Network ${vrf.attributes.tnFvCtxName}`

    var secondaryText = <p>
                          { privateNetwork } </p>
    if(this.state.showRowLink) {
      var rightIcon = <IconButton iconClassName="material-icons" onClick={ this.onSelectLink }>link</IconButton>
      var secondaryText = <p><span style={ {  color: Colors.darkBlack} }> Click link to connect current EPG to this BD </span></p>
    } else if(this.props.linkToEpg && !this.state.showLink) {
      var rightIcon = null
    } else if(this.props.selected && !this.props.linkToEpg) {

      var rightIcon = <IconButton iconClassName="material-icons" onClick={ this.onShowBDDetail }>more_horizontal</IconButton>
    } else {
      var rightIcon = <IconButton iconClassName="material-icons" onClick={ this.toggleArpFlood }>
                        { this.props.bd.attributes.arpFlood == 'yes' ? 'network_wifi' : 'signal_wifi_off' }
                      </IconButton>
    }

    if(this.props.selected && this.props.linkToEpg) {
      var leftIcon = <FontIcon className="material-icons">my_location</FontIcon>
    } else if(this.props.selected) {
      var leftIcon = <FontIcon className="material-icons">check</FontIcon>
    } else {
      var lefticon = null
    }

    return ( <ListItem onMouseEnter={ this.onMouseEnter } onMouseLeave={ this.onMouseLeave } rightIconButton={ rightIcon }
             onClick={ this.onSelectBD } primaryText={ this.props.bd.attributes.name } secondaryText={ secondaryText }
             leftIcon={ leftIcon } secondaryTextLines={ 1 }>
             </ListItem>
    )
  }

}
BridgeDomain.contextTypes = {
  pushConfiguration: React.PropTypes.func
};
reactMixin.onClass(BridgeDomains, LinkedStateMixin);


@
autobind
class BridgeDomainDetail extends React.Component {


  constructor(){
    super();
    this.state = {
      canSubmit: false
    };
  }
  enableButton(){
    this.setState({
      canSubmit: true
    });
  }

  disableButton(){
    this.setState({
      canSubmit: false
    });
  }

  submitForm(model){
    console.log(model)

    var bdDn = `${this.props.tenantDn}`
    console.log(bdDn)

    var data = {
      "fvBD": {
        "attributes": {
          "name": model.name,
          "arpFlood": model.arpFlood,
          "unkMacUcastAct": model.unkMacUcastAct,
          "unkMcastAct": model.unkMcastAct,
          "multiDstPktAct": model.multiDstPktAct,
        },
        "children": [
          {
            "fvRsCtx": {
              "attributes": {
                "tnFvCtxName": model.vrf
              }
            }
          }
        ]
      }
    };

    this.context.pushConfiguration(bdDn, data)
  }


  render(){

    var badgeIcon = (
    <div style={ {  display: 'inline'} }>
      <FloatingActionButton mini={ true } secondary={ true } onClick={ this.props.onShowBDDetail }>
        <FontIcon className="material-icons">chevron_left</FontIcon>
      </FloatingActionButton>
      <span style={ {  marginLeft: 15} }>Bridge Domain { this.props.selectedBd } Details</span>
    </div>
    )

    var moreDetails = (
    <FlatButton secondary={ true } style={ {  backgroundColor: 'rgb(232,232,232)'} } label="Further Details"
    labelPosition="after">
    </FlatButton>
    )

    return (

    <Card>
      <CardTitle title={ badgeIcon }></CardTitle>
      <Formsy.Form onValid={ this.enableButton } onInvalid={ this.disableButton } onValidSubmit={ this.submitForm }>
        <CardText>
          <FormsyText hintText="May not contain spaces, or dashes" floatingLabelText="Name"
          name="name" value={ this.props.selectedBd } required={ true } disabled={ this.props.selectedBd != '' ? true : false }
          />
          <div style={ {  display: 'inline',  float: 'right'} }>
            <FormsyText floatingLabelText="Private Network" name="vrf" value={ this.props.selectedVrf }
            disabled={ true } />
          </div>
          <br/>
          <FormsySelect name="arpFlood" floatingLabelText="Flood ARP Packets?" value={ this.props.bd.attributes.arpFlood }
          fullWidth={ true } menuItems={ [  {    payload: 'yes',    text: 'Yes'  },  {    payload: 'no',    text: 'No'  }] } />
          <br />
          <FormsySelect name="unkMacUcastAct" floatingLabelText="Flood Unknown Layer 2 Frames?"
          value={ this.props.bd.attributes.unkMacUcastAct } fullWidth={ true } menuItems={ [  {    payload: 'flood',    text: 'Yes'  },  {    payload: 'proxy',    text: 'No'  }] }
          />
          <br />
          <FormsySelect name="unkMcastAct" floatingLabelText="Flood Unknown Multicast Frames?"
          value={ this.props.bd.attributes.unkMcastAct } fullWidth={ true } menuItems={ [  {    payload: 'flood',    text: 'Yes'  },  {    payload: 'opt-flood',    text: 'No'  }] }
          />
          <br />
          <FormsySelect name="multiDstPktAct" floatingLabelText="Where should Multidestination (Broadcast or Multicast) Frames be Flooded?"
          value={ this.props.bd.attributes.multiDstPktAct } fullWidth={ true } menuItems={ [  {    payload: 'bd-flood',    text: 'Within the Bridge Domain'  },  {    payload: 'encap-flood',    text: 'Receiving VLAN'  },  {    payload: 'drop',    text: 'Dropped'  }] }
          />
          <br />
        </CardText>
        <Toolbar>
          <ToolbarGroup>
            { moreDetails }
          </ToolbarGroup>
          <ToolbarGroup float="right">
            <RaisedButton disabled={ !this.state.canSubmit } type="submit" label="Save" primary={ true }
            />
          </ToolbarGroup>
        </Toolbar>
      </Formsy.Form>
    </Card>
    )
  }
}

BridgeDomainDetail.contextTypes = {
  pushConfiguration: React.PropTypes.func
};
export default BridgeDomains
