/*
  PathBindings
*/
import React, { PropTypes } from 'react';
import autobind from 'autobind-decorator';
import reactMixin from 'react-mixin';
import helpers from '../../helpers';

import $ from 'jquery';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardExpandable from 'material-ui/lib/card/card-expandable';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardText from 'material-ui/lib/card/card-text';
import CardTitle from 'material-ui/lib/card/card-title';
import Avatar from 'material-ui/lib/avatar';
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';
import List from 'material-ui/lib/lists/list';
import Divider from 'material-ui/lib/divider';
import ListItem from 'material-ui/lib/lists/list-item';
import Colors from 'material-ui/lib/styles/colors';
import TextField from 'material-ui/lib/text-field';
import SelectField from 'material-ui/lib/select-field';
import LinkedStateMixin from 'react-addons-linked-state-mixin';
import IconButton from 'material-ui/lib/icon-button';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import FontIcon from 'material-ui/lib/font-icon';
import Badge from 'material-ui/lib/badge';

import FMUI from 'formsy-material-ui';
const {FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, FormsySelect, FormsyText, FormsyTime, FormsyToggle} = FMUI;

@autobind
class PathBinding extends React.Component {
  constructor(){
    super();
    this.state = {
      rawVPCPaths: [],
      availableSwitches: [],
      availablePaths: [],
      currentSwitch: '',
      currentPath: '',
      nodes: null,
      vpc_paths: null,
    };
  }

  buildPaths(){
    var vpc_regex = /protpaths-((\d+)-(\d+))/;
    //var nodes = require('../../samples/fabricNode.json')[ 'imdata' ];
    //var vpc_paths = require('../../samples/fabricPathEpg-vpc.json')[ 'imdata' ];
    var nodes = this.state.nodes
    var vpc_paths = this.state.vpc_paths

    // Get single nodes
    var availableSwitches = nodes.map(node => {
      return {
        id: node.fabricNode.attributes.id,
        name: node.fabricNode.attributes.name
      }
    })

    // Get VPC nodes
    var temporarySwitchPairs = []
    vpc_paths.map(path => {
      var results = path.fabricPathEp.attributes.dn.match(vpc_regex)
      if(!temporarySwitchPairs.find(node => node.id == results[ 1 ])) {
        var node1 = availableSwitches.find(node => node.id == results[ 2 ]).name
        var node2 = availableSwitches.find(node => node.id == results[ 3 ]).name
        temporarySwitchPairs.push({
          id: results[ 1 ],
          name: `${node1} and ${node2}`
        })
      }
    })

    availableSwitches.push(...temporarySwitchPairs)

    this.setState({
      rawVPCPaths: vpc_paths,
      availableSwitches: availableSwitches,
    })
  }


  componentDidMount(){
    $.ajax({
      url: `https://${this.context.fabric.address}/api/class/fabricNode.json?query-target-filter=and(eq(fabricNode.role, "leaf"))`,
      type: "GET",
      success: result => {
        this.setState({
          nodes: result.imdata
        })
        if(this.state.vpc_paths && this.state.nodes) {
          this.buildPaths()
        }
      }
    })
    $.ajax({
      url: `https://${this.context.fabric.address}/api/class/fabricPathEp.json?query-target-filter=and(eq(fabricPathEp.lagT,"node"),wcard(fabricPathEp.dn,"^topology/pod-1/protpaths-."))`,
      type: "GET",
      success: result => {
        this.setState({
          vpc_paths: result.imdata
        })
        if(this.state.vpc_paths && this.state.nodes) {
          this.buildPaths()
        }
      }
    })
  }

  selectSwitch(nextSwitch){
    var vpc_paths = this.state.rawVPCPaths

    if(nextSwitch.includes('-')) {
      vpc_paths = vpc_paths.filter(path => path.fabricPathEp.attributes.dn.includes(nextSwitch))
      var availablePaths = vpc_paths.map(path => path.fabricPathEp.attributes.name)
    } else {
      var availablePaths = [
        ...Array(48).keys()
      ].map(port => `Eth1/${port + 1}`)
    }

    this.setState({
      currentSwitch: nextSwitch,
      currentPath: '',
      availablePaths: availablePaths
    })
  }

  selectPath(newPath){
    this.setState({
      currentPath: newPath
    })
  }

  createBinding(vlan, immediacy, switchport){
    console.log(this.state.currentSwitch, this.state.currentPath, vlan, immediacy, switchport)

    let epgDn = `${this.props.tenantDn}/ap-${this.props.selectedAp}/epg-${this.props.selectedEpg}`

    if(this.state.currentSwitch.includes('-')) {
      var tDn = `topology/pod-1/protpaths-${this.state.currentSwitch}/pathep-[${this.state.currentPath}]`
    } else {
      var tDn = `topology/pod-1/paths-${this.state.currentSwitch}/pathep-[${this.state.currentPath}]`
    }

    let data = {
      fvAEPg: {
        attributes: {
          name: this.props.selectedEpg
        },
        children: [
          {
            "fvRsPathAtt": {
              "attributes": {
                "encap": `vlan-${vlan}`,
                "instrImedcy": immediacy,
                "mode": switchport,
                "tDn": tDn
              }
            }
          }
        ]
      }
    };

    this.context.pushConfiguration(epgDn, data)
  }

