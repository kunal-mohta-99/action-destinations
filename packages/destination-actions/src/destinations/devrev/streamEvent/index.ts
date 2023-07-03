import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { TrackEventsPublishBody, devrevApiPaths, devrevApiRoot } from '../utils'
import { RequestOptions } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Stream Event',
  description: 'Stream events to DevRev',
  platform: 'cloud',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      label: 'Event Name',
      description: 'Name of the event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    occurredAt: {
      label: 'Event Timestamp',
      description: `The time when this event occurred. If this isn't set, the current time will be used.`,
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      },
      required: true
    },
    email: {
      label: 'Email Address',
      description: 'The email of the contact associated with this event.',
      type: 'string',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    userId: {
      label: 'User ID',
      description: 'User ID, ideally mappable to external ref of a Rev User.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.properties.userId'
      }
    },
    properties: {
      label: 'Properties',
      description: 'A json object containing additional information about the event.',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (request, { payload }) => {
    const { eventName, occurredAt } = payload

    // if no timestamp was received in the event, use the current time
    if (!occurredAt) {
      payload.occurredAt = new Date().toISOString()
    }

    // Track API payload
    const reqBody: TrackEventsPublishBody = {
      events_list: [
        {
          name: eventName,
          event_time: payload.occurredAt.toString(),
          payload: {
            // add mapped data to payload
            ...payload
          }
        }
      ]
    }
    const url = `${devrevApiRoot}${devrevApiPaths.trackEventsPublish}`
    const options: RequestOptions = {
      method: 'POST',
      json: reqBody
    }

    return request(url, options)
  }
}

export default action
