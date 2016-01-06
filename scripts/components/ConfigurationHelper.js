/*
  ConfigurationHelper
*/

import React from 'react';
import autobind from 'autobind-decorator';
import Paper from 'material-ui/lib/paper';
import $ from 'jquery';
const helpers = require('../helpers');
const List = require('material-ui/lib/lists/list');
const ListDivider = require('material-ui/lib/lists/list-divider');
const ListItem = require('material-ui/lib/lists/list-item');
const Avatar = require('material-ui/lib/avatar');
const Colors = require('material-ui/src/styles/colors');
const FloatingActionButton = require('material-ui/lib/floating-action-button');
const FontIcon = require('material-ui/lib/font-icon');
const IconButton = require('material-ui/lib/icon-button');
const Card = require('material-ui/lib/card/card');
const CardExpandable = require('material-ui/lib/card/card-expandable');
const CardHeader = require('material-ui/lib/card/card-header');
const CardText = require('material-ui/lib/card/card-text');
const CardTitle = require('material-ui/lib/card/card-title');
const Dialog = require('material-ui/lib/dialog');
const LinearProgress = require('material-ui/lib/linear-progress');
const Snackbar = require('material-ui/lib/snackbar');
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

@
autobind
class ConfigurationHelper extends React.Component {

  constructor(){
    super();
    this.state = {
      showMore: false,
      configStage: 0,
      verifyCountdown: 15,
      verifyCountdownTimer: null,
      configTime: null,
      faults: [],
      apiError: null,
      curDn: '',
      curData: {},
      snapshot: null,
    };
  }

  showMore(){
    this.setState({
      showMore: !this.state.showMore
    })
  }

  instantRollback(){
    // Handle performing the rollback
    // TODO: Download a copy of the to-be-modified object
    //       prior to performing the configuration push
    console.log("Performing rollback")

    /*esfmt-ignore-start*/
    var [dn, data] = this.props.configStack[0]
    /*esfmt-ignore-end*/

    $.ajax({
      url: `https://${this.props.fabric.address}/api/mo/${dn}.json`,
      type: "POST",
      data: JSON.stringify(this.state.snapshot),
      dataType: "json",
      xhrFields: {
        withCredentials: true
      },
      success: () => this.setState({
          configStage: -2
        })
    })
  }

  handleConfigResponse(result){
    if(result.imdata[ 0 ] && result.imdata[ 0 ].error) {
      let error = result.imdata[ 0 ].error
      console.log('Some sort of configuration error')
      console.log(error)
      this.setState({
        configStage: -1,
        apiError: error.attributes.text
      })
      return
    }

    setTimeout(this.verifyFaults, 10)
  }

  getRollbackSnapshot(){

    /*esfmt-ignore-start*/
    var [dn, data] = this.props.configStack[0]
    this.setState({ curDn: dn, curData: data})
    /*esfmt-ignore-end*/

    this.setState({
      configStage: 1,
      configTime: new Date()
    })

    this.props.mini ? this.refs.snackbar.show() : null

    // Get a copy of the MO currently
    $.ajax({
      url: `https://${this.props.fabric.address}/api/mo/${dn}.json?rsp-prop-include=config-only`,
      type: "GET",
      dataType: "json",
      xhrFields: {
        withCredentials: true
      },
      success: this.postConfiguration
    })
  }

  postConfiguration(snapshot){
    this.setState({
      snapshot: snapshot.imdata[ 0 ]
    })

    /*esfmt-ignore-start*/
    var [dn, data] = this.props.configStack[0]
    /*esfmt-ignore-end*/

    $.ajax({
      url: `https://${this.props.fabric.address}/api/mo/${dn}.json`,
      type: "POST",
      data: JSON.stringify(data),
      dataType: "json",
      xhrFields: {
        withCredentials: true
      },
      success: this.handleConfigResponse
    })
  }

  verifyFaults(){
    this.setState({
      configStage: 2,
      verifyCountdown: 30,
      verifyCountdownTimer: setInterval(() => this.setState({
          verifyCountdown: this.state.verifyCountdown - 1
        }), 100)
    })

    setTimeout(this.collectFaults, 3100)
  }

  collectFaults(){
    // Build a Wilcard match to get todays faults
    // ES7 doesn't have built in interger padding so it must
    // be faked with a string slice
    var d = new Date(this.state.configTime.getTime() - this.props.serverTimeZoneOffset)
    var paddedMonth = ("0" + d.getMonth() + 1).slice(-2)
    var paddedDate = ("0" + d.getDate()).slice(-2)
    var configHour = `${d.getFullYear()}-${paddedMonth}-${paddedDate}T${d.getHours()}`

    //Debugging
    configHour = ''

    $.ajax({
      url: `https://${this.props.fabric.address}/api/mo/${this.state.curDn}.json?&query-target=self&rsp-subtree=full&rsp-subtree-include=faults,no-scoped&rsp-subtree-filter=and(wcard(faultDelegate.created,"${configHour}"))`,
      type: "GET",
      dataType: "json",
      xhrFields: {
        withCredentials: true
      },
      success: this.reportFaults
    })
  }

  reportFaults(faults){
    var d = new Date(this.state.configTime.getTime() - this.props.serverTimeZoneOffset)
    var newFaults = []
    faults = faults.imdata

    faults.map(fault => {
      let faultDate = new Date(fault.faultDelegate.attributes.created)
      if(faultDate >= d) {
        console.log(d, faultDate, fault.faultDelegate.attributes.descr)
        newFaults.push(fault.faultDelegate)
      }
    })

    clearInterval(this.state.verifyCountdownTimer)
    this.setState({
      faults: newFaults,
      configStage: 3,
      verifyCountdown: 30,
      verifyCountdownTimer: null
    })
  }


