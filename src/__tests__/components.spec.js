import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'
import LoginForm from '@/components/auth/forms/LoginForm.vue'
import DashboardOverviewCreator from '@/components/dashboard/dashboardOverviewCreator.vue'

vi.mock('@/components/ui/chat/ChatFloatingWidget.vue', () => ({
  default: {
    name: 'ChatFloatingWidget',
    template: '<div data-test="chat-floating-widget" />'
  }
}))

describe('Components', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('App mounts without crashing', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: ['router-view'] // avoid router-view error
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('LoginForm renders', () => {
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('DashboardOverviewCreator renders', () => {
    const wrapper = mount(DashboardOverviewCreator, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
