import React, { useState, useEffect } from 'react'
import { Popup, Icon, IconButton } from 'UI'
import { connect } from 'react-redux'
import cn from 'classnames'
import { toggleChatWindow } from 'Duck/sessions';
import { connectPlayer } from 'Player/store';
import ChatWindow from '../../ChatWindow';
import { callPeer, requestReleaseRemoteControl, toggleAnnotation } from 'Player'
import { CallingState, ConnectionStatus, RemoteControlStatus } from 'Player/MessageDistributor/managers/AssistManager';
import RequestLocalStream from 'Player/MessageDistributor/managers/LocalStream';
import type { LocalStream } from 'Player/MessageDistributor/managers/LocalStream';

import { toast } from 'react-toastify';
import { confirm } from 'UI';
import stl from './AassistActions.module.css'

function onClose(stream) {
  stream.getTracks().forEach(t=>t.stop());
}

function onReject() {
  toast.info(`Call was rejected.`);
}

function onError(e) {
  toast.error(typeof e === 'string' ? e : e.message);
}


interface Props {
  userId: String,
  toggleChatWindow: (state) => void,
  calling: CallingState,
  annotating: boolean,
  peerConnectionStatus: ConnectionStatus,
  remoteControlStatus: RemoteControlStatus,
  hasPermission: boolean,
  isEnterprise: boolean,
}

function AssistActions({ toggleChatWindow, userId, calling, annotating, peerConnectionStatus, remoteControlStatus, hasPermission, isEnterprise }: Props) {
  const [ incomeStream, setIncomeStream ] = useState<MediaStream | null>(null);
  const [ localStream, setLocalStream ] = useState<LocalStream | null>(null);
  const [ callObject, setCallObject ] = useState<{ end: ()=>void } | null >(null);

  useEffect(() => {
    return callObject?.end()
  }, [])

  useEffect(() => {
    if (peerConnectionStatus == ConnectionStatus.Disconnected) {
      toast.info(`Live session was closed.`);
    }    
  }, [peerConnectionStatus])

  function call() {
    RequestLocalStream().then(lStream => {
      setLocalStream(lStream);
      setCallObject(callPeer(
        lStream,
        setIncomeStream,
        lStream.stop.bind(lStream),
        onReject,
        onError
      ));
    }).catch(onError)
  }

  const confirmCall =  async () => {
    if (await confirm({
      header: 'Start Call',
      confirmButton: 'Call',
      confirmation: `Are you sure you want to call ${userId ? userId : 'User'}?`
    })) {
      call()
    }
  }

  const onCall = calling === CallingState.OnCall || calling === CallingState.Reconnecting
  const cannotCall = (peerConnectionStatus !== ConnectionStatus.Connected) || (isEnterprise && !hasPermission)
  const remoteActive = remoteControlStatus === RemoteControlStatus.Enabled

  return (
    <div className="flex items-center">
      {(onCall || remoteActive) && (
        <>
          <div
            className={
              cn(
                'cursor-pointer p-2 flex items-center',
                {[stl.disabled]: cannotCall}
              )
            }
            onClick={ () => toggleAnnotation(!annotating) }
            role="button"
          >
            <IconButton label={`Annotate`} icon={ annotating ? "pencil-stop" : "pencil"} primaryText redText={annotating} />
          </div>
          <div className={ stl.divider } />
        </>
      )}
      <div
        className={
          cn(
            'cursor-pointer p-2 flex items-center',
            {[stl.disabled]: cannotCall}
          )
        }
        onClick={ requestReleaseRemoteControl }
        role="button"
      >
        <IconButton label={`Remote Control`} icon={ remoteActive ? "window-x" : "remote-control"} primaryText redText={remoteActive} />
      </div>
      <div className={ stl.divider } />
      
      <Popup
        content={ cannotCall ? "You don’t have the permissions to perform this action." : `Call ${userId ? userId : 'User'}` }
      >
        <div
          className={
            cn(
              'cursor-pointer p-2 flex items-center',
              {[stl.disabled]: cannotCall}
            )
          }
          onClick={ onCall ? callObject?.end : confirmCall}
          role="button"
        >
          <IconButton size="small" primary={!onCall} red={onCall} label={onCall ? 'End' : 'Call'} icon="headset" />
        </div>
      </Popup>

      <div className="fixed ml-3 left-0 top-0" style={{ zIndex: 999 }}>
        { onCall && callObject && <ChatWindow endCall={callObject.end} userId={userId} incomeStream={incomeStream} localStream={localStream} /> }
      </div>
    </div>
  )
}

const con = connect(state => {
  const permissions = state.getIn([ 'user', 'account', 'permissions' ]) || []
  return {
    hasPermission: permissions.includes('ASSIST_CALL'),
    isEnterprise: state.getIn([ 'user', 'account', 'edition' ]) === 'ee',
  }
}, { toggleChatWindow })

export default con(connectPlayer(state => ({
  calling: state.calling,
  annotating: state.annotating,
  remoteControlStatus: state.remoteControl,
  peerConnectionStatus: state.peerConnectionStatus,
}))(AssistActions))
