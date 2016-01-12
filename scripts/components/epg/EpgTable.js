/*
  EpgTable
*/
import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import Paper from 'material-ui/lib/paper';
import Badge from 'material-ui/lib/badge';
import reactMixin from 'react-mixin';
import LinkedStateMixin from 'react-addons-linked-state-mixin';


import List from 'material-ui/lib/lists/list';
import Divider from 'material-ui/lib/divider';
import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';
import Colors from 'material-ui/lib/styles/colors';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableFooter from 'material-ui/lib/table/table-footer';
import TableHeader from 'material-ui/lib/table/table-header';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';
import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';

import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardExpandable from 'material-ui/lib/card/card-expandable';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardText from 'material-ui/lib/card/card-text';
import CardTitle from 'material-ui/lib/card/card-title';

import helpers from '../../helpers';
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';
import Dialog from 'material-ui/lib/dialog';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import FontIcon from 'material-ui/lib/font-icon';
import IconButton from 'material-ui/lib/icon-button';

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import TextField from 'material-ui/lib/text-field';

import Popover from 'material-ui/lib/popover/popover';
import Endpoints from './Endpoints';




@autobind
class EpgTable extends React.Component {

  constructor(){
    super();
    this.state = {
      open: false,
      epgs: [],
      activeRow: "",
      activeRowId: -1,
      activeEl: null,
      newEpg: false,
      filterEpg: ''
    };
    this.timer = 0
  }

  componentDidUpdate(prevProps, prevState){
    if(!prevState.newEpg && this.state.newEpg) {
      this.refs.newEpgName.focus()
    }
  }
  selectEpg(rows){
    if(rows.length > 0) {
      var epgs = helpers.parseType(this.props.application.children, 'fvAEPg');
      var uSegEpgs = epgs.filter(epg => epg.attributes.isAttrBasedEPg == 'yes')
      epgs = epgs.filter(epg => epg.attributes.isAttrBasedEPg == 'no')

      var selectedEpgId = rows[ 0 ];
      var epg = epgs[ selectedEpgId ];
      var bd = helpers.parseType(epg.children, 'fvRsBd')[ 0 ];

      this.props.onSelectEpg(this.props.application.attributes.name, epg.attributes.name, bd.attributes.tnFvBDName)

    } else {
      this.props.onSelectEpg('', '', '')
    }
  }
  onRowHoverExit(row){
    let timer = this.timer
    if(timer != 0) {
      clearTimeout(timer)
      this.timer = 0
    //console.log(`Clearing timer=${timer}, oldRow=${row}`)
    }

    if(this.state.activeRow == "") {
      this.setState({
        activeRow: "",
        activeRowId: -1,
      })
    }
  }

  getEndpoints(row){
    var epgs = helpers.parseType(this.props.application.children, 'fvAEPg');
    var uSegEpgs = epgs.filter(epg => epg.attributes.isAttrBasedEPg == 'yes')
    epgs = epgs.filter(epg => epg.attributes.isAttrBasedEPg == 'no')
    var selectedEpgId = row;
    var epg = epgs[ selectedEpgId ];

    this.setState({
      activeRow: epg.attributes.name,
      activeEl: ReactDOM.findDOMNode(this.refs[ epg.attributes.name ])
    })
  }

  hideEndpoints(reason){
    this.setState({
      activeRow: "",
      activeRowId: -1
    })
  }

  onRowHover(row){
    var {activeRowId} = this.state
    var timer = this.timer

    if(timer == 0 && row != this.state.activeRowId) {

      this.setState({
        activeRowId: row
      })

      let timer = setTimeout(this.getEndpoints.bind(this, row), 1000)
      this.timer = timer
    //console.log(`Setting timer=${timer}, newRow=${row}, oldrow=${this.state.activeRowId}`)
    }
  }
  showNewEpg(){
    this.setState({
      newEpg: true
    })
  }
  saveNewEpg(){
    let appDn = `${this.props.tenantDn}/ap-${this.props.application.attributes.name}`

    let data = {
      fvAEPg: {
        attributes: {
          name: this.refs.newEpgName.getValue(),
          isAttrBasedEPg: "no"
        },
        children: [
          {
            "fvRsBd": {
              "attributes": {
                "tnFvBDName": this.props.selectedBd
              }
            }
          }
        ]
      }
    };

    this.context.pushConfiguration(appDn, data)
    this.setState({
      newEpg: false
    })
  }

