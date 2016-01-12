/*
  USegEpg
  <Inventory/>
*/

import React, { PropTypes } from 'react';
import autobind from 'autobind-decorator';
import helpers from '../../helpers';
import $ from 'jquery';


import Paper from 'material-ui/lib/paper';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardExpandable from 'material-ui/lib/card/card-expandable';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardText from 'material-ui/lib/card/card-text';
import Avatar from 'material-ui/lib/avatar';
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';
import Snackbar from 'material-ui/lib/snackbar';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import FontIcon from 'material-ui/lib/font-icon';

import FMUI from 'formsy-material-ui';
const {FormsySelect} = FMUI;

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import TextField from 'material-ui/lib/text-field';

import Colors from 'material-ui/lib/styles/colors';
import { DragDropContext } from 'react-dnd';
import { DropTarget, DragSource } from 'react-dnd';
import ItemTypes from './ItemTypes';
import HTML5Backend from 'react-dnd-html5-backend';

const ItemColors = {
  vmName: {
    label: Colors.fullWhite,
    background: Colors.blueGrey200
  },
  osType: {
    label: Colors.fullWhite,
    background: Colors.red200
  },
  hypervisor: {
    label: Colors.fullWhite,
    background: Colors.green200
  },
  vmID: {
    label: Colors.fullWhite,
    background: Colors.blue200
  },
};

@DragDropContext(HTML5Backend)
@autobind
class USegEpg extends React.Component {

  componentDidMount(){
    $.ajax({
      url: `https://${this.props.fabric.address}/api/node/class/compVm.json`,
      type: "GET",
      dataType: "json",
      success: vms => {
        vms = vms.imdata
        let availableVMs = []
        let availableVMIDs = []
        let osTypes = []
        vms.map(vm => {
          availableVMs.push(vm.compVm.attributes.name)
          availableVMIDs.push(vm.compVm.attributes.oid)
          osTypes.push(vm.compVm.attributes.cfgdOs)
        })
        availableVMs = new Set(availableVMs)
        availableVMs = Array.from(availableVMs)
        availableVMIDs = new Set(availableVMIDs)
        availableVMIDs = Array.from(availableVMIDs)
        osTypes = new Set(osTypes)
        osTypes = Array.from(osTypes)
        this.setState({
          availableVMs,
          availableVMIDs,
          osTypes
        })
      }
    })
    $.ajax({
      url: `https://${this.props.fabric.address}/api/node/class/compHv.json?query-target-filter=and(wcard(compHv.dn, "prov-VMware"))`,
      type: "GET",
      dataType: "json",
      success: hvs => {
        hvs = hvs.imdata
        let availableHypervisors = []
        hvs.map(hv => {
          availableHypervisors.push(`${hv.compHv.attributes.oid} (${hv.compHv.attributes.name})`)
        })
        availableHypervisors = new Set(availableHypervisors)
        availableHypervisors = Array.from(availableHypervisors)
        this.setState({
          availableHypervisors,
        })
      }
    })

    let matchBin = {
      startsWith: [],
      endsWith: [],
      contains: [],
      equals: [],
    };

    let matchItemContainer = helpers.parseType(this.props.epg.children, 'fvCrtrn')[ 0 ]
    if(matchItemContainer) {
      var matchItems = matchItemContainer.children
      matchItems.map(item => {
        item = item.fvVmAttr.attributes
        matchBin[ item.operator ].push({
          name: item.value,
          type: this.apicToInternalMapping[ item.type ]
        })

      })
    }
    this.setState({
      matchBin
    })
  }

  constructor(){
    super();
    this.state = {
      matchBin: {
        startsWith: [],
        endsWith: [],
        contains: [],
        equals: [],
      },
      vmNameFilter: '',
      osTypeFilter: '',
      vmIDFilter: '',
      hypervisorFilter: '',
      lastSelectedMatchItem: {},
      availableVMs: [],
      availableVMIDs: [],
      availableHypervisors: [],
      osTypes: [],
      sbOpen: false
    };
    this.internalToApicMapping = {
      vmName: 'vm-name',
      osType: 'guest-os',
      vmID: 'vm',
      hypervisor: 'hv'
    };
    this.apicToInternalMapping = {
      'vm-name': 'vmName',
      'guest-os': 'osType',
      'vm': 'vmID',
      'hv': 'hypervisor'
    };
  }

