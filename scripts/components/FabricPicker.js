/* 
  FabricPicker
  This will let us make <FabricPicker/>
*/

import React from 'react';
import { History } from 'react-router';
import h from '../helpers';
import reactMixin from 'react-mixin';
import autobind from 'autobind-decorator';

import ThemeManager from 'material-ui/lib/styles/theme-manager';
import LightRawTheme from 'material-ui/lib/styles/raw-themes/light-raw-theme';
import Paper from 'material-ui/lib/paper';
import Avatar from 'material-ui/lib/avatar';
import IconButton from 'material-ui/lib/icon-button';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardExpandable from 'material-ui/lib/card/card-expandable';
import CardHeader from 'material-ui/lib/card/card-header';
import CardMedia from 'material-ui/lib/card/card-media';
import CardText from 'material-ui/lib/card/card-text';
import CardTitle from 'material-ui/lib/card/card-title';

import List from 'material-ui/lib/lists/list';
import Divider from 'material-ui/lib/divider';
import ListItem from 'material-ui/lib/lists/list-item';
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';

import Colors from 'material-ui/lib/styles/colors';

import FMUI from 'formsy-material-ui';
const {FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, FormsySelect, FormsyText, FormsyTime, FormsyToggle} = FMUI;

@autobind
class FabricPicker extends React.Component {
  constructor(){
    super();
    this.state = {
      canSubmit: false,
      muiTheme: ThemeManager.getMuiTheme(LightRawTheme),
      fabrics: {}
    };
  }
  componentWillMount(){
    let newMuiTheme = ThemeManager.modifyRawThemePalette(this.state.muiTheme, {
      accent1Color: Colors.lightBlue700,
      primary1Color: Colors.blueGrey400
    });

    let fabrics = JSON.parse(localStorage.getItem('fabrics')) || {}

    this.setState({
      muiTheme: newMuiTheme,
      fabrics: fabrics
    });
  }
  getChildContext(){
    return {
      muiTheme: this.state.muiTheme,
      history: React.PropTypes.func
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
    event.preventDefault();
    let fabrics = this.state.fabrics
    fabrics[ model.nickname ] = model
    console.log(fabrics)

    localStorage.setItem('fabrics', JSON.stringify(fabrics));
    this.context.history.pushState(null, '/fabric/' + model.nickname);
  }

  chooseFabric(nickname){
    this.context.history.pushState(null, '/fabric/' + nickname);
  }

  removeFabric(nickname, event){
    event.preventDefault()
    event.stopPropagation()
    let fabrics = this.state.fabrics
    delete fabrics[ nickname ]
    console.log(fabrics)

    localStorage.setItem('fabrics', JSON.stringify(fabrics));
    this.setState({
      fabrics
    })
  }

  getFabric(fabric){
    let avatar = <Avatar backgroundColor={ Colors.lightBlue700 }>
                   { fabric.nickname[ 0 ].toUpperCase() }
                 </Avatar>
    let rightIcon = <IconButton onClick={ this.removeFabric.bind(this, fabric.nickname) } iconClassName="material-icons" tooltipPosition="top-center"
                    tooltip="Forget Fabric">close</IconButton>

    let item = (
    <ListItem key={ fabric.nickname } secondaryText={ `${fabric.address} ${fabric.username}` } onClick={ this.chooseFabric.bind(this, fabric.nickname) }
    rightIconButton={ rightIcon }>
      { fabric.nickname }
    </ListItem>
    )
    return item
  }

  render(){
    return (
    <div className="fabric-picker-container" style={ {  minHeight: '100%'} }>
      <div className="row center-lg middle-lg middle-md middle-sm top-xs" style={ {  minHeight: '100%'} }>
        <div className="col-lg-8 col-md-6 col-sm-8 col-xs-12">
          <div style={ {  textAlign: 'left',  marginBottom: 15} }>
            <Card initiallyExpanded={ false }>
              <CardHeader title="Having trouble connecting to your fabric?" subtitle="Solution in here..."
              avatar={ <Avatar style={ {  color: Colors.fullWhite} }>?</Avatar> } actAsExpander={ true } showExpandableButton={ true }
              />
              <CardText expandable={ true }>
                <CardTitle title="1. Accept the APIC certificate" subtitle="Navigate to your APIC and accept the security certificate permanently"
                style={ {  fontSize: 5} } />
                <img src="build/media/step_1.png" />
                <CardTitle title="2. Set Allow Origins field to *" subtitle="Under Fabric > Fabric Policies > Pod Policies > Policies > Management Access > default"
                />
                <img src="build/media/step_2.png" />
              </CardText>
            </Card>
          </div>
          <Card>
            <CardText style={ {  padding: 100} }>
              <div className="row">
                <div className="col-lg-5">
                  <CardTitle title="Enter Fabric Details" />
                  <Formsy.Form onValid={ this.enableButton } onInvalid={ this.disableButton } onValidSubmit={ this.submitForm.bind(this) }>
                    <input type="text" name="usernameFake" style={ {  display: 'none'} } />
                    <input name="passwordFake" type="password" style={ {  display: 'none'} } />
                    <FormsyText required name="nickname" hintText="Nickname" floatingLabelText="Nickname"
                    />
                    <FormsyText required name="address" validationError="Must be a valid IP address or DNS name"
                    hintText="Address" floatingLabelText="Address" />
                    <br />
                    <FormsyText required name="username" hintText="Username" floatingLabelText="Username"
                    />
                    <br />
                    <FormsyText required name="password" hintText="Password" floatingLabelText="Password"
                    type="password" />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <RaisedButton disabled={ !this.state.canSubmit } type="submit" label="Save and Connect to ACI Fabric"
                    primary={ true } />
                  </Formsy.Form>
                </div>
                <div className="col-lg-2">
                  <CardTitle title="Or" />
                </div>
                <div className="col-lg-5">
                  <CardTitle title="Choose from known Fabrics" />
                  <div style={ {  maxHeight: 300,  overflowY: 'scroll'} }>
                    <List>
                      { Object.keys(this.state.fabrics).map(key => {
                          var fabric = this.state.fabrics[ key ]
                          return this.getFabric(fabric)
                        }) }
                    </List>
                  </div>
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
FabricPicker.childContextTypes = {
  muiTheme: React.PropTypes.object,
  history: React.PropTypes.func
};

reactMixin.onClass(FabricPicker, History);

export default FabricPicker;
