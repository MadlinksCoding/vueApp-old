import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('negotiation webhook request context', () => {
  it.each([
    ['AdjustBookingPopup.vue', "type: 'adjust'"],
    ['RescheduleRequestPopup.vue', "type: 'reschedule'"],
    ['MoreTimeRequestPopup.vue', "type: 'moretime'"],
  ])('%s sends explicit offer type and sent lifecycle state', (file, typeMarker) => {
    const popup = source(`src/components/ui/chat/${file}`)
    expect(popup).toContain("status: 'sent'")
    expect(popup).toContain(typeMarker)
    expect(popup).toContain('proposal: {')
  })

  it('marks time-based accept and decline operations explicitly', () => {
    const chatWindow = source('src/components/ui/chat/ChatWindow.vue')
    expect(chatWindow).toContain("status: 'accepted'")
    expect(chatWindow).toContain("status: 'declined'")
    expect(chatWindow).toContain("intent: 'decline_renegotiation'")
    expect(chatWindow).toContain("type: 'adjust'")
  })

  it('passes active Adjust cancellation as negotiation decline', () => {
    const cancelPopup = source('src/components/ui/chat/CancelCallConfirmPopup.vue')
    expect(cancelPopup).toContain("status: 'declined'")
    expect(cancelPopup).toContain("intent: negotiation ? 'decline_renegotiation' : 'normal'")
    expect(cancelPopup).toContain('negotiationId:')
  })
})