  addMatchItem(matchItemName, matchItemType, matchBinType){

    this.state.matchBin[ matchBinType ].push({
      name: matchItemName,
      type: matchItemType
    });

    this.setState({
      matchBin: this.state.matchBin,
      lastSelectedMatchItem: {
        matchItemName,
        matchBinType
      },
      sbOpen: true
    })
  }

  removeMatchItem(itemName, itemType, binType){
    var itemIndex = this.state.matchBin[ binType ].findIndex(item => item.name == itemName && item.type == itemType)

    this.state.matchBin[ binType ].splice(itemIndex, 1);
    this.setState({
      matchBin: this.state.matchBin
    })
  }

  setFilter(event){
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  getAvailableItems(items, selectedItems, itemType, propertyFilter){
    var availableItems = []
    var keys = Object.keys(selectedItems)
    keys.map((key) => {
      selectedItems[ key ].map((item) => {
        item.type == itemType ? availableItems.push(item.name) : null
      })
    })
    items = items.filter(item => availableItems.indexOf(item) == -1)
    items = items.filter(item => item.toLowerCase().includes(propertyFilter.toLowerCase()))

    return items
  }

  save(){
    console.log(this.state.matchBin)
    let epgDn = `${this.props.tenantDn}/ap-${this.props.selectedAp}/epg-${this.props.selectedEpg}`


    var attributes = {
      "fvCrtrn": {
        "attributes": {
          "match": "all",
          "name": "default",
        },
        "children": []
      }
    };

    /*esfmt-ignore-start*/
    Object.keys(this.state.matchBin).map(key => {
      var bin = this.state.matchBin[key]

      bin.map(match => {
        let attribute = {
            fvVmAttr: {
              attributes: {
                name: helpers.slugify(`epg-${this.props.selectedEpg}-reattivio-${match.name}`),
                operator: key,
                value: match.name,
                type: this.internalToApicMapping[match.type],
              }
            }
          };
        attributes.fvCrtrn.children.push(attribute)
      })

    })
    /*esfmt-ignore-end*/


    this.props.pushConfiguration(epgDn, attributes)
  }

  closeSB(){
    this.setState({
      sbOpen: false
    })
  }

  render(){

    var badgeIcon = (
    <FloatingActionButton mini={ true } backgroundColor="red" onClick={ this.props.onClose }>
      <FontIcon className="material-icons">close</FontIcon>
    </FloatingActionButton>
    )

    let availableVMs = this.getAvailableItems(this.state.availableVMs, this.state.matchBin, 'vmName', this.state.vmNameFilter)
    let availableOSTypes = this.getAvailableItems(this.state.osTypes, this.state.matchBin, 'osType', this.state.osTypeFilter)
    let availableHypervisors = this.getAvailableItems(this.state.availableHypervisors, this.state.matchBin, 'hypervisor', this.state.hypervisorFilter)
    let availableVMIDs = this.getAvailableItems(this.state.availableVMIDs, this.state.matchBin, 'vmID', this.state.vmIDFilter)


    let matchItemContainer = helpers.parseType(this.props.epg.children, 'fvCrtrn')[ 0 ]
    if(matchItemContainer) {
      var matchModeValue = matchItemContainer.attributes.match || "any"
    } else {
      var matchModeValue = "any"
    }

    return (
    <Card>
      <CardHeader title="Create a new Micro Segmented End Point Group" subtitle="Drag and drop VMs into a security groups"
      avatar={ badgeIcon }>
      </CardHeader>
      <CardText>
        <div style={ {  margin: 15} }>
          <div className="row" style={ {  marginBottom: 40} }>
            <div className="col-lg-12">
              <Toolbar>
                <ToolbarGroup>
                  <ToolbarTitle text="Match Items" />
                </ToolbarGroup>
                <ToolbarGroup float="right">
                  <RaisedButton primary={ true } label="Save Match Items" onClick={ this.save }
                  />
                </ToolbarGroup>
                <ToolbarGroup float="right">
                  <div style={ {  display: 'inline-block'} }>
                    <Formsy.Form>
                      <FormsySelect style={ {  marginTop: 5} } name="matchMode" value={ matchModeValue }
                      menuItems={ [  {    payload: 'any',    text: 'Will match on any item'  },  {    payload: 'all',    text: 'All items must be matched'  }] } />
                    </Formsy.Form>
                  </div>
                </ToolbarGroup>
              </Toolbar>
              <Paper zDepth={ 3 }>
                <div style={ {  padding: 30} }>
                  <div className="row">
                    <div className="col-lg-3">
                      <VMBin header="Starts With" type="startsWith" selectedItems={ this.state.matchBin }
                      removeMatchItem={ this.removeMatchItem } />
                    </div>
                    <div className="col-lg-3">
                      <VMBin header="Contains" type="contains" selectedItems={ this.state.matchBin } removeMatchItem={ this.removeMatchItem }
                      />
                    </div>
                    <div className="col-lg-3">
                      <VMBin header="Equals" type="equals" selectedItems={ this.state.matchBin } removeMatchItem={ this.removeMatchItem }
                      />
                    </div>
                    <div className="col-lg-3">
                      <VMBin header="Ends With" type="endsWith" selectedItems={ this.state.matchBin } removeMatchItem={ this.removeMatchItem }
                      />
                    </div>
                  </div>
                  <Snackbar message={ `${this.state.lastSelectedMatchItem.matchItemName} added to ${this.state.lastSelectedMatchItem.matchBinType}` } autoHideDuration={ 2500 } open={ this.state.sbOpen }
                  onRequestClose={ this.closeSB } />
                </div>
              </Paper>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-3 col-xs-12">
              <FilterablePanel onChange={ this.setFilter.bind(this) } currentItemCount={ availableVMs.length }
              maxItemCount={ 10 } title="Virtual Machine Names" hintText="Name"
              textFieldName="vmNameFilter">
                { availableVMs.map(key => <VMSource key={ key } name={ key } addMatchItem={ this.addMatchItem }
                                          backgroundColor={ ItemColors.vmName.background } labelColor={ ItemColors.vmName.label } type="vmName"
                                          />) }
              </FilterablePanel>
            </div>
            <div className="col-lg-3 col-xs-12">
              <FilterablePanel onChange={ this.setFilter.bind(this) } currentItemCount={ availableOSTypes.length }
              maxItemCount={ 10 } title="Operating System Type" hintText="Type"
              textFieldName="osTypeFilter">
                { availableOSTypes.map(key => <VMSource key={ key } name={ key } addMatchItem={ this.addMatchItem }
                                              backgroundColor={ ItemColors.osType.background } labelColor={ ItemColors.osType.label } type="osType"
                                              />) }
              </FilterablePanel>
            </div>
            <div className="col-lg-3 col-xs-12">
              <FilterablePanel onChange={ this.setFilter.bind(this) } currentItemCount={ availableHypervisors.length }
              maxItemCount={ 10 } title="Hypervisor" hintText="Hypervisor"
              textFieldName="hypervisorFilter">
                { availableHypervisors.map(key => <VMSource key={ key } name={ key } addMatchItem={ this.addMatchItem }
                                                  backgroundColor={ ItemColors.hypervisor.background } labelColor={ ItemColors.hypervisor.label } type="hypervisor"
                                                  />) }
              </FilterablePanel>
            </div>
            <div className="col-lg-3 col-xs-12">
              <FilterablePanel onChange={ this.setFilter.bind(this) } currentItemCount={ availableVMIDs.length }
              maxItemCount={ 10 } title="Virtual Machine ID" hintText="ID"
              textFieldName="vmIDFilter">
                { availableVMIDs.map(key => <VMSource key={ key } name={ key } addMatchItem={ this.addMatchItem }
                                            backgroundColor={ ItemColors.vmID.background } labelColor={ ItemColors.vmID.label } type="vmID"
                                            />) }
              </FilterablePanel>
            </div>
          </div>
        </div>
      </CardText>
    </Card>
    )
  }
}


const boxTarget = {
  drop(props){
    return {
      name: 'Match Bin',
      type: props.type
    };
  }
};
@DropTarget(ItemTypes.BOX, boxTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
}))
class VMBin extends React.Component {
  static propTypes = {
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  getPlaceHolder(isActive){
    if(this.props.selectedItems[ this.props.type ].length == 0) {
      return isActive ? 'Release to place Match Item' : 'Drag Match Item (Name, OS, Hypervisor, ID)'
    }
  }

  render(){
    const {canDrop, isOver, connectDropTarget} = this.props;
    const isActive = canDrop && isOver;


    return connectDropTarget(
      <div>
        <div style={ {  height: '300px',  border: '1px dashed gray',  textAlign: 'center'} }>
          <div className="dashed-header">
            { this.props.header }
          </div>
          <div>
            <span style={ {  lineHeight: '300px'} }></span>
            <div style={ {  'verticalAlign': 'middle',  display: 'inline-block'} }>
              { this.getPlaceHolder(isActive) }
              { this.props.selectedItems[ this.props.type ].map(key => <RaisedButton key={ key.name } label={ key.name } onClick={ this.props.removeMatchItem.bind(this, key.name, key.type, this.props.type) }
                                                                       style={ {  margin: '7px'} } secondary={ true } labelColor={ ItemColors[ key.type ].label }
                                                                       backgroundColor={ ItemColors[ key.type ].background } />) }
            </div>
          </div>
        </div>
      </div>
    );
  }
}


const boxSource = {
  beginDrag(props){
    return {
      name: props.name,
      type: props.type,
      addMatchItem: props.addMatchItem
    };
  },
  endDrag(props, monitor){
    const item = monitor.getItem();
    const dropResult = monitor.getDropResult();

    if(dropResult) {
      item.addMatchItem(item.name, item.type, dropResult.type);
    }
  }
};

@DragSource(ItemTypes.BOX, boxSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
}))
class VMSource extends React.Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired
  };

  render(){
    const {name, addMatchItem} = this.props;
    const {isDragging, connectDragSource} = this.props;
    const opacity = isDragging ? 0.4 : 1;

    return (
    connectDragSource(
      <div style={ {  display: 'inline-block',  margin: 6,  opacity} }>
        <RaisedButton label={ name } style={ {  opacity} } backgroundColor={ this.props.backgroundColor }
        labelColor={ this.props.labelColor } />
      </div>
    )
    );
  }
}

@autobind
class FilterablePanel extends React.Component {

  render(){
    var overflowMessage = (
    <div style={ {  padding: 15,  textAlign: 'center'} }>
      <p>Too many items (
        { this.props.currentItemCount }). Please type a filter...</p>
    </div>
    )

    var panel = (
    <div style={ {  padding: 15,  textAlign: 'center'} }>
      { this.props.children }
    </div>
    )

    var header = (

    <Toolbar>
      <ToolbarGroup>
        <ToolbarTitle text={ this.props.title } />
      </ToolbarGroup>
    </Toolbar>
    )

    return (
    <Paper zDepth={ 3 }>
      { this.props.title ? header : null }
      { this.props.currentItemCount > this.props.maxItemCount ? overflowMessage : panel }
      <Toolbar>
        <ToolbarGroup>
          <TextField hintText={ this.props.hintText } onChange={ this.props.onChange } name={ this.props.textFieldName }
          />
        </ToolbarGroup>
      </Toolbar>
    </Paper>
    )
  }

}

export default USegEpg;
