/*
  Applications
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

import helpers from '../helpers';
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
import Endpoints from './epg/Endpoints';

import EpgTable from './epg/EpgTable';
import USegEpgTable from './epg/USegEpgTable';

@
autobind
class Applications extends React.Component {


  constructor(){
    super();
    this.state = {
      newAp: false
    };
  }

  componentDidUpdate(prevProps, prevState){
    if(!prevState.newAp && this.state.newAp) {
      this.refs.newApName.focus()
    }
  }

  showNewAp(){
    this.setState({
      newAp: true
    })
  }
  cancelNewAp(force){
    if(this.refs.newApName.getValue().length == 0 || force) {
      this.setState({
        newAp: false
      })
    }
  }
  saveNewAp(){
    const newApName = this.refs.newApName.getValue()
    let appDn = `${this.props.tenantDn}/ap-${newApName}`

    let data = {
      fvAp: {
        attributes: {
          name: newApName,
        }
      }
    };

    this.context.pushConfiguration(appDn, data)
    this.setState({
      newAp: false
    })
  }

  render(){
    if(this.state.newAp) {

      var badgeIcon = <div>
                        <FloatingActionButton mini={ true } secondary={ true }>
                          <FontIcon className="material-icons">info_outline</FontIcon>
                        </FloatingActionButton>
                      </div>
    } else {
      var badgeIcon = <div ref="addEl">
                        <FloatingActionButton mini={ true } secondary={ true } onClick={ this.showNewAp }>
                          <FontIcon className="material-icons">add</FontIcon>
                        </FloatingActionButton>
                      </div>
    }

    return <Card>
             <div style={ {  position: 'relative'} }>
               <div style={ {  position: 'absolute',  'top': 2,  'left': 5} }>
                 { badgeIcon }
                 <Popover open={ this.state.newAp } anchorEl={ this.refs.addEl } anchorOrigin={ {  "horizontal": "right",  "vertical": "center"} }
                 zDepth={ 3 }>
                   <div style={ {  padding: 20} }>
                     <TextField hintText={ "Give your new Application a name..." } onBlur={ this.cancelNewAp.bind(this, false) } ref="newApName"
                     keyboardFocused={ true } style={ {  marginLeft: 10,  width: 400} } />
                     <br />
                     <div style={ {  float: 'right',  paddingTop: 10,  paddingBottom: 10} }>
                       <FlatButton label="Cancel" onTouchTap={ this.cancelNewAp.bind(this, true) } />
                       <FlatButton label="Create Application" primary={ true } onTouchTap={ this.saveNewAp }
                       />
                     </div>
                     <br />
                   </div>
                 </Popover>
               </div>
             </div>
             <Tabs inkBarStyle={ {  height: 5} }>
               { this.props.applications.map(application => <Tab onActive={ this.props.onSelectAp } label={ application.attributes.name } key={ application.attributes.name }>
                                                              <Application key={ application.attributes.name } application={ application } {...this.props}
                                                              />
                                                            </Tab>
                 ) }
             </Tabs>
           </Card>
  }
}
Applications.contextTypes = {
  pushConfiguration: React.PropTypes.func
};

@
autobind
class Application extends React.Component {

  constructor(){
    super();
  }

  render(){
    return (
    <div className="row">
      <div className="row">
        <div className="col-lg-12">
          <EpgTable {...this.props} />
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12">
          <USegEpgTable {...this.props} />
        </div>
      </div>
    </div>
    )
  }

}
Application.contextTypes = {
  pushConfiguration: React.PropTypes.func
};

reactMixin.onClass(Application, LinkedStateMixin);

export default Applications;