  render(){
    var badgeIcon = (
    <FloatingActionButton mini={ true } backgroundColor="red" onClick={ this.props.onClose }>
      <FontIcon className="material-icons">close</FontIcon>
    </FloatingActionButton>
    )
    return (
    <Card style={ {  marginBottom: 10} }>
      <CardHeader title="Create Path Binding" subtitle="External network connected to a port, PC, or vPC"
      avatar={ badgeIcon }>
      </CardHeader>
      <CardText>
        <div className="row">
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <Card>
              <CardTitle title="Select Leaf or Leaf Pair" subtitle="Leaf pairs are for vPC paths"
              />
              <CardText>
                <SwitchSelector availableSwitches={ this.state.availableSwitches } selectSwitch={ this.selectSwitch }
                currentSwitch={ this.state.currentSwitch } />
              </CardText>
            </Card>
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            { this.state.currentSwitch != '' ? <PathSelector availablePaths={ this.state.availablePaths } selectPath={ this.selectPath }
                                               currentSwitch={ this.state.currentSwitch } currentPath={ this.state.currentPath } /> : null }
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            { this.state.currentPath != '' ? <PathBindingConfirmation leaf={ this.state.currentSwitch } path={ this.state.currentPath } onClick={ this.createBinding }
                                             /> : null }
          </div>
        </div>
      </CardText>
    </Card>
    )
  }
}
PathBinding.contextTypes = {
  pushConfiguration: React.PropTypes.func,
  fabric: React.PropTypes.object
};

@autobind
class SwitchSelector extends React.Component {
  render(){
    return (
    <List style={ {  maxHeight: 800,  overflowY: 'scroll'} }>
      { this.props.availableSwitches.sort().map(currentSwitch => {
          return (
          <ListItem key={ currentSwitch.id } primaryText={ currentSwitch.id } secondaryText={ currentSwitch.name }
          onClick={ this.props.selectSwitch.bind(this, currentSwitch.id) } rightIconButton={ this.props.currentSwitch == currentSwitch.id ? <IconButton iconClassName="material-icons">check</IconButton> : <IconButton iconClassName="material-icons">chevron_right</IconButton> } />
          )
        }) }
    </List>
    )
  }
}

@autobind
class PathSelector extends React.Component {
  render(){
    if(this.props.currentSwitch.includes('-')) {
      var title = "Select vPC by Policy Group Name"
      var subtitle = `vPCs available to ${this.props.currentSwitch}`
    } else {
      var title = "Select Path by Port Number"
      var subtitle = `Paths available to ${this.props.currentSwitch}`
    }
    return (
    <Card>
      <CardTitle title={ title } subtitle={ subtitle } />
      <CardText>
        <List style={ {  maxHeight: 400,  overflowY: 'scroll'} }>
          { this.props.availablePaths.map(path => {
              return (
              <ListItem key={ path } primaryText={ path } onClick={ this.props.selectPath.bind(this, path) }
              rightIconButton={ this.props.currentPath == path ? <IconButton iconClassName="material-icons">check</IconButton> : <IconButton iconClassName="material-icons">chevron_right</IconButton> } />
              )
            }) }
        </List>
      </CardText>
    </Card>
    )
  }
}

@autobind
class PathBindingConfirmation extends React.Component {
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
    this.props.onClick(model.vlan, model.immediacy, model.switchport)
  }

  render(){
    return (
    <Card>
      <CardTitle title="Confirm Options" subtitle={ `Path binding ${this.props.path} on ${this.props.leaf}` } />
      <CardText>
        <Formsy.Form onValid={ this.enableButton } onInvalid={ this.disableButton } onValidSubmit={ this.submitForm }>
          <TextField hintText="Disabled Hint Text" disabled={ true } value={ this.props.leaf }
          floatingLabelText="Leaf Switch" />
          <br/>
          <TextField hintText="Disabled Hint Text" disabled={ true } value={ this.props.path }
          floatingLabelText="Path" />
          <br/>
          <FormsyText required name="vlan" validations="isNumeric" validationError="VLAN must be numeric"
          hintText="VLAN ID" value="1" floatingLabelText="VLAN ID" />
          <br />
          <FormsySelect name="immediacy" floatingLabelText="Bind before traffic is seen?" value="immediate"
          fullWidth={ true } menuItems={ [  {    payload: 'immediate',    text: 'Yes'  },  {    payload: 'lazy',    text: 'No'  }] } />
          <br />
          <FormsySelect name="switchport" floatingLabelText="Switchport Mode" value="regular"
          fullWidth={ true } menuItems={ [  {    payload: 'regular',    text: 'Trunk'  },  {    payload: 'native',    text: 'Access (802.1P)'  },  {    payload: 'untagged',    text: 'Access (Untagged)'  }] } />
          <br />
          <RaisedButton disabled={ !this.state.canSubmit } type="submit" label="Create Path Binding"
          primary={ true } />
        </Formsy.Form>
      </CardText>
    </Card>
    )
  }
}
reactMixin.onClass(PathBindingConfirmation, LinkedStateMixin);

export default PathBinding;
