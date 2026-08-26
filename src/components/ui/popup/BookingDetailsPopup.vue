<template>
  <component :is="panelComponent" v-bind="panelProps" @update:model-value="handleModelUpdate" @closed="emit('closed')">
    <div
      class="relative w-full overflow-auto inline-flex flex-col justify-start items-start"
      :class="[surfaceWidthClass, isCompact ? 'booking-details-compact-surface bg-[#F9FAFB]' : 'h-full bg-white']"
      :data-layout-variant="layoutVariant"
      data-test="event-details-fan"
      :style="{ '--event-color': eventColor }"
    >
      <div
        v-if="refreshing"
        class="absolute inset-0 z-[70] flex items-center justify-center bg-white/85 backdrop-blur-[1px]"
        data-test="booking-details-refreshing"
      >
        <Spinner
          size="md"
          thickness="2.5"
          color="text-[#5549FF]"
          data-test="booking-details-refreshing-spinner"
        />
      </div>

      <template v-if="isCompact">
        <div class="absolute inset-y-0 left-0 z-10 w-1" :style="{ backgroundColor: eventColor }" data-test="booking-details-compact-color-rail" />

        <div class="hidden h-7 w-full items-start justify-between md:flex" data-test="booking-details-compact-desktop-header">
          <div class="inline-flex h-7 items-center">
            <div class="h-7 px-1.5 py-1 inline-flex items-center" :style="{ backgroundColor: eventColor }" data-test="booking-details-compact-event-type">
              <span class="text-sm font-bold leading-5 text-white">{{ eventTypeLabel }}</span>
            </div>
            <div class="h-7 px-1.5 py-1 inline-flex items-center gap-1.5">
              <img v-if="compactPendingStatus" :src="CompactPendingIcon" alt="" class="size-4" data-test="booking-details-compact-pending-icon" />
              <span v-else class="size-2.5 rounded-full" :style="{ backgroundColor: statusColor }" aria-hidden="true" data-test="booking-details-compact-status-dot" />
              <span class="text-sm font-medium uppercase leading-5 text-[#667085]" data-test="booking-details-compact-status">{{ statusText }}</span>
            </div>
          </div>
          <button type="button" class="m-2 flex size-10 items-center justify-center disabled:cursor-wait disabled:opacity-50" :disabled="actionLoading" :aria-label="t('common_close')" data-test="booking-details-compact-close" @click="closePanel">
            <img :src="CompactCloseIcon" alt="" class="size-5" />
          </button>
        </div>

        <div class="flex w-full flex-1 flex-col gap-5 p-4 md:pt-3">
          <div class="flex w-full items-center gap-2 md:hidden" data-test="booking-details-compact-mobile-header">
            <img v-if="compactPendingStatus" :src="CompactPendingIcon" alt="" class="size-4 shrink-0" data-test="booking-details-compact-pending-icon" />
            <span v-else class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: statusColor }" aria-hidden="true" data-test="booking-details-compact-status-dot" />
            <h2 class="min-w-0 flex-1 truncate text-2xl font-semibold leading-8 text-[#B54708]" data-test="booking-details-compact-title">{{ titleText }}</h2>
            <button type="button" class="flex size-5 shrink-0 items-center justify-center disabled:cursor-wait disabled:opacity-50" :disabled="actionLoading" :aria-label="t('common_close')" data-test="booking-details-compact-close" @click="closePanel">
              <img :src="CompactCloseIcon" alt="" class="size-4" />
            </button>
          </div>

          <h2 class="hidden w-full truncate text-3xl font-semibold leading-[2.375rem] text-[#B54708] md:block" data-test="booking-details-compact-title">{{ titleText }}</h2>

          <BookingDetailsInformation
            compact
            :formatted-date="formattedDate"
            :formatted-time-range="formattedTimeRange"
            :counterparty-name="creatorName"
            :counterparty-fallback="counterpartyFallback"
            :counterparty-avatar="creatorAvatar"
            :counterparty-verified="creatorVerified"
            :additional-request-lines="additionalRequestLines"
            :session-cost="paymentTotal"
            :session-deposit="sessionDepositTokens"
            :cancellation-fee="activeCancellationFee"
            :booking-fee="activeBookingFee"
            :pending-price-adjustment="pendingPriceAdjustment"
            :adjustment="adjustment"
            :reminder-text="reminderText"
          />

          <button
            v-if="canReviewBooking && compactReviewMode !== 'full'"
            type="button"
            class="mt-auto flex min-h-10 w-full items-center justify-center bg-[#07F468] px-6 py-2 text-base font-medium leading-6 text-[#0C111D] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="actionLoading"
            :aria-label="t('calendar_event_accept_booking')"
            data-test="booking-details-compact-accept"
            @click="approveBooking"
          >
            <Spinner
              v-if="actionLoading"
              size="sm"
              thickness="2.5"
              color="text-[#0C111D]"
              :show-track="false"
              data-test="booking-details-compact-accept-spinner"
            />
            <span v-else>{{ t('calendar_event_accept_booking') }}</span>
          </button>
        </div>

        <div
          v-if="showExpiredNotice"
          class="mt-auto flex w-full items-stretch border-l-[3px] border-gray-400 bg-gray-50 p-3"
          data-test="booking-details-compact-expired-notice"
        >
          <div class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-500" data-test="booking-details-compact-expired-badge">
            {{ t('booking_details_request_expired') }}
          </div>
        </div>

        <div
          v-else-if="canReviewBooking && compactReviewMode === 'full'"
          class="mt-auto flex w-full flex-col gap-2 border-l-[3px] border-[#06AED4] bg-[#ECFDFF] p-3"
          data-test="booking-details-compact-review-notice"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div data-svg-wrapper class="relative shrink-0">
              <img v-if="creatorAvatar" :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" />
              <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-[#FCE40D] text-sm font-semibold text-[#344054]" aria-hidden="true">
                {{ creatorName.charAt(0) }}
              </div>
            </div>
            <div class="min-w-0 flex-1 text-sm font-semibold leading-5 text-[#0096B7]" data-test="booking-details-compact-review-heading">
              {{ t('booking_details_pending_request_from', { fan: creatorName || t('common_fan') }) }}
            </div>
          </div>

          <button
            type="button"
            class="flex min-h-10 w-full items-center justify-center gap-2 rounded-sm bg-[#07F468] px-4 py-2 text-sm font-medium text-[#0C111D] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="actionLoading"
            :aria-label="t('calendar_event_accept_booking')"
            data-test="booking-details-compact-accept"
            @click="approveBooking"
          >
            <Spinner
              v-if="actionLoading"
              size="sm"
              thickness="2.5"
              color="text-[#0C111D]"
              :show-track="false"
              data-test="booking-details-compact-accept-spinner"
            />
            <template v-else>
              <span data-svg-wrapper class="relative"><img :src="CheckBlackIcon" alt="" class="h-5 w-5" /></span>
              <span>{{ t('calendar_event_accept_booking') }}</span>
            </template>
          </button>

          <div class="flex w-full items-center gap-2" data-test="booking-details-compact-review-actions">
            <button
              v-if="canAdjustBooking"
              type="button"
              class="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-sm border border-[#344054] bg-white px-4 py-2 text-sm font-medium text-[#1D2939] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="actionLoading"
              data-test="booking-details-compact-adjust"
              @click="adjustBooking"
            >
              <span data-svg-wrapper class="relative"><img :src="EditGrayIcon" alt="" class="h-5 w-5" /></span>
              {{ t('booking_details_adjust_detail') }}
            </button>
            <div class="relative ml-auto shrink-0" data-booking-review-menu @click.stop>
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#344054] bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                :aria-label="t('fan_event_details_booking_actions')"
                :aria-expanded="reviewMenuOpen"
                :disabled="actionLoading"
                data-test="booking-details-compact-review-menu"
                @click.stop="toggleReviewMenu"
              >
                <img :src="DotsGrayIcon" alt="" class="h-5 w-5" />
              </button>
              <div
                v-if="reviewMenuOpen"
                class="absolute bottom-11 right-0 z-[1200] w-[11rem] rounded-md border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
                data-test="booking-details-compact-review-menu-dropdown"
                @click.stop
              >
                <button
                  type="button"
                  class="inline-flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[#FF4405] hover:bg-[#FFF4ED]"
                  :disabled="actionLoading"
                  data-test="booking-details-compact-decline"
                  @click.stop="openRejectConfirmation"
                >
                  <span data-svg-wrapper class="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#FF4405" stroke-width="1.5" stroke-linecap="round" /></svg>
                  </span>
                  {{ t('calendar_event_decline_booking') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
      <div class="self-stretch relative bg-black/25 backdrop-blur-[5px] flex flex-col justify-start items-start">
        <div class="self-stretch px-4 pt-12 pb-2 min-h-[18.75rem] relative bg-gradient-to-b from-amber-400/5 to-amber-400/30 flex flex-col justify-end items-start gap-4" data-test="event-details-fan-hero">
          <div class="h-6 p-1.5 bg-[rgba(29,29,29,0.5)] rounded-[50px] inline-flex justify-start items-center gap-1" data-test="event-details-fan-status">
            <div data-property-1="decline" data-size="Default" class="size-4 p-px flex justify-start items-center gap-2.5">
              <div v-if="displayIsCancelledStatus" class="size-3.5 rounded-[50px] flex justify-center items-center gap-2.5" :style="{ backgroundColor: statusColor }">
                <div data-svg-wrapper class="relative">
                  <img :src="CloseIcon" alt="" class="h-3 w-3" />
                </div>
              </div>
              <div v-else-if="compactPendingStatus" class="size-4 rounded-[50px] flex justify-center items-center gap-2.5">
                <div  data-svg-wrapper class="relative">
                  <img :src="HelpCircleIcon" alt="" class="h-4 w-4" />
                </div>
              </div>
              <div v-else class="size-3.5 rounded-[50px] flex justify-center items-center gap-2.5 bg-[#07F468]">
                <div  data-svg-wrapper class="relative">
                  <img :src="CheckBlackIcon" alt="" class="h-2.5 w-2.5" />
                </div>
              </div>
            </div>
            <div class="justify-start text-white text-xs font-normal font-['Poppins'] leading-4 line-clamp-1">{{ statusText }}</div>
          </div>

          <img :src="coverImage" :alt="titleText" class="absolute left-0 top-0 h-full w-full object-cover -z-[1]" data-test="event-details-fan-cover" />

          <div class="self-stretch flex flex-col justify-start items-start gap-4">
            <div class="self-stretch justify-start text-white text-2xl md:text-3xl font-semibold leading-8 md:leading-9 line-clamp-2">{{ titleText }}</div>
            <div class="self-stretch flex flex-col justify-center items-start">
              <div class="justify-center text-white text-base md:text-xl font-semibold leading-6 md:leading-8">{{ formattedDate }}</div>
              <div class="size- inline-flex justify-start items-start gap-2">
                <div class="justify-center text-white text-base md:text-xl font-semibold leading-6 md:leading-8">{{ formattedTimeRange }}</div>
              </div>
            </div>
            <div v-if="creatorName" class="self-stretch flex flex-col justify-center items-start gap-2">
              <div class="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
                <div class="h-6 flex justify-center items-center gap-1.5">
                  <div v-if="creatorAvatar" data-svg-wrapper class="relative">
                    <img :src="creatorAvatar" :alt="creatorName" class="h-[1.375rem] w-[1.375rem] object-cover [border-radius:25%_75%_50%_51%_/_45%_65%_36%_55%]" />
                  </div>
                  <div class="size- inline-flex flex-col justify-center items-start">
                    <div class="self-stretch inline-flex justify-start items-center gap-1">
                      <div class="justify-start text-white text-base font-medium leading-6 line-clamp-1">{{ creatorName }}</div>
                      <div v-if="creatorVerified" data-svg-wrapper data-size="xs" class="relative">
                        <img :src="VerifiedBlueTickIcon" alt="" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="showMenu && !canReviewBooking" class="right-4 top-[16px] absolute z-20 inline-flex items-start gap-1">
            <div data-svg-wrapper class="relative">
              <button type="button" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-black/20" :aria-label="t('fan_event_details_booking_actions')" :aria-expanded="menuOpen" data-test="event-details-fan-menu" @click.stop="toggleMenu">
                <img :src="DotsWhiteIcon" alt="" class="cursor-pointer" />
              </button>
              <div v-if="menuOpen" class="absolute right-0 top-9 z-[1200] w-[14rem] rounded-[0.375rem] border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] overflow-hidden" data-test="event-details-fan-menu-dropdown" @click.stop>
                <button type="button" class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#F04438] hover:bg-[#FEF3F2]" data-test="event-details-fan-cancel" @click.stop="requestCancel">
                  <span data-svg-wrapper class="inline-flex w-5 h-5 items-center justify-center">
                    <span
                      aria-hidden="true"
                      class="h-5 w-5 bg-[#F04438]"
                      :style="{ maskImage: `url(${CloseIcon})`, WebkitMaskImage: `url(${CloseIcon})`, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center', maskSize: 'contain', WebkitMaskSize: 'contain' }"
                    />
                  </span>
                  {{ t('fan_event_details_cancel_booking') }}
                </button>
              </div>
            </div>
            <button type="button" data-svg-wrapper class="flex h-8 w-8 cursor-pointer items-center justify-center rounded hover:bg-black/20" :aria-label="t('common_close')" data-test="event-details-fan-close" @click.stop="closePanel">
              <img :src="CloseIcon" alt="" class="h-6 w-6" />
            </button>
          </div>
          <button v-else type="button" data-svg-wrapper class="right-4 top-[16px] absolute z-20 cursor-pointer" :aria-label="t('common_close')" data-test="event-details-fan-close" @click="closePanel">
            <img :src="CloseIcon" alt="" class="cursor-pointer h-6 w-6" />
          </button>
        </div>

        <div class="size- px-1.5 py-1 left-0 top-0 absolute rounded-br-sm inline-flex justify-center items-center gap-2.5" :style="{ backgroundColor: eventColor }" data-test="event-details-fan-event-type-badge">
          <div class="justify-start text-white text-sm font-bold leading-5">{{ eventTypeLabel }}</div>
        </div>
      </div>

      <div v-if="showCreatorCancellationNotice" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-start" data-test="booking-details-cancelled-notice">
        <div class="w-1 self-stretch bg-[#FF4405]" />
        <div class="flex-1 px-3 py-3 bg-[#FFF4ED] inline-flex justify-start items-start gap-3">
          <div v-if="creatorAvatar" data-svg-wrapper class="relative shrink-0"><img :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" /></div>
          <div class="flex-1 text-sm leading-5 text-[#7A271A]">
            <div class="font-semibold" data-test="booking-details-cancelled-heading">{{ cancelledNoticeHeading }}</div>
            <div v-if="noShowNotice" class="mt-1 text-gray-900" data-test="booking-details-no-show-notice">{{ noShowNotice }}</div>
            <div v-if="cancelledRefundTokens != null" class="mt-1 text-gray-900" data-test="booking-details-cancelled-refund">{{ t('booking_details_cancelled_refund_notice', { tokens: formatTokenAmount(cancelledRefundTokens) }) }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="showFanNoShowNotice" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-stretch" data-test="booking-details-fan-cancelled-notice">
        <div class="w-1 self-stretch bg-[#FF4405]" />
        <div class="flex-1 px-3 py-3 bg-[#FFF4ED] inline-flex justify-start items-center gap-3 min-w-0">
          <div v-if="creatorAvatar" data-svg-wrapper class="relative shrink-0"><img :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" /></div>
          <div class="flex-1 min-w-0 text-sm font-semibold leading-5 text-[#7A271A]" data-test="booking-details-no-show-notice">{{ noShowNotice }}</div>
        </div>
      </div>

      <div v-else-if="showExpiredNotice" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-stretch" data-test="booking-details-expired-notice">
        <div class="w-1 self-stretch bg-gray-400" />
        <div class="flex-1 px-3 py-3 bg-gray-50 inline-flex justify-start items-center gap-3 min-w-0">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-500" data-test="booking-details-expired-badge">
            {{ t('booking_details_request_expired') }}
          </div>
        </div>
      </div>

      <div v-else-if="canReviewBooking" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-stretch" data-test="booking-details-review-notice">
        <div class="w-1 self-stretch bg-[#06AED4]" />
        <div class="flex-1 px-3 py-3 bg-[#ECFDFF] inline-flex justify-start items-start gap-3 min-w-0">
          <div v-if="creatorAvatar" data-svg-wrapper class="relative shrink-0">
            <img :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" />
          </div>
          <div class="flex-1 min-w-0 flex flex-col items-start gap-3">
            <div class="self-stretch text-sm font-semibold leading-5 text-[#0096B7]" data-test="booking-details-review-heading">
              {{ t('booking_details_pending_request_from', { fan: creatorName || t('common_fan') }) }}
            </div>
            <div class="self-stretch flex flex-nowrap items-center gap-2" data-test="booking-details-review-actions">
              <button type="button" class="flex-1 min-w-0 min-h-10 px-4 py-2 rounded-sm shadow-sm inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-950 bg-[#07F468] disabled:cursor-not-allowed disabled:opacity-60" :disabled="actionLoading" data-test="booking-details-accept" @click="approveBooking">
                <span data-svg-wrapper class="relative"><img :src="CheckBlackIcon" alt="" class="h-5 w-5" /></span>
                {{ actionLoading ? t('common_loading') : t('calendar_event_accept_booking') }}
              </button>
              <button v-if="canAdjustBooking" type="button" class="flex-1 min-w-0 min-h-10 px-4 py-2 rounded-sm border border-[#344054] bg-white inline-flex items-center justify-center gap-2 text-sm font-medium text-[#1D2939] disabled:cursor-not-allowed disabled:opacity-60" :disabled="actionLoading" data-test="booking-details-adjust" @click="adjustBooking">
                <span data-svg-wrapper class="relative"><img :src="EditGrayIcon" alt="" class="h-5 w-5" /></span>
                {{ t('calendar_event_adjust_request') }}
              </button>
              <div class="relative ml-auto shrink-0" data-booking-review-menu @click.stop>
                <button type="button" class="h-10 w-10 rounded-sm border border-[#98A2B3] bg-white inline-flex items-center justify-center hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60" :aria-label="t('fan_event_details_booking_actions')" :aria-expanded="reviewMenuOpen" :disabled="actionLoading" data-test="booking-details-review-menu" @click.stop="toggleReviewMenu">
                  <img :src="DotsGrayIcon" alt="" class="h-5 w-5" />
                </button>
                <div v-if="reviewMenuOpen" class="absolute right-0 top-11 z-[1200] w-[11rem] rounded-md border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)]" data-test="booking-details-review-menu-dropdown" @click.stop>
                  <button type="button" class="w-full px-3 py-2.5 inline-flex items-center gap-2 text-left text-sm font-medium text-[#FF4405] hover:bg-[#FFF4ED]" :disabled="actionLoading" data-test="booking-details-decline" @click.stop="openRejectConfirmation">
                    <span data-svg-wrapper class="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="#FF4405" stroke-width="1.5" stroke-linecap="round" /></svg>
                    </span>
                    {{ t('calendar_event_decline_booking') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="creatorWaitingForAdjustment"
        class="self-stretch min-h-16 border-b-[0.5px] border-[#EAECF0] inline-flex items-stretch"
        :data-counteroffer-type="counterOfferType"
        data-test="booking-details-adjustment-waiting-notice"
      >
        <div class="w-[3px] shrink-0 self-stretch bg-[#98A2B3]" data-test="booking-details-counteroffer-rail" />
        <div class="flex-1 min-w-0 px-2 py-3 flex flex-col items-start gap-4 [background:linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.9)_100%),linear-gradient(90deg,rgba(152,162,179,0.15)_0%,rgba(152,162,179,0.15)_100%),linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.9)_100%)]">
          <div class="self-stretch flex items-start justify-end gap-4">
            <div class="relative size-10 shrink-0 rounded-[200px] bg-[#FCE40D]" data-test="booking-details-counteroffer-sent-icon">
              <img
                v-if="creatorAvatar"
                :src="creatorAvatar"
                :alt="creatorName || decisionFanUsername"
                class="size-10 rounded-full object-cover"
                data-test="booking-details-counteroffer-avatar"
              />
              <div class="absolute left-7 top-[27px] z-10 size-[22px] rounded-lg bg-[#98A2B3]">
                <div data-svg-wrapper class="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 overflow-hidden">
                  <img :src="SendWhiteIcon" alt="" class="size-4" />
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0 self-stretch flex flex-col items-start justify-center">
              <div class="self-stretch pb-2 pr-1 pt-1 text-sm font-semibold leading-5 text-[#344054] break-words" data-test="booking-details-adjustment-waiting-heading">
                {{ t('booking_details_counteroffer_sent_for_review', { fan: decisionFanUsername }) }}
              </div>
              <div class="self-stretch flex flex-col items-start gap-2.5">
                <div v-if="counterOfferPresentation.remarks" class="self-stretch flex flex-col items-start gap-0.5 text-black [text-shadow:_0px_0px_10px_rgb(0_0_0_/_0.10)]" data-test="booking-details-counteroffer-remarks">
                  <div class="self-stretch text-xs font-normal leading-[18px]">{{ t('booking_details_counteroffer_your_remarks') }}</div>
                  <div class="self-stretch whitespace-pre-wrap break-words text-sm font-normal leading-5">“{{ counterOfferPresentation.remarks }}”</div>
                </div>
                <div v-if="counterOfferPresentation.hasComparison" class="self-stretch flex flex-wrap items-center gap-2" data-test="booking-details-counteroffer-comparison">
                  <div class="min-w-0 px-2 flex flex-col items-start justify-center gap-1">
                    <div class="text-xs font-medium leading-[18px] text-[#97180C]" data-test="booking-details-counteroffer-original-label">{{ counterOfferPresentation.originalLabel }}</div>
                    <div class="min-w-0 flex items-center gap-1">
                      <img v-if="counterOfferPresentation.usesTokens" :src="tokenIcon" alt="" class="size-5 shrink-0 grayscale" data-test="booking-details-counteroffer-original-token" />
                      <div class="min-w-0 break-words text-sm font-medium leading-5 text-[#667085] line-through" data-test="booking-details-counteroffer-original-value">{{ counterOfferPresentation.originalValue }}</div>
                    </div>
                  </div>
                  <div data-svg-wrapper class="relative size-6 shrink-0 overflow-hidden">
                    <img :src="priceArrowIcon" alt="" class="size-6" />
                  </div>
                  <div class="min-w-0 px-2 flex flex-col items-start justify-center gap-1">
                    <div class="text-xs font-medium leading-[18px] text-[#FF4405]" data-test="booking-details-counteroffer-proposed-label">{{ counterOfferPresentation.proposedLabel }}</div>
                    <div class="min-w-0 flex items-center gap-1">
                      <img v-if="counterOfferPresentation.usesTokens" :src="tokenIcon" alt="" class="size-5 shrink-0" data-test="booking-details-counteroffer-proposed-token" />
                      <div class="min-w-0 break-words text-sm font-semibold leading-5 text-[#FF4405]" data-test="booking-details-counteroffer-proposed-value">{{ counterOfferPresentation.proposedValue }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="fanPendingTimeOffer" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-stretch" data-test="booking-details-time-offer">
        <div class="w-1 self-stretch bg-orange-600" />
        <div class="flex-1 px-3 py-3 bg-[#FFF4ED] inline-flex justify-start items-start gap-3 min-w-0">
          <div v-if="creatorAvatar" data-svg-wrapper class="relative shrink-0">
            <img :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" />
          </div>
          <div class="flex-1 min-w-0 flex flex-col items-start gap-3">
            <div class="self-stretch text-sm leading-5 text-[#7A271A]" data-test="booking-details-time-offer-heading">
              <span class="font-semibold">{{ creatorName || t('common_creator') }}</span>
              {{ counterOfferType === 'reschedule' ? t('booking_details_proposed_reschedule') : t('booking_details_proposed_more_time') }}
            </div>
            <div class="self-stretch inline-flex flex-wrap items-center gap-2">
              <div class="inline-flex flex-col items-start gap-0.5">
                <span class="text-xs font-medium leading-4 text-red-800">{{ t('booking_details_current_time') }}</span>
                <span class="text-sm font-medium leading-5 text-gray-500 line-through" data-test="booking-details-time-offer-original">{{ formattedCurrentRange }}</span>
              </div>
              <div data-svg-wrapper class="relative"><img :src="ArrowBrownIcon" alt="" /></div>
              <div class="inline-flex flex-col items-start gap-0.5">
                <span class="text-xs font-medium leading-4 text-orange-600">{{ t('booking_details_new_time') }}</span>
                <span class="text-sm font-semibold leading-5 text-orange-600" data-test="booking-details-time-offer-proposed">{{ formattedProposedRange }}</span>
              </div>
            </div>
            <div class="self-stretch flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button type="button" class="flex-1 min-w-20 p-2 bg-[#07F468] flex justify-center items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" :disabled="actionLoading" data-test="booking-details-accept-counter" @click="acceptCounter">
                <div data-svg-wrapper class="relative"><img :src="CheckBlackIcon" alt="" /></div>
                <div class="text-center text-[#0C111D] text-sm font-medium capitalize leading-6 tracking-tight">{{ actionLoading ? t('common_loading') : t('booking_details_accept_new_time') }}</div>
              </button>
              <button type="button" class="flex-1 sm:flex-none min-w-20 p-2 bg-[#FF4405] flex justify-center items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" :disabled="actionLoading" data-test="booking-details-reject-counter" @click="rejectCounter">
                <div data-svg-wrapper class="relative"><img :src="CloseIcon" alt="" /></div>
                <div class="text-center text-white text-sm font-medium capitalize leading-6 tracking-tight">{{ t('booking_details_reject_new_time') }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="fanWaitingForCreator" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-stretch" data-test="booking-details-fan-waiting-notice">
        <div class="w-1 self-stretch bg-[#06AED4]" />
        <div class="flex-1 px-3 py-3 bg-[#ECFDFF] inline-flex justify-start items-center gap-3 min-w-0">
          <div v-if="creatorAvatar" data-svg-wrapper class="relative shrink-0">
            <img :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" />
          </div>
          <div class="flex-1 min-w-0 text-sm font-semibold leading-5 text-[#0096B7]" data-test="booking-details-fan-waiting-heading">
            {{ t('booking_details_waiting_for_creator_response') }}
          </div>
        </div>
      </div>

      <div v-else-if="fanPendingPriceAdjustment" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-start" data-test="event-details-fan-price-adjustment">
        <div class="w-1 self-stretch bg-orange-600" />
        <div class="flex-1 px-2 py-3 [background:linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.9)_100%),linear-gradient(0deg,rgba(255,68,5,0.1)_0%,rgba(255,68,5,0.1)_100%),rgba(255,255,255,0.9)] inline-flex flex-col justify-start items-start gap-4">
          <div class="self-stretch inline-flex justify-end items-start gap-4">
            <div v-if="creatorAvatar" data-svg-wrapper data-icon-type="user" data-indicator="false" data-state="Default" class="relative">
              <img :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" />
            </div>
            <div class="flex-1 self-stretch inline-flex flex-col justify-start items-start">
              <div class="self-stretch pb-2 flex flex-col justify-start items-start gap-2">
                <div class="self-stretch inline-flex justify-between items-start">
                  <div class="flex-1 pr-1 pt-1 flex justify-center items-center gap-2.5">
                    <div class="flex-1 justify-start"><span class="text-red-800 text-sm font-semibold leading-5">{{ creatorName || t('common_creator') }} </span> <span class="text-red-800 text-sm font-normal leading-5">{{ t('fan_event_details_adjusted_cost') }}</span></div>
                  </div>
                </div>
              </div>
              <div class="self-stretch flex flex-col justify-start items-start gap-2">
                <div class="self-stretch flex flex-col justify-start items-start gap-2.5">
                  <div v-if="adjustment.remarks" class="self-stretch flex flex-col justify-start items-start gap-0.5">
                    <div class="self-stretch justify-start text-black text-xs font-normal leading-4 [text-shadow:_0px_0px_10px_rgb(0_0_0_/_0.10)]">{{ t('fan_event_details_remarks') }}</div>
                    <div class="self-stretch justify-start text-black text-sm font-normal leading-5 [text-shadow:_0px_0px_10px_rgb(0_0_0_/_0.10)] whitespace-pre-wrap break-words">{{ adjustment.remarks }}</div>
                  </div>
                  <div class="self-stretch inline-flex justify-start items-center gap-2">
                    <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
                      <div class="text-center justify-start text-red-800 text-xs font-medium leading-4">{{ t('fan_event_details_original_price') }}</div>
                      <div class="size- inline-flex justify-start items-center gap-1 grayscale">
                        <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" /></div>
                        <div class="text-center justify-start text-gray-500 text-sm font-medium line-through leading-5">{{ formatTokenAmount(adjustment.originalTokens) }}</div>
                      </div>
                    </div>
                    <div data-svg-wrapper class="relative"><img :src="ArrowBrownIcon" alt="" /></div>
                    <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
                      <div class="text-center justify-start text-orange-600 text-xs font-medium leading-4">{{ t('fan_event_details_new_price') }}</div>
                      <div class="size- inline-flex justify-start items-center gap-1">
                        <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" /></div>
                        <div class="text-center justify-start text-orange-600 text-sm font-semibold leading-5">{{ formatTokenAmount(adjustment.proposedTokens) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="self-stretch inline-flex justify-between items-end">
                  <div class="flex-1 flex justify-start flex-col sm:flex-row items-center gap-2">
                    <button type="button" class="flex-1 self-stretch min-w-20 p-2 bg-[#07F468] flex justify-center items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" :disabled="actionLoading" data-test="event-details-fan-accept-adjustment" @click="emit('accept-adjustment', adjustment)">
                      <div data-svg-wrapper class="relative"><img :src="CheckBlackIcon" alt="" /></div>
                      <div class="text-center justify-start text-[#0C111D] text-sm font-medium capitalize leading-6 tracking-tight">{{ actionLoading ? t('common_loading') : t('booking_details_accept_and_pay') }}</div>
                    </button>
                    <button type="button" class="flex-1 self-stretch sm:flex-none sm:self-auto min-w-20 p-2 bg-[#FF4405] flex justify-center items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60" :disabled="actionLoading" data-test="event-details-fan-decline-adjustment" @click="emit('decline-adjustment', adjustment)">
                      <div data-svg-wrapper class="relative"><img :src="CloseIcon" alt="" /></div>
                      <div class="text-center justify-start text-white text-sm font-medium capitalize leading-6 tracking-tight">{{ t('fan_event_details_decline_cancel') }}</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="showConfirmedNotice"
        class="self-stretch border-b-[0.5px] border-[#D0D5DD] inline-flex items-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.16)]"
        data-test="booking-details-confirmed-notice"
      >
        <div class="w-1 shrink-0 self-stretch bg-[#20C7B5]" data-test="booking-details-confirmed-rail" />
        <div class="flex-1 min-w-0 px-3 py-3 inline-flex items-center gap-3 [background:linear-gradient(90deg,rgba(32,199,181,0.16)_0%,rgba(255,255,255,0.96)_100%)]">
          <div class="relative h-10 w-10 shrink-0" data-svg-wrapper>
            <img
              v-if="creatorAvatar"
              :src="creatorAvatar"
              :alt="confirmedCounterpartyUsername"
              class="h-10 w-10 rounded-full object-cover"
              data-test="booking-details-confirmed-avatar"
            />
            <div
              v-else
              class="h-10 w-10 rounded-full bg-[#E4E7EC] inline-flex items-center justify-center text-sm font-semibold uppercase text-[#475467]"
              data-test="booking-details-confirmed-avatar-fallback"
              aria-hidden="true"
            >
              {{ confirmedCounterpartyInitial }}
            </div>
            <span class="absolute -bottom-1 -right-1 h-[22px] w-[22px] rounded-full border-2 border-white bg-[#20C7B5] inline-flex items-center justify-center" aria-hidden="true" data-test="booking-details-confirmed-badge">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M5 9.25L7.6 11.75L13 6.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="9" cy="9" r="7.25" stroke="white" stroke-width="1.5" />
              </svg>
            </span>
          </div>
          <div class="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-[#117E75]" data-test="booking-details-confirmed-heading">
            {{ t('booking_details_confirmed_with_counterparty', { counterparty: confirmedCounterpartyUsername }) }}
          </div>
        </div>
      </div>

      <div class="self-stretch flex-1 bg-gray-50 inline-flex justify-start items-start">
        <div class="w-1 self-stretch relative" :style="{ backgroundColor: eventColor }" data-test="event-details-fan-color-rail" />
        <div class="flex-1 min-w-0 self-stretch p-4 inline-flex flex-col justify-between items-start gap-2">
          <BookingDetailsInformation
            :formatted-date="formattedDate"
            :formatted-time-range="formattedTimeRange"
            :counterparty-name="creatorName"
            :counterparty-fallback="counterpartyFallback"
            :counterparty-avatar="creatorAvatar"
            :counterparty-verified="creatorVerified"
            :can-open-chat="canOpenChat"
            :chat-payload="chatPayload"
            :additional-request-lines="additionalRequestLines"
            :show-cancelled-fees="showCancelledFees"
            :session-cost="paymentTotal"
            :cancellation-fee="cancelledCancellationFee"
            :booking-fee="cancelledBookingFee"
            :pending-price-adjustment="pendingPriceAdjustment"
            :adjustment="adjustment"
            :reminder-text="reminderText"
            @open-chat="handleOpenChat"
          />

          <div v-if="!canReviewBooking && canJoinCall" class="self-stretch inline-flex justify-start items-start gap-2.5">
            <button type="button" class="flex-1 px-4 py-2 bg-[#07F468] rounded-sm flex justify-center items-center gap-3 cursor-pointer" data-test="event-details-fan-join" @click="handleJoin">
              <div data-svg-wrapper class="relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16.4996 10L12.9996 6.5L16.4996 3M12.9996 6.5H20.9996M10.2266 13.8631C9.02506 12.6615 8.07627 11.3028 7.38028 9.85323C7.32041 9.72854 7.29048 9.66619 7.26748 9.5873C7.18576 9.30695 7.24446 8.96269 7.41447 8.72526C7.46231 8.65845 7.51947 8.60129 7.63378 8.48698C7.98338 8.13737 8.15819 7.96257 8.27247 7.78679C8.70347 7.1239 8.70347 6.26932 8.27247 5.60643C8.15819 5.43065 7.98338 5.25585 7.63378 4.90624L7.43891 4.71137C6.90747 4.17993 6.64174 3.91421 6.35636 3.76987C5.7888 3.4828 5.11854 3.4828 4.55098 3.76987C4.2656 3.91421 3.99987 4.17993 3.46843 4.71137L3.3108 4.86901C2.78117 5.39863 2.51636 5.66344 2.31411 6.02348C2.08969 6.42298 1.92833 7.04347 1.9297 7.5017C1.93092 7.91464 2.01103 8.19687 2.17124 8.76131C3.03221 11.7947 4.65668 14.6571 7.04466 17.045C9.43264 19.433 12.295 21.0575 15.3284 21.9185C15.8928 22.0787 16.1751 22.1588 16.588 22.16C17.0462 22.1614 17.6667 22 18.0662 21.7756C18.4263 21.5733 18.6911 21.3085 19.2207 20.7789L19.3783 20.6213C19.9098 20.0898 20.1755 19.8241 20.3198 19.5387C20.6069 18.9712 20.6069 18.3009 20.3198 17.7333C20.1755 17.448 19.9098 17.1822 19.3783 16.6508L19.1835 16.4559C18.8339 16.1063 18.6591 15.9315 18.4833 15.8172C17.8204 15.3862 16.9658 15.3862 16.3029 15.8172C16.1271 15.9315 15.9523 16.1063 15.6027 16.4559C15.4884 16.5702 15.4313 16.6274 15.3644 16.6752C15.127 16.8453 14.7828 16.904 14.5024 16.8222C14.4235 16.7992 14.3612 16.7693 14.2365 16.7094C12.7869 16.0134 11.4282 15.0646 10.2266 13.8631Z" stroke="#0C111D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </div>
              <div class="justify-start text-gray-900 text-lg font-semibold font-['Poppins'] leading-7">{{ t('common_join_call') }}</div>
            </button>
          </div>
        </div>
      </div>
      </template>
    </div>
  </component>

  <BookingAdjustmentDecisionPopup
    v-model="rejectDecisionOpen"
    :popup-config="decisionPopupConfig"
    mode="reject"
    actor-role="creator"
    :event-title="rejectEventTitle"
    :fan-username="decisionFanUsername"
    :session-refund-tokens="rejectRefundTokens"
    :net-refund-tokens="rejectRefundTokens"
    :processing="actionLoading"
    @confirm="confirmRejectDecision"
    @close="closeRejectDecision"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PopupHandler from './PopupHandler.vue';
import BookingAdjustmentDecisionPopup from './BookingAdjustmentDecisionPopup.vue';
import BookingDetailsInformation from './BookingDetailsInformation.vue';
import Spinner from '@/components/ui/spinner/Spinner.vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { getCalendarEventApprovalState, getCalendarEventJoinState } from '@/utils/bookingJoinUtils.js';
import { getPendingCounterOffer } from '@/services/bookings/utils/bookingNegotiationUtils.js';
import { buildBookingChatMessage } from '@/services/bookings/utils/bookingChatMessage.js';
import { fetchUserProfileData } from '@/services/users/userProfileApi.js';
import FlowHandler from '@/services/flow-system/FlowHandler.js';
import { shouldShowBookingOptionsMenu } from '@/services/bookings/utils/bookingMenuVisibility.js';
import defaultCoverImage from '@/assets/images/icons/background.webp';
import tokenIcon from '@/assets/images/icons/token-02.webp';
import priceArrowIcon from '@/assets/images/icons/arrow-right-orange.svg';
import VerifiedBlueTickIcon from '@/assets/images/icons/verified-tick-blue.svg';
import CloseIcon from '@/assets/images/icons/x-close-white.svg';
import DotsWhiteIcon from '@/assets/images/icons/dots-vertical-white.svg';
import CheckBlackIcon from '@/assets/images/icons/check-black.svg';
import ArrowBrownIcon from '@/assets/images/icons/arrow-right-brown.svg';
import TokenIcon from '@/assets/images/icons/token-sm-calender.svg';
import EditGrayIcon from '@/assets/images/icons/edit-02-gray.svg';
import DotsGrayIcon from '@/assets/images/icons/dots-vertical.svg';
import SendWhiteIcon from '@/assets/images/icons/send-01-white.svg';
import CompactPendingIcon from '@/assets/images/icons/booking-compact-pending.svg';
import CompactCloseIcon from '@/assets/images/icons/booking-compact-close.svg';
import HelpCircleIcon from '@/assets/images/icons/help-circle.svg';

defineOptions({ name: 'BookingDetailsPopup' });

const props = defineProps({
  modelValue: { type: Boolean, default: true }, booking: { type: Object, default: null },
  event: { type: Object, default: () => ({}) }, presentation: { type: String, default: 'popup' },
  layoutVariant: { type: String, default: 'hero' },
  compactReviewMode: { type: String, default: 'full' },
  actionLoading: { type: Boolean, default: false },
  refreshing: { type: Boolean, default: false },
  userRole: { type: String, default: 'fan' },
  canReviewPending: { type: Boolean, default: false },
  comparisonTime: { type: [Date, String, Number], default: null },
  // Chat message this booking is linked to. Rebuilt from `booking.meta` when absent.
  bookingMessage: { type: Object, default: null },
  // Chat-side action (`counter_offer`, `accepted`, …) which wins over the booking status.
  messageAction: { type: String, default: null },
  // Enables the creator's "Ask for more time" / "Ask to reschedule" menu entries.
  canRequestTimeChange: { type: Boolean, default: false },
  // Merged over the slide-in PopupHandler config (e.g. a higher zIndex inside chat).
  popupConfig: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue', 'close', 'closed', 'join-call', 'open-chat', 'cancel-booking', 'accept-adjustment', 'decline-adjustment', 'approve-booking', 'reject-booking', 'adjust-booking', 'decision-visibility', 'accept-counter', 'reject-counter', 'ask-more-time', 'ask-to-reschedule']);
const { t, locale } = useBookingTranslations();
const menuOpen = ref(false);
const reviewMenuOpen = ref(false);
const now = ref(new Date());
const creatorProfile = ref(null);
const fetchedBooking = ref(null);
const rejectDecisionOpen = ref(false);
const compactMobile = ref(typeof window !== 'undefined' && window.innerWidth < 768);
let timerId = null;
let profileController = null;

const defaultPopupConfig = { actionType: 'slidein', from: 'right', offset: '0px', speed: '300ms', effect: 'cubic-bezier(0.4, 0, 0.2, 1)', closeSpeed: '250ms', closeEffect: 'cubic-bezier(0.4, 0, 0.2, 1)', showOverlay: true, closeOnOutside: true, lockScroll: true, escToClose: true, width: { default: '500px', '<768': '100%' }, height: { default: '100%', '<768': '100%' }, scrollable: true };
const responsiveDialogPopupConfig = computed(() => compactMobile.value
  ? {
      actionType: 'slidein', from: 'bottom', offset: '0px', speed: '220ms', effect: 'ease-out',
      closeSpeed: '220ms', closeEffect: 'ease-in', showOverlay: true, closeOnOutside: true,
      lockScroll: true, escToClose: true, width: '100%', height: 'auto', scrollable: false,
      customClass: 'booking-details-compact-dialog',
    }
  : {
      actionType: 'popup', position: 'center', customEffect: 'fade', speed: '200ms', effect: 'ease-out',
      closeSpeed: '180ms', closeEffect: 'fade', showOverlay: true, closeOnOutside: true,
      lockScroll: true, escToClose: true, width: '500px', height: 'auto', scrollable: false,
      customClass: 'booking-details-compact-dialog',
    });
const isCompact = computed(() => props.layoutVariant === 'compact');
const isResponsiveDialog = computed(() => props.presentation === 'responsive-dialog');
const popupConfig = computed(() => ({
  ...(isResponsiveDialog.value ? responsiveDialogPopupConfig.value : defaultPopupConfig),
  ...props.popupConfig,
}));
// A z-index above 5000 is taken literally by the popup stack instead of being
// stacked over, so a decision popup left on its own default opens *under* the panel
// that launched it wherever the host lifted that panel — chat puts it at 10001 to
// clear the conversation. Nothing to override when the host left the panel at the
// default: normal stacking already lands the decision popup on top.
const decisionPopupConfig = computed(() => {
  const panelZ = Number(popupConfig.value?.forceZIndex ?? popupConfig.value?.zIndex);
  return Number.isFinite(panelZ) ? { zIndex: panelZ + 1 } : null;
});
const isSidePanel = computed(() => props.presentation === 'side-panel');
// PopupHandler forces `md:!w-auto` on its panel, which beats the inline width from the
// config — so the surface has to carry the desktop width itself or long content
// (adjustment remarks in particular) stretches the whole panel.
const surfaceWidthClass = computed(() => {
  if (isCompact.value) return 'w-full md:w-[31.25rem]';
  return isSidePanel.value ? '' : 'md:w-[31.25rem]';
});
const panelComponent = computed(() => (isSidePanel.value ? 'div' : PopupHandler));
const panelProps = computed(() => (isSidePanel.value
  ? { class: 'h-full min-h-0 w-full' }
  : { modelValue: props.modelValue, config: popupConfig.value }));
// A reactive booking prop is an explicit authoritative override (for example,
// the result of an in-place creator review). The internally fetched booking is
// only the fallback used when a lightweight calendar event opens the popup.
const raw = computed(() => props.booking || fetchedBooking.value || props.event?.raw || {});
const snapshot = computed(() => raw.value?.eventSnapshot || {});
const currentEvent = computed(() => raw.value?.eventCurrent || {});
const mergedEvent = computed(() => ({ ...currentEvent.value, ...snapshot.value }));

function firstText(...values) { return values.find((value) => typeof value === 'string' && value.trim())?.trim() || ''; }
function normalizeUsername(value) { const username = firstText(value).replace(/^@+/, ''); return /^user\s*#\s*\d+$/i.test(username) ? '' : username; }
function finiteNumber(value) { if (value === '' || value == null) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function normalizeColor(value) { const text = firstText(value); return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(text) ? text : '#5549FF'; }
function titleCase(value) { return String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

const bookingId = computed(() => firstText(raw.value?.bookingId, raw.value?.id, props.event?.bookingId));
const requestedBookingId = computed(() => firstText(props.booking?.bookingId, props.booking?.id, props.event?.bookingId, props.event?.raw?.bookingId, props.event?.raw?.id));
const creatorId = computed(() => raw.value?.creatorId ?? raw.value?.creator_id ?? mergedEvent.value?.creatorId ?? null);
const fanId = computed(() => raw.value?.userId ?? raw.value?.user_id ?? raw.value?.fanId ?? mergedEvent.value?.userId ?? null);
const viewerRole = computed(() => String(props.userRole || 'fan').trim().toLowerCase() === 'creator' ? 'creator' : 'fan');
const counterpartyId = computed(() => viewerRole.value === 'creator' ? fanId.value : creatorId.value);
const titleText = computed(() => firstText(props.event?.title, raw.value?.eventTitle, mergedEvent.value?.title) || t('calendar_event_untitled_booking'));
const storedEventColor = computed(() => normalizeColor(props.event?.color || raw.value?.eventColorSkin || mergedEvent.value?.eventColorSkin));
const coverImage = computed(() => firstText(raw.value?.eventImage, raw.value?.coverImage, raw.value?.imageUrl, mergedEvent.value?.coverImage, mergedEvent.value?.coverImageUrl, mergedEvent.value?.imageUrl, mergedEvent.value?.image) || defaultCoverImage);
const eventType = computed(() => firstText(raw.value?.eventType, mergedEvent.value?.eventType, mergedEvent.value?.type));
const callType = computed(() => firstText(raw.value?.eventCallType, mergedEvent.value?.eventCallType, mergedEvent.value?.callType));
const isGroupEvent = computed(() => eventType.value.toLowerCase().includes('group'));
const eventTypeLabel = computed(() => isGroupEvent.value
  ? t(callType.value.toLowerCase().includes('audio') ? 'fan_event_details_group_audio_call' : 'dashboard_group_video_call')
  : t(callType.value.toLowerCase().includes('audio') ? 'fan_event_details_one_on_one_audio_call' : 'fan_event_details_one_on_one_video_call'));

const startDate = computed(() => { const parsed = new Date(props.event?.start || raw.value?.startAtIso || raw.value?.startIso || ''); return Number.isNaN(parsed.getTime()) ? null : parsed; });
const endDate = computed(() => { const parsed = new Date(props.event?.end || raw.value?.endAtIso || raw.value?.endIso || ''); return Number.isNaN(parsed.getTime()) ? null : parsed; });
const formattedDate = computed(() => startDate.value ? new Intl.DateTimeFormat(locale.value, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(startDate.value) : t('calendar_event_date_not_set'));
const formattedTimeRange = computed(() => {
  if (!startDate.value || !endDate.value) return t('calendar_event_time_not_set');
  const formatter = new Intl.DateTimeFormat(locale.value, { hour: 'numeric', minute: '2-digit' });
  return `${formatter.format(startDate.value)} - ${formatter.format(endDate.value)}`;
});
function formatDateTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale.value, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}
function parseDate(value) {
  const parsed = value instanceof Date ? value : new Date(value || '');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function durationBetweenMinutes(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end || end.getTime() <= start.getTime()) return null;
  return Math.round((end.getTime() - start.getTime()) / 60000);
}
function endFromDuration(startValue, explicitEndValue, durationMinutes) {
  const explicitEnd = parseDate(explicitEndValue);
  if (explicitEnd) return explicitEnd;
  const start = parseDate(startValue);
  const duration = finiteNumber(durationMinutes);
  return start && duration != null && duration > 0
    ? new Date(start.getTime() + duration * 60000)
    : null;
}
function formatCounterOfferRange(startValue, endValue) {
  const start = parseDate(startValue);
  if (!start) return '';
  const end = parseDate(endValue);
  const dateTimeFormatter = new Intl.DateTimeFormat(locale.value, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  if (!end) return dateTimeFormatter.format(start);
  const dateFormatter = new Intl.DateTimeFormat(locale.value, { year: 'numeric', month: 'numeric', day: 'numeric' });
  if (dateFormatter.format(start) === dateFormatter.format(end)) {
    const timeFormatter = new Intl.DateTimeFormat(locale.value, { hour: 'numeric', minute: '2-digit' });
    return `${dateTimeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  }
  return `${dateTimeFormatter.format(start)} - ${dateTimeFormatter.format(end)}`;
}
function formatCounterOfferDuration(value) {
  const minutes = finiteNumber(value);
  if (minutes == null) return '';
  return t('calendar_event_duration_minutes', { count: new Intl.NumberFormat(locale.value).format(minutes) });
}
// A `moretime` / `reschedule` offer proposes a new start; the session keeps its length.
const proposedStartDate = computed(() => {
  const parsed = new Date(counterOffer.value.proposed.proposedSlotDate || '');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
});
const proposedEndDate = computed(() => {
  if (!proposedStartDate.value || !startDate.value || !endDate.value) return null;
  return new Date(proposedStartDate.value.getTime() + (endDate.value.getTime() - startDate.value.getTime()));
});
const formattedProposedRange = computed(() => {
  if (!proposedStartDate.value) return '';
  if (!proposedEndDate.value) return formatDateTime(proposedStartDate.value);
  const timeFormatter = new Intl.DateTimeFormat(locale.value, { hour: 'numeric', minute: '2-digit' });
  return `${formatDateTime(proposedStartDate.value)} - ${timeFormatter.format(proposedEndDate.value)}`;
});
const formattedCurrentRange = computed(() => (startDate.value ? `${formatDateTime(startDate.value)}` : ''));

const normalizedStatus = computed(() => firstText(raw.value?.status, raw.value?.bookingStatus, props.event?.status).toLowerCase());
const isCancelledStatus = computed(() => normalizedStatus.value.startsWith('cancel') || normalizedStatus.value === 'declined');
const pendingStartElapsed = computed(() => (
  (normalizedStatus.value === 'pending' || normalizedStatus.value === 'pending_hold')
  && Boolean(startDate.value)
  && now.value.getTime() >= startDate.value.getTime()
));

// Pending approval ends at the exact start boundary. Other booking states retain
// the established live-window behavior and expire only after their end time.
const isExpired = computed(() => {
  if (!startDate.value) return false;
  if (pendingStartElapsed.value) return true;
  const currentMs = now.value.getTime();
  const startMs = startDate.value.getTime();
  if (endDate.value && currentMs >= startMs && currentMs < endDate.value.getTime()) return false;
  return currentMs >= startMs;
});
const displayStatus = computed(() => pendingStartElapsed.value ? 'cancelled' : normalizedStatus.value);
const displayIsCancelledStatus = computed(() => displayStatus.value.startsWith('cancel') || displayStatus.value === 'declined');
const statusKeys = { confirmed: 'calendar_event_status_confirmed', completed: 'calendar_event_status_completed', pending: 'calendar_event_status_pending', pending_hold: 'calendar_event_status_pending_hold', cancelled: 'calendar_event_status_cancelled', cancelled_user: 'calendar_event_status_cancelled', cancelled_creator: 'calendar_event_status_cancelled', declined: 'calendar_event_status_declined' };
const statusText = computed(() => t(statusKeys[displayStatus.value] || 'calendar_event_status_pending'));
const compactPendingStatus = computed(() => displayStatus.value === 'pending' || displayStatus.value === 'pending_hold');
const statusColor = computed(() => ['confirmed', 'completed'].includes(displayStatus.value) ? '#22C55E' : (displayIsCancelledStatus.value ? '#F04438' : '#F59E0B'));

// Calendar events can be lightweight projections without negotiation metadata.
// Prefer the authoritative booking fetched by this component before falling
// back to booking/event props so review and waiting states use one data source.
const counterOffer = computed(() => getPendingCounterOffer([raw.value, props.booking, props.event]));
const counterOfferType = computed(() => counterOffer.value.type);
const pendingPriceAdjustment = computed(() => counterOfferType.value === 'adjust');
const pendingTimeOffer = computed(() => counterOfferType.value === 'moretime' || counterOfferType.value === 'reschedule');
const fanPendingPriceAdjustment = computed(() => viewerRole.value === 'fan' && pendingPriceAdjustment.value);
const fanPendingTimeOffer = computed(() => viewerRole.value === 'fan' && pendingTimeOffer.value && !isExpired.value);
const creatorWaitingForAdjustment = computed(() => viewerRole.value === 'creator' && Boolean(counterOfferType.value));
const eventColor = computed(() => fanPendingPriceAdjustment.value ? '#FACC15' : storedEventColor.value);
const adjustment = computed(() => {
  const negotiation = raw.value?.meta?.negotiation || {};
  const legacy = raw.value?.meta?.adjust || {};
  return {
    negotiationId: negotiation.negotiationId || null,
    originalTokens: finiteNumber(negotiation.original?.totalTokens) ?? finiteNumber(legacy.prevTotalTokens),
    proposedTokens: finiteNumber(negotiation.proposed?.totalTokens) ?? finiteNumber(legacy.proposedTokens),
    proposedStartAtIso: firstText(negotiation.proposed?.startAtIso, legacy.proposedSlotDate),
    proposedDurationMinutes: finiteNumber(negotiation.proposed?.durationMinutes) ?? finiteNumber(legacy.adjustedDurationMinutes),
    remarks: firstText(negotiation.proposed?.remarks, legacy.proposedRemarks),
  };
});
const counterOfferPresentation = computed(() => {
  const meta = raw.value?.meta || {};
  const negotiation = meta.negotiation && typeof meta.negotiation === 'object' ? meta.negotiation : {};
  const original = negotiation.original && typeof negotiation.original === 'object' ? negotiation.original : {};
  const proposed = negotiation.proposed && typeof negotiation.proposed === 'object' ? negotiation.proposed : {};
  const rawType = firstText(meta.currentCounterOffer, counterOffer.value.rawType, counterOfferType.value);
  const legacyCandidate = meta[rawType] || meta[counterOfferType.value];
  const legacy = legacyCandidate && typeof legacyCandidate === 'object' ? legacyCandidate : {};
  const remarks = firstText(proposed.remarks, legacy.proposedRemarks, counterOffer.value.proposed.proposedRemarks);

  let originalLabel = '';
  let proposedLabel = '';
  let originalValue = '';
  let proposedValue = '';
  let usesTokens = false;

  if (counterOfferType.value === 'adjust') {
    const originalTokens = finiteNumber(original.totalTokens)
      ?? finiteNumber(legacy.prevTotalTokens)
      ?? finiteNumber(counterOffer.value.proposed.prevTotalTokens);
    const proposedTokens = finiteNumber(proposed.totalTokens)
      ?? finiteNumber(legacy.proposedTokens)
      ?? finiteNumber(counterOffer.value.proposed.proposedTokens);
    originalLabel = t('booking_adjustment_original_price');
    proposedLabel = t('booking_adjustment_new_price');
    originalValue = originalTokens == null ? '' : formatTokenAmount(originalTokens);
    proposedValue = proposedTokens == null ? '' : formatTokenAmount(proposedTokens);
    usesTokens = true;
  } else {
    const originalStart = firstText(original.startAtIso, raw.value?.startAtIso, raw.value?.startIso, props.event?.start);
    const originalEnd = firstText(original.endAtIso, raw.value?.endAtIso, raw.value?.endIso, props.event?.end);
    const proposedStart = firstText(proposed.startAtIso, legacy.proposedSlotDate, counterOffer.value.proposed.proposedSlotDate);
    const proposedExplicitEnd = firstText(proposed.endAtIso, legacy.proposedEndAtIso, legacy.proposedEndIso);
    const originalDuration = finiteNumber(original.durationMinutes)
      ?? durationBetweenMinutes(originalStart, originalEnd);
    const proposedDuration = finiteNumber(proposed.durationMinutes)
      ?? finiteNumber(legacy.adjustedDurationMinutes)
      ?? finiteNumber(counterOffer.value.proposed.adjustedDurationMinutes)
      ?? durationBetweenMinutes(proposedStart, proposedExplicitEnd)
      ?? originalDuration;

    if (counterOfferType.value === 'reschedule') {
      const proposedEnd = endFromDuration(proposedStart, proposedExplicitEnd, proposedDuration);
      originalLabel = t('booking_details_counteroffer_original_schedule');
      proposedLabel = t('booking_details_counteroffer_new_schedule');
      originalValue = formatCounterOfferRange(originalStart, originalEnd);
      proposedValue = formatCounterOfferRange(proposedStart, proposedEnd);
    } else if (counterOfferType.value === 'moretime') {
      originalLabel = t('booking_details_counteroffer_original_duration');
      proposedLabel = t('booking_details_counteroffer_new_duration');
      originalValue = formatCounterOfferDuration(originalDuration);
      proposedValue = formatCounterOfferDuration(proposedDuration);
    }
  }

  return {
    remarks,
    originalLabel,
    proposedLabel,
    originalValue,
    proposedValue,
    usesTokens,
    hasComparison: Boolean(originalValue && proposedValue),
  };
});
function formatTokenAmount(amount) { const value = finiteNumber(amount); return value == null ? t('calendar_event_not_set') : new Intl.NumberFormat(locale.value).format(value); }
const paymentTotal = computed(() => {
  const payment = raw.value?.payment || {};
  const lineTotal = Array.isArray(payment.lines) ? payment.lines.reduce((sum, line) => sum + Number(line?.amount || 0), 0) : null;
  return finiteNumber(payment.total) ?? finiteNumber(raw.value?.paymentTotal) ?? lineTotal;
});
const paymentAllocations = computed(() => raw.value?.payment?.allocations && typeof raw.value.payment.allocations === 'object'
  ? raw.value.payment.allocations
  : {});
const sessionDepositTokens = computed(() => finiteNumber(raw.value?.sessionDepositTokens)
  ?? finiteNumber(raw.value?.payment?.sessionDepositTokens)
  ?? finiteNumber(raw.value?.payment?.depositTokens)
  ?? finiteNumber(paymentAllocations.value.service));
const activeCancellationFee = computed(() => finiteNumber(paymentAllocations.value.cancellationFee)
  ?? finiteNumber(raw.value?.cancellationFeeTokens)
  ?? finiteNumber(mergedEvent.value?.cancellationFeeTokens));
const activeBookingFee = computed(() => finiteNumber(paymentAllocations.value.bookingFee)
  ?? finiteNumber(raw.value?.bookingFeeTokens)
  ?? finiteNumber(mergedEvent.value?.bookingFeeTokens));
const rejectEventTitle = computed(() => firstText(raw.value?.eventTitle, mergedEvent.value?.title, props.event?.title) || t('calendar_event_untitled_booking'));
const rejectRefundTokens = computed(() => finiteNumber(paymentTotal.value) ?? 0);
const hasSessionCost = computed(() => finiteNumber(paymentTotal.value) != null);
const reminderText = computed(() => { const minutes = finiteNumber(raw.value?.reminderMinutes ?? mergedEvent.value?.callReminderMinutesBefore ?? mergedEvent.value?.remindBeforeMinutes); return minutes && minutes > 0 ? t('calendar_event_minutes_before', { count: minutes }) : t('calendar_event_reminder_not_set'); });
const additionalRequestLines = computed(() => {
  const lines = [];
  (Array.isArray(raw.value?.requestedAddOns) ? raw.value.requestedAddOns : []).forEach((item) => { const label = typeof item === 'string' ? item : firstText(item?.title, item?.name, item?.label); if (label) lines.push(label); });
  Object.entries(raw.value?.additionalRequests || {}).forEach(([key, value]) => { if (value === true) lines.push(titleCase(key)); else if (typeof value === 'string' && value.trim()) lines.push(`${titleCase(key)}: ${value.trim()}`); });
  const personalRequest = firstText(raw.value?.personalRequestText); if (personalRequest) lines.push(personalRequest);
  return lines.length ? [...new Set(lines)] : [t('calendar_event_no_additional_request')];
});
const resolvedCounterpartyName = computed(() => viewerRole.value === 'creator'
  ? firstText(creatorProfile.value?.username, creatorProfile.value?.displayName, creatorProfile.value?.display_name, raw.value?.fanUsername, raw.value?.username, raw.value?.fanDisplayName, raw.value?.userDisplayName)
  : firstText(creatorProfile.value?.username, creatorProfile.value?.displayName, creatorProfile.value?.display_name, raw.value?.creatorUsername, raw.value?.creatorDisplayName, raw.value?.creatorName, mergedEvent.value?.creatorDisplayName, mergedEvent.value?.creatorName));
const counterpartyFallback = computed(() => viewerRole.value === 'creator' ? t('common_fan') : t('common_creator'));
const creatorName = computed(() => normalizeUsername(resolvedCounterpartyName.value) || counterpartyFallback.value);
const decisionFanUsername = computed(() => normalizeUsername(creatorProfile.value?.username)
  || normalizeUsername(raw.value?.fanUsername)
  || normalizeUsername(raw.value?.fanUserName)
  || t('common_fan'));
const creatorAvatar = computed(() => viewerRole.value === 'creator'
  ? firstText(
      creatorProfile.value?.avatar,
      creatorProfile.value?.avatarUrl,
      creatorProfile.value?.avatar_url,
      raw.value?.fanAvatar,
      raw.value?.fanAvatarUrl,
      raw.value?.userAvatar,
      raw.value?.userAvatarUrl,
      raw.value?.userSnapshot?.avatar,
      raw.value?.userSnapshot?.avatarUrl,
      raw.value?.userSnapshot?.avatar_url,
    )
  : firstText(
      creatorProfile.value?.avatar,
      creatorProfile.value?.avatarUrl,
      creatorProfile.value?.avatar_url,
      raw.value?.creatorAvatar,
      raw.value?.creatorAvatarUrl,
      raw.value?.creatorSnapshot?.avatar,
      raw.value?.creatorSnapshot?.avatarUrl,
      raw.value?.creatorSnapshot?.avatar_url,
      mergedEvent.value?.creatorAvatar,
      mergedEvent.value?.creatorAvatarUrl,
    ));
const confirmedCounterpartyUsername = computed(() => normalizeUsername(creatorName.value) || counterpartyFallback.value);
const confirmedCounterpartyInitial = computed(() => confirmedCounterpartyUsername.value.charAt(0) || '?');
const creatorVerified = computed(() => viewerRole.value === 'creator' ? false : [
  creatorProfile.value?.isVerified,
  creatorProfile.value?.is_verified,
  raw.value?.creatorVerified,
  raw.value?.creatorIsVerified,
  mergedEvent.value?.creatorVerified,
  mergedEvent.value?.creatorIsVerified,
].some((value) => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'));
const chatPayload = computed(() => raw.value?.meta?.chatId ? { chatId: raw.value.meta.chatId } : (counterpartyId.value ? { userId: String(counterpartyId.value) } : {}));
const canOpenChat = computed(() => Boolean(chatPayload.value.chatId || chatPayload.value.userId));
const joinState = computed(() => getCalendarEventJoinState(props.event, { viewerRole: viewerRole.value, now: now.value }));
const canJoinCall = computed(() => joinState.value.canJoin && Boolean(joinState.value.joinUrl));
const isEnded = computed(() => joinState.value.effectiveEndDate && now.value.getTime() >= new Date(joinState.value.effectiveEndDate).getTime());
const showMenu = computed(() => Boolean(bookingId.value) && shouldShowBookingOptionsMenu({
  viewerRole: viewerRole.value,
  status: normalizedStatus.value,
  isPassed: Boolean(isEnded.value) || pendingStartElapsed.value,
  hasPendingPriceAdjustment: pendingPriceAdjustment.value,
}));
const approvalState = computed(() => getCalendarEventApprovalState(props.event, { now: now.value }));
const isWaitingForResponse = computed(() => viewerRole.value === 'creator' && Boolean(raw.value?.meta?.currentCounterOffer));
const canReviewBooking = computed(() => viewerRole.value === 'creator' && props.canReviewPending && approvalState.value.canReview && !isWaitingForResponse.value);
const canAdjustBooking = computed(() => Boolean(raw.value?.meta?.bookingMessageId && raw.value?.meta?.chatId));

// Chat-linked state — the chat message wins over the booking status because the
// negotiation lives on the message until the fan responds.
const resolvedMessage = computed(() => props.bookingMessage || buildBookingChatMessage(raw.value));
const effectiveAction = computed(() => firstText(props.messageAction, resolvedMessage.value?.content?.action).toLowerCase()
  || (isCancelledStatus.value ? 'declined' : normalizedStatus.value === 'confirmed' ? 'accepted' : normalizedStatus.value));
const isPendingApproval = computed(() => approvalState.value.isPending && !counterOfferType.value);
// Nothing to act on any more: the slot started before either side responded.
const showExpiredNotice = computed(() => isExpired.value && !isCancelledStatus.value
  && (isPendingApproval.value || Boolean(counterOfferType.value)));
const showConfirmedNotice = computed(() => normalizedStatus.value === 'confirmed'
  && !isExpired.value
  && !counterOfferType.value);
const fanWaitingForCreator = computed(() => viewerRole.value === 'fan' && isPendingApproval.value && !isExpired.value);
const canAskTimeChange = computed(() => props.canRequestTimeChange
  && viewerRole.value === 'creator'
  && effectiveAction.value === 'accepted'
  && !isExpired.value
  && !counterOfferType.value
  && canAdjustBooking.value);
const cancellation = computed(() => raw.value?.cancellation && typeof raw.value.cancellation === 'object' ? raw.value.cancellation : {});
const cancelledActor = computed(() => firstText(cancellation.value.actor, normalizedStatus.value === 'cancelled_creator' ? 'creator' : normalizedStatus.value === 'cancelled_user' ? 'fan' : ''));
const cancelledRefundTokens = computed(() => finiteNumber(cancellation.value.refundedTokens)
  ?? finiteNumber(raw.value?.paymentSettlement?.releasedTotal)
  ?? finiteNumber(raw.value?.payment?.settlement?.releasedTotal)
  ?? finiteNumber(raw.value?.settlement?.releasedTotal));
const cancelledCancellationFee = computed(() => finiteNumber(cancellation.value.cancellationFeeTokens) ?? finiteNumber(raw.value?.payment?.allocations?.cancellationFee) ?? 0);
const cancelledBookingFee = computed(() => finiteNumber(raw.value?.payment?.allocations?.bookingFee) ?? finiteNumber(raw.value?.payment?.bookingFeeAmountTokens) ?? 0);
const cancelledReason = computed(() => firstText(cancellation.value.reason, raw.value?.meta?.cancelled?.reason));
// A no-show auto-cancel settles differently for each side, so both need to see it.
const noShowNotice = computed(() => {
  if (cancelledReason.value === 'creator_no_show_auto_cancel' && viewerRole.value === 'fan') {
    return t('booking_details_no_show_fully_refunded');
  }
  if (cancelledReason.value === 'fan_no_show_auto_cancel' && viewerRole.value === 'creator') {
    return t('booking_details_no_show_fan_forfeited');
  }
  return '';
});
// The cancellation notice is written from the creator's perspective (headings, fee
// breakdown), so fans only get the no-show settlement line.
const showCreatorCancellationNotice = computed(() => isCancelledStatus.value && viewerRole.value === 'creator');
const showFanNoShowNotice = computed(() => isCancelledStatus.value && viewerRole.value === 'fan' && Boolean(noShowNotice.value));
const showCancelledFees = computed(() => showCreatorCancellationNotice.value && (cancelledCancellationFee.value > 0 || cancelledBookingFee.value > 0));
const cancelledNoticeHeading = computed(() => cancelledActor.value === 'creator'
  ? t('booking_details_cancelled_by_creator', { fan: creatorName.value || t('common_fan') })
  : t('booking_details_cancelled_by_fan', { fan: creatorName.value || t('common_fan') }));

function handleModelUpdate(value) { emit('update:modelValue', value); if (!value) emit('close'); }
function closePanel() { menuOpen.value = false; reviewMenuOpen.value = false; rejectDecisionOpen.value = false; emit('update:modelValue', false); emit('close'); }
function handleOpenChat(payload) { emit('open-chat', payload); emit('close'); }
function handleJoin() { const fresh = getCalendarEventJoinState(props.event, { viewerRole: viewerRole.value, now: new Date() }); if (fresh.canJoin && fresh.joinUrl) emit('join-call', { bookingId: bookingId.value, eventId: raw.value?.eventId, joinUrl: fresh.joinUrl, event: props.event }); }
function reviewPayload(decision) {
  return {
    bookingId: bookingId.value,
    eventId: raw.value?.eventId,
    decision,
    event: props.event,
    counterparty: {
      username: creatorName.value,
      avatarUrl: creatorAvatar.value,
    },
  };
}
function approveBooking() { if (!canReviewBooking.value || props.actionLoading) return; emit('approve-booking', reviewPayload('approve')); }
function rejectBooking() { if (!canReviewBooking.value || props.actionLoading) return; emit('reject-booking', reviewPayload('reject')); }
function adjustBooking() { if (!canReviewBooking.value || !canAdjustBooking.value || props.actionLoading) return; emit('adjust-booking', { bookingId: bookingId.value, eventId: raw.value?.eventId, event: props.event, booking: raw.value }); }
function toggleMenu() { menuOpen.value = !menuOpen.value; }
function toggleReviewMenu() { if (!canReviewBooking.value || props.actionLoading) return; reviewMenuOpen.value = !reviewMenuOpen.value; }
function openRejectConfirmation() { if (!canReviewBooking.value || props.actionLoading) return; reviewMenuOpen.value = false; rejectDecisionOpen.value = true; }
function closeRejectDecision() { if (props.actionLoading) return; rejectDecisionOpen.value = false; }
function confirmRejectDecision(payload = {}) {
  if (payload.mode !== 'reject' || props.actionLoading) return;
  rejectDecisionOpen.value = false;
  rejectBooking();
}
function requestCancel() {
  menuOpen.value = false;
  emit('cancel-booking', {
    bookingId: bookingId.value,
    eventId: raw.value?.eventId,
    event: props.event,
    origin: 'booking-details',
    retainDetailsOnSuccess: viewerRole.value === 'creator',
  });
}
// Shared payload for every chat-linked negotiation action, so hosts never have to
// re-derive the message or the proposal from their own state.
function counterPayload(extra = {}) {
  return {
    bookingId: bookingId.value,
    eventId: raw.value?.eventId,
    event: props.event,
    booking: raw.value,
    message: resolvedMessage.value,
    offerType: counterOfferType.value,
    proposed: counterOffer.value.proposed,
    negotiationId: counterOffer.value.negotiationId,
    ...extra,
  };
}
function acceptCounter() { if (props.actionLoading || !fanPendingTimeOffer.value) return; emit('accept-counter', counterPayload()); }
function rejectCounter() { if (props.actionLoading || !fanPendingTimeOffer.value) return; emit('reject-counter', counterPayload()); }
function askMoreTime() { menuOpen.value = false; if (!canAskTimeChange.value || props.actionLoading) return; emit('ask-more-time', counterPayload()); }
function askToReschedule() { menuOpen.value = false; if (!canAskTimeChange.value || props.actionLoading) return; emit('ask-to-reschedule', counterPayload()); }
function handleDocumentClick() { menuOpen.value = false; reviewMenuOpen.value = false; }
function syncCompactViewport() { compactMobile.value = window.innerWidth < 768; }
function handleDocumentKeydown(event) {
  if (event.key !== 'Escape' || !reviewMenuOpen.value) return;
  event.preventDefault();
  event.stopPropagation();
  reviewMenuOpen.value = false;
}

watch(showMenu, (visible) => { if (!visible) menuOpen.value = false; });
watch(rejectDecisionOpen, (visible) => emit('decision-visibility', Boolean(visible)));
watch(bookingId, () => { menuOpen.value = false; reviewMenuOpen.value = false; rejectDecisionOpen.value = false; });
watch(canReviewBooking, (visible) => { if (!visible) { reviewMenuOpen.value = false; rejectDecisionOpen.value = false; } });
watch(() => props.comparisonTime, (value) => { if (value != null) { const parsed = new Date(value); if (!Number.isNaN(parsed.getTime())) now.value = parsed; } }, { immediate: true });
watch(requestedBookingId, async (id) => {
  fetchedBooking.value = null;
  if (!id || props.booking) return;
  try {
    const result = await FlowHandler.run('bookings.fetchBooking', { bookingId: id });
    if (result?.ok && result?.data?.item && requestedBookingId.value === id) fetchedBooking.value = result.data.item;
  } catch (_error) {
    fetchedBooking.value = null;
  }
}, { immediate: true });
watch(counterpartyId, async (id) => {
  if (profileController) profileController.abort();
  creatorProfile.value = null;
  if (!id) return;
  const controller = new AbortController();
  profileController = controller;
  try {
    const profile = await fetchUserProfileData(id, { signal: controller.signal });
    if (profileController === controller) creatorProfile.value = profile;
  } catch (error) { if (error?.name !== 'AbortError' && profileController === controller) creatorProfile.value = null; }
  finally { if (profileController === controller) profileController = null; }
}, { immediate: true });
onMounted(() => { syncCompactViewport(); timerId = window.setInterval(() => { now.value = new Date(); }, 15000); window.addEventListener('resize', syncCompactViewport); document.addEventListener('click', handleDocumentClick); document.addEventListener('keydown', handleDocumentKeydown, true); });
onBeforeUnmount(() => { if (rejectDecisionOpen.value) emit('decision-visibility', false); if (timerId) window.clearInterval(timerId); if (profileController) profileController.abort(); window.removeEventListener('resize', syncCompactViewport); document.removeEventListener('click', handleDocumentClick); document.removeEventListener('keydown', handleDocumentKeydown, true); });
</script>

<style>
.booking-details-compact-dialog {
  width: 100% !important;
  height: auto !important;
  max-height: calc(100dvh - 6.5rem) !important;
  overflow: visible !important;
}

.booking-details-compact-surface {
  max-height: calc(100dvh - 6.5rem);
  border-radius: 1.5rem 1.5rem 0 0;
}

@media (min-width: 768px) {
  .booking-details-compact-dialog {
    width: 500px !important;
    max-width: 500px !important;
    max-height: calc(100dvh - 2rem) !important;
  }

  .booking-details-compact-surface {
    width: 500px;
    max-height: calc(100dvh - 2rem);
    border-radius: 1.25rem;
  }
}
</style>
