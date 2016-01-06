/*
  Epgs
*/
import React, { PropTypes } from 'react';
import autobind from 'autobind-decorator';
import reactMixin from 'react-mixin';
import ImageLoader from 'react-imageloader';
const helpers = require('../../helpers');

import $ from 'jquery';
import scrollto from 'jquery.scrollto';
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
var ReactGridLayout = require('react-grid-layout');
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
const RefreshIndicator = require('material-ui/lib/refresh-indicator');
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')

const FMUI = require('formsy-material-ui');
const {FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, FormsySelect, FormsyText, FormsyTime, FormsyToggle} = FMUI;
const PathBinding = require('./PathBinding')
const VMMBinding = require('./VMMBinding')
const CircularProgress = require('material-ui/lib/circular-progress');

@autobind
class EpgConnections extends React.Component {

  constructor(){
    super();
    this.state = {
      showVMMBindingDialog: false,
      showPathBindingDialog: false,
    };
  }


  openPathBindingDialog(){
    this.setState({
      showPathBindingDialog: true
    });
    $(window).scrollTo(0, 700)
  }

  closePathBindingDialog(){
    this.setState({
      showPathBindingDialog: false
    });
  }

  openVMMBindingDialog(){
    this.setState({
      showVMMBindingDialog: true
    });
    $(window).scrollTo(0, 700)
  }

  closeVMMBindingDialog(){
    this.setState({
      showVMMBindingDialog: false
    });
  }

  renderShowPathBinding(){
    return (
    <ReactCSSTransitionGroup transitionAppear={ true } transitionName="longer"
    transitionAppearTimeout={ 800 } transitionEnterTimeout={ 800 }
    transitionLeaveTimeout={ 500 }>
      { this.state.showPathBindingDialog ? <PathBinding key={ 0 } onClose={ this.closePathBindingDialog } {...this.props}
                                           /> : null }
    </ReactCSSTransitionGroup>
    )
  }

  renderShowVMMBinding(){
    return (
    <ReactCSSTransitionGroup transitionAppear={ true } transitionName="longer"
    transitionAppearTimeout={ 800 } transitionEnterTimeout={ 800 }
    transitionLeaveTimeout={ 500 }>
      { this.state.showVMMBindingDialog ? <VMMBinding key={ 0 } onClose={ this.closeVMMBindingDialog } {...this.props}/> : null }
    </ReactCSSTransitionGroup>
    )
  }

  render(){


    var badgeIcon = (
    <div style={ {  display: 'inline'} }>
      <FloatingActionButton mini={ true } secondary={ true } onClick={ this.props.close }>
        <FontIcon className="material-icons">chevron_left</FontIcon>
      </FloatingActionButton>
      <span style={ {  marginLeft: 15} }>{ `Connections to EPG ${this.props.selectedEpg}` }</span>
    </div>
    )


    return (
    <div>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
          { this.renderShowPathBinding() }
          { this.renderShowVMMBinding() }
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12">
          <Card initiallyExpanded={ true }>
            <CardTitle title={ badgeIcon } subtitle={ <span style={ {  marginLeft: 56} }>How do external devices connect to this EPG?</span> } />
            <CardText expandable={ true }>
              <div className="row center-sm">
                <div className="col-lg-3 col-md-3 col-sm-8 col-xs-12" style={ {  marginBottom: 15} }>
                  <Card>
                    <CardMedia overlay={ <CardTitle title="Path Bindings" subtitle="External network connected to a port, PC, or vPC"
                                         /> }>
                      <img style={ {  height: 337} } src="/build/media/path_new.png" />
                    </CardMedia>
                    <CardActions>
                      <FlatButton label="New" onClick={ this.openPathBindingDialog } />
                      <FlatButton label="View All" />
                    </CardActions>
                  </Card>
                </div>
                <div className="col-lg-3 col-md-3 col-sm-8 col-xs-12" style={ {  marginBottom: 15} }>
                  <Card>
                    <CardMedia overlay={ <CardTitle title="Node Bindings" subtitle="External network connected to all ports on a leaf"
                                         /> }>
                      <img style={ {  height: 337} } src="/build/media/node_new_edited.png" />
                    </CardMedia>
                    <CardActions>
                      <FlatButton label="New" />
                      <FlatButton label="View All" />
                    </CardActions>
                  </Card>
                </div>
                <div className="col-lg-3 col-md-3 col-sm-8 col-xs-12" style={ {  marginBottom: 15} }>
                  <Card>
                    <CardMedia overlay={ <CardTitle title="Virtual Domain Bindings" subtitle="Dynamic virtual networking (vCenter, HyperV, OpenStack, Docker)"
                                         /> }>
                      <img style={ {  height: 337} } src="/build/media/vmm_new.png" />
                    </CardMedia>
                    <CardActions>
                      <FlatButton label="New" onClick={ this.openVMMBindingDialog } />
                      <FlatButton label="View All" />
                    </CardActions>
                  </Card>
                </div>
                <div className="col-lg-3 col-md-3 col-sm-8 col-xs-12" style={ {  marginBottom: 15} }>
                  <Card>
                    <CardMedia overlay={ <CardTitle title="Physical Domain Bindings" subtitle="Specify physical switch ports and vlans this Tenant can use"
                                         /> }>
                      <img style={ {  height: 337} } src="/build/media/phys_new.png" />
                    </CardMedia>
                    <CardActions>
                      <FlatButton label="New" onClick={ this.openVMMBindingDialog } />
                      <FlatButton label="View All" />
                    </CardActions>
                  </Card>
                </div>
              </div>
            </CardText>
          </Card>
        </div>
      </div>
    </div>
    )
  }
}

export default EpgConnections;