  componentWillReceiveProps(nextProps){
    if(nextProps.configStack.length > 0) {
      this.setState({
        configStage: 0,
        apiError: null,
        faults: []
      })
      setTimeout(this.getRollbackSnapshot, 10)
    }
  }

  renderShowMore(){

    if(this.props.configStack.length > 0) {
      var cs = this.props.configStack[ 0 ]
      var [dn, data] = cs
      return <Card style={ {  marginTop: 15,  maxHeight: 400,  overflowY: 'scroll'} }>
               <CardTitle title={ dn } style={ {  paddingBottom: 0} } />
               <CardText style={ {  paddingTop: 5} }>
                 <pre>{ JSON.stringify(data, null, 2) }</pre>
               </CardText>
             </Card>
    } else {
      return <div />
    }
  }

  render(){

    let standardActions = [
      {
        text: 'Instant Rollback',
        onTouchTap: this.instantRollback,
      },
      {
        text: 'Done',
        onTouchTap: this.props.finishedConfiguration,
        ref: 'submit'
      }
    ];


    var showMoreIcon = (
    <IconButton iconClassName="material-icons" tooltipPosition="bottom-left" tooltip="Show object dn and data playload"
    onClick={ this.showMore }>
      more_vertical
    </IconButton>
    )


    var stage1 = (
    <ListItem disabled={ true } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                          hourglass_empty</FontIcon> } backgroundColor={ Colors.grey400 } /> } rightIconButton={ showMoreIcon }>
      Configuration is being sent over
      <div style={ {  marginTop: 20} }>
        <LinearProgress mode="indeterminate" />
      </div>
      { this.state.showMore ? this.renderShowMore() : null }
    </ListItem>
    )

    var stage1_success = (
    <ListItem disabled={ true } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                          check</FontIcon> } backgroundColor={ Colors.green500 } /> } rightIconButton={ showMoreIcon }>
      Configuration pushed
      { this.state.showMore ? this.renderShowMore() : null }
    </ListItem>
    )

    var stage2 = (
    <ListItem disabled={ true } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                          hourglass_empty</FontIcon> } backgroundColor={ Colors.grey400 } /> }>
      Waiting 3 seconds for feedback on how that went
      <div style={ {  marginTop: 20} }>
        <LinearProgress mode="determinate" value={ 100 - (this.state.verifyCountdown / 30 * 100) } />
      </div>
    </ListItem>
    )


    var stage2_success = (
    <ListItem disabled={ true } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                          check</FontIcon> } backgroundColor={ Colors.green500 } /> }>
      Gathered feedback from Fabric
    </ListItem>
    )


    var api_error = (
    <ListItem disabled={ true } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                          error</FontIcon> } backgroundColor={ Colors.red500 } /> } secondaryText="Your ACI Fabric responded with the above error message."
    rightIconButton={ showMoreIcon }>
      { this.state.apiError }
      { this.state.showMore ? this.renderShowMore() : null }
    </ListItem>
    )

    var rollback = (
    <ListItem disabled={ true } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                          fast_rewind</FontIcon> } backgroundColor={ Colors.lightBlue700 } /> } primaryText="Phew! Don't worry, I've got your back"
    secondaryText="Config rolled back" />
    )

    if(this.state.faults.length > 0) {
      var faultArray = this.state.faults.map(fault => <ListItem style={ {  fontSize: '0.75em'} } key={ fault.attributes.dn } leftAvatar={ <Avatar backgroundColor={ Colors.red500 } icon={ <FontIcon className="material-icons"> error</FontIcon> } /> }>
                                                        { fault.attributes.descr }
                                                      </ListItem>)
      var stage3 = (
      <div>
        <ListItem initiallyOpen={ true } primaryTogglesNestedList={ true }
        nestedItems={ faultArray } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                                 warning</FontIcon> } backgroundColor={ Colors.amberA700 } /> }>Uh Oh! There is a couple of new faults
        </ListItem>
      </div>
      )
    } else {
      var stage3 = (
      <div>
        <ListItem disabled={ true } leftAvatar={ <Avatar icon={ <FontIcon className="material-icons">
                                                                  check</FontIcon> } backgroundColor={ Colors.green500 } /> }>Looks Good! No new faults raised
        </ListItem>
      </div>
      )

    }

    var full = <Dialog title="Pushing to your Fabric" actions={ this.state.configStage >= 2 || this.state.configStage <= -1 ? standardActions : [] } actionFocus="submit"
               open={ this.props.configStack.length > 0 } onRequestClose={ this.state.configStage >= 2 || this.state.configStage <= -1 ? this.props.finishedConfiguration : null }>
                 <List>
                   { this.state.configStage == -2 ? rollback : <div /> }
                   { this.state.configStage == -1 ? api_error : <div /> }
                   { this.state.configStage == 1 ? stage1 : this.state.configStage > 1 ? stage1_success : <div /> }
                   { this.state.configStage == 2 ? stage2 : this.state.configStage > 2 ? stage2_success : <div /> }
                   { this.state.configStage >= 3 ? stage3 : <div /> }
                 </List>
               </Dialog>

    var mini = <div>
                 <Snackbar message={ `Pushed ${this.props.configStack.length} change to your Fabric` } action="Instant Undo" autoHideDuration={ 1000 }
                 ref="snackbar" onTouchTap={ this.instantRollback } onDismiss={ this.props.finishedConfiguration } />
               </div>

    return <div>
             { this.props.mini ? mini : full }
           </div>
  }
}

export default ConfigurationHelper;
