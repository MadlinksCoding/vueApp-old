<template>
  <div v-if="!hasDashboardContext" class="flex min-h-[24rem] items-center justify-center rounded-xl bg-white/70 p-6 text-center">
    <div>
      <h2 class="text-base font-semibold text-slate-700">{{ t("dashboard_waiting_context") }}</h2>
      <p class="mt-2 text-sm text-slate-500">
        {{ t("dashboard_context_missing", { role: isFan ? "fan" : "creator" }) }}
      </p>
    </div>
  </div>

  <div
    v-else
    ref="dashboardRootRef"
    :class="[
      embedded ? 'h-full min-h-0' : 'h-[calc(100vh-2rem)]',
      'flex flex-col overflow-hidden relative'
    ]"
  >
    <div class="flex w-full h-full">
      <MainCalendar
        ref="mainCalendarRef"
        :class="[
          'flex-1 w-full h-full relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          embedded ? 'lg:overflow-y-auto' : 'overflow-y-auto'
        ]"
        variant="default"
        :focus-date="state.focus"
        :events="events1"
        :events-data="eventsData"
        :booking-schedule-events="bookingScheduleEvents"
        :booking-schedule-booked-slots-index="dashboardEventsEngine.state.events.bookedSlotsIndex"
        :show-booking-schedule-list="isCreator && !dashboardEventsEngine.state.events.loading"
        :theme="theme1"
        :user-role="dashboardRole"
        :can-review-pending="isCreator"
        :data-attrs="{ 'data-calendar': 'main' }"
        :console-overlaps="true"
        :highlight-today-column="true"
        day-column-mode="events"
        time-start="00:00"
        time-end="24:00"
        :slot-minutes="60"
        :row-height-px="120"
        :min-event-height-px="0"
        @date-selected="onSelectFromMain"
        @view-changed="state.view = $event"
        @join-call="handleJoin"
        @approve-booking="onApprovePendingBooking"
        @reject-booking="onRejectPendingBooking"
        @cancel-booking="onCancelBookingFromCalendar"
        @menu-action="handleWidgetMenuAction"
        @create-event="goToCreateEvent($event.type)"
        @edit-schedule-event="handleEditScheduleEvent"
        @delete-schedule-event="openDeleteEventPopup"
        @view-schedule-card="openScheduleCardPreview"
      >
        <template #event="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              !event?.isAvailabilityBlock ? 'cursor-pointer' : '',
              !event?.isAvailabilityBlock && (view === 'month' ? 'rounded-[0.25rem]' : 'rounded-[0.375rem]'),
              view === 'month' ? 'month-booking-row overflow-hidden' : '',
              view === 'month'
                ? 'hidden lg:flex text-xs leading-3 w-full shadow-sm'
                : 'text-xs min-h-[1.25rem] w-full overflow-hidden'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            data-test="dashboard-month-booking-marker"
            tabindex="0"
            @mouseenter="showCalendarEventTooltip(event, $event)"
            @mouseleave="hideCalendarEventTooltip"
            @focusin="showCalendarEventTooltip(event, $event)"
            @focusout="hideCalendarEventTooltip"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div class="flex items-center min-w-0 w-full">
                <div
                  class="flex min-w-0 w-full items-center gap-1 overflow-hidden font-medium py-[0.125rem] px-1"
                  data-test="dashboard-calendar-booking-title"
                >
                  <component
                    :is="getBookedSlotTypeIcon(event)"
                    data-test="dashboard-calendar-booking-icon"
                    :data-booking-icon-type="getBookedSlotTypeIconKind(event)"
                    color="currentColor"
                    :class="['shrink-0', getCalendarSlotIconSizeClass(view)]"
                  />
                  <span class="min-w-0 truncate">{{ event.title }}</span>
                </div>
              </div>
              <div class="flex min-w-0 items-center gap-1 text-[0.625rem] opacity-90 py-[0.125rem] px-1" data-test="dashboard-calendar-booking-time">
                <span
                  class="shrink-0"
                  data-test="dashboard-calendar-booking-status-icon"
                  :data-booking-status-icon="getBookedSlotIndicatorStatus(event)"
                >
                  <PendingStatus :status="getBookedSlotIndicatorStatus(event)" />
                </span>
                <span class="min-w-0 truncate">
                  {{ hhmm(event.start) }}<template v-if="view !== 'month'"> - {{ hhmm(event.end) }}</template>
                </span>
              </div>
            </template>
          </div>
        </template>

        <template #event-alt="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              !event?.isAvailabilityBlock ? 'cursor-pointer' : '',
              !event?.isAvailabilityBlock ? 'rounded-lg' : '',
              view === 'month' ? 'month-booking-row flex overflow-hidden' : '',
              'py-[0.125rem] px-[0.25rem] text-xs shadow-custom'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            data-test="dashboard-month-booking-marker"
            tabindex="0"
            @mouseenter="showCalendarEventTooltip(event, $event)"
            @mouseleave="hideCalendarEventTooltip"
            @focusin="showCalendarEventTooltip(event, $event)"
            @focusout="hideCalendarEventTooltip"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div
                class="flex min-w-0 items-center gap-1 overflow-hidden font-semibold"
                data-test="dashboard-calendar-booking-title"
              >
                <component
                  :is="getBookedSlotTypeIcon(event)"
                  data-test="dashboard-calendar-booking-icon"
                  :data-booking-icon-type="getBookedSlotTypeIconKind(event)"
                  color="currentColor"
                  :class="['shrink-0', getCalendarSlotIconSizeClass(view)]"
                />
                <span class="min-w-0 truncate">{{ event.title }}</span>
              </div>
              <div class="flex min-w-0 items-center gap-1 opacity-90 text-[0.625rem]" data-test="dashboard-calendar-booking-time">
                <span
                  class="shrink-0"
                  data-test="dashboard-calendar-booking-status-icon"
                  :data-booking-status-icon="getBookedSlotIndicatorStatus(event)"
                >
                  <PendingStatus :status="getBookedSlotIndicatorStatus(event)" />
                </span>
                <span class="min-w-0 truncate">
                  {{ hhmm(event.start) }}<template v-if="view !== 'month'"> - {{ hhmm(event.end) }}</template>
                </span>
              </div>
            </template>
          </div>
        </template>

        <template #event-custom="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              !event?.isAvailabilityBlock ? 'cursor-pointer' : '',
              !event?.isAvailabilityBlock ? 'rounded-lg' : '',
              view === 'month' ? 'month-booking-row flex overflow-hidden' : '',
              'py-[0.125rem] px-[0.25rem] text-xs shadow-md min-h-[1.25rem] overflow-hidden'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            data-test="dashboard-month-booking-marker"
            tabindex="0"
            @mouseenter="showCalendarEventTooltip(event, $event)"
            @mouseleave="hideCalendarEventTooltip"
            @focusin="showCalendarEventTooltip(event, $event)"
            @focusout="hideCalendarEventTooltip"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div
                class="flex min-w-0 items-center gap-1 overflow-hidden font-semibold"
                data-test="dashboard-calendar-booking-title"
              >
                <component
                  :is="getBookedSlotTypeIcon(event)"
                  data-test="dashboard-calendar-booking-icon"
                  :data-booking-icon-type="getBookedSlotTypeIconKind(event)"
                  color="currentColor"
                  :class="['shrink-0', getCalendarSlotIconSizeClass(view)]"
                />
                <span class="min-w-0 truncate">{{ event.title }}</span>
              </div>
              <div class="flex min-w-0 items-center gap-1 opacity-90 text-[0.625rem]" data-test="dashboard-calendar-booking-time">
                <span
                  class="shrink-0"
                  data-test="dashboard-calendar-booking-status-icon"
                  :data-booking-status-icon="getBookedSlotIndicatorStatus(event)"
                >
                  <PendingStatus :status="getBookedSlotIndicatorStatus(event)" />
                </span>
                <span class="min-w-0 truncate">
                  {{ hhmm(event.start) }}<template v-if="view !== 'month'"> - {{ hhmm(event.end) }}</template>
                </span>
              </div>
            </template>
          </div>
        </template>

        <template #event-custom2="{ event, style, onClick, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              event?.isAvailabilityBlock ? 'pointer-events-none' : '',
              !event?.isAvailabilityBlock ? 'cursor-pointer' : '',
              !event?.isAvailabilityBlock ? 'rounded-lg' : '',
              view === 'month' ? 'month-booking-row flex overflow-hidden' : '',
              'py-[0.125rem] px-[0.25rem] shadow-md'
            ]"
            :style="[style, getCalendarEventStyle(event)]"
            data-test="dashboard-month-booking-marker"
            tabindex="0"
            @mouseenter="showCalendarEventTooltip(event, $event)"
            @mouseleave="hideCalendarEventTooltip"
            @focusin="showCalendarEventTooltip(event, $event)"
            @focusout="hideCalendarEventTooltip"
            @click.stop="!event?.isAvailabilityBlock && onClick(event)"
          >
            <template v-if="!event?.isAvailabilityBlock">
              <div
                class="flex min-w-0 items-center gap-1 overflow-hidden font-bold text-[0.75rem]"
                data-test="dashboard-calendar-booking-title"
              >
                <component
                  :is="getBookedSlotTypeIcon(event)"
                  data-test="dashboard-calendar-booking-icon"
                  :data-booking-icon-type="getBookedSlotTypeIconKind(event)"
                  color="currentColor"
                  :class="['shrink-0', getCalendarSlotIconSizeClass(view)]"
                />
                <span class="min-w-0 truncate">{{ event.title }}</span>
              </div>
              <div class="flex min-w-0 items-center gap-1 text-[0.625rem]" data-test="dashboard-calendar-booking-time">
                <span
                  class="shrink-0"
                  data-test="dashboard-calendar-booking-status-icon"
                  :data-booking-status-icon="getBookedSlotIndicatorStatus(event)"
                >
                  <PendingStatus :status="getBookedSlotIndicatorStatus(event)" />
                </span>
                <span class="min-w-0 truncate">
                  {{ hhmm(event.start) }}<template v-if="view !== 'month'"> - {{ hhmm(event.end) }}</template>
                </span>
              </div>
            </template>
          </div>
        </template>

        <template #event-availability="{ event, style, view }">
          <div
            :class="[
              view === 'month' ? 'static' : 'absolute',
              view === 'month'
                ? 'flex h-[1.375rem] min-w-0 w-full cursor-pointer items-center overflow-hidden rounded-[0.25rem] px-1 py-0 text-xs font-medium leading-4 shadow-sm'
                : 'min-h-[0.375rem] w-full cursor-pointer overflow-hidden px-2 py-1 text-xs font-medium leading-4'
            ]"
            :style="[
              style,
              getCalendarEventStyle(event),
              view === 'month' ? getMonthAvailabilitySummaryStyle(event) : {}
            ]"
            data-test="dashboard-month-availability-marker"
            role="button"
            tabindex="0"
            :aria-label="t('dashboard_booking_schedule_menu_aria', { title: event.title || t('dashboard_booking_schedule_untitled_event') })"
            @click.stop="openAvailabilityScheduleMenu(event, $event)"
            @keydown.enter.prevent.stop="openAvailabilityScheduleMenu(event, $event)"
            @keydown.space.prevent.stop="openAvailabilityScheduleMenu(event, $event)"
          >
            <span
              v-if="event.title && (view === 'month' || !event.hideAvailabilityTitle)"
              data-test="dashboard-calendar-availability-title"
              class="flex min-w-0 items-center gap-1 overflow-hidden"
            >
              <BookingScheduleIcon
                data-test="dashboard-calendar-availability-icon"
                color="currentColor"
                :class="[
                  'shrink-0',
                  'h-3 w-3'
                ]"
              />
              <span class="min-w-0 truncate">{{ event.title }}</span>
            </span>
          </div>
        </template>

        <template #month-expanded="{ events, day, onClick }">
          <div class="w-full p-2 bg-black/10 flex flex-col min-h-[8rem]" data-test="dashboard-month-expanded">
            <EventsWidget
              :sections="buildExpandedMonthSections(events, day)"
              :user-role="dashboardRole"
              @join-click="handleJoin"
              @reply-click="handleReply"
              @event-click="handleMonthExpandedEventClick($event, onClick)"
              @menu-action="handleWidgetMenuAction"
            />
          </div>
        </template>
      </MainCalendar>

      <div
        :class="['hidden ipad-portrait:hidden lg:flex lg:w-[22vw] lg:min-w-[20.375rem] lg:max-w-[28rem] flex-col gap-4 px-2 lg:px-6 lg:pt-4 xl:pt-4 pb-[6.5rem] md:px-4 h-full', !embedded && 'lg:pt-6 xl:pt-12']"
      >
        <MiniCalendar
          class="md:col-span-1"
          :month-date="state.focus"
          :selected-date="state.selected || state.focus"
          :events="miniEvents"
          :theme="theme1"
          :hide-past-dots="true"
          :data-attrs="{ 'data-calendar': 'mini' }"
          @date-selected="onSelectFromMini"
        />

        <div
          v-if="dashboardEventsEngine.state.events.error"
          class="px-3 py-2 rounded bg-red-50 text-red-700 text-xs font-medium"
        >
          {{ dashboardEventsEngine.state.events.error }}
        </div>
        <div
          v-else-if="dashboardEventsEngine.state.events.loading"
          class="flex flex-col gap-4"
        >
          <div
            v-if="isCreator"
            class="h-12 w-full rounded-[3rem] bg-[#101828]/10 animate-pulse"
          />

          <div class="flex flex-col gap-3">
            <div class="h-3 w-24 rounded-full bg-[#101828]/10 animate-pulse" />
            <div
              v-for="index in 3"
              :key="`upcoming-skeleton-${index}`"
              class="flex h-[4.125rem] items-center gap-3 rounded-[0.25rem] border border-[#EAECF0] bg-white/80 px-3 shadow-sm animate-pulse"
            >
              <div class="h-full w-1 rounded-full bg-[#07F468]/30" />
              <div class="flex w-[3.4375rem] flex-col items-center justify-center gap-1 shrink-0">
                <div class="h-3 w-8 rounded-full bg-[#101828]/10" />
                <div class="h-3 w-10 rounded-full bg-[#101828]/10" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="h-3 w-3/4 rounded-full bg-[#101828]/10" />
                <div class="flex items-center gap-2">
                  <div class="h-5 w-5 rounded-full bg-[#101828]/10" />
                  <div class="h-2.5 w-1/2 rounded-full bg-[#101828]/10" />
                </div>
              </div>
              <div class="flex flex-col items-end justify-between self-stretch py-1">
                <div class="h-2.5 w-12 rounded-full bg-[#101828]/10" />
                <div class="h-6 w-16 rounded-[0.25rem] bg-[#101828]/10" />
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="h-3 w-28 rounded-full bg-[#101828]/10 animate-pulse" />
            <div
              v-for="index in 2"
              :key="`pending-skeleton-${index}`"
              class="flex h-[4.125rem] items-center gap-3 rounded-[0.25rem] border border-[#EAECF0] bg-white/80 px-3 shadow-sm animate-pulse"
            >
              <div class="h-full w-1 rounded-full bg-[#FDB022]/30" />
              <div class="flex w-[3.4375rem] flex-col items-center justify-center gap-1 shrink-0">
                <div class="h-3 w-8 rounded-full bg-[#101828]/10" />
                <div class="h-3 w-10 rounded-full bg-[#101828]/10" />
              </div>
              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="h-3 w-2/3 rounded-full bg-[#101828]/10" />
                <div class="flex items-center gap-2">
                  <div class="h-5 w-5 rounded-full bg-[#101828]/10" />
                  <div class="h-2.5 w-1/3 rounded-full bg-[#101828]/10" />
                </div>
              </div>
              <div class="h-4 w-4 rounded-full bg-[#101828]/10 shrink-0" />
            </div>
          </div>
        </div>

        <div v-else-if="isCreator" class="relative w-full z-[999] hidden" ref="popupTrigger">
          <ButtonComponent
            :text="t('dashboard_new_events')"
            variant="none"
            customClass="group w-full h-12 min-h-10 px-4 py-2 text-base font-semibold bg-black rounded-[3rem] inline-flex justify-center items-center gap-2 text-[#07F468] hover:text-black hover:bg-[#07F468]"
            :leftIcon="'https://i.ibb.co.com/RpWmJkcb/plus.webp'"
            :leftIconClass="'w-6 h-6 transition duration-200 group-hover:[filter:brightness(0)_saturate(100%)]'"
            @click="togglePopup"
          />

          <div v-show="isCreatePopupOpen" class="fixed z-[999]" :style="popupStyle">
            <CreateEventPopup
              @create-private="goToCreateEvent('private')"
              @create-group="goToCreateEvent('group')"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <BookingScheduleList
            v-if="isCreator && !dashboardEventsEngine.state.events.loading"
            :events="bookingScheduleEvents"
            :booked-slots-index="dashboardEventsEngine.state.events.bookedSlotsIndex"
            @edit="handleEditScheduleEvent"
            @delete="openDeleteEventPopup"
            @view-card="openScheduleCardPreview"
          />

          <div v-if="!dashboardEventsEngine.state.events.loading">
            <EventsWidget
              :sections="eventsData"
              :user-role="dashboardRole"
              @join-click="handleJoin"
              @reply-click="handleReply"
              @event-click="handleWidgetEventClick"
              @menu-action="handleWidgetMenuAction"
            />
          </div>
        </div>
      </div>

      <div v-if="isCreator" class="fixed bottom-2 md:bottom-5 right-2 md:right-5 z-50" ref="floatingPopupTrigger">
        <!-- For Tablet and Mobile-->
        <button
          class="bg-[#FB5BA2] p-3 rounded-full flex ipad-portrait:flex lg:hidden items-center justify-center shadow-lg hover:scale-110 transition-transform"
          @click="toggleFloatingPopup"
        >
          <img
            :src="calenderPlusIcon"
            class="w-6 h-6"
            :alt="t('common_add')"
          />
        </button>
        <!-- Landscape screen -->
        <button
          class="w-[14.3125rem] h-[4rem] min-h-10 px-6 py-2 rounded-full bg-[#F06] shadow-[0_4px_8px_-2px_rgba(255,0,102,0.10),0_2px_4px_-2px_rgba(255,0,102,0.06)] hidden ipad-portrait:hidden lg:flex items-center justify-between transition-transform"
          @click="toggleFloatingPopup"
        >
          <div class="flex items-center gap-2 justify-between">
            <img
              :src="calenderPlusIcon"
              class="w-6 h-6"
              :alt="t('common_add')"
            />
            <span class="text-white font-poppins text-[1.25rem] font-semibold leading-[1.875rem]">NEW EVENT</span>
          </div>
          <div>
            <img :src="DropdownArrowDown" alt="" class="w-4 h-4 transition-transform duration-300 ease-in-out" :class="isFloatingPopupOpen ? 'rotate-180' : ''" />
          </div>
        </button>
        <div
          v-show="isFloatingPopupOpen"
          class="w-full md:w-auto bg-white/90 rounded shadow-[0px_0px_12px_0px_rgba(0,0,0,0.10)] backdrop-blur-[3.125rem] inline-flex flex-col justify-start items-start overflow-hidden !fixed !bottom-0 !right-0 lg:!bottom-24 lg:!right-6 !top-auto !left-auto"
        >
          <CreateEventPopup
            @create-private="goToCreateEvent('private')"
            @create-group="goToCreateEvent('group')"
          />
        </div>
      </div>
    </div>

    <PopupHandler v-if="isCreator" v-model="newEventsPopupOpen" :config="newEventsPopupConfig">
      <NewEventsPopup
        @create-private="goToCreateEvent('private')"
        @create-group="goToCreateEvent('group')"
      />
    </PopupHandler>

    <PopupHandler v-model="cancelBookingPopupOpen" :config="cancelBookingPopupConfig">
      <div class="w-[30.9375rem] border border-[#EAECF0] bg-white p-4 shadow-xl">
        <h3 class="text-[1rem] font-semibold text-gray-700">{{ cancelBookingConfirmTitle }}</h3>
        <p class="mt-2 text-black">
          {{ cancelBookingConfirmBody }}
        </p>
        <div class="mt-2 bg-gray-50 px-3 py-2 text-[0.75rem] text-gray-700">
          <p class="font-semibold truncate">{{ cancelBookingCandidateTitle }}</p>
          <p v-if="cancelBookingCandidateTime" class="mt-1">{{ cancelBookingCandidateTime }}</p>
        </div>
        <div class="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            class="h-9 px-3 text-base font-medium leading-6 text-[#ff4405] hover:bg-gray-50"
            :disabled="cancelBookingLoading"
            @click="closeCancelBookingPopup"
          >
            {{ t("dashboard_cancel_confirm_back") }}
          </button>
          <button
            type="button"
            class="h-9 bg-[#ff4405] px-3 text-base font-medium leading-6 text-white hover:bg-[#ff692e] disabled:opacity-60"
            :disabled="cancelBookingLoading"
            @click="confirmCancelBooking"
          >
            {{ cancelBookingLoading ? t("common_loading") : cancelBookingConfirmAction }}
          </button>
        </div>
      </div>
    </PopupHandler>

    <PopupHandler v-if="isCreator" v-model="deleteEventPopupOpen" :config="deleteEventPopupConfig">
      <div class="w-[32.875rem] max-w-[90vw] rounded-[0.25rem] border border-[#EAECF0] bg-white px-4 py-5 shadow-xl">
        <h3 class="text-[1rem] font-semibold leading-6 text-gray-700">
          {{ deleteEventConfirmTitle }}
        </h3>
        <p class="mt-2 text-base leading-6 text-slate-700">
          {{ t("dashboard_delete_booking_schedule_body") }}
        </p>
        <div class="mt-6 flex items-center justify-end gap-6">
          <button
            type="button"
            class="h-10 px-4 text-base font-medium leading-6 text-[#ff4405] hover:bg-gray-50 disabled:opacity-60"
            :disabled="deleteEventLoading"
            @click="closeDeleteEventPopup"
          >
            {{ t("common_cancel") }}
          </button>
          <button
            type="button"
            class="h-10 bg-[#ff4405] px-6 text-base font-medium leading-6 text-white hover:bg-[#ff692e] disabled:opacity-60"
            :disabled="deleteEventLoading"
            @click="confirmDeleteEvent"
          >
            {{ deleteEventLoading ? t("common_loading") : t("dashboard_delete_booking_schedule_action") }}
          </button>
        </div>
      </div>
    </PopupHandler>

    <OneOnOneBookingFlowPopup
      v-if="isCreator"
      :model-value="scheduleCardPreviewOpen"
      :creator-id="normalizedCreatorId"
      :fan-id="normalizedFanId"
      :api-base-url="props.apiBaseUrl"
      preview-mode
      preview-read-only
      :preview-event="scheduleCardPreviewEvent"
      :preview-booked-slots="scheduleCardPreviewBookedSlots"
      :preview-start-step="1"
      step1-primary-action="edit-schedule"
      @update:model-value="setScheduleCardPreviewOpen"
      @edit-schedule="handleScheduleCardPreviewEdit"
    />

    <BookingScheduleMenu
      v-if="isCreator"
      :open="availabilityScheduleMenu.open"
      :event="availabilityScheduleMenu.event"
      position-class="fixed"
      :menu-style="availabilityScheduleMenuStyle"
      @edit="handleAvailabilityMenuEdit"
      @view-card="handleAvailabilityMenuViewCard"
      @delete="handleAvailabilityMenuDelete"
      @close="closeAvailabilityScheduleMenu"
    />

    <div
      v-if="calendarTooltip.visible"
      class="pointer-events-none fixed z-[1600] w-max min-w-[10rem] max-w-[min(17rem,calc(100vw-1.5rem))] rounded-[0.625rem] bg-[#454158]/95 px-3.5 py-2.5 text-white shadow-[0_12px_28px_rgba(16,24,40,0.22)]"
      :style="calendarTooltipStyle"
      :data-placement="calendarTooltip.placement"
      data-test="dashboard-booking-tooltip"
    >
      <span
        class="absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 bg-[#454158]"
        :class="calendarTooltip.placement === 'top'
          ? 'bottom-0 translate-y-1/2'
          : 'top-0 -translate-y-1/2'"
      />
      <div class="relative flex flex-col gap-2">
        <div class="truncate text-sm font-semibold leading-5">
          {{ calendarTooltip.title }}
        </div>
        <div class="flex items-center gap-1.5 text-sm font-semibold leading-5">
          <span
            class="shrink-0"
            data-test="dashboard-booking-tooltip-status-icon"
            :data-booking-tooltip-status-icon="calendarTooltip.status"
          >
            <PendingStatus :status="calendarTooltip.status" :width="12" :height="12" />
          </span>
          <span class="truncate">{{ calendarTooltip.time }}</span>
        </div>
      </div>
    </div>

    <ToastHost />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { hhmm, addDays } from "@/utils/calendarHelpers.js";
import calenderPlusIcon from "@/assets/images/icons/calender-plus-02.svg";
import DropdownArrowDown from "@/assets/images/icons/dropdown-arrow-down.svg";
import MiniCalendar from "@/components/calendar/MiniCalendar.vue";
import MainCalendar from "@/components/calendar/MainCalendar.vue";
import ButtonComponent from "@/components/dev/button/ButtonComponent.vue";
import EventsWidget from "@/components/calendar/EventsWidget.vue";
import BookingScheduleList from "@/components/calendar/BookingScheduleList.vue";
import BookingScheduleMenu from "@/components/calendar/BookingScheduleMenu.vue";
import BookingScheduleIcon from "@/components/icons/BookingScheduleIcon.vue";
import GroupCallIcon from "@/components/icons/GroupCallIcon.vue";
import PendingStatus from "@/components/icons/PendingStatus.vue";
import PhoneIcon from "@/components/icons/PhoneIcon.vue";
import CreateEventPopup from "@/components/calendar/CreateEventPopup.vue";
import NewEventsPopup from "@/components/calendar/NewEventsPopup.vue";
import OneOnOneBookingFlowPopup from "@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowPopup.vue";
import PopupHandler from "@/components/ui/popup/PopupHandler.vue";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { createFlowStateEngine } from "@/utils/flowStateEngine.js";
import { mapBookedSlotsToCalendarEvents, mapAvailabilityToCalendarEvents } from "@/services/bookings/utils/bookingSlotUtils.js";
import { showToast } from "@/utils/toastBus.js";
import { buildScheduledGroupMeetingUrl, getBookingJoinState } from "@/utils/bookingJoinUtils.js";
import { resolveFanIdFromContext, toNumberOr } from "@/utils/contextIds.js";
import { normalizeDashboardBookingRole } from "@/utils/dashboardRole.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import plusIcon from "@/assets/images/icons/plus-icon.svg"

const props = defineProps({
  creatorId: {
    type: [Number, String],
    default: null,
  },
  userRole: {
    type: String,
    default: "creator",
  },
  fanId: {
    type: [Number, String],
    default: null,
  },
  apiBaseUrl: {
    type: String,
    default: "",
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  refreshSignal: {
    type: [String, Number, Boolean],
    default: "",
  },
  filterPastPendingBookings: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["create-event", "edit-event", "open-url"]);
const { t, locale } = useBookingTranslations();

const isCreatePopupOpen = ref(false);
const newEventsPopupOpen = ref(false);
const reviewPendingLoading = ref(false);
const dashboardRootRef = ref(null);
const mainCalendarRef = ref(null);
const initialWeekDateRevealed = ref(false);
const cancelBookingPopupOpen = ref(false);
const cancelBookingLoading = ref(false);
const cancelBookingCandidate = ref(null);
const deleteEventPopupOpen = ref(false);
const deleteEventLoading = ref(false);
const deleteEventCandidate = ref(null);
const scheduleCardPreviewOpen = ref(false);
const scheduleCardPreviewEvent = ref(null);
const availabilityScheduleMenu = reactive({
  open: false,
  event: null,
  left: 0,
  top: 0,
});
const isFloatingPopupOpen = ref(false);
const popupTrigger = ref(null);
const floatingPopupTrigger = ref(null);
const popupStyle = reactive({ top: "0px", left: "0px" });
const isMounted = ref(false);
const currentTime = ref(new Date());
const currentTimeTimer = ref(null);
const calendarTooltip = reactive({
  visible: false,
  title: "",
  time: "",
  status: "confirmed",
  x: 0,
  y: 0,
  placement: "bottom",
});

const calendarTooltipStyle = computed(() => ({
  left: `${calendarTooltip.x}px`,
  top: `${calendarTooltip.y}px`,
  transform: calendarTooltip.placement === "top"
    ? "translate(-50%, -100%)"
    : "translate(-50%, 0)",
}));

const availabilityScheduleMenuStyle = computed(() => ({
  left: `${availabilityScheduleMenu.left}px`,
  top: `${availabilityScheduleMenu.top}px`,
}));

const isEmbeddedMobileViewport = () => (
  props.embedded
  && typeof window !== "undefined"
  && window.innerWidth < 1024
);

const scrollElementToTop = (element) => {
  if (!element) return;
  if (typeof element.scrollTo === "function") {
    element.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }
  element.scrollTop = 0;
  element.scrollLeft = 0;
};

const resetEmbeddedMobileScrollToTop = () => {
  if (!isEmbeddedMobileViewport()) return false;

  scrollElementToTop(dashboardRootRef.value);
  mainCalendarRef.value?.resetScrollToTop?.();
  return true;
};

const normalizedCreatorId = computed(() => toNumberOr(props.creatorId, null));
const normalizedFanId = computed(() => resolveFanIdFromContext({
  preferredId: props.fanId,
  fallback: null,
}));
const dashboardRole = computed(() => normalizeDashboardBookingRole(props.userRole));
const isCreator = computed(() => dashboardRole.value === "creator");
const isFan = computed(() => dashboardRole.value === "fan");
const hasDashboardContext = computed(() => (
  isFan.value
    ? normalizedFanId.value != null
    : normalizedCreatorId.value != null
));

const dashboardEventsEngine = createFlowStateEngine({
  flowId: "dashboard-events-flow",
  initialStep: 1,
  urlSync: "none",
  defaults: {
    events: {
      cachedResponse: null,
      list: [],
      bookedList: [],
      catalogEvents: [],
      rawEvents: [],
      bookedSlotsRaw: [],
      bookedSlotsIndex: {},
      meta: {},
      loading: false,
      error: null,
    },
  },
});

const newEventsPopupConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  verticalAlign: "bottom",
  width: { default: "24rem", "<768": "100%" },
  height: { default: "auto" },
  speed: "300ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
};

const cancelBookingPopupConfig = {
  actionType: "popup",
  position: "center",
  customEffect: "scale",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: true,
  closeOnOutside: true,
  lockScroll: true,
  escToClose: true,
  width: { default: "auto", "<480": "90%" },
  height: "auto",
  scrollable: false,
};

const deleteEventPopupConfig = {
  ...cancelBookingPopupConfig,
  closeOnOutside: !deleteEventLoading.value,
};

const state = reactive({
  focus: new Date(),
  selected: null,
  view: "week",
});

const theme1 = computed(() => ({
  mini: {
    wrapper: "flex flex-col w-full font-medium text-[#0C111D] mt-0 gap-[0.625rem] rounded-xl w-[17.375rem]",
    header: "font-semibold",
    dayBase: "relative w-[2rem] h-[2rem] rounded-full flex flex-col items-center justify-center focus:outline-none focus:ring-0 focus:ring-inset focus:ring-emerald-500 text-xs leading-[18px] font-medium text-[#0C111D]",
    outside: "opacity-0",
    expired: "opacity-40",
    today: "bg-[#101828] !font-semibold text-white",
    selected: "bg-[#101828] !font-semibold text-white",
    dot: "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#101828]",
    selectedDot: "!bg-white",
    pendingDot: "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full !bg-transparent border border-[#101828]",
  },
  main: {
    wrapper: `relative flex flex-col gap-2 lg:gap-6 overflow-hidden rounded-xl h-full px-2 md:px-4 lg:pl-6 lg:pr-0 pt-6 lg:pt-4 ${props.embedded ? '' : ''}`,
    title: "text-[1.5rem] md:text-base font-semibold text-[#344054]",
    xHeader: "text-xs uppercase tracking-wide text-slate-500 top-0 sticky w-full backdrop-blur-md z-10 flex-row-reverse md:flex-row",
    axisXLabel: "flex flex-col justify-end pb-[0.75rem] w-[2.8rem] md:w-[4.8rem]",
    axisXDay: "py-1 text-center h-[3.995rem]",
    axisXToday: "bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center",
    axisYRow: "dashboard-events-calendar-time-label h-[3.914rem] uppercase text-right pr-2 w-[2.4rem] lg:w-[4.8rem] text-gray-400 text-xs font-medium leading-4",
    colBase: "relative bg-white/20",
    gridRow: "h-[4rem] border-b border-white/50",
    eventBase: "absolute mx-1 rounded-md border border-stone-100 bg-white p-2 text-xs shadow-sm",
  },
  month: {
    weekHeader: "text-xs uppercase tracking-wide text-slate-500",
    cellBase: "h-full w-full p-1 sm:p-2 text-left hover:bg-slate-50 focus:outline-none focus:border-2 focus:border-emerald-500 border border-white/50 flex flex-col items-start justify-start overflow-hidden",
    outside: "opacity-40",
    today: "border-2 border-emerald-500",
    cellEvent: "w-full text-[0.563rem] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-md bg-slate-100 border border-slate-200 truncate cursor-pointer",
  },
}));

const DEFAULT_EVENT_COLOR = "#5549FF";
const AVAILABILITY_TITLE_BOOKING_START_WINDOW_MS = 15 * 60 * 1000;

const toggleFloatingPopup = () => {
  isFloatingPopupOpen.value = !isFloatingPopupOpen.value;
};

const updatePopupPosition = () => {
  if (!popupTrigger.value) return;
  const rect = popupTrigger.value.getBoundingClientRect();
  popupStyle.top = `${rect.bottom + 8}px`;
  popupStyle.right = `${(window.innerWidth - rect.right) / 16}rem`;
  popupStyle.left = "auto";
};

const togglePopup = () => {
  isCreatePopupOpen.value = !isCreatePopupOpen.value;
  if (isCreatePopupOpen.value) {
    updatePopupPosition();
  }
};

const handlePositionUpdate = () => {
  if (isCreatePopupOpen.value) updatePopupPosition();
  if (availabilityScheduleMenu.open) closeAvailabilityScheduleMenu();
};

const handleClickOutside = (event) => {
  if (!isCreatePopupOpen.value && !isFloatingPopupOpen.value && !availabilityScheduleMenu.open) return;
  const path = event.composedPath ? event.composedPath() : [];
  if (popupTrigger.value && !path.includes(popupTrigger.value)) {
    isCreatePopupOpen.value = false;
  }
  if (floatingPopupTrigger.value && !path.includes(floatingPopupTrigger.value)) {
    isFloatingPopupOpen.value = false;
  }
  if (availabilityScheduleMenu.open) {
    closeAvailabilityScheduleMenu();
  }
};

const handleDocumentKeydown = (event) => {
  if (event.key === "Escape" && availabilityScheduleMenu.open) {
    closeAvailabilityScheduleMenu();
  }
};

function normalizeHexColor(color, fallback = DEFAULT_EVENT_COLOR) {
  if (typeof color !== "string") return fallback;
  const normalized = color.trim();
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(normalized)) return normalized;
  return fallback;
}

function resolveOptionalEventColor(...candidates) {
  for (const candidate of candidates) {
    const color = normalizeHexColor(candidate, null);
    if (color) return color;
  }
  return null;
}

function resolveEventColor(...candidates) {
  const color = resolveOptionalEventColor(...candidates);
  if (color) return color;
  return DEFAULT_EVENT_COLOR;
}

function hexToRgb(hexColor = DEFAULT_EVENT_COLOR) {
  const hex = normalizeHexColor(hexColor).replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
  const number = Number.parseInt(full, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function rgba(hexColor, alpha = 1) {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const GENERIC_EVENT_TITLE_FALLBACKS = new Set(["event title", "untitled event"]);

function normalizeEventTitleCandidate(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isGenericEventTitle(value) {
  return GENERIC_EVENT_TITLE_FALLBACKS.has(String(value || "").trim().toLowerCase());
}

function resolveCalendarEventTitle(event = {}) {
  const candidates = [
    event?.title,
    event?.eventTitle,
    event?.eventName,
    event?.event_name,
    event?.name,
    event?.raw?.title,
    event?.raw?.eventTitle,
    event?.raw?.eventName,
    event?.raw?.event_name,
    event?.raw?.name,
  ];
  let genericFallback = "";

  for (const candidate of candidates) {
    const normalized = normalizeEventTitleCandidate(candidate);
    if (!normalized) continue;

    if (isGenericEventTitle(normalized)) {
      genericFallback = genericFallback || normalized;
      continue;
    }

    return normalized;
  }

  return genericFallback || t("dashboard_booking_schedule_untitled_event");
}

const APPROVED_BOOKING_STATUSES = new Set(["approved", "completed", "confirmed"]);
const PENDING_BOOKING_STATUSES = new Set(["pending", "pending_hold"]);

function resolveBookingStatus(event = {}) {
  const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
  return String(event?.status || raw.status || raw.bookingStatus || "").toLowerCase();
}

function isApprovedBookingStatus(event = {}) {
  return APPROVED_BOOKING_STATUSES.has(resolveBookingStatus(event));
}

function isPastBookedCalendarEvent(event = {}, comparisonDate = currentTime.value) {
  if (!event || event.isAvailabilityBlock === true) return false;
  const endDate = resolveEventEndDate(event);
  if (!endDate) return false;
  return endDate.getTime() < comparisonDate.getTime();
}

function isPastPendingBookedCalendarEvent(event = {}, comparisonDate = currentTime.value) {
  return PENDING_BOOKING_STATUSES.has(resolveBookingStatus(event))
    && isPastBookedCalendarEvent(event, comparisonDate);
}

function isMidnightDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return date.getHours() === 0 && date.getMinutes() === 0;
}

function getCalendarEventStyle(event) {
  const color = normalizeHexColor(
    event?.color || event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
    DEFAULT_EVENT_COLOR,
  );

  if (event?.isAvailabilityBlock) {
    const startsAtMidnight = isMidnightDateTime(event?.start);
    const endsAtMidnight = isMidnightDateTime(event?.end);

    return {
      backgroundColor: rgba(color, 0.08),
      borderTop: startsAtMidnight ? "0" : `1px solid ${color}`,
      borderBottom: endsAtMidnight ? "0" : `1px solid ${color}`,
      borderRadius: "0px",
      color,
      zIndex: 1,
    };
  }

  if (isPastBookedCalendarEvent(event)) {
    return {
      backgroundColor: "#D9DCE6",
      border: "1px solid #C8CDD8",
      borderBottom: "1px solid #C8CDD8",
      boxShadow: "none",
      color: "#98A2B3",
      zIndex: 2,
    };
  }

  if (!isApprovedBookingStatus(event)) {
    return {
      backgroundColor: "transparent",
      border: `1px solid ${color}`,
      borderBottom: `1px solid ${color}`,
      color,
      zIndex: 2,
    };
  }

  return {
    backgroundColor: color,
    border: `1px solid ${color}`,
    borderBottom: `1px solid ${color}`,
    color: "#ffffff",
    zIndex: 2,
  };
}

function getMonthAvailabilitySummaryStyle(event) {
  const color = normalizeHexColor(
    event?.color || event?.eventColorSkin || event?.raw?.eventColorSkin || DEFAULT_EVENT_COLOR,
    DEFAULT_EVENT_COLOR,
  );

  return {
    backgroundColor: rgba(color, 0.10),
    border: "0",
    borderTop: "0",
    borderRight: "0",
    borderBottom: "0",
    borderLeft: "0",
    borderRadius: "4px",
    boxShadow: "none",
    color,
  };
}

function asDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveEventEndDate(event = {}) {
  return asDate(
    event?.end
      || event?.endIso
      || event?.endAtIso
      || event?.endAt
      || event?.raw?.endIso
      || event?.raw?.endAtIso
      || event?.raw?.endAt,
  );
}

function hasNotEnded(event = {}, comparisonDate = currentTime.value) {
  const endDate = resolveEventEndDate(event);
  if (!endDate) return false;
  return endDate.getTime() >= comparisonDate.getTime();
}

function sameDay(leftDate, rightDate) {
  return (
    leftDate.getFullYear() === rightDate.getFullYear()
    && leftDate.getMonth() === rightDate.getMonth()
    && leftDate.getDate() === rightDate.getDate()
  );
}

function formatWidgetTime(startDate, endDate) {
  return `${hhmm(startDate)}-${hhmm(endDate)}`;
}

function formatCalendarTooltipTime(event = {}) {
  const start = event?.start ? hhmm(event.start) : "";
  const end = event?.end ? hhmm(event.end) : "";
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function isTouchCapableDevice() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator || {};
  const touchPoints = Number(nav.maxTouchPoints || nav.msMaxTouchPoints || 0);
  return touchPoints > 0;
}

function canShowCalendarEventTooltip() {
  if (typeof window === "undefined") return false;
  if (isTouchCapableDevice()) return false;
  if (typeof window.matchMedia !== "function") return true;
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function showCalendarEventTooltip(event = {}, domEvent = null) {
  if (!canShowCalendarEventTooltip()) {
    hideCalendarEventTooltip();
    return;
  }

  if (!event || event.isAvailabilityBlock === true) {
    hideCalendarEventTooltip();
    return;
  }

  const target = domEvent?.currentTarget;
  if (!target || typeof target.getBoundingClientRect !== "function" || typeof window === "undefined") return;

  const rect = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth || 1024;
  const viewportHeight = window.innerHeight || 768;
  const margin = 12;
  const tooltipWidth = Math.min(272, Math.max(160, viewportWidth - (margin * 2)));
  const tooltipHeightEstimate = 84;
  const gap = 14;
  const hasBottomSpace = (viewportHeight - rect.bottom) >= (tooltipHeightEstimate + gap + margin);
  const placement = hasBottomSpace ? "bottom" : "top";
  const unclampedX = rect.left + (rect.width / 2);
  const minX = margin + (tooltipWidth / 2);
  const maxX = viewportWidth - margin - (tooltipWidth / 2);

  calendarTooltip.title = event?.title || t("dashboard_booked_slot");
  calendarTooltip.time = formatCalendarTooltipTime(event);
  calendarTooltip.status = getBookedSlotIndicatorStatus(event);
  calendarTooltip.x = Math.min(Math.max(unclampedX, minX), maxX);
  calendarTooltip.y = placement === "top" ? rect.top - gap : rect.bottom + gap;
  calendarTooltip.placement = placement;
  calendarTooltip.visible = true;
}

function hideCalendarEventTooltip() {
  calendarTooltip.visible = false;
}

const DEFAULT_AVATAR_URL = "https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png";

function isGroupCalendarEvent(event = {}) {
  const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
  const eventSnapshot = raw.eventSnapshot && typeof raw.eventSnapshot === "object" ? raw.eventSnapshot : {};
  const eventCurrent = raw.eventCurrent && typeof raw.eventCurrent === "object" ? raw.eventCurrent : {};
  return String(
    event?.type
      || event?.eventType
      || raw.eventType
      || raw.type
      || eventSnapshot.type
      || eventSnapshot.eventType
      || eventCurrent.type
      || eventCurrent.eventType
      || "",
  ).toLowerCase() === "group-event";
}

function getBookedSlotTypeIcon(event = {}) {
  return isGroupCalendarEvent(event) ? GroupCallIcon : PhoneIcon;
}

function getBookedSlotTypeIconKind(event = {}) {
  return isGroupCalendarEvent(event) ? "group" : "private";
}

function getCalendarSlotIconSizeClass(view) {
  return view === "month" ? "h-2.5 w-2.5" : "h-3 w-3";
}

function getBookedSlotIndicatorStatus(event = {}) {
  const status = resolveBookingStatus(event);
  if (status.includes("pending")) return "pending";
  if (
    status.includes("cancel")
    || status.includes("declin")
    || status.includes("reject")
  ) {
    return "declined";
  }
  return "confirmed";
}

function makeAvatar(event) {
  if (isGroupCalendarEvent(event)) {
    const participants = Array.isArray(event?.raw?.participants) ? event.raw.participants : [];
    const participantAvatars = participants
      .map((participant) => ({
        src: participant?.avatarUrl || DEFAULT_AVATAR_URL,
        name: participant?.name || "User",
      }))
      .slice(0, 4);

    if (participantAvatars.length > 0) return participantAvatars;
  }

  return [{
    src: event?.raw?.creatorAvatarUrl || DEFAULT_AVATAR_URL,
    name: event?.raw?.creatorName || t("common_creator"),
  }];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function getJoinOptionsFromEvent(event = {}) {
  const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
  const eventCurrent = raw.eventCurrent && typeof raw.eventCurrent === "object" ? raw.eventCurrent : {};
  const eventSnapshot = raw.eventSnapshot && typeof raw.eventSnapshot === "object" ? raw.eventSnapshot : {};

  return {
    enableCallReminderMinutesBefore: firstDefined(
      event.enableCallReminderMinutesBefore,
      raw.enableCallReminderMinutesBefore,
      eventSnapshot.enableCallReminderMinutesBefore,
      eventCurrent.enableCallReminderMinutesBefore,
      event.setReminders,
      raw.setReminders,
      eventSnapshot.setReminders,
      eventCurrent.setReminders,
    ),
    callReminderMinutesBefore: firstDefined(
      event.callReminderMinutesBefore,
      raw.callReminderMinutesBefore,
      raw.reminderMinutes,
      eventSnapshot.callReminderMinutesBefore,
      eventSnapshot.reminderMinutes,
      eventCurrent.callReminderMinutesBefore,
      eventCurrent.reminderMinutes,
    ),
    reminderMinutes: firstDefined(
      raw.reminderMinutes,
      event.reminderMinutes,
      eventSnapshot.reminderMinutes,
      eventCurrent.reminderMinutes,
    ),
    extensions: firstDefined(event.extensions, raw.extensions, []),
  };
}

function getGroupParticipantCount(event = {}) {
  const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
  const participants = Array.isArray(raw.participants) ? raw.participants : [];
  const explicitCount = Number(raw.participantCount ?? event.participantCount);
  if (Number.isFinite(explicitCount) && explicitCount > 0) return Math.floor(explicitCount);
  return participants.length;
}

function getWidgetGroupText(event = {}) {
  const base = t("dashboard_group_event");
  if (!isCreator.value) return base;

  const count = getGroupParticipantCount(event);
  return count > 0 ? `${base} (${count})` : base;
}

function resolveJoinStateForEvent(event = {}) {
  const isGroup = isGroupCalendarEvent(event);
  const bookingId = event?.bookingId || event?.raw?.bookingId || null;
  const joinState = getBookingJoinState({
    bookingId,
    startAt: event?.start,
    endAt: event?.end,
    status: event?.status || event?.raw?.status || "",
    ...getJoinOptionsFromEvent(event),
  });

  if (!isGroup || !isCreator.value) return joinState;

  const creatorJoinUrl = buildScheduledGroupMeetingUrl({
    eventId: event?.eventId || event?.raw?.eventId || null,
    startIso: event?.start || event?.raw?.startIso || event?.raw?.startAtIso || null,
  });

  return {
    ...joinState,
    joinUrl: creatorJoinUrl || joinState.joinUrl,
    canJoin: joinState.canJoin && Boolean(creatorJoinUrl || joinState.joinUrl),
  };
}

function shouldShowJoinButtonForEvent(event = {}, joinState = {}, options = {}) {
  if (options.showReply === true) return false;

  const status = String(event?.status || event?.raw?.status || "").toLowerCase();
  if (status === "pending" || status === "pending_hold" || status.startsWith("cancelled")) return false;

  return Boolean(joinState.joinUrl || event?.bookingId || event?.raw?.bookingId);
}

function getWidgetStatusInfo(event = {}, startDate = null, endDate = null, accentColor = null) {
  const status = String(event?.status || event?.raw?.status || "").toLowerCase();
  const defaultText = event.status === "active" ? t("dashboard_status_active") : event.status;
  const now = currentTime.value;

  if (status === "confirmed" && startDate instanceof Date && !Number.isNaN(startDate.getTime())) {
    if (endDate instanceof Date && !Number.isNaN(endDate.getTime())) {
      const nowMs = now.getTime();
      if (nowMs >= startDate.getTime() && nowMs < endDate.getTime()) {
        return {
          text: t("calendar_event_live_now"),
          color: null,
        };
      }
    }

    const msToStart = startDate.getTime() - now.getTime();
    if (msToStart > 0 && msToStart <= (5 * 60 * 1000)) {
      const minutesToStart = Math.max(1, Math.ceil(msToStart / 60000));
      return {
        text: `in ${minutesToStart} mins`,
        color: accentColor,
      };
    }
  }

  return {
    text: defaultText,
    color: null,
  };
}

function toWidgetItem(event, options = {}) {
  const startDate = asDate(event.start) || new Date();
  const endDate = asDate(event.end) || startDate;
  const isGroup = isGroupCalendarEvent(event);
  const joinState = resolveJoinStateForEvent(event);
  const accentColor = resolveEventColor(
    event?.color,
    event?.eventColorSkin,
    event?.raw?.eventColorSkin,
  );

  const styles = isGroup
    ? { titleColorClass: "text-activePink", borderClass: "bg-brightPink" }
    : { titleColorClass: "text-lightViolet", borderClass: "bg-lightViolet" };
  const participantCount = isGroup && isCreator.value ? getGroupParticipantCount(event) : undefined;
  const showJoinButton = shouldShowJoinButtonForEvent(event, joinState, options);
  const statusInfo = getWidgetStatusInfo(event, startDate, endDate, accentColor);

  if (options.layout === "today") {
    return {
      time: formatWidgetTime(startDate, endDate),
      title: event.title,
      titleColorClass: styles.titleColorClass,
      borderClass: styles.borderClass,
      bgClass: "bg-gradient-to-r from-gray-50/50 to-gray-50/20",
      showJoin: showJoinButton,
      canJoin: joinState.canJoin,
      joinUrl: joinState.joinUrl,
      joinAvailableAtIso: joinState.joinAvailableAtIso,
      statusText: statusInfo.text,
      statusColor: statusInfo.color,
      showReply: options.showReply === true,
      avatars: makeAvatar(event),
      sourceEvent: event,
      accentColor,
      isGroup,
      groupText: isGroup ? getWidgetGroupText(event) : undefined,
      participantCount,
    };
  }

  return {
    dayName: startDate.toLocaleDateString(locale.value, { weekday: "short" }).toUpperCase(),
    dayNumber: String(startDate.getDate()),
    title: event.title,
    titleColorClass: styles.titleColorClass,
    borderClass: styles.borderClass,
    bgClass: "bg-gradient-to-r from-gray-50/50 to-gray-50/20",
    isGroup,
    groupText: isGroup ? getWidgetGroupText(event) : undefined,
    participantCount,
    showJoin: showJoinButton,
    canJoin: joinState.canJoin,
    joinUrl: joinState.joinUrl,
    joinAvailableAtIso: joinState.joinAvailableAtIso,
    statusText: statusInfo.text,
    statusColor: statusInfo.color,
    showReply: options.showReply === true,
    avatars: makeAvatar(event),
    sourceEvent: event,
    accentColor,
  };
}

function resetEventsState() {
  dashboardEventsEngine.setState("events.error", null, { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.loading", false, { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.list", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.bookedList", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.catalogEvents", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.rawEvents", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.bookedSlotsRaw", [], { reason: "events-reset", silent: true });
  dashboardEventsEngine.setState("events.bookedSlotsIndex", {}, { reason: "events-reset", silent: true });
}

function buildCalendarSlotsFromContext({
  catalogEvents = [],
  bookedSlotsRaw = [],
  bookedSlotsIndex = {},
  focusDate = new Date(),
}) {
  const calendarSlots = mapBookedSlotsToCalendarEvents(bookedSlotsRaw, {
    includeStatuses: ["pending", "pending_hold", "confirmed", "completed"],
    titleFallback: t("dashboard_booked_slot"),
  });

  const eventColorByEventId = new Map(
    catalogEvents
      .map((event) => [
        String(event?.eventId || event?.id || ""),
        resolveOptionalEventColor(
          event?.color,
          event?.eventColorSkin,
          event?.raw?.color,
          event?.raw?.eventColorSkin,
        ),
      ])
      .filter(([eventId, color]) => Boolean(eventId && color)),
  );
  const callTypeByEventId = new Map(
    catalogEvents
      .map((event) => [
        String(event?.eventId || event?.id || ""),
        String(event?.eventCallType || event?.raw?.eventCallType || "").toLowerCase(),
      ])
      .filter(([eventId]) => Boolean(eventId)),
  );
  const eventTitleByEventId = new Map(
    catalogEvents
      .map((event) => [
        String(event?.eventId || event?.id || ""),
        resolveCalendarEventTitle(event),
      ])
      .filter(([eventId, title]) => Boolean(eventId && title)),
  );
  const bookedCalendarSlots = calendarSlots.map((slot) => {
    const eventId = String(slot?.eventId || "");
    const eventCallType = callTypeByEventId.get(eventId) || String(slot?.raw?.eventCallType || "").toLowerCase();
    const eventColorSkin = eventColorByEventId.get(eventId)
      || normalizeHexColor(slot?.eventColorSkin || slot?.raw?.eventColorSkin, null)
      || null;

    return {
      ...slot,
      eventCallType,
      eventColorSkin,
      raw: {
        ...(slot?.raw || {}),
        eventCallType,
        eventColorSkin,
      },
    };
  });
  const shouldHideAvailabilityTitle = (slot) => {
    const eventId = String(slot?.eventId || "").trim();
    const availabilityStartMs = new Date(slot?.start).getTime();
    if (!eventId || Number.isNaN(availabilityStartMs)) return false;

    const windowEndMs = availabilityStartMs + AVAILABILITY_TITLE_BOOKING_START_WINDOW_MS;

    return bookedCalendarSlots.some((booking) => {
      if (String(booking?.eventId || "").trim() !== eventId) return false;

      const bookingStartMs = new Date(booking?.start).getTime();
      if (Number.isNaN(bookingStartMs)) return false;

      return bookingStartMs >= availabilityStartMs && bookingStartMs <= windowEndMs;
    });
  };

  const availabilitySlots = mapAvailabilityToCalendarEvents(catalogEvents, {
    bookedSlotsIndex,
    focusDate,
    rangeDaysBefore: 14,
    rangeDaysAfter: 56,
    mode: "scheduleWindow",
  }).map((slot) => {
    const eventId = String(slot?.eventId || "");
    const eventCallType = callTypeByEventId.get(eventId) || String(slot?.eventCallType || "").toLowerCase();
    const eventColorSkin = eventColorByEventId.get(eventId)
      || resolveOptionalEventColor(slot?.color, slot?.eventColorSkin, slot?.raw?.eventColorSkin)
      || DEFAULT_EVENT_COLOR;

    return {
      ...slot,
      title: eventTitleByEventId.get(eventId) || resolveCalendarEventTitle(slot),
      color: eventColorSkin,
      eventColorSkin,
      eventCallType,
      hideAvailabilityTitle: shouldHideAvailabilityTitle(slot),
      raw: {
        ...(slot?.raw || {}),
        eventCallType,
        eventColorSkin,
      },
    };
  });

  return {
    bookedCalendarSlots,
    calendarSlots: [...availabilitySlots, ...bookedCalendarSlots],
  };
}

const rebuildAvailabilityForFocusDate = () => {
  const catalogEvents = dashboardEventsEngine.state?.events?.catalogEvents;
  const bookedSlotsRaw = dashboardEventsEngine.state?.events?.bookedSlotsRaw;
  const bookedSlotsIndex = dashboardEventsEngine.state?.events?.bookedSlotsIndex;

  if (!Array.isArray(catalogEvents) || catalogEvents.length === 0) return;
  if (!Array.isArray(bookedSlotsRaw)) return;

  const { bookedCalendarSlots, calendarSlots } = buildCalendarSlotsFromContext({
    catalogEvents,
    bookedSlotsRaw,
    bookedSlotsIndex: bookedSlotsIndex || {},
    focusDate: state.focus,
  });

  dashboardEventsEngine.setState("events.bookedList", bookedCalendarSlots, { reason: "events-focus", silent: true });
  dashboardEventsEngine.setState("events.list", calendarSlots, { reason: "events-focus", silent: true });
};

const fetchDashboardContext = async (forceRefresh = false) => {
  const creatorId = normalizedCreatorId.value;
  const fanId = normalizedFanId.value;

  if (!hasDashboardContext.value) {
    resetEventsState();
    return;
  }

  dashboardEventsEngine.setState("creatorId", creatorId, { reason: "events-fetch", silent: true });
  dashboardEventsEngine.setState("fanId", fanId, { reason: "events-fetch", silent: true });
  dashboardEventsEngine.setState("events.loading", true, { reason: "events-fetch", silent: true });

  const result = await dashboardEventsEngine.callFlow(
    "bookings.fetchDashboardBookingContext",
    {
      creatorId: isCreator.value ? creatorId : null,
      fanId: isFan.value ? fanId : null,
      userRole: dashboardRole.value,
      status: "active",
      periodMonths: 6,
      slotLimit: 1000,
      statusIn: "pending,pending_hold,confirmed,completed",
    },
    {
      forceRefresh,
      context: {
        stateEngine: dashboardEventsEngine,
        creatorId,
        apiBaseUrl: props.apiBaseUrl || undefined,
      },
    },
  );

  if (!result?.ok) {
    const message = result?.meta?.uiErrors?.[0]
      || result?.error?.message
      || t("dashboard_load_failed_message");
    dashboardEventsEngine.setState("events.error", message, { reason: "events-fetch" });
    dashboardEventsEngine.setState("events.list", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedList", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.catalogEvents", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.rawEvents", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsRaw", [], { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsIndex", {}, { reason: "events-fetch", silent: true });
  } else {
    const catalogEvents = Array.isArray(result?.data?.events) ? result.data.events : [];
    const rawEvents = Array.isArray(result?.data?.rawEvents) ? result.data.rawEvents : [];
    const bookedSlotsRaw = Array.isArray(result?.data?.bookedSlots) ? result.data.bookedSlots : [];
    const bookedSlotsIndex = result?.data?.bookedSlotsIndex || {};

    dashboardEventsEngine.setState("events.catalogEvents", catalogEvents, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.rawEvents", rawEvents, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsRaw", bookedSlotsRaw, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.bookedSlotsIndex", bookedSlotsIndex, { reason: "events-fetch", silent: true });

    const { bookedCalendarSlots, calendarSlots } = buildCalendarSlotsFromContext({
      catalogEvents,
      bookedSlotsRaw,
      bookedSlotsIndex,
      focusDate: state.focus,
    });
    dashboardEventsEngine.setState("events.bookedList", bookedCalendarSlots, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.list", calendarSlots, { reason: "events-fetch", silent: true });
    dashboardEventsEngine.setState("events.error", null, { reason: "events-fetch", silent: true });
  }

  dashboardEventsEngine.setState("events.loading", false, { reason: "events-fetch", silent: true });
  await nextTick();
  if (
    !initialWeekDateRevealed.value
    && state.view === "week"
    && typeof window !== "undefined"
    && window.innerWidth >= 1024
    && typeof mainCalendarRef.value?.revealSelectedWeekDay === "function"
  ) {
    initialWeekDateRevealed.value = true;
    mainCalendarRef.value.revealSelectedWeekDay({ behavior: "smooth" });
  }
  await mainCalendarRef.value?.scrollToCurrentTime?.({ behavior: "smooth" });
};

const resolveBookingIdFromPayload = (payload) => {
  const id = payload?.bookingId || payload?.event?.bookingId || payload?.event?.raw?.bookingId || null;
  return id ? String(id) : null;
};

const reviewPendingBooking = async (payload, decision) => {
  if (!isCreator.value) return;
  const bookingId = resolveBookingIdFromPayload(payload);
  if (!bookingId) {
    showToast({
      type: "error",
      title: t("dashboard_booking_action_failed_title"),
      message: t("dashboard_booking_action_missing_id"),
    });
    return;
  }

  if (reviewPendingLoading.value) return;
  reviewPendingLoading.value = true;

  const actionLabel = decision === "approve" ? "approved" : "rejected";

  try {
    const result = await dashboardEventsEngine.callFlow(
      "bookings.reviewPendingBooking",
      {
        bookingId,
        decision,
        actor: "creator",
        reason: decision === "approve" ? "approved_by_creator" : "rejected_by_creator",
      },
      {
        context: {
          stateEngine: dashboardEventsEngine,
          creatorId: normalizedCreatorId.value,
          apiBaseUrl: props.apiBaseUrl || undefined,
        },
      },
    );

    if (!result?.ok) {
      const message = result?.meta?.uiErrors?.[0]
        || result?.error?.message
        || t("dashboard_booking_action_update_failed");
      showToast({
        type: "error",
        title: t("dashboard_booking_action_failed_title"),
        message,
      });
      return;
    }

    showToast({
      type: "success",
      title: t("dashboard_booking_updated_title"),
      message: t("dashboard_booking_updated_message", { action: actionLabel }),
    });

    await fetchDashboardContext(true);
  } finally {
    reviewPendingLoading.value = false;
  }
};

const onApprovePendingBooking = async (payload) => {
  await reviewPendingBooking(payload, "approve");
};

const onRejectPendingBooking = async (payload) => {
  await reviewPendingBooking(payload, "reject");
};

const goToCreateEvent = (type) => {
  isCreatePopupOpen.value = false;
  newEventsPopupOpen.value = false;
  isFloatingPopupOpen.value = false;
  emit("create-event", { type });
};

const bookingScheduleEvents = computed(() => {
  const events = dashboardEventsEngine.state?.events?.catalogEvents;
  if (!Array.isArray(events)) return [];
  return events.filter((event) => String(event?.status || event?.raw?.status || "active").toLowerCase() === "active");
});

const getScheduleEventId = (event = {}) => String(event?.eventId || event?.id || event?.raw?.eventId || event?.raw?.id || "").trim();

const findBookingScheduleEventById = (eventId) => {
  const normalizedEventId = String(eventId || "").trim();
  if (!normalizedEventId) return null;

  return bookingScheduleEvents.value.find((event) => getScheduleEventId(event) === normalizedEventId) || null;
};

const normalizeScheduleEventPayload = (event = {}) => {
  const eventId = getScheduleEventId(event);
  if (!eventId) return null;

  return {
    ...event,
    eventId,
    title: String(event?.title || event?.eventTitle || event?.raw?.title || t("dashboard_booking_schedule_untitled_event")).trim(),
    type: event?.type === "group" || event?.type === "group-event" || event?.eventType === "group-event" || event?.raw?.type === "group-event"
      ? "group"
      : "private",
  };
};

const resolveAvailabilityScheduleEvent = (event = {}) => {
  const eventId = getScheduleEventId(event);
  const matchedScheduleEvent = findBookingScheduleEventById(eventId);
  return normalizeScheduleEventPayload(matchedScheduleEvent || event);
};

const scheduleCardPreviewBookedSlots = computed(() => {
  const eventId = getScheduleEventId(scheduleCardPreviewEvent.value);
  const bookedSlots = dashboardEventsEngine.state?.events?.bookedSlotsRaw;
  if (!eventId || !Array.isArray(bookedSlots)) return [];

  return bookedSlots.filter((slot) => String(slot?.eventId || slot?.raw?.eventId || "").trim() === eventId);
});

const closeScheduleCardPreview = () => {
  scheduleCardPreviewOpen.value = false;
  scheduleCardPreviewEvent.value = null;
};

const setScheduleCardPreviewOpen = (open) => {
  scheduleCardPreviewOpen.value = Boolean(open);
  if (!open) {
    scheduleCardPreviewEvent.value = null;
  }
};

const openScheduleCardPreview = (event) => {
  const normalizedEvent = normalizeScheduleEventPayload(event);
  if (!normalizedEvent) return;

  scheduleCardPreviewEvent.value = normalizedEvent;
  scheduleCardPreviewOpen.value = true;
};

const closeAvailabilityScheduleMenu = () => {
  availabilityScheduleMenu.open = false;
  availabilityScheduleMenu.event = null;
};

const positionAvailabilityScheduleMenu = (domEvent) => {
  const fallbackLeft = 8;
  const fallbackTop = 8;
  if (typeof window === "undefined") {
    availabilityScheduleMenu.left = fallbackLeft;
    availabilityScheduleMenu.top = fallbackTop;
    return;
  }

  const trigger = domEvent?.currentTarget || domEvent?.target;
  const menuWidth = 196;
  const menuHeight = 176;
  const gap = 8;
  const viewportPadding = 8;
  const viewportWidth = window.innerWidth || menuWidth + viewportPadding * 2;
  const viewportHeight = window.innerHeight || menuHeight + viewportPadding * 2;
  let left = fallbackLeft;
  let top = fallbackTop;
  let topWhenAbove = fallbackTop;

  if (Number.isFinite(domEvent?.clientX) && Number.isFinite(domEvent?.clientY)) {
    left = domEvent.clientX;
    top = domEvent.clientY;
    topWhenAbove = domEvent.clientY - menuHeight - gap;
  } else if (trigger && typeof trigger.getBoundingClientRect === "function") {
    const rect = trigger.getBoundingClientRect();
    left = rect.left;
    top = rect.bottom + gap;
    topWhenAbove = rect.top - menuHeight - gap;
  }

  if (left + menuWidth > viewportWidth - viewportPadding) {
    left = viewportWidth - menuWidth - viewportPadding;
  }

  if (top + menuHeight > viewportHeight - viewportPadding) {
    top = topWhenAbove;
  }

  availabilityScheduleMenu.left = Math.max(viewportPadding, left);
  availabilityScheduleMenu.top = Math.max(viewportPadding, top);
};

const openAvailabilityScheduleMenu = (event, domEvent) => {
  if (!isCreator.value) return;
  const scheduleEvent = resolveAvailabilityScheduleEvent(event);
  if (!scheduleEvent) return;

  availabilityScheduleMenu.event = scheduleEvent;
  positionAvailabilityScheduleMenu(domEvent);
  availabilityScheduleMenu.open = true;
};

const handleAvailabilityMenuEdit = (event) => {
  closeAvailabilityScheduleMenu();
  handleEditScheduleEvent(event);
};

const handleAvailabilityMenuViewCard = (event) => {
  closeAvailabilityScheduleMenu();
  openScheduleCardPreview(event);
};

const handleAvailabilityMenuDelete = (event) => {
  closeAvailabilityScheduleMenu();
  openDeleteEventPopup(event);
};

const handleScheduleCardPreviewEdit = (event) => {
  const selectedEvent = normalizeScheduleEventPayload(event) || scheduleCardPreviewEvent.value;
  closeScheduleCardPreview();
  handleEditScheduleEvent(selectedEvent);
};

const handleEditScheduleEvent = (event) => {
  const normalizedEvent = normalizeScheduleEventPayload(event);
  if (!normalizedEvent) return;

  emit("edit-event", {
    eventId: normalizedEvent.eventId,
    type: normalizedEvent.type,
    event: normalizedEvent,
  });
};

const deleteEventCandidateTitle = computed(() => (
  String(deleteEventCandidate.value?.title || deleteEventCandidate.value?.eventTitle || t("dashboard_booking_schedule_untitled_event")).trim()
));
const deleteEventConfirmTitle = computed(() => (
  t("dashboard_delete_booking_schedule_title", { title: deleteEventCandidateTitle.value })
));

const openDeleteEventPopup = (event) => {
  const eventId = String(event?.eventId || event?.id || "").trim();
  if (!eventId) return;
  deleteEventCandidate.value = {
    ...event,
    eventId,
    title: String(event?.title || event?.eventTitle || t("dashboard_booking_schedule_untitled_event")).trim(),
  };
  deleteEventPopupOpen.value = true;
};

const closeDeleteEventPopup = () => {
  if (deleteEventLoading.value) return;
  deleteEventPopupOpen.value = false;
  deleteEventCandidate.value = null;
};

const confirmDeleteEvent = async () => {
  const eventId = deleteEventCandidate.value?.eventId;
  if (!eventId || deleteEventLoading.value) return;

  deleteEventLoading.value = true;
  try {
    const result = await dashboardEventsEngine.callFlow(
      "events.deleteEvent",
      { eventId },
      {
        context: {
          stateEngine: dashboardEventsEngine,
          creatorId: normalizedCreatorId.value,
          apiBaseUrl: props.apiBaseUrl || undefined,
        },
      },
    );

    if (!result?.ok) {
      showToast({
        type: "error",
        title: t("dashboard_delete_booking_schedule_failed_title"),
        message: result?.meta?.uiErrors?.[0]
          || result?.error?.message
          || t("common_try_again"),
      });
      return;
    }

    showToast({
      type: "success",
      title: t("dashboard_delete_booking_schedule_success_title"),
      message: t("dashboard_delete_booking_schedule_success_message"),
    });
    deleteEventPopupOpen.value = false;
    deleteEventCandidate.value = null;
    await fetchDashboardContext(true);
  } finally {
    deleteEventLoading.value = false;
  }
};

const cancelBookingCandidateTitle = computed(() => cancelBookingCandidate.value?.event?.title || t("common_booking"));

const cancelBookingConfirmTitle = computed(() => (
  isFan.value ? t("dashboard_fan_cancel_confirm_title") : t("dashboard_cancel_confirm_title")
));

const cancelBookingConfirmBody = computed(() => (
  isFan.value ? fanCancelBookingConfirmBody.value : t("dashboard_cancel_confirm_body")
));

const cancelBookingConfirmAction = computed(() => (
  isFan.value ? t("dashboard_fan_cancel_confirm_action") : t("dashboard_cancel_confirm_action")
));

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const firstDefinedFromSources = (sources, keys) => {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
        return source[key];
      }
    }
  }
  return null;
};

const getCancellationEventSources = (event = {}) => {
  const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
  return [
    raw.eventCurrent,
    raw.eventSnapshot,
    raw,
    event,
  ].filter((source) => source && typeof source === "object");
};

const getPaymentSources = (event = {}) => {
  const raw = event?.raw && typeof event.raw === "object" ? event.raw : {};
  return [raw.payment, event.payment].filter((payment) => payment && typeof payment === "object");
};

const hasBookingFeeForCancelEvent = (event = {}) => {
  const hasBookingFeeLine = getPaymentSources(event).some((payment) => (
    Array.isArray(payment.lines)
    && payment.lines.some((line) => {
      const code = String(line?.code || "").trim().toLowerCase();
      const label = String(line?.label || "").trim().toLowerCase();
      return (code === "booking_fee" || label === "booking fee")
        && toPositiveNumber(line?.amount) > 0;
    })
  ));
  if (hasBookingFeeLine) return true;

  const sources = getCancellationEventSources(event);
  const bookingFeeEnabled = toBoolean(firstDefinedFromSources(sources, ["enableBookingFee"]));
  const bookingFeeTokens = toPositiveNumber(firstDefinedFromSources(sources, ["bookingFeeTokens", "bookingFee"]));
  return bookingFeeEnabled && bookingFeeTokens > 0;
};

const advanceCancelWindowMs = (event = {}) => {
  const sources = getCancellationEventSources(event);
  const quantity = toPositiveNumber(firstDefinedFromSources(sources, [
    "advanceCancelWindowQuantity",
    "advanceCancelWindow",
    "advanceVoid",
  ]));
  const unit = String(firstDefinedFromSources(sources, ["advanceCancelWindowUnit"]) || "").trim().toLowerCase();
  if (quantity <= 0) return 0;
  if (unit === "day" || unit === "days") return quantity * 24 * 60 * 60 * 1000;
  if (unit === "hour" || unit === "hours") return quantity * 60 * 60 * 1000;
  if (unit === "minute" || unit === "minutes") return quantity * 60 * 1000;
  return 0;
};

const isInsideAdvanceCancelWindow = (event = {}) => {
  const sources = getCancellationEventSources(event);
  const advanceCancelEnabled = toBoolean(firstDefinedFromSources(sources, [
    "allowAdvanceCancelToAvoidMinCharge",
    "allowAdvanceCancellation",
  ]));
  if (!advanceCancelEnabled) return false;

  const windowMs = advanceCancelWindowMs(event);
  if (windowMs <= 0) return false;

  const start = asDate(event?.start || event?.raw?.startIso || event?.raw?.startAtIso);
  if (!start) return false;

  return (start.getTime() - Date.now()) >= windowMs;
};

const getCancellationFeeTokensForCancelEvent = (event = {}) => {
  const sources = getCancellationEventSources(event);
  const cancellationFeeEnabled = toBoolean(firstDefinedFromSources(sources, ["enableCancellationFee"]));
  const cancellationFeeTokens = toPositiveNumber(firstDefinedFromSources(sources, ["cancellationFeeTokens", "cancellationFee"]));
  if (!cancellationFeeEnabled || cancellationFeeTokens <= 0) return 0;

  const status = String(event?.status || event?.raw?.status || "").trim().toLowerCase();
  if (status !== "confirmed") return 0;
  if (isInsideAdvanceCancelWindow(event)) return 0;

  return cancellationFeeTokens;
};

const fanCancelBookingConfirmMessages = computed(() => {
  const event = cancelBookingCandidate.value?.event || {};
  const messages = [];

  if (hasBookingFeeForCancelEvent(event)) {
    messages.push(t("dashboard_fan_cancel_confirm_booking_fee_body"));
  }

  const cancellationFeeTokens = getCancellationFeeTokensForCancelEvent(event);
  if (cancellationFeeTokens > 0) {
    messages.push(t("dashboard_fan_cancel_confirm_cancellation_fee_body", {
      tokens: Math.ceil(cancellationFeeTokens),
    }));
  }

  return messages.length > 0
    ? messages
    : [t("dashboard_fan_cancel_confirm_neutral_body")];
});

const fanCancelBookingConfirmBody = computed(() => fanCancelBookingConfirmMessages.value.join(" "));

const cancelBookingCandidateTime = computed(() => {
  const event = cancelBookingCandidate.value?.event;
  const start = asDate(event?.start);
  const end = asDate(event?.end);
  if (!start || !end) return "";
  return `${start.toLocaleDateString()} - ${hhmm(start)} - ${hhmm(end)}`;
});

const closeCancelBookingPopup = () => {
  cancelBookingPopupOpen.value = false;
  cancelBookingCandidate.value = null;
};

const allEvents = computed(() => {
  const list = dashboardEventsEngine.state?.events?.bookedList;
  if (!Array.isArray(list)) return [];
  const now = currentTime.value;
  return list.filter((event) => hasNotEnded(event, now)).sort((left, right) => {
    const leftStart = asDate(left.start)?.getTime() || 0;
    const rightStart = asDate(right.start)?.getTime() || 0;
    return leftStart - rightStart;
  });
});

const calendarEvents = computed(() => {
  const list = dashboardEventsEngine.state?.events?.list;
  if (!Array.isArray(list)) return [];
  return [...list].sort((left, right) => {
    const leftStart = asDate(left.start)?.getTime() || 0;
    const rightStart = asDate(right.start)?.getTime() || 0;
    return leftStart - rightStart;
  });
});

const events1 = computed(() => {
  const now = currentTime.value;
  return calendarEvents.value.filter((event) => {
    const status = resolveBookingStatus(event);
    return !status.startsWith("cancelled")
      && (!props.filterPastPendingBookings || !isPastPendingBookedCalendarEvent(event, now));
  });
});
const miniEvents = computed(() => {
  const combined = [
    ...(events1.value || []),
    ...(allEvents.value || []),
    ...(calendarEvents.value || []),
  ];
  const seen = new Set();
  return combined.filter((event) => {
    if (!event) return false;
    const id = String(event.id || event.eventId || event.bookingId || `${event.start}-${event.title}`);
    if (seen.has(id)) return false;
    seen.add(id);
    const status = String(event.status || resolveBookingStatus(event) || "").toLowerCase();
    return !status.startsWith("cancelled");
  });
});

const eventsData = computed(() => {
  const focus = state.focus || new Date();
  
  if (state.view === "day") {
    const yesterday = addDays(focus, -1);
    const tomorrow = addDays(focus, 1);

    const filterByDay = (date) => allEvents.value.filter(ev => sameDay(asDate(ev.start), date));

    const yesterdaySections = buildExpandedMonthSections(filterByDay(yesterday), yesterday);
    const todaySections = buildExpandedMonthSections(filterByDay(focus), focus);
    const tomorrowSections = buildExpandedMonthSections(filterByDay(tomorrow), tomorrow);

    const pendingItems = allEvents.value
      .filter(event => {
        const status = String(event.status || "").toLowerCase();
        return status === "pending" || status === "pending_hold";
      })
      .map(event => toWidgetItem(event, { showReply: true }));

    return [
      ...yesterdaySections,
      ...todaySections,
      ...tomorrowSections,
      { title: t("dashboard_pending_events"), items: pendingItems },
    ];
  }

  const now = currentTime.value;

  const todayItems = [];
  const weekItems = [];
  const pendingItems = [];

  allEvents.value.forEach((event) => {
    const startDate = asDate(event.start);
    if (!startDate) return;

    const status = String(event.status || "").toLowerCase();
    if (status === "pending" || status === "pending_hold") {
      pendingItems.push(toWidgetItem(event, { showReply: true }));
      return;
    }

    if (sameDay(startDate, now)) {
      todayItems.push(toWidgetItem(event, { layout: "today" }));
      return;
    }

    if (startDate > now) {
      weekItems.push(toWidgetItem(event, { layout: "week" }));
    }
  });

  return [
    { title: t("dashboard_today_section"), items: todayItems },
    { title: t("dashboard_week_section"), items: weekItems },
    { title: t("dashboard_pending_events"), items: pendingItems },
  ];
});

const buildExpandedMonthSections = (events = [], day = null) => {
  const now = currentTime.value;
  const items = events.filter((event) => hasNotEnded(event, now)).map((event) => {
    const status = String(event?.status || "").toLowerCase();
    return toWidgetItem(event, {
      layout: "today",
      showReply: status === "pending" || status === "pending_hold",
    });
  });
  const sectionDate = asDate(day);
  const title = sectionDate
    ? sectionDate.toLocaleDateString(locale.value, { weekday: "short", month: "short", day: "numeric" }).toUpperCase()
    : t("dashboard_today_section");

  return [{ title, items }];
};

const onSelectFromMini = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date);
  rebuildAvailabilityForFocusDate();
};

const onSelectFromMain = (date) => {
  state.selected = new Date(date);
  state.focus = new Date(date);
  rebuildAvailabilityForFocusDate();
};

const onCalendarEventClick = (event) => {
  console.log("[listener] event-click -> event object:", event.detail.event);
};

const handleJoin = (item) => {
  const sourceEvent = item?.sourceEvent || item?.event || item || null;
  const joinState = resolveJoinStateForEvent(sourceEvent);

  if (!joinState.canJoin || !joinState.joinUrl) {
    showToast({
      type: "error",
      title: t("dashboard_join_unavailable_title"),
      message: t("dashboard_join_unavailable_message"),
    });
    return;
  }

  emit("open-url", {
    url: joinState.joinUrl,
    target: "_self",
  });
};

const handleReply = (item) => {
  console.log("Reply", item);
};

const handleWidgetEventClick = (item) => {
  const event = item?.sourceEvent;
  if (!event) return;
  mainCalendarRef.value?.openEventDetails?.(event);
};

const handleMonthExpandedEventClick = (item, onClick) => {
  const event = item?.sourceEvent;
  if (event && typeof onClick === "function") {
    onClick(event);
    return;
  }
  handleWidgetEventClick(item);
};

const handleWidgetMenuAction = (payload) => {
  const action = String(payload?.action || "");
  const event = payload?.event?.sourceEvent || payload?.event || null;

  if (action === "cancel_call") {
    const bookingId = resolveBookingIdFromPayload({ event });
    if (!bookingId) {
      showToast({
        type: "error",
        title: t("dashboard_booking_cancel_failed_title"),
        message: t("dashboard_cancel_missing_id"),
      });
      return;
    }
    cancelBookingCandidate.value = { bookingId, event };
    cancelBookingPopupOpen.value = true;
    return;
  }

  if (action === "ask_more_time" || action === "ask_to_reschedule") {
    showToast({
      type: "info",
      title: t("dashboard_coming_soon_title"),
      message: t("dashboard_coming_soon_message"),
    });
  }
};

const onCancelBookingFromCalendar = (payload) => {
  const bookingId = resolveBookingIdFromPayload(payload || {});
  const event = payload?.event || null;
  if (!bookingId) {
    showToast({
      type: "error",
      title: t("dashboard_booking_cancel_failed_title"),
      message: t("dashboard_cancel_missing_id"),
    });
    return;
  }
  cancelBookingCandidate.value = { bookingId, event };
  cancelBookingPopupOpen.value = true;
};

const confirmCancelBooking = async () => {
  const bookingId = cancelBookingCandidate.value?.bookingId;
  if (!bookingId || cancelBookingLoading.value) return;

  const cancellationRequest = isFan.value
    ? {
        bookingId,
        actor: "fan",
        reason: "fan_cancelled_from_events_widget",
      }
    : {
        bookingId,
        actor: "creator",
        reason: "creator_cancelled_from_events_widget",
      };

  cancelBookingLoading.value = true;
  try {
    const result = await dashboardEventsEngine.callFlow(
      "bookings.cancelBooking",
      cancellationRequest,
      {
        context: {
          stateEngine: dashboardEventsEngine,
          creatorId: normalizedCreatorId.value,
          apiBaseUrl: props.apiBaseUrl || undefined,
        },
      },
    );

    if (!result?.ok) {
      const message = result?.meta?.uiErrors?.[0]
        || result?.error?.message
        || t("dashboard_booking_cancel_failed_message");
      showToast({
        type: "error",
        title: t("dashboard_booking_cancel_failed_title"),
        message,
      });
      return;
    }

    showToast({
      type: "success",
      title: t("dashboard_booking_cancelled_title"),
      message: t("dashboard_booking_cancelled_message"),
    });
    closeCancelBookingPopup();
    await fetchDashboardContext(true);
  } finally {
    cancelBookingLoading.value = false;
  }
};

onMounted(() => {
  isMounted.value = true;
  currentTime.value = new Date();
  currentTimeTimer.value = window.setInterval(() => {
    currentTime.value = new Date();
  }, 60 * 1000);
  dashboardEventsEngine.initialize({ fromUrl: false });

  window.addEventListener("resize", handlePositionUpdate);
  window.addEventListener("scroll", handlePositionUpdate, true);
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleDocumentKeydown);
  document.addEventListener("calendar:event-click", onCalendarEventClick);

  if (hasDashboardContext.value) {
    fetchDashboardContext(true);
  } else {
    resetEventsState();
  }

  if (isFan.value) {
    isCreatePopupOpen.value = false;
    isFloatingPopupOpen.value = false;
    newEventsPopupOpen.value = false;
  }
});

watch([normalizedCreatorId, normalizedFanId, dashboardRole], ([nextCreatorId, nextFanId, nextRole], [previousCreatorId, previousFanId, previousRole]) => {
  if (!isMounted.value) return;

  if (nextRole === "fan") {
    if (nextFanId == null) {
      resetEventsState();
      return;
    }
    if (nextFanId !== previousFanId || nextRole !== previousRole) {
      fetchDashboardContext(true);
    }
    return;
  }

  if (nextCreatorId == null) {
    resetEventsState();
    return;
  }
  if (nextCreatorId !== previousCreatorId || nextRole !== previousRole) {
    fetchDashboardContext(true);
  }
});

watch(() => props.refreshSignal, (nextSignal, previousSignal) => {
  if (!isMounted.value) return;
  if (!nextSignal || nextSignal === previousSignal) return;
  if (!hasDashboardContext.value) return;
  fetchDashboardContext(true);
});

watch(dashboardRole, (nextRole) => {
  if (nextRole === "fan") {
    isCreatePopupOpen.value = false;
    isFloatingPopupOpen.value = false;
    newEventsPopupOpen.value = false;
    closeAvailabilityScheduleMenu();
  }
});

watch(() => state.view, () => {
  closeAvailabilityScheduleMenu();
});

onUnmounted(() => {
  if (currentTimeTimer.value) {
    window.clearInterval(currentTimeTimer.value);
    currentTimeTimer.value = null;
  }
  window.removeEventListener("resize", handlePositionUpdate);
  window.removeEventListener("scroll", handlePositionUpdate, true);
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleDocumentKeydown);
  document.removeEventListener("calendar:event-click", onCalendarEventClick);
});

defineExpose({
  resetEmbeddedMobileScrollToTop,
});
</script>

<style scoped>
:deep(.dashboard-events-calendar-time-label:last-child) {
  display: none;
}

.month-booking-row {
  height: 1.375rem;
  min-height: 1.375rem;
  align-items: center;
  gap: 0.25rem;
  overflow: hidden;
  padding: 0 0.25rem;
}

.month-booking-row > :first-child {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.month-booking-row [data-test="dashboard-calendar-booking-title"] {
  min-width: 0;
  width: auto;
  flex: 1 1 auto;
  padding-top: 0;
  padding-bottom: 0;
}

.month-booking-row [data-test="dashboard-calendar-booking-time"] {
  min-width: max-content;
  flex: 0 0 auto;
  overflow: visible;
  padding: 0;
  white-space: nowrap;
}

.month-booking-row [data-test="dashboard-calendar-booking-time"] > :last-child {
  min-width: max-content;
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}
</style>