  cancelNewEpg(){

    if(this.refs.newEpgName.getValue().length == 0) {
      this.setState({
        newEpg: false
      })
    }
  }
  getEpgRow(epg){
    if(epg.attributes.name.toLowerCase().includes(this.state.filterEpg.toLowerCase() || '')) {
      var bd = helpers.parseType(epg.children, 'fvRsBd')[ 0 ];
      var contractProvCount = helpers.parseType(epg.children, 'fvRsProv').length
      var contractConsCount = helpers.parseType(epg.children, 'fvRsCons').length
      var pathBindingsCount = helpers.parseType(epg.children, 'fvRsPathAtt').length
      var nodeBindingsCount = helpers.parseType(epg.children, 'fvRsNodeAtt').length
      var domains = helpers.parseType(epg.children, 'fvRsDomAtt')
      var physDomsCount = domains.filter(dom => dom.attributes.tDn.includes('phys')).length
      var vmmDomsCount = domains.length - physDomsCount
      return (
      <TableRow selected={ epg.attributes.name == this.props.selectedEpg ? true : false } key={ epg.attributes.name } ref={ epg.attributes.name }>
        <TableRowColumn>
          { epg.attributes.name }
        </TableRowColumn>
        <TableRowColumn>
          { bd.attributes.tnFvBDName }
        </TableRowColumn>
        <TableRowColumn>
          { contractProvCount }<span> | </span>
          { contractConsCount }
        </TableRowColumn>
        <TableRowColumn>
          { pathBindingsCount }<span> | </span>
          { nodeBindingsCount }
        </TableRowColumn>
        <TableRowColumn>
          { vmmDomsCount }<span> | </span>
          { physDomsCount }
        </TableRowColumn>
      </TableRow>
      )
    }
  }

  render(){

    if(this.props.application.children) {
      var epgs = helpers.parseType(this.props.application.children, 'fvAEPg');
      var uSegEpgs = epgs.filter(epg => epg.attributes.isAttrBasedEPg == 'yes')
      epgs = epgs.filter(epg => epg.attributes.isAttrBasedEPg == 'no')
    } else {
      epgs = []
      uSegEpgs = []
    }

    var newEpgText = (
    <ToolbarGroup float="right">
      <TextField hintText={ "Give your new EPG a name..." } onBlur={ this.cancelNewEpg } ref="newEpgName"
      style={ {  marginTop: 5,  width: 400} } />
    </ToolbarGroup>
    )

    if(this.state.newEpg && this.props.selectedBd) {
      var epgBadgeIcon = (
      <FloatingActionButton mini={ true } primary={ true } backgroundColor={ Colors.green500 }
      onClick={ this.saveNewEpg } disabled={ this.props.selectedBd == '' ? true : false }>
        <FontIcon className="material-icons">check</FontIcon>
      </FloatingActionButton>
      )
    } else {
      var epgBadgeIcon = (
      <FloatingActionButton mini={ true } primary={ true } onClick={ this.showNewEpg }
      disabled={ this.props.selectedBd == '' ? true : false }>
        <FontIcon className="material-icons">add</FontIcon>
      </FloatingActionButton>
      )
    }

    return (
    <Paper zDepth={ 3 } style={ {  margin: 25} }>
      <div style={ {  position: 'relative'} }>
        <div style={ {  position: 'absolute',  'top': -15,  'right': 0} }>
          { epgBadgeIcon }
        </div>
      </div>
      <Popover open={ this.state.activeRow == "" ? false : true } onRequestClose={ this.hideEndpoints } anchorEl={ this.state.activeEl }
      anchorOrigin={ {  "horizontal": "middle",  "vertical": "center"} } targetOrigin={ {  "horizontal": "left",  "vertical": "top"} } zDepth={ 3 }
      useLayerForClickAway={ false }>
        <div style={ {  padding: 20} }>
          <div style={ {  float: 'right',  paddingTop: 10,  paddingBottom: 10} }>
            <Endpoints epg={ this.state.activeRow } application={ this.props.application } tenantDn={ this.props.tenantDn }
            />
          </div>
          <br />
        </div>
      </Popover>
      <Toolbar>
        <ToolbarGroup>
          <ToolbarTitle text="End Point Groups" title="Classify end points based on Layer 2 paths and Virtual Domains"
          />
        </ToolbarGroup>
        { this.state.newEpg && this.props.selectedBd ? newEpgText : null }
      </Toolbar>
      <Table onRowSelection={ this.selectEpg } onRowHover={ this.onRowHover } onRowHoverExit={ this.onRowHoverExit }>
        <TableHeader displaySelectAll={ false } adjustForCheckbox={ false }>
          <TableRow>
            <TableHeaderColumn tooltip='End Point Group name'>Name</TableHeaderColumn>
            <TableHeaderColumn tooltip='Layer two flooding domain'>Bridge Domain</TableHeaderColumn>
            <TableHeaderColumn tooltip='Contracts count'>Contracts (Provided | Consumed)</TableHeaderColumn>
            <TableHeaderColumn tooltip=''>Network Connections (Path | Leaf)</TableHeaderColumn>
            <TableHeaderColumn tooltip=''>Domain Bindings (Virtual | Physical)</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={ false } deselectOnClickaway={ false }
        showRowHover={ true }>
          { epgs.map(this.getEpgRow) } </TableBody>
      </Table>
      <Toolbar>
        <ToolbarGroup>
          <TextField hintText="Filter Results" valueLink={ this.linkState('filterEpg') } />
        </ToolbarGroup>
        <ToolbarGroup float="right">
          <RaisedButton disabled={ this.props.selectedEpg == '' } primary={ true } onClick={ this.props.onSelectEpgConnection }
          label="Network Connections" />
        </ToolbarGroup>
      </Toolbar>
    </Paper>
    )
  }
}

EpgTable.contextTypes = {
  pushConfiguration: React.PropTypes.func
};

reactMixin.onClass(EpgTable, LinkedStateMixin);
export default EpgTable;
