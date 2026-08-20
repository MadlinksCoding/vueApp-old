<template>
  <component :is="panelComponent" v-bind="panelProps" @update:model-value="handleModelUpdate">
    <div class="w-full h-full overflow-auto bg-white inline-flex flex-col justify-start items-start" :class="surfaceWidthClass" data-test="event-details-fan" :style="{ '--event-color': eventColor }">
      <div class="self-stretch relative bg-black/25 backdrop-blur-[5px] flex flex-col justify-start items-start">
        <div class="self-stretch px-4 pt-12 pb-2 min-h-[18.75rem] relative bg-gradient-to-b from-amber-400/5 to-amber-400/30 flex flex-col justify-end items-start gap-4" data-test="event-details-fan-hero">
          <div class="h-6 p-1.5 bg-stone-900/50 rounded-[50px] inline-flex justify-start items-center gap-1" data-test="event-details-fan-status">
            <div data-property-1="decline" data-size="Default" class="size-4 p-px flex justify-start items-center gap-2.5">
              <div class="size-3.5 rounded-[50px] flex justify-center items-center gap-2.5" :style="{ backgroundColor: statusColor }">
                <div v-if="isCancelledStatus" data-svg-wrapper class="relative">
                  <img :src="CloseIcon" alt="" class="h-3 w-3" />
                </div>
                <span v-else class="size-1.5 rounded-full bg-white" aria-hidden="true" />
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
                <button v-if="canAskTimeChange" type="button" class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] hover:bg-[#F9FAFB]" data-test="booking-details-ask-more-time" @click.stop="askMoreTime">
                  <span class="inline-flex w-5 h-5 items-center justify-center" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 7V12L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#475467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </span>
                  {{ t('booking_details_ask_more_time') }}
                </button>
                <button v-if="canAskTimeChange" type="button" class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] border-t border-[#EAECF0] hover:bg-[#F9FAFB]" data-test="booking-details-ask-reschedule" @click.stop="askToReschedule">
                  <span class="inline-flex w-5 h-5 items-center justify-center" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 2V6M8 2V6M3 10H21M7 22H17C18.6569 22 20 20.6569 20 19V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V19C4 20.6569 5.34315 22 7 22Z" stroke="#475467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </span>
                  {{ t('booking_details_ask_reschedule') }}
                </button>
                <button type="button" class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#F04438] border-t border-[#EAECF0] hover:bg-[#FEF3F2]" data-test="event-details-fan-cancel" @click.stop="requestCancel">
                  <span data-svg-wrapper class="inline-flex w-5 h-5 items-center justify-center">
                    <span
                      aria-hidden="true"
                      class="h-6 w-6 bg-[#F04438]"
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

      <div v-else-if="creatorWaitingForAdjustment" class="self-stretch shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)] border-b-[0.50px] border-gray-200 inline-flex justify-start items-stretch" data-test="booking-details-adjustment-waiting-notice">
        <div class="w-1 self-stretch bg-[#06AED4]" />
        <div class="flex-1 px-3 py-3 bg-[#ECFDFF] inline-flex justify-start items-center gap-3 min-w-0">
          <div v-if="creatorAvatar" data-svg-wrapper class="relative shrink-0">
            <img :src="creatorAvatar" :alt="creatorName" class="h-10 w-10 rounded-full object-cover" />
          </div>
          <div class="flex-1 min-w-0 text-sm font-semibold leading-5 text-[#0096B7]" data-test="booking-details-adjustment-waiting-heading">
            {{ t('booking_details_waiting_for_adjustment_response', { fan: creatorName || t('common_fan') }) }}
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

      <div class="self-stretch flex-1 bg-gray-50 inline-flex justify-start items-start">
        <div class="w-1 self-stretch relative" :style="{ backgroundColor: eventColor }" data-test="event-details-fan-color-rail" />
        <div class="flex-1 min-w-0 self-stretch p-4 inline-flex flex-col justify-between items-start gap-2">
          <div class="self-stretch flex flex-col justify-start items-start gap-4">
            <div class="self-stretch inline-flex justify-start items-start gap-4">
              <div data-svg-wrapper class="relative"><img :src="userIcon" alt="" class="filter grayscale brightness-75 opacity-100" /></div>
              <div class="w-96 min-w-0 flex-1 inline-flex flex-col justify-center items-start gap-2">
                <div class="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
                  <div class="h-6 flex justify-center items-center gap-1.5">
                    <div v-if="creatorAvatar" data-svg-wrapper class="relative"><img :src="creatorAvatar" :alt="creatorName" class="h-[1.375rem] w-[1.375rem] object-cover [border-radius:25%_75%_50%_51%_/_45%_65%_36%_55%]" /></div>
                    <div class="size- inline-flex flex-col justify-center items-start">
                      <div class="self-stretch inline-flex justify-start items-center gap-1">
                        <div class="justify-start text-gray-900 text-sm font-normal leading-5 line-clamp-1">{{ creatorName || t('common_creator') }}</div>
                        <div v-if="creatorVerified" data-svg-wrapper data-size="xs" class="relative"><img :src="VerifiedBlueTickIcon" alt="" /></div>
                      </div>
                    </div>
                  </div>
                </div>
                <button v-if="canOpenChat" type="button" data-color="dark" data-leading-icon="true" data-property-1="hover" data-size="sm" data-trailing-icon="true" class="size- inline-flex justify-start items-center gap-0.5" data-test="event-details-fan-open-chat" @click="emit('open-chat', chatPayload); emit('close')">
                  <div data-svg-wrapper class="relative"><img :src="ChatBlueIcon" alt="" /></div>
                  <div class="justify-start text-blue-600 text-xs font-medium leading-4">{{ t('calendar_event_open_chat') }}</div>
                  <div data-svg-wrapper class="relative"><img :src="ArrowUpRightBlueIcon" alt="" /></div>
                </button>
              </div>
            </div>

            <div class="self-stretch inline-flex justify-start items-start gap-4">
              <div data-svg-wrapper class="relative"><img :src="dotPoints" alt="" /></div>
              <div class="flex-1 inline-flex flex-col justify-start items-start gap-2">
                <div class="justify-center text-gray-900 text-sm font-semibold leading-5">{{ t('calendar_event_additional_request') }}</div>
                <div v-for="line in additionalRequestLines" :key="line" class="justify-center text-gray-900 text-sm font-normal leading-5 whitespace-pre-wrap break-words">{{ line }}</div>
              </div>
            </div>

            <div v-if="showCancelledFees" class="self-stretch inline-flex justify-start items-start gap-4" data-test="booking-details-cancelled-fees">
              <div data-svg-wrapper class="relative"><img :src="dollarIcon" alt="" /></div>
              <div class="flex-1 min-w-0 flex flex-row flex-wrap items-start gap-x-8 gap-y-4" data-test="booking-details-cost-tiles">
                <div v-if="cancelledCancellationFee > 0" class="min-w-[8rem] flex flex-col items-start gap-2" data-test="booking-details-cancellation-fee">
                  <span class="text-gray-900 text-sm font-semibold leading-5">{{ t('booking_adjustment_cancellation_fee') }}</span>
                  <span class="inline-flex items-center gap-1 text-gray-900 text-sm font-semibold leading-5"><img :src="tokenIcon" alt="" class="h-6 w-6" />{{ formatTokenAmount(cancelledCancellationFee) }}</span>
                </div>
                <div v-if="cancelledBookingFee > 0" class="min-w-[8rem] flex flex-col items-start gap-2" data-test="booking-details-booking-fee">
                  <span class="text-gray-900 text-sm font-semibold leading-5">{{ t('booking_adjustment_booking_fee') }}</span>
                  <span class="inline-flex items-center gap-1 text-gray-900 text-sm font-semibold leading-5"><img :src="tokenIcon" alt="" class="h-6 w-6" />{{ formatTokenAmount(cancelledBookingFee) }}</span>
                </div>
              </div>
            </div>

            <div v-else class="self-stretch inline-flex justify-start items-start gap-4">
              <div data-svg-wrapper class="relative"><img :src="dollarIcon" alt="" /></div>
              <div class="flex-1 min-w-0 flex flex-row flex-wrap items-start gap-x-8 gap-y-4" data-test="booking-details-cost-tiles">
                <div class="min-w-[8rem] flex flex-col items-start gap-2" data-test="booking-details-session-cost-tile">
                  <div class="justify-center text-gray-900 text-sm font-semibold leading-5">{{ t('fan_event_details_session_cost') }}</div>
                  <div v-if="pendingPriceAdjustment" class="size- inline-flex justify-start items-center gap-2" data-test="event-details-fan-session-cost-adjusted">
                    <div class="size- flex justify-start items-center gap-1 grayscale">
                      <div data-svg-wrapper class="relative"><img :src="tokenIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-original-icon" /></div>
                      <div class="text-center justify-start text-gray-500 text-sm font-medium line-through leading-5" data-test="event-details-fan-session-cost-original">{{ formatTokenAmount(adjustment.originalTokens) }}</div>
                    </div>
                    <div data-svg-wrapper class="relative"><img :src="priceArrowIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-arrow" /></div>
                    <div class="size- flex justify-start items-center gap-1">
                      <div data-svg-wrapper class="relative"><img :src="tokenIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-proposed-icon" /></div>
                      <div class="text-center justify-start text-gray-900 text-sm font-semibold leading-5" data-test="event-details-fan-session-cost-proposed">{{ formatTokenAmount(adjustment.proposedTokens) }}</div>
                    </div>
                  </div>
                  <div v-else-if="hasSessionCost" class="size- inline-flex justify-start items-center gap-1" data-test="event-details-fan-session-cost-standard">
                    <div data-svg-wrapper class="relative"><img :src="tokenIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-icon" /></div>
                    <div class="text-center justify-start text-gray-900 text-sm font-semibold leading-5" data-test="event-details-fan-session-cost-value">{{ formatTokenAmount(paymentTotal) }}</div>
                  </div>
                  <div v-else class="justify-center text-gray-900 text-sm font-normal leading-5" data-test="event-details-fan-session-cost-missing">{{ t('calendar_event_not_set') }}</div>
                </div>
              </div>
            </div>

            <div class="self-stretch inline-flex justify-start items-center gap-4">
              <div data-svg-wrapper class="relative"><img :src="bellIcon" alt="" class="filter grayscale brightness-75 opacity-100" /></div>
              <div class="size- flex justify-start items-center gap-2"><div class="justify-center text-gray-900 text-sm font-normal leading-5">{{ reminderText }}</div></div>
            </div>
          </div>

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
    </div>
  </component>

  <BookingAdjustmentDecisionPopup
    v-model="rejectDecisionOpen"
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
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { getCalendarEventApprovalState, getCalendarEventJoinState } from '@/utils/bookingJoinUtils.js';
import { getPendingCounterOffer } from '@/services/bookings/utils/bookingNegotiationUtils.js';
import { buildBookingChatMessage } from '@/services/bookings/utils/bookingChatMessage.js';
import { fetchUserProfileData } from '@/services/users/userProfileApi.js';
import FlowHandler from '@/services/flow-system/FlowHandler.js';
import defaultCoverImage from '@/assets/images/icons/background.webp';
import tokenIcon from '@/assets/images/icons/token-02.webp';
import priceArrowIcon from '@/assets/images/icons/arrow-right-orange.svg';
import VerifiedBlueTickIcon from '@/assets/images/icons/verified-tick-blue.svg';
import CloseIcon from '@/assets/images/icons/x-close-white.svg';
import DotsWhiteIcon from '@/assets/images/icons/dots-vertical-white.svg';
import CheckBlackIcon from '@/assets/images/icons/check-black.svg';
import ArrowBrownIcon from '@/assets/images/icons/arrow-right-brown.svg';
import TokenIcon from '@/assets/images/icons/token-sm-calender.svg';
import userIcon from '@/assets/images/icons/profile.webp';
import dotPoints from '@/assets/images/icons/dotpoints.png';
import dollarIcon from '@/assets/images/icons/dollar.png';
import bellIcon from '@/assets/images/icons/bell-1.webp';
import ChatBlueIcon from '@/assets/images/icons/message-text-square-blue.svg';
import ArrowUpRightBlueIcon from '@/assets/images/icons/arrow-up-right-blue.svg';
import EditGrayIcon from '@/assets/images/icons/edit-02-gray.svg';
import DotsGrayIcon from '@/assets/images/icons/dots-vertical.svg';

defineOptions({ name: 'BookingDetailsPopup' });

const props = defineProps({
  modelValue: { type: Boolean, default: true }, booking: { type: Object, default: null },
  event: { type: Object, default: () => ({}) }, presentation: { type: String, default: 'popup' },
  actionLoading: { type: Boolean, default: false },
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
const emit = defineEmits(['update:modelValue', 'close', 'join-call', 'open-chat', 'cancel-booking', 'accept-adjustment', 'decline-adjustment', 'approve-booking', 'reject-booking', 'adjust-booking', 'decision-visibility', 'accept-counter', 'reject-counter', 'ask-more-time', 'ask-to-reschedule']);
const { t, locale } = useBookingTranslations();
const menuOpen = ref(false);
const reviewMenuOpen = ref(false);
const now = ref(new Date());
const creatorProfile = ref(null);
const fetchedBooking = ref(null);
const rejectDecisionOpen = ref(false);
let timerId = null;
let profileController = null;

const defaultPopupConfig = { actionType: 'slidein', from: 'right', offset: '0px', speed: '300ms', effect: 'cubic-bezier(0.4, 0, 0.2, 1)', closeSpeed: '250ms', closeEffect: 'cubic-bezier(0.4, 0, 0.2, 1)', showOverlay: true, closeOnOutside: true, lockScroll: true, escToClose: true, width: { default: '500px', '<768': '100%' }, height: { default: '100%', '<768': '100%' }, scrollable: true };
const popupConfig = computed(() => ({ ...defaultPopupConfig, ...props.popupConfig }));
const isSidePanel = computed(() => props.presentation === 'side-panel');
// PopupHandler forces `md:!w-auto` on its panel, which beats the inline width from the
// config — so the surface has to carry the desktop width itself or long content
// (adjustment remarks in particular) stretches the whole panel.
const surfaceWidthClass = computed(() => (isSidePanel.value ? '' : 'md:w-[31.25rem]'));
const panelComponent = computed(() => (isSidePanel.value ? 'div' : PopupHandler));
const panelProps = computed(() => (isSidePanel.value
  ? { class: 'h-full min-h-0 w-full' }
  : { modelValue: props.modelValue, config: popupConfig.value }));
const raw = computed(() => fetchedBooking.value || props.booking || props.event?.raw || {});
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

// The request can no longer be acted on once its slot has started (unless it is live).
const isExpired = computed(() => {
  if (!startDate.value) return false;
  const currentMs = now.value.getTime();
  const startMs = startDate.value.getTime();
  if (endDate.value && currentMs >= startMs && currentMs < endDate.value.getTime()) return false;
  return currentMs >= startMs;
});
const normalizedStatus = computed(() => firstText(raw.value?.status, raw.value?.bookingStatus, props.event?.status).toLowerCase());
const isCancelledStatus = computed(() => normalizedStatus.value.startsWith('cancel') || normalizedStatus.value === 'declined');
const statusKeys = { confirmed: 'calendar_event_status_confirmed', completed: 'calendar_event_status_completed', pending: 'calendar_event_status_pending', pending_hold: 'calendar_event_status_pending_hold', cancelled: 'calendar_event_status_cancelled', cancelled_user: 'calendar_event_status_cancelled', cancelled_creator: 'calendar_event_status_cancelled', declined: 'calendar_event_status_declined' };
const statusText = computed(() => t(statusKeys[normalizedStatus.value] || 'calendar_event_status_pending'));
const statusColor = computed(() => ['confirmed', 'completed'].includes(normalizedStatus.value) ? '#22C55E' : (normalizedStatus.value.startsWith('cancel') || normalizedStatus.value === 'declined' ? '#F04438' : '#F59E0B'));

const counterOffer = computed(() => getPendingCounterOffer([props.booking, props.event]));
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
function formatTokenAmount(amount) { const value = finiteNumber(amount); return value == null ? t('calendar_event_not_set') : new Intl.NumberFormat(locale.value).format(value); }
const paymentTotal = computed(() => {
  const payment = raw.value?.payment || {};
  const lineTotal = Array.isArray(payment.lines) ? payment.lines.reduce((sum, line) => sum + Number(line?.amount || 0), 0) : null;
  return finiteNumber(payment.total) ?? finiteNumber(raw.value?.paymentTotal) ?? lineTotal;
});
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
const creatorName = computed(() => viewerRole.value === 'creator'
  ? firstText(creatorProfile.value?.username, creatorProfile.value?.displayName, creatorProfile.value?.display_name, raw.value?.fanUsername, raw.value?.username, raw.value?.fanDisplayName, raw.value?.userDisplayName)
  : firstText(creatorProfile.value?.username, creatorProfile.value?.displayName, creatorProfile.value?.display_name, raw.value?.creatorUsername, raw.value?.creatorDisplayName, raw.value?.creatorName, mergedEvent.value?.creatorDisplayName, mergedEvent.value?.creatorName));
const decisionFanUsername = computed(() => normalizeUsername(creatorProfile.value?.username)
  || normalizeUsername(raw.value?.fanUsername)
  || normalizeUsername(raw.value?.fanUserName)
  || t('common_fan'));
const creatorAvatar = computed(() => viewerRole.value === 'creator'
  ? firstText(creatorProfile.value?.avatar, creatorProfile.value?.avatarUrl, creatorProfile.value?.avatar_url, raw.value?.fanAvatar, raw.value?.userAvatar)
  : firstText(creatorProfile.value?.avatar, creatorProfile.value?.avatarUrl, creatorProfile.value?.avatar_url, raw.value?.creatorAvatar, mergedEvent.value?.creatorAvatar, mergedEvent.value?.creatorAvatarUrl));
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
const showMenu = computed(() => Boolean(bookingId.value) && !isEnded.value && !isCancelledStatus.value && !pendingPriceAdjustment.value);
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
function handleJoin() { const fresh = getCalendarEventJoinState(props.event, { viewerRole: viewerRole.value, now: new Date() }); if (fresh.canJoin && fresh.joinUrl) emit('join-call', { bookingId: bookingId.value, eventId: raw.value?.eventId, joinUrl: fresh.joinUrl, event: props.event }); }
function approveBooking() { if (!canReviewBooking.value || props.actionLoading) return; emit('approve-booking', { bookingId: bookingId.value, eventId: raw.value?.eventId, decision: 'approve', event: props.event }); }
function rejectBooking() { if (!canReviewBooking.value || props.actionLoading) return; emit('reject-booking', { bookingId: bookingId.value, eventId: raw.value?.eventId, decision: 'reject', event: props.event }); }
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
function requestCancel() { menuOpen.value = false; emit('cancel-booking', { bookingId: bookingId.value, eventId: raw.value?.eventId, event: props.event }); }
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
onMounted(() => { timerId = window.setInterval(() => { now.value = new Date(); }, 15000); document.addEventListener('click', handleDocumentClick); document.addEventListener('keydown', handleDocumentKeydown, true); });
onBeforeUnmount(() => { if (rejectDecisionOpen.value) emit('decision-visibility', false); if (timerId) window.clearInterval(timerId); if (profileController) profileController.abort(); document.removeEventListener('click', handleDocumentClick); document.removeEventListener('keydown', handleDocumentKeydown, true); });
</script>
