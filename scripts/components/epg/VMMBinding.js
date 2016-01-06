/*
  VMMBinding
*/
import React, { PropTypes } from 'react';
import autobind from 'autobind-decorator';
import reactMixin from 'react-mixin';
const helpers = require('../../helpers');

import $ from 'jquery';
const Card = require('material-ui/lib/card/card');
const CardActions = require('material-ui/lib/card/card-actions');
const CardExpandable = require('material-ui/lib/card/card-expandable');
const CardHeader = require('material-ui/lib/card/card-header');
const CardMedia = require('material-ui/lib/card/card-media');
const CardText = require('material-ui/lib/card/card-text');
const CardTitle = require('material-ui/lib/card/card-title');
const Avatar = require('material-ui/lib/avatar');
const FlatButton = require('material-ui/lib/flat-button');
const RaisedButton = require('material-ui/lib/raised-button');
const List = require('material-ui/lib/lists/list');
const ListDivider = require('material-ui/lib/lists/list-divider');
const ListItem = require('material-ui/lib/lists/list-item');
const Colors = require('material-ui/src/styles/colors');
const TextField = require('material-ui/lib/text-field');
const SelectField = require('material-ui/lib/select-field');
const LinkedStateMixin = require('react-addons-linked-state-mixin');
const IconButton = require('material-ui/lib/icon-button');
const FloatingActionButton = require('material-ui/lib/floating-action-button');
const FontIcon = require('material-ui/lib/font-icon');
const Badge = require('material-ui/lib/badge');

const FMUI = require('formsy-material-ui');
const {FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, FormsySelect, FormsyText, FormsyTime, FormsyToggle} = FMUI;


@autobind
class VMMBinding extends React.Component {
  constructor(){
    super();
    this.state = {
      vmmDomP: [],
      availableDomains: [
        {
          id: 'VMware',
          name: 'VMWare vCenter Networking (DVS/AVS)'
        },
        {
          id: 'OpenStack',
          name: 'OpenStack Networking (ML2/GBP)'
        },
        {
          id: 'HyperV',
          name: 'Microsoft HyperV Networking'
        },
      ],
      availableVMM: [],
      currentDomain: '',
      currentVMM: '',
    };
  }

  componentDidMount(){
    //var vpc_regex = /protpaths-((\d+)-(\d+))/;
    //var vmmDomP = require('../../samples/vmmDomP.json')[ 'imdata' ];

    $.ajax({
      url: `https://${this.context.fabric.address}/api/class/vmmDomP.json`,
      type: "GET",
      xhrFields: {
        withCredentials: true
      },
      success: result => {
        this.setState({
          vmmDomP: result.imdata,
        })
      }
    })
  }

  selectDomain(nextDomain){
    var availableVMM = this.state.vmmDomP.filter(vmm => {
      return vmm.vmmDomP.attributes.dn.includes(nextDomain)
    })

    availableVMM = availableVMM.map(vmm => {
      return vmm.vmmDomP.attributes.name
    })

    this.setState({
      currentDomain: nextDomain,
      currentVMM: '',
      availableVMM: availableVMM
    })
  }

  selectVMM(newVMM){
    this.setState({
      currentVMM: newVMM
    })
  }

