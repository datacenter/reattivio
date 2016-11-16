/*
  EpgConnections
*/
import React, { PropTypes } from 'react';
import autobind from 'autobind-decorator';
import reactMixin from 'react-mixin';
import ImageLoader from 'react-imageloader';
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
import RefreshIndicator from 'material-ui/lib/refresh-indicator';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import FMUI from 'formsy-material-ui';
const {FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, FormsySelect, FormsyText, FormsyTime, FormsyToggle} = FMUI;
import PathBinding from './PathBinding'
import VMMBinding from './VMMBinding'
import CircularProgress from 'material-ui/lib/circular-progress';

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
                      <img style={ {  height: 337} } src="./build/media/path_binding.png" />
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
                      <img style={ {  height: 337} } src="./build/media/node_binding.png" />
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
                      <img style={ {  height: 337} } src="./build/media/vmm_binding.png" />
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
                      <img style={ {  height: 337} } src="./build/media/phys_binding.png" />
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
