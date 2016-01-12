/*
  Endpoints
*/
import React, { PropTypes } from 'react';
import autobind from 'autobind-decorator';
import reactMixin from 'react-mixin';

import helpers from '../../helpers';

import $ from 'jquery';
import scrollto from 'jquery.scrollto';
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

import Divider from 'material-ui/lib/divider';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import Colors from 'material-ui/lib/styles/colors';

import IconButton from 'material-ui/lib/icon-button';

import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableFooter from 'material-ui/lib/table/table-footer';
import TableHeader from 'material-ui/lib/table/table-header';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';
import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';

import FontIcon from 'material-ui/lib/font-icon';
import Badge from 'material-ui/lib/badge';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import CircularProgress from 'material-ui/lib/circular-progress';


@autobind
class Endpoints extends React.Component {

  constructor(){
    super();
    this.state = {
      loaded: false,
      endpoints: []
    };
  }

  updateEndpoints(result){
    result = result.imdata
    let endpoints = result.map(obj => {
      let ep = obj.fvCEp
      let children = ep.children
      let attributes = ep.attributes

      let paths = helpers.parseType(children, 'fvRsCEpToPathEp') || [];
      paths = paths.map(path => path.attributes.tDn)

      return {
        name: attributes.name,
        ip: attributes.ip,
        mac: attributes.mac,
        learn: attributes.lcC,
        paths: paths,
      }
    })
    this.setState({
      endpoints,
      loaded: true
    })
  }

  componentDidMount(){
    let {tenantDn, application, epg} = this.props
    let appName = application.attributes.name
    $.ajax({
      url: `https://${this.context.fabric.address}/api/mo/${tenantDn}/ap-${appName}/epg-${epg}.json?query-target=children&target-subtree-class=fvCEp&rsp-subtree=children&rsp-subtree-class=fvRsVm,fvRsHyper,fvRsCEpToPathEp,fvIp`,
      type: "GET",
      dataType: "json",
      success: this.updateEndpoints
    })
  }

  componentWillReceiveProps(nextProps){
    if(this.props.epg != nextProps.epg) {
      this.setState({
        loaded: false
      })
      let {tenantDn, application, epg} = nextProps
      let appName = application.attributes.name
      $.ajax({
        url: `https://${this.context.fabric.address}/api/mo/${tenantDn}/ap-${appName}/epg-${epg}.json?query-target=children&target-subtree-class=fvCEp&rsp-subtree=children&rsp-subtree-class=fvRsVm,fvRsHyper,fvRsCEpToPathEp,fvIp`,
        type: "GET",
        dataType: "json",
        success: this.updateEndpoints
      })
    }
  }


  render(){

    var loading = <div className="row center-lg">
                    <CircularProgress mode="indeterminate" />
                  </div>

    var endpoints = (
    <Table selectable={ false } multiSelectable={ false }>
      <TableHeader displaySelectAll={ false } adjustForCheckbox={ false }>
        <TableRow>
          <TableHeaderColumn style={ {  width: '17%'} } tooltip='Endpoint named (if available) learned from VMM'>Endpoint</TableHeaderColumn>
          <TableHeaderColumn style={ {  width: '11%'} } tooltip='IP Address (if unavailable L3 learning is disabled or EP is L2)'>IP</TableHeaderColumn>
          <TableHeaderColumn style={ {  width: '17%'} } tooltip='MAC Address'>MAC</TableHeaderColumn>
          <TableHeaderColumn style={ {  width: '15%'} } tooltip='How has the fabric learned about this endpoint?'>Learn Source</TableHeaderColumn>
          <TableHeaderColumn tooltip='Physical paths this endpoint is available behind'>Paths</TableHeaderColumn>
        </TableRow>
      </TableHeader>
      <TableBody displayRowCheckbox={ false } showRowHover={ this.state.showRowHover }
      stripedRows={ this.state.stripedRows }>
        { this.state.endpoints.map((ep) => {
            return (
            <TableRow key={ ep.mac }>
              <TableRowColumn style={ {  width: '17%'} }>
                { ep.name }
              </TableRowColumn>
              <TableRowColumn style={ {  width: '11%'} }>
                { ep.ip }
              </TableRowColumn>
              <TableRowColumn style={ {  width: '17%'} }>
                { ep.mac }
              </TableRowColumn>
              <TableRowColumn style={ {  width: '15%'} }>
                { ep.learn }
              </TableRowColumn>
              <TableRowColumn>
                { ep.paths.map(path => <p key={ path }>
                                         { path }
                                         <br/>
                                       </p>) }
              </TableRowColumn>
            </TableRow>)
          }) }
      </TableBody>
    </Table>
    )

    return (
    <div style={ {  maxWidth: 1000,  paddingBottom: 25} }>
      <CardTitle title={ `Endpoints for EPG ${this.props.epg}` } />
      { this.state.loaded ? endpoints : loading }
    </div>
    )
  }
}
Endpoints.contextTypes = {
  fabric: React.PropTypes.object
};

export default Endpoints;
