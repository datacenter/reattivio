/*
  ConfigurationHelper
*/

import React from 'react';
import autobind from 'autobind-decorator';
import Paper from 'material-ui/lib/paper';
import $ from 'jquery';
import helpers from '../helpers';
import List from 'material-ui/lib/lists/list';
import Divider from 'material-ui/lib/divider';
import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';
import Colors from 'material-ui/lib/styles/colors';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import FontIcon from 'material-ui/lib/font-icon';
import IconButton from 'material-ui/lib/icon-button';
import Card from 'material-ui/lib/card/card';
import CardExpandable from 'material-ui/lib/card/card-expandable';
import CardHeader from 'material-ui/lib/card/card-header';
import CardText from 'material-ui/lib/card/card-text';
import CardTitle from 'material-ui/lib/card/card-title';
import Dialog from 'material-ui/lib/dialog';
import LinearProgress from 'material-ui/lib/linear-progress';
import Snackbar from 'material-ui/lib/snackbar';
import FlatButton from 'material-ui/lib/flat-button';

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
      sbOpen: false,
      timers: []
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
      url: `${this.props.fabric.protocol}://${this.props.fabric.address}/api/mo/${dn}.json`,
      type: "POST",
      data: JSON.stringify(this.state.snapshot),
      dataType: "json",
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

    if(this.props.mini) {
      this.setState({
        sbOpen: true
      })
      this.props.finishedConfiguration()
    } else {
      var timers = this.state.timers
      timers.push(setTimeout(this.verifyFaults, 1))
      this.setState({
        timers
      })
    }
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

    // Get a copy of the MO currently
    $.ajax({
      url: `${this.props.fabric.protocol}://${this.props.fabric.address}/api/mo/${dn}.json?rsp-prop-include=config-only`,
      type: "GET",
      dataType: "json",
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
      url: `${this.props.fabric.protocol}://${this.props.fabric.address}/api/mo/${dn}.json`,
      type: "POST",
      data: JSON.stringify(data),
      dataType: "json",
      success: this.handleConfigResponse
    })
  }

  verifyFaultCountdown(){
    const countdown = this.state.verifyCountdown
    if(countdown == 0) {
      clearInterval(this.state.verifyCountdownTimer)
      var timers = this.state.timers
      timers.push(setTimeout(this.collectFaults, 10))
      this.setState({
        timers,
        verifyCountdownTimer: null
      })
    } else {
      this.setState({
        verifyCountdown: countdown - 1
      })
    }
  }

  verifyFaults(){

    var timers = this.state.timers

    const interval = setInterval(this.verifyFaultCountdown, 100)
    timers.push(interval)


    this.setState({
      configStage: 2,
      verifyCountdown: 30,
      verifyCountdownTimer: interval,
      timers: timers
    })
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
      url: `${this.props.fabric.protocol}://${this.props.fabric.address}/api/mo/${this.state.curDn}.json?&query-target=self&rsp-subtree=full&rsp-subtree-include=faults,no-scoped&rsp-subtree-filter=and(wcard(faultDelegate.created,"${configHour}"))`,
      type: "GET",
      dataType: "json",
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
    if(nextProps.configStack.length > 0 && this.state.configStage == 0) {
      this.setState({
        configStage: 0,
        apiError: null,
        faults: [],
      })
      var timers = this.state.timers
      timers.push(setTimeout(this.getRollbackSnapshot, 10))
      this.setState({
        timers
      })
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

  finishedConfigurationSB(){
    this.state.timers.map(timer => clearInterval(timer))
    this.setState({
      sbOpen: false,
      configStage: 0,
      timers: []
    })
  }

  finishedConfiguration(){
    this.state.timers.map(timer => clearInterval(timer))
    if(this.state.configStage >= 2 || this.state.configStage <= -1) {
      this.setState({
        sbOpen: false,
        configStage: 0,
        timers: []
      })
      this.props.finishedConfiguration()
    }
  }

  render(){

    let standardActions = [
      <FlatButton label='Instant Rollback' onTouchTap={ this.instantRollback } />
      ,
      <FlatButton label='Done' onTouchTap={ this.finishedConfiguration } keyboardFocused={ true }
      primary={ true } />
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

    var full = <Dialog title="Pushing to your Fabric" actions={ this.state.configStage >= 2 || this.state.configStage <= -1 ? standardActions : [] } open={ this.props.configStack.length > 0 }
               onRequestClose={ this.finishedConfiguration }>
                 <List>
                   { this.state.configStage == -2 ? rollback : <div /> }
                   { this.state.configStage == -1 ? api_error : <div /> }
                   { this.state.configStage == 1 ? stage1 : this.state.configStage > 1 ? stage1_success : <div /> }
                   { this.state.configStage == 2 ? stage2 : this.state.configStage > 2 ? stage2_success : <div /> }
                   { this.state.configStage >= 3 ? stage3 : <div /> }
                 </List>
               </Dialog>

    var mini = <div>
                 <Snackbar message={ `Pushing that to your Fabric` } action="Instant Undo" autoHideDuration={ 3000 }
                 onActionTouchTap={ this.instantRollback } open={ this.state.sbOpen } onRequestClose={ this.finishedConfigurationSB }
                 />
               </div>

    return <div>
             { this.props.mini ? mini : full }
           </div>
  }
}

export default ConfigurationHelper;