  createBinding(deployment, resolution){
    console.log(this.state.currentDomain, this.state.currentVMM, deployment, resolution)

    let epgDn = `${this.props.tenantDn}/ap-${this.props.selectedAp}/epg-${this.props.selectedEpg}`

    let tDn = `uni/vmmp-${this.state.currentDomain}/dom-${this.state.currentVMM}`


    let data = {
      fvAEPg: {
        attributes: {
          name: this.props.selectedEpg
        },
        children: [
          {
            "fvRsDomAtt": {
              "attributes": {
                "instrImedcy": deployment,
                "resImedcy": resolution,
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
      <CardHeader title="Create Virtual Domain Binding" subtitle="External virtual network connected to the Fabric"
      avatar={ badgeIcon }>
      </CardHeader>
      <CardText>
        <div className="row">
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            <Card>
              <CardTitle title="Virtual Networking Type" />
              <CardText>
                <DomainSelector availableDomains={ this.state.availableDomains } selectDomain={ this.selectDomain }
                currentDomain={ this.state.currentDomain } />
              </CardText>
            </Card>
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            { this.state.currentDomain != '' ? <VMMSelector availableVMM={ this.state.availableVMM } selectVMM={ this.selectVMM } currentDomain={ this.state.currentDomain }
                                               currentVMM={ this.state.currentVMM } /> : null }
          </div>
          <div className="col-lg-4 col-md-4 col-sm-12 col-xs-12">
            { this.state.currentVMM != '' ? <VMMDomainConfirmation domain={ this.state.currentDomain } vmm={ this.state.currentVMM } onClick={ this.createBinding }
                                            /> : null }
          </div>
        </div>
      </CardText>
    </Card>
    )
  }
}
VMMBinding.contextTypes = {
  pushConfiguration: React.PropTypes.func,
  fabric: React.PropTypes.object
};

@autobind
class DomainSelector extends React.Component {
  render(){
    return (
    <List>
      { this.props.availableDomains.sort().map(currentDomain => {
          return (
          <ListItem key={ currentDomain.id } primaryText={ currentDomain.id } secondaryText={ currentDomain.name }
          onClick={ this.props.selectDomain.bind(this, currentDomain.id) } rightIconButton={ this.props.currentDomain == currentDomain.id ? <IconButton iconClassName="material-icons">check</IconButton> : <IconButton iconClassName="material-icons">chevron_right</IconButton> } />
          )
        }) }
    </List>
    )
  }
}

@autobind
class VMMSelector extends React.Component {
  render(){
    var title = "Select Virtual Network"
    var subtitle = `Virtual Networks available of type ${this.props.currentDomain}`
    return (
    <Card>
      <CardTitle title={ title } subtitle={ subtitle } />
      <CardText>
        <List>
          { this.props.availableVMM.sort().map(vmm => {
              return (
              <ListItem key={ vmm } primaryText={ vmm } onClick={ this.props.selectVMM.bind(this, vmm) }
              rightIconButton={ this.props.currentVMM == vmm ? <IconButton iconClassName="material-icons">check</IconButton> : <IconButton iconClassName="material-icons">chevron_right</IconButton> } />
              )
            }) }
        </List>
      </CardText>
    </Card>
    )
  }
}

@autobind
class VMMDomainConfirmation extends React.Component {
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
    this.props.onClick(model.deployment, model.resolution)
  }

  render(){
    return (
    <Card>
      <CardTitle title="Confirm Options" subtitle={ `Virtual Network Binding ${this.props.vmm} of type ${this.props.domain}` } />
      <CardText>
        <Formsy.Form onValid={ this.enableButton } onInvalid={ this.disableButton } onValidSubmit={ this.submitForm }>
          <TextField hintText="Disabled Hint Text" disabled={ true } value={ this.props.domain }
          floatingLabelText="Domain Type" />
          <br />
          <TextField hintText="Disabled Hint Text" disabled={ true } value={ this.props.vmm }
          floatingLabelText="Virtual Network Name" />
          <br/>
          <FormsySelect name="deployment" floatingLabelText="Allocate switch resources before traffic is seen?"
          value="immediate" fullWidth={ true } menuItems={ [  {    payload: 'immediate',    text: 'Yes'  },  {    payload: 'lazy',    text: 'No'  }] }
          />
          <br />
          <FormsySelect name="resolution" floatingLabelText="When should policy be downloaded to switch?"
          value="immediate" fullWidth={ true } menuItems={ [  {    payload: 'immediate',    text: 'When virtual network is connected'  },  {    payload: 'lazy',    text: 'When virtual network is connected AND virtual machine is assigned'  },  {    payload: 'pre-provision',    text: 'Right Now!'  }] }
          />
          <br />
          <RaisedButton disabled={ !this.state.canSubmit } type="submit" label="Create Virtual Network Binding"
          primary={ true } />
        </Formsy.Form>
      </CardText>
    </Card>
    )
  }
}
reactMixin.onClass(VMMDomainConfirmation, LinkedStateMixin);

export default VMMBinding;
