import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdjustBookingPopup from '@/components/ui/chat/AdjustBookingPopup.vue'
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue'
import { checkBookingAdjustmentAvailabilityFlow } from '@/services/bookings/flows/checkBookingAdjustmentAvailabilityFlow.js'

const runMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/flow-system/FlowHandler', () => ({
  default: { run: runMock },
}))

vi.mock('@/utils/toastBus.js', () => ({ showToast: vi.fn() }))

const PickerStub = defineComponent({
  name: 'EventSlotDateTimePicker',
  emits: ['update:modelValue'],
  template: `
    <div>
      <button data-testid="select-first-time" @click="$emit('update:modelValue', { date: '2026-09-20', startTime: '10:00' })">first</button>
      <button data-testid="select-second-time" @click="$emit('update:modelValue', { date: '2026-09-27', startTime: '11:00' })">second</button>
    </div>
  `,
})

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function mountPopup(availabilityHandler = async () => ({ ok: true, data: { available: true } })) {
  runMock.mockImplementation((flowId, payload) => {
    if (flowId === 'bookings.fetchBooking') {
      return Promise.resolve({
        ok: true,
        data: {
          item: {
            bookingId: 'booking_1',
            eventId: 'event_1',
            creatorId: 'creator_1',
            durationMinutes: 30,
            startAtIso: '2026-09-19T10:00:00+08:00',
            endAtIso: '2026-09-19T10:30:00+08:00',
            payment: { total: 20 },
          },
        },
      })
    }
    if (flowId === 'events.fetchEvent') {
      return Promise.resolve({
        ok: true,
        data: { item: { eventId: 'event_1', slots: [{ day: 'sunday', startTime: '09:00', endTime: '17:00' }] } },
      })
    }
    if (flowId === 'bookings.checkAdjustmentAvailability') return availabilityHandler(payload)
    return Promise.resolve({ ok: true, data: {} })
  })

  return mount(AdjustBookingPopup, {
    props: {
      chatId: 'chat_1',
      message: {
        message_id: 'message_1',
        content: { booking_id: 'booking_1', event_id: 'event_1' },
      },
    },
    global: {
      stubs: {
        Teleport: true,
        EventSlotDateTimePicker: PickerStub,
      },
    },
  })
}

describe('AdjustBookingPopup availability checks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    runMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a spinner-only disabled submit button while checking, then enables it when available', async () => {
    const availability = deferred()
    const wrapper = mountPopup(() => availability.promise)
    await flushPromises()

    await wrapper.get('[data-testid="select-first-time"]').trigger('click')
    const submit = wrapper.get('[data-testid="adjust-booking-submit"]').get('button')
    expect(submit.attributes('disabled')).toBeDefined()
    expect(submit.attributes('aria-busy')).toBe('true')
    expect(submit.get('span').classes()).toContain('invisible')
    expect(submit.find('.animate-spin').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(200)
    availability.resolve({ ok: true, data: { available: true, reason: null } })
    await flushPromises()

    const settledSubmit = wrapper.get('[data-testid="adjust-booking-submit"]').get('button')
    expect(settledSubmit.element.disabled).toBe(false)
    expect(settledSubmit.attributes('aria-busy')).toBeUndefined()
    expect(settledSubmit.get('span').classes()).not.toContain('invisible')
    wrapper.unmount()
  })

  it('shows the exact warning and keeps submission disabled for a conflict', async () => {
    const wrapper = mountPopup(async () => ({ ok: true, data: { available: false, reason: 'booking_conflict' } }))
    await flushPromises()
    await wrapper.get('[data-testid="select-first-time"]').trigger('click')
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()

    expect(wrapper.get('[data-testid="booking-availability-conflict"]').text()).toBe(
      'You have an existing booking at this time. Please select a different time.',
    )
    expect(wrapper.get('[data-testid="adjust-booking-submit"]').get('button').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('ignores a stale conflict response after a newer selection is verified', async () => {
    const first = deferred()
    const second = deferred()
    let requestCount = 0
    const wrapper = mountPopup(() => {
      requestCount += 1
      return requestCount === 1 ? first.promise : second.promise
    })
    await flushPromises()

    await wrapper.get('[data-testid="select-first-time"]').trigger('click')
    await vi.advanceTimersByTimeAsync(200)
    await wrapper.get('[data-testid="select-second-time"]').trigger('click')
    await vi.advanceTimersByTimeAsync(200)

    second.resolve({ ok: true, data: { available: true } })
    await flushPromises()
    first.resolve({ ok: true, data: { available: false, reason: 'booking_conflict' } })
    await flushPromises()

    expect(wrapper.find('[data-testid="booking-availability-conflict"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="adjust-booking-submit"]').get('button').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('fails closed and retries the current selection', async () => {
    let shouldFail = true
    const wrapper = mountPopup(async () => (
      shouldFail
        ? { ok: false, error: { message: 'offline' } }
        : { ok: true, data: { available: true } }
    ))
    await flushPromises()
    await wrapper.get('[data-testid="select-first-time"]').trigger('click')
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()

    const error = wrapper.get('[data-testid="booking-availability-error"]')
    expect(error.text()).toContain('We couldn’t verify this time. Please try again.')
    expect(wrapper.get('[data-testid="adjust-booking-submit"]').get('button').attributes('disabled')).toBeDefined()

    shouldFail = false
    await error.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="adjust-booking-submit"]').get('button').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('submits a price-only adjustment without requesting availability', async () => {
    const wrapper = mountPopup()
    await flushPromises()

    await wrapper.get('[data-testid="adjustment-token-stepper"] input').setValue('5')
    await wrapper.get('[data-testid="adjust-booking-submit"]').get('button').trigger('click')
    await flushPromises()

    expect(runMock).not.toHaveBeenCalledWith(
      'bookings.checkAdjustmentAvailability',
      expect.anything(),
    )
    expect(runMock).toHaveBeenCalledWith(
      'bookings.updateMeta',
      expect.objectContaining({ bookingId: 'booking_1' }),
    )
    expect(wrapper.emitted('submitted')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('ButtonComponent loading state', () => {
  it('preserves the label footprint while exposing a disabled busy button', async () => {
    const wrapper = mount(ButtonComponent, { props: { text: 'SUBMIT', loading: true } })
    await nextTick()
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.get('span').text()).toBe('SUBMIT')
    expect(button.get('span').classes()).toContain('invisible')
    expect(button.find('.animate-spin').exists()).toBe(true)
  })
})

describe('checkBookingAdjustmentAvailabilityFlow', () => {
  it('posts only the booking window to the booking-scoped endpoint', async () => {
    const post = vi.fn().mockResolvedValue({ ok: true, available: false, reason: 'booking_conflict' })
    const result = await checkBookingAdjustmentAvailabilityFlow({
      payload: {
        bookingId: 'booking/1',
        startAtIso: '2026-09-20T10:00:00+08:00',
        durationMinutes: 30,
      },
      context: { apiBaseUrl: 'http://localhost:3001', requestHeaders: { Authorization: 'Bearer token' } },
      api: { post },
    })

    expect(post).toHaveBeenCalledWith(
      'http://localhost:3001/bookings/booking%2F1/availability-check',
      { startAtIso: '2026-09-20T10:00:00+08:00', durationMinutes: 30 },
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    )
    expect(result).toEqual(expect.objectContaining({
      ok: true,
      data: { available: false, reason: 'booking_conflict' },
    }))
  })
})
