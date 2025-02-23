import React from 'react'
import { Icon, Popup } from 'UI'
import { connectPlayer, toggleEvents, scale } from 'Player';
import cn from 'classnames'
import stl from './EventsToggleButton.module.css'

function EventsToggleButton({ showEvents, toggleEvents }: any) {
  const toggle = () => {
    toggleEvents()
    scale()
  }
  return (
    <Popup
      content={ showEvents ? 'Hide Events' : 'Show Events' }
      size="tiny"
      inverted
      position="bottom right"
    >
      <button
        className={cn("absolute right-0 z-50", stl.wrapper)}
        onClick={toggle}
      >
        <Icon
          name={ showEvents ? 'chevron-double-right' : 'chevron-double-left' }
          size="12"
        />      
      </button>
    </Popup>
  )
}

export default connectPlayer(state => ({
  showEvents: !state.showEvents
}), { toggleEvents })(EventsToggleButton)

