/*
  PrivateNetworks
*/

import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import Paper from 'material-ui/lib/paper';
import reactMixin from 'react-mixin';
import LinkedStateMixin from 'react-addons-linked-state-mixin';
import helpers from '../../helpers';
import List from 'material-ui/lib/lists/list';
import Divider from 'material-ui/lib/divider';
import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';
import Colors from 'material-ui/lib/styles/colors';

import FloatingActionButton from 'material-ui/lib/floating-action-button';
import FontIcon from 'material-ui/lib/font-icon';
import IconButton from 'material-ui/lib/icon-button';

import Card from 'material-ui/lib/card/card';
import CardExpandable from 'material-ui/lib/card/card-expandable';
import CardHeader from 'material-ui/lib/card/card-header';
import CardText from 'material-ui/lib/card/card-text';

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import TextField from 'material-ui/lib/text-field';
@
autobind
class PrivateNetworks extends React.Component {
  constructor(){
    super()
    this.state = {
      newVrf: false,
      filterVrf: ''
    };
  }

  newVrf(){
    if(this.state.newVrf) {
      let data = {
        fvCtx: {
          attributes: {
            name: this.refs.newVrfName.getValue()
          }
        }
      };

      this.context.pushConfiguration(this.props.tenantDn, data)
    }
    this.setState({
      newVrf: !this.state.newVrf
    })
  }

  cancelNewVrf(){
    this.setState({
      newVrf: false
    })
  }

  componentDidUpdate(prevProps, prevState){
    if(!prevState.newVrf && this.state.newVrf) {
      this.refs.newVrfName.focus()
    }
  }

  render(){

    if(this.state.newVrf) {
      var subtitle = ""
      var title = (
      <TextField onBlur={ this.cancelNewVrf } hintText={ "Give your new Network a name..." } ref="newVrfName"
      style={ {  marginTop: 5,  width: 400} } />
      )
      var badgeIcon = (
      <FloatingActionButton mini={ true } primary={ true } backgroundColor={ Colors.green500 }
      onClick={ this.newVrf }>
        <FontIcon className="material-icons">check</FontIcon>
      </FloatingActionButton>
      )
    } else {

      var subtitle = "Layer 3 Routing Context"
      var title = "Private Networks"
      var badgeIcon = (
      <FloatingActionButton mini={ true } primary={ true } onClick={ this.newVrf }>
        <FontIcon className="material-icons">add</FontIcon>
      </FloatingActionButton>
      )
    }

    const vrfs = this.props.vrfs.filter(vrf => vrf.attributes.name.toLowerCase().includes(this.state.filterVrf.toLowerCase()))
    return (
    <Card initiallyExpanded={ true }>
      <CardHeader title={ title } subtitle={ subtitle } actAsExpander={ false }
      showExpandableButton={ true } avatar={ badgeIcon }>
      </CardHeader>
      <CardText expandable={ true }>
        <List>
          { vrfs.map(vrf => (
            <PrivateNetwork key={ vrf.attributes.name } vrf={ vrf } linkToBD={ this.props.linkToBD }
            selected={ vrf.attributes.name == this.props.selectedVrf ? true : false } onSelectVrf={ this.props.onSelectVrf } tenantDn={ this.props.tenantDn }
            />
            )
            ) }
        </List>
      </CardText>
      <Toolbar>
        <ToolbarGroup>
          <TextField hintText="Filter" valueLink={ this.linkState('filterVrf') } />
        </ToolbarGroup>
      </Toolbar>
    </Card>
    )
  }
}
PrivateNetworks.contextTypes = {
  pushConfiguration: React.PropTypes.func
};
reactMixin.onClass(PrivateNetworks, LinkedStateMixin);



@
autobind
class PrivateNetwork extends React.Component {
  constructor(){
    super();
    this.state = {
      showLinkToVrf: false
    };
  }

  onSelectLink(event){
    event.preventDefault();
    event.stopPropagation();
    this.props.onSelectVrf(this.props.vrf.attributes.name)
  }

  toggleContractEnforcement(event){
    event.preventDefault();
    event.stopPropagation();
    var ctxDn = `${this.props.tenantDn}/ctx-${this.props.vrf.attributes.name}`
    console.log(ctxDn)

    var dataOn = {
      "fvCtx": {
        "attributes": {
          "pcEnfPref": "enforced",
        }
      }
    }
    var dataOff = {
      "fvCtx": {
        "attributes": {
          "pcEnfPref": "unenforced",
        }
      }
    }
    if(this.props.vrf.attributes.pcEnfPref == 'unenforced') {
      console.log('Turning contract enforcment on')
      this.context.pushConfiguration(ctxDn, dataOn)
    } else {
      console.log('Turning contract enforcment on')
      this.context.pushConfiguration(ctxDn, dataOff)
    }
  }
  onMouseEnter(){
    if(this.props.linkToBD) {
      this.setState({
        showLinkToVrf: true
      })
    }
  }
  onMouseLeave(){
    this.setState({
      showLinkToVrf: false
    })
  }

  onSelectVrf(){
    if(this.props.linkToBD) {
      console.log('Squashing vrf select during link state')
    } else if(this.props.selected) {
      this.props.onSelectVrf('')
    } else {
      this.props.onSelectVrf(this.props.vrf.attributes.name)
    }
  }

  render(){

    var secondaryText = `Security currently ${this.props.vrf.attributes.pcEnfPref}`


    if(this.state.showLinkToVrf) {
      var rightIcon = <IconButton onClick={ this.onSelectLink } iconClassName="material-icons">link</IconButton>
      var secondaryText = <p><span style={ {  color: Colors.darkBlack} }> Click to connect current BD to this Private Network</span></p>
    } else if(this.props.linkToBD && !this.state.showLinkToVrf) {
      var rightIcon = null
    } else if(this.props.selected && !this.props.linkToBD) {
      var rightIcon = <IconButton iconClassName="material-icons" onClick={ this.props.onShowBDDetail }>more_horizontal</IconButton>
    } else {
      var rightIcon = <IconButton iconClassName="material-icons" onClick={ this.toggleContractEnforcement }>
                        { this.props.vrf.attributes.pcEnfPref == 'enforced' ? 'lock' : 'lock_open' }
                      </IconButton>
    }



    if(this.props.linkToBD && this.props.selected) {
      var leftIcon = <FontIcon className="material-icons">my_location</FontIcon>
    } else if(this.props.selected) {
      var leftIcon = <FontIcon className="material-icons">check</FontIcon>
    } else {
      var leftIcon = null
    }

    return ( <ListItem onMouseEnter={ this.onMouseEnter } onClick={ this.onSelectVrf } onMouseLeave={ this.onMouseLeave }
             leftIcon={ leftIcon } primaryText={ this.props.vrf.attributes.name } rightIconButton={ rightIcon }
             secondaryText={ secondaryText } secondaryTextLines={ 1 } />
    )
  }

}
PrivateNetwork.contextTypes = {
  pushConfiguration: React.PropTypes.func
};

export default PrivateNetworks;
