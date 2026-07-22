<template>
  <section ref="calendarRootRef" :class="theme.main.wrapper" v-bind="dataAttrs" :data-view="effectiveView"
    :data-focus="cursor ? cursor.toISOString().slice(0, 10) : ''">

    <!-- default-header-theme-1 -->
    <div v-if="variant === 'default'" class="flex items-center flex-col gap-4 sticky top-0 z-30 py-0 px-1 md:px-0 md:pl-0">
      <div class="w-full flex items-center justify-between ipad-portrait-large:items-start ipad-landscape-large:items-start">
        <div class="flex items-center gap-3 ipad-portrait-large:flex-col ipad-portrait-large:items-start ipad-portrait-large:gap-2 ipad-landscape-large:flex-col ipad-landscape-large:items-start ipad-landscape-large:gap-2">
          <div class="flex items-center gap-3">
            <div class="font-bold hidden lg:block w-[9rem] uppercase" :class="theme.main.title" data-test="calendar-desktop-title">{{ title }}</div>
            <!-- mobile-view-start-->
            <button
              type="button"
              class="cursor-pointer flex lg:hidden items-center gap-1 mobile-calendar-toggle"
              data-test="calendar-mobile-month-toggle"
              @click="toggleMobileCalendar"
            >
              <span class="text-gray-950 text-base font-bold uppercase" data-test="calendar-mobile-month-title">
                {{ mobileCalendarTitle }}
              </span>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.00024 12L16.0002 20L24.0002 12" stroke="#667085" stroke-width="3" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>

            </button>

            <Teleport to="body">
              <div v-show="isMobileCalendarOpen" class="fixed inset-0 z-[120] lg:hidden">
                <!-- Backdrop -->
                <Transition name="fade">
                  <div v-if="isMobileCalendarOpen" class="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    @click="isMobileCalendarOpen = false">
                  </div>
                </Transition>
                <!-- Bottom Sheet -->
                <Transition name="slide-up">
                  <div v-if="isMobileCalendarOpen" ref="mobileCalendarRef"
                    class="absolute bottom-0 left-0 w-full bg-white rounded-t-[1.5rem] shadow-[0px_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden">

                    <div class="p-4">

                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2 cursor-pointer flex-1" @click="isDatePopupOpen = true">
                          <div class="flex items-center justify-between flex-1 px-2 py-1">
                            <div class="text-gray-950 text-base font-bold uppercase">{{ currentMonth }}</div>
                            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.00024 12L16.0002 20L24.0002 12" stroke="#101828" stroke-width="4" stroke-linecap="round"
                                stroke-linejoin="round" />
                            </svg>
                          </div>
                          <div class="flex items-center justify-between flex-1 px-2 py-1">
                            <div class="text-gray-950 text-base font-bold uppercase">{{ currentYear }}</div>
                            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.00024 12L16.0002 20L24.0002 12" stroke="#101828" stroke-width="4" stroke-linecap="round"
                                stroke-linejoin="round" />
                            </svg>
                          </div>
                        </div>

                        <span class="flex hidden items-center justify-between gap-6 px-2">
                          <button class="flex items-center justify-center p-2" @click="shift(-1)" data-main-prev>
                            <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 16.9995L1 8.99951L9 0.999512" stroke="#FF0066" stroke-width="3" stroke-linecap="round"
                                stroke-linejoin="round" />
                            </svg>
                          </button>
                          <button class="flex items-center justify-center p-2" @click="shift(1)" data-main-next>
                            <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 16.9995L9 8.99951L1 0.999512" stroke="#FF0066" stroke-width="3" stroke-linecap="round"
                                stroke-linejoin="round" />
                            </svg>
                          </button>
                        </span>
                      </div>

                      <MiniCalendar class="w-full" :month-date="cursor" :selected-date="focusDate" :events="events" :theme="{
                        ...theme,
                        mini: {
                          wrapper: 'flex flex-col w-full font-medium text-[#0C111D] mt-[0.625rem] gap-[0.625rem] rounded-xl',
                          header: 'font-semibold',
                          dayBase: 'relative w-full aspect-square rounded-full flex flex-col items-center justify-center focus:outline-none focus:ring-0 focus:ring-inset focus:ring-emerald-500 text-xs leading-[18px] font-medium text-[#0C111D]',
                          outside: 'opacity-0',
                          expired: 'opacity-40',
                          today: 'bg-[#101828] !font-semibold text-white',
                          selected: 'bg-[#101828] !font-semibold text-white',
                          dot: 'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#101828]',
                          selectedDot: '!bg-white',
                          pendingDot: 'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full !bg-transparent border border-[#101828]',
                          ...(theme?.mini || {})
                        }
                      }" :hide-past-dots="true" :data-attrs="{ 'data-calendar': 'mini' }" @date-selected="(d) => { emitDate(d); isMobileCalendarOpen = false; }">
                      </MiniCalendar>

                      <!-- Bottom spacer for safe areas -->
                      <div class="h-6"></div>
                    </div>
                  </div>
                </Transition>
              </div>
            </Teleport>

            <!-- mobile-view-end-->
            <button
              class="px-[1.5rem] hidden lg:flex justify-center items-center py-[0.25rem] h-[3rem] rounded-[2rem] border border-pink-400 hover:bg-slate-50"
              @click="goToday" data-main-today>
              <p class="font-medium text-sm text-pink-500">{{ t("common_today") }}</p>
            </button>
          </div>
          <span class="lg:flex items-center justify-between hidden ">
            <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(-1)" data-main-prev>
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.9995L1 8.99951L9 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
            <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(1)" data-main-next>
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 16.9995L9 8.99951L1 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </span>
        </div>

        <div class="flex items-center gap-2" ref="dropdownContainer">
        <!-- View selector dropdown -->
          <div class="px-2 hidden lg:flex items-center gap-2">
            <CheckboxGroup :label="t('dashboard_calendar_show_legend')" v-model="showLegend"
              checkboxClass="appearance-none bg-white border border-[#D0D5DD] rounded-[0.25rem] w-4 min-w-4 h-4 checked:bg-[#FF0066] checked:border-[#FF0066] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:border-white checked:after:border-b-2 checked:after:border-r-2 checked:after:rotate-45 checked:after:box-border cursor-pointer"
              labelClass="text-xs font-semibold leading-normal tracking-[0.0175rem] text-slate-700 cursor-pointer uppercase mt-[0.125rem] whitespace-nowrap"
              wrapperClass="flex items-center" />
          </div>
          <div
            v-if="dayColumnMode !== 'events'"
            class="relative inline-block text-left flex lg:hidden"
            data-test="calendar-mobile-view-selector"
          >
          <div @click="availableViewOptions.length > 1 ? toggleViewSelector() : null"
            :class="[
              isViewSelectorOpen ? 'bg-[#0C111D]' : 'bg-white/90',
              availableViewOptions.length <= 1 ? 'cursor-default pointer-events-none justify-center' : 'cursor-pointer justify-between'
            ]"
            class="border border-[#FB5BA2] gap-1 px-[1rem] py-1 rounded-full flex items-center select-none transition-all duration-100">
            <span class="flex items-center justify-center h-full py-1">
              <h2 class="text-[0.875rem] font-semibold uppercase transition-colors" :class="isViewSelectorOpen ? 'text-white' : 'text-[#FB5BA2]'">
                {{ t(`common_${view}`) }}
              </h2>
            </span>

            <button v-if="availableViewOptions.length > 1" class="flex items-center justify-center w-5 h-5 transition-transform duration-200"
              :class="{ 'rotate-180': isViewSelectorOpen }">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" :stroke="isViewSelectorOpen ? 'white' : '#FB5BA2'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div v-if="isViewSelectorOpen"
            class="absolute top-full right-0 mt-2 z-50 w-[5.813rem] bg-white rounded-[0.313rem] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100">
            <div class="py-1">
              <button v-for="v in availableViewOptions" :key="v" @click="setView(v); isViewSelectorOpen = false"
                class="w-full text-left px-3 py-3 text-[0.875rem] text-[#0C111D] uppercase transition-colors"
                :class="view === v ? 'bg-slate-50 font-bold' : 'font-semibold hover:bg-gray-50'">
                {{ t(`common_${v}`) }}
              </button>
            </div>
          </div>
        </div>

        <div class="relative inline-block text-left hidden lg:flex">

          <div @click="toggleDropdown"
            :class="isDropdownOpen ? 'bg-[#000]' : 'bg-gradient-to-l from-pink-500/20 to-pink-500/10'"
            class="w-[10.25rem] px-[1.5rem] py-1 rounded-[3rem] flex items-center justify-between cursor-pointer select-none transition-all duration-300">
            <span class="flex items-center justify-center h-full py-2">
              <h2 class="text-[0.875rem] font-medium " :class="isDropdownOpen ? 'text-white' : 'text-black'">{{
                t("dashboard_all_events") }}
              </h2>
              <p data-test="all-events-count" class="text-[#F06] text-[0.625rem] font-bold h-full ml-1">
                {{ filteredBookedSlotsCount }}
              </p>
            </span>

              <button class="flex items-center justify-center w-[0.5rem] h-[0.5rem] transition-transform duration-200"
                :class="{ 'rotate-180': isDropdownOpen }">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0.796688 1.96714L3.53832 6.70268C3.68984 6.9644 3.7656 7.09526 3.86444 7.13922C3.95066 7.17755 4.04909 7.17755 4.13531 7.13922C4.23415 7.09526 4.30992 6.9644 4.46144 6.70268L7.20307 1.96714C7.35513 1.70448 7.43117 1.57315 7.41993 1.46536C7.41013 1.37134 7.36087 1.28591 7.28442 1.23032C7.19677 1.16659 7.04501 1.16659 6.74151 1.16659H1.25825C0.954741 1.16659 0.802987 1.16659 0.715335 1.23032C0.638882 1.28591 0.589625 1.37134 0.579824 1.46536C0.568586 1.57315 0.64462 1.70448 0.796688 1.96714Z"
                    :fill="isDropdownOpen ? 'white' : 'black'" :stroke="isDropdownOpen ? 'white' : 'black'"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

          <div v-if="isDropdownOpen"
            class="absolute top-full right-0 mt-2 z-50 origin-top-left hidden lg:block tracking-normal">
            <EventDropdownContent v-model="dropdownFilters" />
          </div>

          </div>

        <span
            class="lg:flex items-center hidden w-[14.375rem] rounded-[3rem] p-[0.25rem] bg-white/20 border border-pink-400/80">

            <button @click="setView('day')"
              class="w-[4.5rem] h-[2.5rem] px-[1rem] py-[0.5rem] leading-[1.25rem] rounded-[3rem] text-[0.875rem] font-bold" :class="view === 'day'
                ? 'bg-pink-400/80 text-white'
                : 'text-pink-400/80'">
              {{ t("common_day") }}
            </button>

            <button @click="setView('week')"
              class="w-[4.5rem] h-[2.5rem] px-[1rem] py-[0.5rem] leading-[1.25rem] rounded-[3rem] text-[0.875rem] font-semibold"
              :class="view === 'week'
                ? 'bg-pink-400/80 text-white'
                : 'text-pink-400/80'">
              {{ t("common_week") }}
            </button>

            <button @click="setView('month')"
              class="w-[4.875rem] h-[2.5rem] px-[1rem] py-[0.5rem] leading-[1.25rem] rounded-[3rem] text-[0.875rem] font-bold"
              :class="view === 'month'
                ? 'bg-pink-400/80 text-white'
                : 'text-pink-400/80'">
              {{ t("common_month") }}
            </button>

          </span>

          <div class="relative inline-block text-left flex lg:hidden">
            <button
              @click="availableViewOptions.length > 1 ? (isViewSelectorOpen = !isViewSelectorOpen) : null"
              class="min-w-[5.875rem] h-[2.5rem] px-[1rem] py-[0.25rem] rounded-[3rem] border border-[#FB5BA2] font-medium text-sm flex items-center justify-center gap-2 focus:outline-none select-none transition-colors duration-150"
              :class="[
                isViewSelectorOpen ? 'bg-[#0C111D] text-white' : 'bg-white/90 text-[#FB5BA2]',
                availableViewOptions.length <= 1 ? 'cursor-default pointer-events-none' : 'cursor-pointer'
              ]"
              :disabled="availableViewOptions.length <= 1"
            >
              <span :class="{ 'w-full text-center': availableViewOptions.length <= 1 }">{{ t(`common_${view}`) }}</span>
              <svg
                v-if="availableViewOptions.length > 1"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                class="transition-transform duration-200"
                :class="{ 'rotate-180': isViewSelectorOpen }"
              >
                <path d="M5 7.5L10 12.5L15 7.5" :stroke="isViewSelectorOpen ? 'white' : '#FB5BA2'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div
              v-if="isViewSelectorOpen"
              class="absolute top-full right-0 mt-2 z-50 min-w-[5.813rem] rounded-[5px] bg-white shadow-sm flex flex-col overflow-hidden"
            >
              <button
                v-for="v in availableViewOptions"
                :key="v"
                @click="setView(v); isViewSelectorOpen = false"
                class="w-full text-left px-4 py-2 text-base font-medium text-[#0C111D] transition-colors flex-auto"
                :class="view === v ? 'bg-[#EAECF0]/50 font-semiboldbold' : 'font-semiboldbold hover:bg-[#EAECF0]/50'"
              >
                {{ t(`common_${v}`) }}
              </button>
            </div>
          </div>


        <!-- mobile-view-today-button -->
        <button
          class="flex fixed bottom-2 left-2 lg:hidden justify-center px-6 py-3 items-center rounded-full bg-white shadow-[0_0_12px_-2px_rgba(251,91,162,0.25),0_2px_4px_-2px_rgba(251,91,162,0.06)]"
          @click="goToday" data-main-today>
          <p class="font-medium text-sm text-[#FB5BA2] uppercase">{{ t("common_today") }}</p>
        </button>
        <div class="cursor-pointer relative flex lg:hidden p-2">
          <div @click="toggleDropdown">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.38589 5.66687C2.62955 4.82155 2.25138 4.39889 2.23712 4.03968C2.22473 3.72764 2.35882 3.42772 2.59963 3.22889C2.87684 3 3.44399 3 4.57828 3H19.4212C20.5555 3 21.1227 3 21.3999 3.22889C21.6407 3.42772 21.7748 3.72764 21.7624 4.03968C21.7481 4.39889 21.3699 4.82155 20.6136 5.66687L14.9074 12.0444C14.7566 12.2129 14.6812 12.2972 14.6275 12.3931C14.5798 12.4781 14.5448 12.5697 14.5236 12.6648C14.4997 12.7721 14.4997 12.8852 14.4997 13.1113V18.4584C14.4997 18.6539 14.4997 18.7517 14.4682 18.8363C14.4403 18.911 14.395 18.9779 14.336 19.0315C14.2692 19.0922 14.1784 19.1285 13.9969 19.2012L10.5969 20.5612C10.2293 20.7082 10.0455 20.7817 9.89802 20.751C9.76901 20.7242 9.6558 20.6476 9.583 20.5377C9.49975 20.4122 9.49975 20.2142 9.49975 19.8184V13.1113C9.49975 12.8852 9.49975 12.7721 9.47587 12.6648C9.45469 12.5697 9.41971 12.4781 9.37204 12.3931C9.31828 12.2972 9.2429 12.2129 9.09213 12.0444L3.38589 5.66687Z"
                stroke="#667085" stroke-width="1.77778" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- Mobile filter dropdown removed, replaced by Teleport below -->

        </div>
        <div class="cursor-pointer flex ipad-portrait-large:flex lg:hidden p-2" data-test="calendar-mobile-popup-trigger" @click="calendarPopupOpen = true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
              stroke="#667085" stroke-width="1.78" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
         <!-- <div class="cursor-pointer flex lg:hidden" data-test="calendar-mobile-popup-trigger" @click="eventsRequestsPopupOpen = true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
              stroke="#667085" stroke-width="1.78" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div> -->

        </div>
      </div>

      <div v-show="showLegend" class="w-full hidden ipad-portrait:hidden lg:flex items-start gap-2 self-stretch rounded-[10px]">
        <!-- Event type -->
        <div class="flex flex-1 items-start justify-between gap-2 rounded-[50px] bg-[rgba(251,91,162,0.10)] px-5 py-2">
          <span class="font-medium text-xs leading-[18px] text-[#F06] uppercase whitespace-nowrap">{{ t("dashboard_calendar_legend_event_type") }}</span>
          <div class="flex justify-end items-start gap-5">
            <!-- Item-1 -->
             <div class="flex items-center gap-2">
                <PhoneIcon />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D] whitespace-nowrap">{{ t("dashboard_calendar_legend_one_on_one_call") }}</span>
             </div>
             <!-- Item-2 -->
             <div class="flex items-center gap-2">
                 <GroupCallIcon />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D] whitespace-nowrap">{{ t("dashboard_calendar_legend_group_call") }}</span>
             </div>
             <!-- Item-3 -->
             <div class="flex items-center gap-2">
                <BookingScheduleIcon />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D] whitespace-nowrap">{{ t("dashboard_calendar_legend_booking_schedule") }}</span>
             </div>
          </div>
        </div>
        <!-- /Event type -->
         <!-- Status -->
        <div class="flex flex-1 items-start justify-between gap-2 rounded-[50px] bg-[rgba(251,91,162,0.10)] px-5 py-2">
          <span class="font-medium text-xs leading-[18px] text-[#F06] uppercase">{{ t("dashboard_calendar_legend_status") }}</span>
          <div class="flex justify-end items-start gap-5">
            <!-- Item-1 -->
             <div class="flex items-center gap-2">
                <PendingStatus status="pending" />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D]">{{ t("calendar_event_status_pending") }}</span>
             </div>
             <!-- Item-2 -->
             <div class="flex items-center gap-2">
                <PendingStatus status="confirmed" />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D] whitespace-nowrap">{{ t("calendar_event_status_confirmed") }}</span>
             </div>
             <!-- Item-3 -->
             <div class="flex items-center gap-2">
                <PendingStatus status="declined" />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D] whitespace-nowrap">{{ t("dashboard_calendar_legend_declined_canceled") }}</span>
             </div>
          </div>
        </div>
        <!-- /Status -->

      </div>

    </div>

    <!-- default-header-theme-2 -->
    <div v-else-if="variant === 'theme2'"
      class="flex flex-wrap lg:flex-nowrap items-center justify-between w-full mb-[3rem]">

      <div class="flex items-center gap-3 order-1">
        <div class="font-bold w-[9rem]" :class="theme.main.title">{{ title }}</div>
        <span class="flex items-center justify-between">
          <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(-1)" data-main-prev>
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.9995L1 8.99951L9 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
          <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(1)" data-main-next>
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 16.9995L9 8.99951L1 0.999512" stroke="#667085" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </span>
      </div>

      <div class="flex items-center gap-3 order-3 w-full mt-1 lg:w-auto lg:order-2 lg:mt-0">
        <CheckboxGroup :label="t('dashboard_show_existing_schedule')" v-model="showSchedule"
          checkboxClass="appearance-none bg-white border border-[#D0D5DD] rounded-[0.25rem] w-4 min-w-4 h-4 checked:white checked:bg-[#FF0066] checked:border-[#FF0066] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:border-white checked:after:border-w-0 checked:after:border-b-2 checked:after:border-r-2 checked:after:rotate-45 checked:after:box-border cursor-pointer"
          labelClass="text-xs sm:text-xs leading-normal tracking-[0.0175rem] text-slate-700 cursor-pointer mt-[0.125rem]"
          wrapperClass="flex items-center" />
      </div>

      <button @click="$emit('preview-schedule')"
        class="px-2 py-2.5 rounded-full outline-none border border-[#F1C1D9] text-brand-textPink text-xs font-medium flex items-center gap-2 hover:bg-pink-100 transition-colors order-2 lg:order-3">
        {{ t("common_preview_booking_schedule") }}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round" class="mb-[0.063rem]">
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </button>
    </div>


    <div ref="timeGridBodyRef" v-if="effectiveView !== 'month'" data-cal-time-grid class="h-full flex flex-col px-1 md:px-0 w-full overflow-hidden relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div class="flex shrink-0" :class="[theme.main.xHeader]">

        <div :class="[theme.main.axisXLabel, 'shrink-0']">
          <div
            v-if="variant === 'default'"
            :class="[
              isEventColumnMode ? 'flex' : 'lg:flex hidden',
              'justify-end items-center px-[0.25rem] gap-[0.125rem] opacity-0'
            ]"
          >
            <span class="flex items-center justify-center w-[0.625rem] h-[0.625rem] flex-1 text-right">
              <svg width="6" height="5" viewBox="0 0 6 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.5 1.36523L3 3.86523L5.5 1.36523" stroke="#98A2B3" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </span>
            <p class="text-xs text-gray-400 font-medium leading-[1.125rem]">{{ t("calendar_timezone_gmt_offset", { offset: " +08" }) }}</p>
          </div>
          <div v-else class="flex flex-col items-center justify-end pb-2">
            <span class="text-[0.625rem] font-bold text-slate-400">{{ t("calendar_timezone_gmt_offset", { offset: "+5" }) }}</span>
          </div>
        </div>

        <div
          v-if="isDayEventColumnMode"
          class="flex min-w-0 w-full items-center h-[3.995rem] pl-2"
          :class="isMobileDayEventColumnMode ? 'gap-0' : 'gap-4'"
          data-test="calendar-day-event-header"
        >
          <div
            v-if="isMobileDayEventColumnMode"
            ref="mobileDayStripRef"
            class="flex w-full min-w-0 snap-x snap-mandatory overflow-x-auto scroll-smooth scroll-pl-[25%] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            data-test="calendar-mobile-day-strip"
          >
            <button
              v-for="d in mobileDayStripDays"
              :key="'mobile-day-' + formatLocalDateKey(d)"
              type="button"
              class="flex min-w-[25%] w-[25%] shrink-0 snap-start flex-col items-center justify-center gap-1 px-1 py-1 text-center"
              :data-date="formatLocalDateKey(d)"
              :data-selected="sameDay(d, selectedDay) ? 'true' : 'false'"
              :data-today="sameDay(d, today) ? 'true' : 'false'"
              data-test="calendar-mobile-day-strip-date"
              @click="selectMobileDayDate(d)"
            >
              <span
                class="text-[0.625rem] font-bold uppercase leading-4"
                :class="[
                  d.getDay() === 0 ? 'text-[#FF0066]' : 'text-[#0C111D]',
                  sameDay(d, selectedDay) ? 'opacity-100' : 'opacity-80'
                ]"
              >
                {{ shortWeekdays[d.getDay()] }}
              </span>
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full text-[1rem] font-bold leading-8"
                :class="[
                  sameDay(d, selectedDay)
                    ? 'bg-[#0C111D] text-white'
                    : (d.getDay() === 0 ? 'text-[#FF0066]' : 'text-[#0C111D]'),
                  sameDay(d, today) && !sameDay(d, selectedDay) ? 'ring-1 ring-[#FB5BA2]/40' : ''
                ]"
              >
                {{ d.getDate() }}
              </span>
            </button>
          </div>

          <template v-else>
            <div
              class="min-w-0 truncate text-sm md:text-base font-bold uppercase tracking-[0.04em] text-[#344054]"
              data-test="calendar-day-event-title"
            >
              {{ dayModeTitle }}
            </div>
            <span class="flex shrink-0 items-center justify-between">
              <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(-1)" data-main-prev>
                <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.9995L1 8.99951L9 0.999512" stroke="#101828" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
              <button class="w-[2rem] h-[2rem] flex items-center justify-center" @click="shift(1)" data-main-next>
                <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 16.9995L9 8.99951L1 0.999512" stroke="#101828" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
            </span>
          </template>
        </div>

        <div
          v-else-if="isWeekEventColumnMode"
          class="flex min-w-0 w-full items-center h-[3.995rem] pl-2"
          data-test="calendar-week-event-header"
        >
          <div
            ref="weekHeaderScrollRef"
            class="w-full min-w-0 select-none overflow-x-auto overscroll-x-contain touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            :class="isWeekHeaderMouseDragging ? 'cursor-grabbing' : 'cursor-grab'"
            data-test="calendar-week-event-header-scroll"
            @scroll="syncWeekHorizontalScroll('header')"
            @wheel="handleWeekHorizontalWheel($event, 'header')"
            @mousedown="beginWeekHeaderMouseDrag"
            @click.capture="handleWeekHeaderClickCapture"
          >
            <div
              class="flex h-[3.995rem]"
              :style="weekEventTrackStyle"
              data-test="calendar-week-event-header-track"
            >
              <button
                v-for="group in weekEventDayGroups"
                :key="'week-header-' + group.dateKey"
                type="button"
                class="flex shrink-0 flex-col items-center justify-center gap-1 px-1 py-1 text-center transition-opacity"
                :class="group.isSelected ? 'opacity-100' : 'opacity-30'"
                :style="weekEventDayGroupStyle(group)"
                :data-date="group.dateKey"
                :data-selected="group.isSelected ? 'true' : 'false'"
                :data-today="sameDay(group.day, today) ? 'true' : 'false'"
                :data-week-day-units="group.widthUnits"
                :data-week-day-base-width="`${group.baseWidthPercent}%`"
                data-test="calendar-week-event-header-day"
                @click="selectWeekDate(group.day)"
              >
                <span
                  class="text-[0.625rem] font-bold uppercase leading-4"
                  :class="group.day.getDay() === 0 ? 'text-[#FF0066]' : 'text-[#0C111D]'"
                >
                  {{ shortWeekdays[group.day.getDay()] }}
                </span>
                <span
                  class="flex h-8 w-8 items-center justify-center rounded-full text-[1rem] font-bold leading-8"
                  :class="[
                    group.isSelected
                      ? 'bg-[#0C111D] text-white'
                      : (group.day.getDay() === 0 ? 'text-[#FF0066]' : 'text-[#0C111D]'),
                    sameDay(group.day, today) && !group.isSelected ? 'ring-1 ring-[#FB5BA2]/40' : ''
                  ]"
                >
                  {{ group.day.getDate() }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="grid w-full" :class="[
          effectiveView === 'day' ? 'grid-cols-3' : 'grid-cols-7',
          variant === 'theme2' ? 'min-h-[5rem]' : 'h-[3.995rem]'
        ]">
          <div v-for="(d, i) in headerDays" :key="'xh-' + i" 
            class="text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
            :class="[
              theme.main.axisXDay,
              (sd(d).getDay() === 0 && variant === 'default') ? 'text-[#FF6A6A]' : '',
              sameDay(d, cursor) ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
            ]" 
            :data-date="d.toISOString().slice(0, 10)"
            @click="emitDate(d)">

            <div v-if="variant === 'theme2'"
              class="h-4 text-[0.625rem] font-bold leading-4 tracking-wider uppercase text-slate-500">
              <span v-if="highlightTodayColumn && sameDay(d, today)" data-test="calendar-today-label">
                {{ t("common_today") }}
              </span>
            </div>

            <div class="text-xs font-semibold leading-[1.25rem] uppercase"
              :class="variant === 'theme2' ? 'text-slate-500 tracking-wider mb-1' : ''">
              {{ shortWeekdays[d.getDay()] }}
            </div>

            <div class="text-[1rem] w-[2rem] text-center font-semibold leading-[2rem]"
              :class="[
                (highlightTodayColumn && sameDay(d, today)) ? theme.main.axisXToday : '',
                sameDay(d, cursor) && !sameDay(d, today) ? 'bg-pink-500/20 rounded-full' : ''
              ]">
              {{ d.getDate() }}
            </div>
          </div>
        </div>

      </div>

      <div
        ref="timeGridScrollRef"
        data-cal-time-scroll
        class="flex items-start gap-2 flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-row-reverse md:flex-row">
        <div class="flex flex-col shrink-0" data-cal-time-axis :style="{ height: gridMetrics.totalHeight + 'px' }">
          <div v-for="(t, idx) in range.labels" :key="'slot-label-' + t"
            :class="[theme.main.axisYRow, 'shrink-0', isNowLabel(t) ? ' !text-brand-textPink font-bold' : '']"
            :style="idx < gridMetrics.rows.length ? { height: gridMetrics.rows[idx].height + 'px' } : {}">
            {{ formatTime(t) }}
          </div>
        </div>

        <div
          ref="weekBodyScrollRef"
          class="flex-1 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          :class="isWeekEventColumnMode ? 'overflow-x-auto overscroll-x-contain touch-pan-x' : 'overflow-x-hidden'"
          data-test="calendar-week-event-body-scroll"
          :style="{ height: gridMetrics.totalHeight + 'px' }"
          @scroll="syncWeekHorizontalScroll('body')"
          @wheel="handleWeekBodyWheel"
        >
        <span
          class="w-full min-w-0 relative rounded-md"
          :class="[
            isWeekEventColumnMode ? 'flex' : 'grid',
            isEventColumnMode ? 'overflow-visible' : 'overflow-hidden',
            !isEventColumnMode ? (effectiveView === 'day' ? 'grid-cols-3' : 'grid-cols-7') : ''
          ]"
          :style="timeGridColumnStyle"
        >
          <div
            v-if="showNowLine"
            class="pointer-events-none absolute left-0 right-0 z-[6] h-[2px] bg-[#FF0066]"
            data-test="calendar-now-line"
            :style="{ top: `${nowLineTopPx}px` }"
          ></div>

          <template v-if="isDayEventColumnMode">
            <div
              v-for="column in dayEventColumns"
              :key="'event-col-' + column.eventId"
              :data-date="selectedDayIso"
              :data-event-id="column.isEmpty ? undefined : column.eventId"
              :data-empty-column="column.isEmpty ? 'true' : 'false'"
              :data-expired="sd(selectedDay) < today ? 'true' : 'false'"
              :class="[theme.main.colBase, 'min-w-0']"
              @click.self="emitDate(selectedDay)"
            >

              <div class="absolute z-[0] inset-0 pointer-events-none">
                <div v-for="(metric, i) in gridMetrics.rows" :key="'grid-' + i" :class="theme.main.gridRow" :style="{ height: metric.height + 'px' }"></div>
              </div>

              <div class="relative z-[0]" data-cal-scroll
                :style="{ height: gridMetrics.totalHeight + 'px' }">
                <template v-for="ev in eventsForEventColumn(column)" :key="ev.id||ev.title+ev.start">
                  <slot v-if="ev.slot === 'availability'" name="event-availability" :event="ev" :day="selectedDay" :view="effectiveView"
                    :style="styleBlock(ev, selectedDay)" :onClick="dispatchEventClick"></slot>
                  <slot v-else-if="ev.slot === 'alt'" name="event-alt" :event="ev" :day="selectedDay" :view="effectiveView"
                    :style="styleBlock(ev, selectedDay)" :onClick="dispatchEventClick"></slot>
                  <slot v-else-if="ev.slot === 'custom'" name="event-custom" :event="ev" :day="selectedDay" :view="effectiveView"
                    :style="styleBlock(ev, selectedDay)" :onClick="dispatchEventClick"></slot>
                  <slot v-else-if="ev.slot === 'custom2'" name="event-custom2" :event="ev" :day="selectedDay" :view="effectiveView"
                    :style="styleBlock(ev, selectedDay)" :onClick="dispatchEventClick"></slot>
                  <slot v-else name="event" :event="ev" :day="selectedDay" :view="effectiveView" :style="styleBlock(ev, selectedDay)"
                    :onClick="dispatchEventClick"></slot>
                </template>
              </div>

            </div>
          </template>

          <template v-else-if="isWeekEventColumnMode">
            <div
              v-for="group in weekEventDayGroups"
              :key="'week-day-' + group.dateKey"
              class="relative shrink-0 transition-opacity"
              :class="[theme.main.colBase, group.isSelected ? 'opacity-100' : 'opacity-30']"
              :style="{ ...weekEventDayGroupStyle(group), height: gridMetrics.totalHeight + 'px' }"
              :data-date="group.dateKey"
              :data-selected="group.isSelected ? 'true' : 'false'"
              :data-expired="sd(group.day) < today ? 'true' : 'false'"
              :data-week-day-units="group.widthUnits"
              :data-week-day-base-width="`${group.baseWidthPercent}%`"
              data-test="calendar-week-event-day-group"
              @click.self="selectWeekDate(group.day)"
            >
              <div
                class="grid h-full min-w-0"
                :style="eventColumnsGridStyle(group.columns)"
                data-test="calendar-week-event-day-columns"
              >
                <div
                  v-for="column in group.columns"
                  :key="'week-event-col-' + group.dateKey + '-' + column.eventId"
                  :data-date="group.dateKey"
                  :data-event-id="column.isEmpty ? undefined : column.eventId"
                  :data-empty-column="column.isEmpty ? 'true' : 'false'"
                  :data-selected-day="group.isSelected ? 'true' : 'false'"
                  :data-expired="sd(group.day) < today ? 'true' : 'false'"
                  :class="[theme.main.colBase, 'min-w-0']"
                  data-test="calendar-week-event-column"
                  @click.self="selectWeekDate(group.day)"
                >

                  <div class="absolute z-[0] inset-0 pointer-events-none">
                    <div v-for="(metric, i) in gridMetrics.rows" :key="'week-grid-' + group.dateKey + '-' + column.eventId + '-' + i" :class="theme.main.gridRow" :style="{ height: metric.height + 'px' }"></div>
                  </div>

                  <div class="relative z-[0]" data-cal-scroll
                    :style="{ height: gridMetrics.totalHeight + 'px' }">
                    <template v-for="ev in eventsForEventColumn(column, group.day)" :key="ev.id||ev.title+ev.start">
                      <slot v-if="ev.slot === 'availability'" name="event-availability" :event="ev" :day="group.day" :view="effectiveView"
                        :style="styleBlock(ev, group.day)" :onClick="dispatchEventClick"></slot>
                      <slot v-else-if="ev.slot === 'alt'" name="event-alt" :event="ev" :day="group.day" :view="effectiveView"
                        :style="styleBlock(ev, group.day)" :onClick="dispatchEventClick"></slot>
                      <slot v-else-if="ev.slot === 'custom'" name="event-custom" :event="ev" :day="group.day" :view="effectiveView"
                        :style="styleBlock(ev, group.day)" :onClick="dispatchEventClick"></slot>
                      <slot v-else-if="ev.slot === 'custom2'" name="event-custom2" :event="ev" :day="group.day" :view="effectiveView"
                        :style="styleBlock(ev, group.day)" :onClick="dispatchEventClick"></slot>
                      <slot v-else name="event" :event="ev" :day="group.day" :view="effectiveView" :style="styleBlock(ev, group.day)"
                        :onClick="dispatchEventClick"></slot>
                    </template>
                  </div>

                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div v-for="(d, idx) in bodyDays" :key="'col-' + idx" :data-date="d.toISOString().slice(0, 10)"
              :data-expired="sd(d) < today ? 'true' : 'false'" :class="theme.main.colBase" @click.self="emitDate(d)">

              <div class="absolute z-[0] inset-0 pointer-events-none">
                <div v-for="(metric, i) in gridMetrics.rows" :key="'grid-' + i" :class="theme.main.gridRow" :style="{ height: metric.height + 'px' }"></div>
              </div>

              <div class="relative z-[0]" data-cal-scroll
                :style="{ height: gridMetrics.totalHeight + 'px' }">
                <template v-for="ev in eventsForBodyDay(d)" :key="ev.id||ev.title+ev.start">
                  <slot v-if="ev.slot === 'availability'" name="event-availability" :event="ev" :day="d" :view="effectiveView"
                    :style="styleBlock(ev, d)" :onClick="dispatchEventClick"></slot>
                  <slot v-else-if="ev.slot === 'alt'" name="event-alt" :event="ev" :day="d" :view="effectiveView"
                    :style="styleBlock(ev, d)" :onClick="dispatchEventClick"></slot>
                  <slot v-else-if="ev.slot === 'custom'" name="event-custom" :event="ev" :day="d" :view="effectiveView"
                    :style="styleBlock(ev, d)" :onClick="dispatchEventClick"></slot>
                  <slot v-else-if="ev.slot === 'custom2'" name="event-custom2" :event="ev" :day="d" :view="effectiveView"
                    :style="styleBlock(ev, d)" :onClick="dispatchEventClick"></slot>
                  <slot v-else name="event" :event="ev" :day="d" :view="effectiveView" :style="styleBlock(ev, d)"
                    :onClick="dispatchEventClick"></slot>
                </template>
              </div>

            </div>
          </template>
        </span>
        </div>
      </div>
    </div>

    <div ref="monthViewRef" v-if="effectiveView === 'month'" class="flex flex-col px-1 md:px-0 w-full h-full overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" data-test="calendar-month-view">

      <div class="grid grid-cols-7 shrink-0 top-0 sticky w-full backdrop-blur-md z-10">
        <div v-for="(w, index) in shortWeekdays" :key="w"
          class="text-center text-sm sm:text-lg font-semibold uppercase leading-7 mb-[0.625rem]"
          :class="index === 0 ? 'text-red-400' : 'text-gray-500'">
          {{ w }}
        </div>
      </div>

      <div class="min-h-0 flex-1 flex flex-col">

        <div v-for="(row, rowIndex) in monthRows" :key="'row-' + rowIndex" class="contents">

          <div class="grid min-h-0 grid-cols-7 flex-1 overflow-hidden" data-test="calendar-month-week-row">
            <button v-for="(d, i) in row" :key="'m-' + i" :ref="(element) => setMonthCellRef(formatLocalDateKey(d), element)" type="button" :data-date="d.toISOString().slice(0, 10)" @click="handleMonthDateClick(d)" :class="[
              theme.month.cellBase,
              'min-h-0 overflow-hidden',
              d.getMonth() !== cursor.getMonth() ? theme.month.outside : '',
              (highlightTodayColumn && sameDay(d, today)) ? theme.month.today : '',
              d.getDay() === 0 ? 'text-red-400' : '',
              expandedDate && sameDay(d, expandedDate) ? 'bg-slate-50' : ''
            ]">
              <div class="w-full mb-1 flex justify-between gap-1 items-center">
                <div class="text-sm font-semibold text-[#101828]" data-test="calendar-month-date-label" :class="d.getDay() === 0 ? 'text-red-400 font-semibold' : ''">
                {{ d.getDate() }}
                </div>  

                <div class="px-2 py-[2px] flex items-center justify-end gap-[2px]">
                  <span class="text-xs font-medium text-[#F06]">+</span>
                  <img src="/images/token-sm-calender.svg" alt="" class="w-4 h-4" />
                  <span class="text-xs font-medium text-[#F06]">3,800</span>
                </div>
              </div>

              <div
                :ref="(element) => setMonthBookingViewportRef(formatLocalDateKey(d), element)"
                class="min-h-0 flex-1 w-full overflow-visible"
                data-test="calendar-month-bookings"
                :data-booking-count="monthBookingEventsForDay(d).length"
                :data-visible-booking-count="monthBookingVisibleCount(d)"
              >
                <div :ref="(element) => setMonthBookingContentRef(formatLocalDateKey(d), element)" class="flex w-full flex-col gap-1">
                  <div
                    v-for="(booking, bookingIndex) in visibleMonthBookingEventsForDay(d)"
                    :key="booking.id || booking.title + booking.start"
                    class="flex h-[1.375rem] w-full shrink-0 items-center gap-1 overflow-hidden"
                    data-test="calendar-month-booking-row"
                  >
                    <div class="min-w-0 flex-1 overflow-hidden">
                      <slot :name="resolveEventSlotName(booking)" :event="booking" :day="d" view="month"
                        :onClick="dispatchEventClick" />
                    </div>
                    <span
                      v-if="bookingIndex === visibleMonthBookingEventsForDay(d).length - 1 && monthHiddenBookingCount(d) > 0"
                      class="shrink-0 text-[0.625rem] font-medium leading-4 text-[#344054]"
                      data-test="calendar-month-booking-more"
                    >
                      +{{ monthHiddenBookingCount(d) }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                v-if="monthAvailabilityEventsForDay(d).length > 0"
                class="mt-auto flex min-h-0 w-full shrink-0 flex-col gap-1 overflow-hidden"
                data-test="calendar-month-availability-summary"
                :data-availability-count="monthAvailabilityEventsForDay(d).length"
                :data-visible-availability-count="monthAvailabilityVisibleCount(d)"
              >
                <div
                  v-for="(availability, availabilityIndex) in visibleMonthAvailabilityEventsForDay(d)"
                  :key="'month-availability-' + (availability.eventId || availability.id || availabilityIndex)"
                  class="flex h-[1.375rem] last:h-[2.6rem] w-full shrink-0 items-start gap-1 overflow-hidden flex-col"
                  data-test="calendar-month-availability-row"
                >
                  <div class="min-w-0 flex-1 overflow-hidden">
                    <slot
                      name="event-availability"
                      :event="availability"
                      :day="d"
                      view="month"
                      :onClick="dispatchEventClick"
                    />
                  </div>
                  <span
                    v-if="availabilityIndex === visibleMonthAvailabilityEventsForDay(d).length - 1 && monthHiddenAvailabilityCount(d) > 0"
                    class="shrink-0 text-xs font-medium text-[#344054] flex items-center gap-1"
                    data-test="calendar-month-availability-more"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M7.99967 3.33337V12.6667M3.33301 8.00004H12.6663" stroke="#344054" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>{{ monthHiddenAvailabilityCount(d) }} MORE...
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div v-if="isRowExpanded(row) && expandedDayEvents.length > 0" class="w-full transition-all duration-300 lg:hidden">
            <slot name="month-expanded" :events="expandedDayEvents" :day="expandedDate" :onClick="dispatchEventClick">
              <div class="w-full p-2 bg-black/10 flex flex-col gap-2" data-test="month-expanded-default">
                <button
                  v-for="event in expandedDayEvents"
                  :key="event.id || event.title + event.start"
                  type="button"
                  class="w-full min-h-[4.125rem] pr-1 bg-gradient-to-r from-gray-50/50 to-gray-50/20 rounded inline-flex gap-1.5 overflow-hidden text-left shadow-sm"
                  data-test="month-expanded-event"
                  @click.stop="dispatchEventClick(event)"
                >
                  <div class="w-1 shrink-0" :style="{ backgroundColor: monthEventAccent(event) }" />
                  <div class="flex-1 min-w-0 py-2 flex gap-2">
                    <div class="w-14 shrink-0 text-slate-700 text-xs font-medium font-['Poppins'] leading-4">
                      {{ formatMonthEventTimeRange(event) }}
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col gap-1">
                      <div
                        class="text-sm font-semibold font-['Poppins'] leading-5 truncate"
                        :style="{ color: monthEventAccent(event) }"
                      >
                        {{ event.title || t("dashboard_booked_slot") }}
                      </div>
                      <div class="text-gray-500 text-xs font-medium font-['Poppins'] leading-4 truncate">
                        {{ monthEventMeta(event) }}
                      </div>
                    </div>
                    <div v-if="event.status" class="shrink-0 text-gray-500 text-xs font-medium font-['Poppins'] leading-4 capitalize">
                      {{ formatEventStatus(event.status) }}
                    </div>
                  </div>
                </button>
              </div>
            </slot>
          </div>
        </div>
      </div>

      <div
        v-if="width >= 1024 && expandedDate && expandedMonthEventCount > 0"
        ref="monthOverlayRef"
        class="month-date-overlay absolute z-30 flex flex-col overflow-hidden border border-[#344054] bg-white/95 shadow-[0_12px_32px_rgba(16,24,40,0.22)] backdrop-blur-md"
        data-test="calendar-month-date-overlay"
        :data-date="formatLocalDateKey(expandedDate)"
        :style="monthOverlayStyle"
        @click.stop
      >
        <div class="sticky top-0 z-10 flex h-10 shrink-0 items-center justify-between border-none border-[#D0D5DD] bg-white/95 px-2">
          <div class="flex items-center gap-2">
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-[#0C111D] text-sm font-semibold text-white" data-test="calendar-month-overlay-date">
              {{ expandedDate.getDate() }}
            </span>
            <span class="hidden text-[0.625rem] font-semibold uppercase text-[#667085]">
              {{ shortWeekdays[expandedDate.getDay()] }}
            </span>
          </div>
          <button
            type="button"
            class="hidden _flex h-7 w-7 items-center justify-center text-[#667085] hover:text-[#101828]"
            data-test="calendar-month-overlay-close"
            :aria-label="t('common_close')"
            @click.stop="closeMonthDateOverlay"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div data-test="calendar-month-overlay-bookings" class="space-y-1">
            <template v-for="event in expandedMonthBookingEvents" :key="'month-overlay-booking-' + (event.id || event.eventId || event.title + event.start)">
              <slot
                :name="resolveEventSlotName(event)"
                :event="event"
                :day="expandedDate"
                view="month"
                :onClick="handleMonthOverlayBookingClick"
              />
            </template>
          </div>

          <div v-if="expandedMonthAvailabilityEvents.length > 0" data-test="calendar-month-overlay-availabilities" class="space-y-1">
            <template v-for="availability in expandedMonthAvailabilityEvents" :key="'month-overlay-availability-' + (availability.eventId || availability.id || availability.title + availability.start)">
              <slot
                name="event-availability"
                :event="availability"
                :day="expandedDate"
                view="month"
                :onClick="dispatchEventClick"
              />
            </template>
          </div>
        </div>
      </div>
    </div>


    <!-- popups -->
    <PopupHandler v-model="calendarPopupOpen" :config="calendarPopupConfig">
      <CalendarMobilePopupContent
        :view="view"
        :events-data="props.eventsData"
        :can-create-events="canCreateEvents"
        :booking-schedule-events="props.bookingScheduleEvents"
        :booking-schedule-booked-slots-index="props.bookingScheduleBookedSlotsIndex"
        :show-booking-schedule-list="props.showBookingScheduleList"
        @set-view="setView"
        @join-click="handleJoin"
        @reply-click="handleReply"
        @event-click="handleMobileWidgetEventClick"
        @menu-action="handleMobileWidgetMenuAction"
        @open-new-events="handleOpenNewEvents"
        @edit-schedule-event="handleMobileScheduleEdit"
        @delete-schedule-event="handleMobileScheduleDelete"
        @view-schedule-card="handleMobileScheduleCardPreview"
        @close="calendarPopupOpen = false"
      />
    </PopupHandler>

    <PopupHandler v-model="eventsRequestsPopupOpen" :config="eventsRequestsPopupConfig">
      <EventsRequestsPopup
        v-if="eventsRequestsPopupOpen"
        :events-data="props.eventsData"
        :user-role="props.userRole"
        @close="eventsRequestsPopupOpen = false"
        @join-click="handleJoin"
        @reply-click="handleReply"
        @event-click="handleMobileWidgetEventClick"
        @menu-action="handleMobileWidgetMenuAction"
      />
    </PopupHandler>

    <PopupHandler v-model="newEventsPopupOpen" :config="newEventsPopupConfig">
      <NewEventsPopup
        @create-private="handleCreateEvent('private')"
        @create-group="handleCreateEvent('group')"
      />
    </PopupHandler>

    <PopupHandler v-model="eventDetailsPopupOpen" :config="eventDetailsPopupConfig">
      <CalendarEventDetailsPopup
        v-if="eventDetailsPopupOpen"
        :event="selectedEvent"
        :user-role="props.userRole"
        :can-review-pending="props.canReviewPending"
        @join-call="handleJoin"
        @approve-booking="handleApproveBooking"
        @reject-booking="handleRejectBooking"
        @cancel-booking="handleCancelBooking"
        @adjust-booking="handleAdjustBooking"
        @open-chat="handleOpenChat"
        @close="eventDetailsPopupOpen = false"
      />
    </PopupHandler>

    <!-- <PopupHandler v-model="isDatePopupOpen" :config="datePopupConfig">
      <MobileDateSelector :current-date="cursor" @update:date="handleDateUpdate" @close="isDatePopupOpen = false" />
    </PopupHandler> -->
    <Teleport to="body">
      <div v-if="isDatePopupOpen && width < 1024" class="fixed inset-0 z-[120] lg:hidden">
        <Transition name="fade">
          <div v-if="isDatePopupOpen" class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="isDatePopupOpen = false"></div>
        </Transition>

        <Transition name="slide-up">
          <div v-if="isDatePopupOpen" class="absolute bottom-0 left-0 w-full bg-white rounded-t-[1.5rem] shadow-[0px_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
            <div class="py-4 pb-0">
               <div class="max-h-[70vh] overflow-y-auto">
                 <MobileDateSelector :current-date="cursor" @update:date="handleDateUpdate" @close="isDatePopupOpen = false" />
               </div>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>

    <!-- Teleport for Mobile Filter Bottom Sheet -->
    <Teleport to="body">
      <div v-if="isDropdownOpen && width < 1024" class="fixed inset-0 z-[120] lg:hidden">
        <!-- Backdrop -->
        <Transition name="fade">
          <div v-if="isDropdownOpen" class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="isDropdownOpen = false"></div>
        </Transition>

        <!-- Bottom Sheet -->
        <Transition name="slide-up">
          <div v-if="isDropdownOpen" class="absolute bottom-0 left-0 w-full bg-[#F2F4F7] rounded-t-[1.5rem] shadow-[0px_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
            <div class="py-4">
              <div class="flex justify-between items-center px-4">
                <h2 class="text-gray-950 text-sm font-semibold">{{ t("dashboard_display_options") }}</h2>
              </div>
              
              <div class="max-h-[70vh] overflow-y-auto pb-6">
                <EventDropdownContent v-model="dropdownFilters" class="!shadow-none !border-none !w-full" />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>

    <AdjustBookingPopup
      v-if="adjustBookingState"
      :message="adjustBookingState.message"
      :chatId="adjustBookingState.chatId"
      @close="adjustBookingState = null"
      @submitted="handleAdjustSubmitted"
    />
    <!-- Mobile sticky bottom event card -->
    <Teleport to="body">
      <div class="fixed hidden bottom-0 left-0 right-0 z-[90] md:hidden">
        <div class="w-full bg-white min-h-[80px] shadow-[0_0_12px_0_rgba(85,73,255,0.75),0_4px_8px_-2px_rgba(85,73,255,0.10),0_2px_4px_-2px_rgba(85,73,255,0.06)] border border-gray-100 p-3 flex gap-1.5">
         
          <div 
            class="w-[0.25rem] h-[auto] rounded-[0.875rem] bg-[#5549FF]"
          > </div>
          <span class="text-xs py-2 text-gray-700 font-semibold leading-4 shrink-0 w-[54px]">12:30pm– 1:00pm</span>
          <div class="flex flex-col gap-1 self-stretch flex-1">
            <div class="flex items-center gap-2">
              <div class="flex flex-1 items-center gap-1 min-w-0">
                <PhoneIcon color="#5549FF"/>
                <p class="text-[0.875rem] font-semibold text-[#5549FF] truncate leading-5">High School Simulator</p>
                <img :src=GreenCheckIcon />
              </div>
              <button class="flex items-center justify-center w-5 h-5 shrink-0">
                <img :src=ThreeDotsIcon />
              </button>
            </div>
  
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <img
                  src="https://i.pravatar.cc/32?img=5"
                  alt="Guest"
                  class="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <p class="text-[0.6875rem] text-gray-500 font-medium flex-1 truncate">Apples</p>
              </div>
              <div class="flex flex-col items-end gap-1">
                <span class="flex items-center gap-1 shrink-0">
                  <IndicatorDot color="#FF4405" class="w-2 h-2" />
                  <span class="text-[0.6875rem] font-medium text-[#FF4405]">in 5 min</span>
                </span>
                <button class="flex items-center gap-1 px-2.5 py-1.5 rounded-[0.25rem] bg-[#5549FF] hover:bg-[#5549FF]/90 transition-colors shrink-0 blink-border-blue-effect">
                  <img :src=PhoneIncoming02Icon />
                  <span class="text-white text-[0.75rem] font-semibold">{{ t('common_join_call') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </section>



</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { SOD, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, timeToMinutes, overlaps, monthNames } from '@/utils/calendarHelpers.js';
import CheckboxGroup from '../ui/form/checkbox/CheckboxGroup.vue';
import { onUnmounted } from 'vue';
import EventDropdownContent from './EventDropdownContent.vue';
import PendingStatus from "@/components/icons/PendingStatus.vue";
import PopupHandler from '../ui/popup/PopupHandler.vue';
import PhoneIcon from "@/components/icons/PhoneIcon.vue";
import GroupCallIcon from "@/components/icons/GroupCallIcon.vue";
import BookingScheduleIcon from "@/components/icons/BookingScheduleIcon.vue";
import ButtonComponent from '../dev/button/ButtonComponent.vue';
import NewEventsPopup from './NewEventsPopup.vue';
import CalendarMobilePopupContent from './CalendarMobilePopupContent.vue';
import CalendarEventDetailsPopup from './CalendarEventDetailsPopup.vue';
import EventsRequestsPopup from './EventsRequestsPopup.vue';
import MobileDateSelector from './MobileDateSelector.vue';
import AdjustBookingPopup from '@/components/ui/chat/AdjustBookingPopup.vue';
import FlowHandler from '@/services/flow-system/FlowHandler';
import { useChatSocket } from '@/composables/useChatSocket';
import { useChatStore } from '@/stores/useChatStore';
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

import MiniCalendar from './MiniCalendar.vue';
import IndicatorDot from '../icons/IndicatorDot.vue';
import GreenCheckIcon from "@/assets/images/icons/green-check.svg"
import PhoneIncoming02Icon from "@/assets/images/icons/phone-incoming-02.svg"
import ThreeDotsIcon from "@/assets/images/icons/dots-vertical.svg"

const props = defineProps({
  variant: { type: String, default: 'default' },
  focusDate: { type: Date, required: true },
  initialView: { type: String, default: 'week' },
  events: { type: Array, default: () => [] },
  eventsData: { type: Array, default: () => [] },
  bookingScheduleEvents: { type: Array, default: () => [] },
  bookingScheduleBookedSlotsIndex: { type: Object, default: () => ({}) },
  showBookingScheduleList: { type: Boolean, default: false },
  theme: { type: Object, default: () => ({}) },
  userRole: { type: String, default: 'creator' },
  canReviewPending: { type: Boolean, default: true },
  dataAttrs: { type: Object, default: () => ({}) },
  consoleOverlaps: { type: Boolean, default: true },
  highlightTodayColumn: { type: Boolean, default: false },
  timeStart: { type: String, default: '05:00' },
  timeEnd: { type: String, default: '23:00' },
  slotMinutes: { type: Number, default: 60 },
  rowHeightPx: { type: Number, default: 64 },
  minEventHeightPx: { type: Number, default: 0 },
  dayColumnMode: { type: String, default: 'dates' }
});

const emit = defineEmits(['date-selected', 'update:focus-date', 'view-changed', 'preview-schedule', 'join-call', 'reply-click', 'approve-booking', 'reject-booking', 'cancel-booking', 'menu-action', 'create-event', 'edit-schedule-event', 'delete-schedule-event', 'view-schedule-card', 'refresh-events']);
const { t, locale } = useBookingTranslations();
const today = ref(SOD(new Date()));
const width = ref(window.innerWidth);
const cursor = ref(new Date(props.focusDate));
const view = ref(props.initialView);
const calendarRootRef = ref(null);
const timeGridBodyRef = ref(null);
const timeGridScrollRef = ref(null);
const mobileDayStripRef = ref(null);
const weekHeaderScrollRef = ref(null);
const weekBodyScrollRef = ref(null);
const monthCellRefs = new Map();
const monthBookingViewportRefs = new Map();
const monthBookingContentRefs = new Map();
const monthBookingVisibleCounts = ref({});
const monthAvailabilityVisibleCounts = ref({});
let monthAvailabilityResizeObserver = null;
let monthAvailabilityLayoutFrame = null;
const weekHeaderMouseDrag = ref({
  active: false,
  dragging: false,
  startX: 0,
  startLeft: 0,
});
const suppressWeekHeaderClick = ref(false);
const nowTimer = ref(null);
const nowY = ref(0);
const currentTimeMs = ref(Date.now());
// State for dropdown
const isDropdownOpen = ref(false);
const isViewSelectorOpen = ref(false);
const availableViewOptions = computed(() => (width.value < 768 ? ['day'] : ['day', 'week', 'month']));
const dropdownContainer = ref(null);
const showSchedule = ref(true); // Checkbox state
const showLegend = ref(false);
const dropdownFilters = ref({
  video: true,
  audio: true,
  groupCall: true,
  showSchedule: true,
  showCompleted: false,
  showAnalytics: false,
});
const calendarPopupOpen = ref(false);
const newEventsPopupOpen = ref(false);
const eventsRequestsPopupOpen = ref(false);
const eventDetailsPopupOpen = ref(false);
const adjustBookingState = ref(null);
const selectedEvent = ref({});
const isMobileCalendarOpen = ref(false);

const chatStore = useChatStore();
const { sendChatMessage } = useChatSocket();
const isDatePopupOpen = ref(false); // New state for Date Popup
const expandedDate = ref(null);
const monthViewRef = ref(null);
const monthOverlayRef = ref(null);
const monthOverlayStyle = ref({});
const mobileCalendarRef = ref(null);
const canCreateEvents = computed(() => props.userRole === 'creator');

const handleMobileCalendarClickOutside = (event) => {
  if (
    isMobileCalendarOpen.value &&
    mobileCalendarRef.value &&
    !mobileCalendarRef.value.contains(event.target) &&
    // Check if the click was on the toggle button itself (to avoid immediate re-opening)
    // !event.target.closest('.mobile-calendar-toggle')
    !event.target.closest('.cursor-pointer.flex.lg\\:hidden')

  ) {
    isMobileCalendarOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleMobileCalendarClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleMobileCalendarClickOutside);
});


const toggleMobileCalendar = () => {
  isMobileCalendarOpen.value = !isMobileCalendarOpen.value;
};


// Divider for Month Rows (7 days each)
const monthRows = computed(() => {
  const result = [];
  const allDays = days.value;
  for (let i = 0; i < allDays.length; i += 7) {
    result.push(allDays.slice(i, i + 7));
  }
  return result;
});

const isExpandableMonthEvent = (event) => event
  && event.isAvailabilityBlock !== true
  && event.isDraftPreview !== true;

const getExpandableMonthEvents = (day) => [...eventsForDay(day)]
  .filter(isExpandableMonthEvent)
  .sort((left, right) => left.start - right.start || left.end - right.end);

const expandedDayEvents = computed(() => (
  expandedDate.value ? getExpandableMonthEvents(expandedDate.value) : []
));

const expandedMonthBookingEvents = computed(() => (
  expandedDate.value ? monthBookingEventsForDay(expandedDate.value) : []
));

const expandedMonthAvailabilityEvents = computed(() => (
  expandedDate.value ? monthAvailabilityEventsForDay(expandedDate.value) : []
));

const expandedMonthEventCount = computed(() => (
  expandedMonthBookingEvents.value.length + expandedMonthAvailabilityEvents.value.length
));

const resolveEventSlotName = (event = {}) => {
  if (!event?.slot || event.slot === 'event') return 'event';
  return `event-${event.slot}`;
};

const handleMonthDateClick = (d) => {
  if (window.innerWidth >= 1024) {
    const hasEvents = monthBookingEventsForDay(d).length > 0
      || monthAvailabilityEventsForDay(d).length > 0;

    if (!hasEvents || (expandedDate.value && sameDay(d, expandedDate.value))) {
      expandedDate.value = null;
      monthOverlayStyle.value = {};
    } else {
      expandedDate.value = new Date(d);
      positionMonthDateOverlay(d);
    }

    emitDate(d);
    return;
  }

  const dayEvents = getExpandableMonthEvents(d);

  if (dayEvents.length > 0) {
    if (expandedDate.value && sameDay(d, expandedDate.value)) {
      expandedDate.value = null;
    } else {
      expandedDate.value = new Date(d);
    }
  } else {
    expandedDate.value = null;
  }
  emitDate(d);
};

function closeMonthDateOverlay() {
  expandedDate.value = null;
  monthOverlayStyle.value = {};
}

function handleMonthOverlayBookingClick(event) {
  closeMonthDateOverlay();
  dispatchEventClick(event);
}



const isRowExpanded = (row) => {
  if (!expandedDate.value) return false;
  return row.some(d => sameDay(d, expandedDate.value));
};

const calendarPopupConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  speed: "250ms",
  effect: "ease-in-out",
  showOverlay: true,
  closeOnOutside: true,
  lockScroll: true,
  escToClose: true,
  width: { default: "480px" },
  height: { default: "80%", "<768": "80%" },
  scrollable: true,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
};

const eventsRequestsPopupConfig = {
  actionType: "slidein",
  from: "bottom",
  offset: "0px",
  speed: "300ms",
  effect: "ease-in-out",
  showOverlay: true,
  closeOnOutside: true,
  lockScroll: true,
  escToClose: true,
  width: { default: "100%" },
  height: { default: "80%" },
  scrollable: false,
  closeSpeed: "250ms",
};

const newEventsPopupConfig = {
  actionType: "slidein",
  from: "right",
  offset: "0px",
  verticalAlign: "bottom",
  width: { default: "24rem" },
  height: { default: "auto" },
  speed: "300ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: false,
};

const eventDetailsPopupConfig = {
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
  width: { default: "auto", "<480": "98%" },
  height: "auto",
  scrollable: false,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
  customClass: "mobile-event-details-sheet",
};

const datePopupConfig = {
  actionType: "slidein",
  from: "top",
  offset: "65px", // Height of header
  verticalAlign: "top", // Opens from top
  width: { default: "100%" },
  height: { default: "auto" }, // Let component define height
  speed: "300ms",
  effect: "ease-in-out",
  showOverlay: false,
  closeOnOutside: true,
  lockScroll: true,
};

const handleDateUpdate = (newDate) => {
  cursor.value = newDate;
  emit('date-selected', newDate);
  // Also emit update:focus-date if user expects v-model behavior
  emit('update:focus-date', newDate);
  isDatePopupOpen.value = false;
  isMobileCalendarOpen.value = false; // Close parent popup too if desired? User said "neeche jo calendar ha wahan bh date chng honic chyh"
};

const effectiveView = computed(() => {
  if (props.variant === 'theme2') return 'week';
  // if (width.value < 640) return 'day';
  // if (width.value < 1024 && view.value === 'month') return 'week';
  return view.value;
});

const isEventColumnMode = computed(() => (
  ['day', 'week'].includes(effectiveView.value)
  && ['default', 'theme2'].includes(props.variant)
  && props.dayColumnMode === 'events'
));

const isDayEventColumnMode = computed(() => (
  isEventColumnMode.value && effectiveView.value === 'day'
));

const isWeekEventColumnMode = computed(() => (
  isEventColumnMode.value && effectiveView.value === 'week'
));

const isMobileDayEventColumnMode = computed(() => (
  isDayEventColumnMode.value && width.value < 1024
));

function formatLocalDateKey(date) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const selectedDay = computed(() => new Date(cursor.value));
const selectedDayIso = computed(() => formatLocalDateKey(selectedDay.value));
const dayModeTitle = computed(() => selectedDay.value.toLocaleDateString(locale.value, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).toUpperCase());

const range = computed(() => {
  const sMin = timeToMinutes(props.timeStart);
  const eMin = timeToMinutes(props.timeEnd);
  const step = props.slotMinutes;
  const minutesTotal = Math.max(1, eMin - sMin);
  const rowCount = Math.floor(minutesTotal / step);
  const labels = Array.from({ length: rowCount + 1 }, (_, i) => {
    const mins = sMin + i * step;
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  });
  return { sMin, eMin, step, minutesTotal, rowCount, labels };
});

const weekDays = computed(() => {
  const s = startOfWeek(cursor.value);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
});

const selectedWeekContainsToday = computed(() => (
  weekDays.value.some((day) => sameDay(day, today.value))
));

const mobileDayStripDays = computed(() => {
  if (!isMobileDayEventColumnMode.value) return [];

  const s = startOfWeek(selectedDay.value);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
});

const headerDays = computed(() => {
  if (isDayEventColumnMode.value) {
    return [cursor.value];
  }

  if (effectiveView.value === 'day') {
    return [addDays(cursor.value, -1), cursor.value, addDays(cursor.value, 1)];
  }
  return days.value;
});

const days = computed(() => {
  if (effectiveView.value === 'month') {
    const start = startOfWeek(startOfMonth(cursor.value));
    const end = endOfWeek(endOfMonth(cursor.value));
    const arr = []; for (let x = new Date(start); x <= end; x = addDays(x, 1)) arr.push(new Date(x));
    return arr;
  }
  return effectiveView.value === 'day' ? [cursor.value] : weekDays.value;
});

const bodyDays = computed(() => {
  if (isDayEventColumnMode.value) {
    return [cursor.value];
  }

  if (effectiveView.value === 'day') {
    return [addDays(cursor.value, -1), cursor.value, addDays(cursor.value, 1)];
  }
  return days.value;
});

function resolveCalendarBookingStatus(event = {}) {
  const raw = event?.raw && typeof event.raw === 'object' ? event.raw : {};
  return String(
    event?.status
      || event?.bookingStatus
      || raw?.status
      || raw?.bookingStatus
      || '',
  ).trim().toLowerCase();
}

function isCompletedCalendarBooking(event = {}, comparisonTimeMs = currentTimeMs.value) {
  if (event?.isAvailabilityBlock === true) return false;
  if (resolveCalendarBookingStatus(event) === 'completed') return true;

  const endTimeMs = new Date(event?.end).getTime();
  return Number.isFinite(endTimeMs) && endTimeMs <= comparisonTimeMs;
}

const normalized = computed(() => {
  let evs = props.events || [];

  if (props.variant === 'default') {
    evs = evs.filter((ev) => {
      const isAvailabilityBlock = ev?.isAvailabilityBlock === true;
      if (isAvailabilityBlock && !showSchedule.value) return false;
      if (!isAvailabilityBlock
        && !dropdownFilters.value.showCompleted
        && isCompletedCalendarBooking(ev, currentTimeMs.value)) return false;

      const rawCallType = String(
        ev?.eventCallType
          || ev?.raw?.eventCallType
          || ev?.event?.eventCallType
          || '',
      ).trim().toLowerCase();
      const rawEventType = String(
        ev?.eventType
          || ev?.type
          || ev?.raw?.eventType
          || ev?.raw?.type
          || '',
      ).trim().toLowerCase();

      if (rawEventType.includes('group')) return !!dropdownFilters.value.groupCall;

      if (rawCallType.includes('audio')) return !!dropdownFilters.value.audio;
      if (rawCallType.includes('video')) return !!dropdownFilters.value.video;

      // Unknown call type fallback: keep visible if any 1:1 channel is enabled.
      return !!(dropdownFilters.value.video || dropdownFilters.value.audio);
    });
  }

  if (props.variant === 'theme2') {
    evs = evs.filter(ev => {
      const isDraftPreview = ev?.isDraftPreview === true;
      const isExistingSchedule = ev?.isExistingSchedule === true;

      // New explicit flags take precedence in theme2:
      // - Draft preview is always visible
      // - Existing schedule is visible only when checkbox is enabled
      if (isDraftPreview) return true;
      if (isExistingSchedule) return !!showSchedule.value;

      // Backward-compatible behavior for older events payloads.
      if (ev.slot === 'custom') return true;
      return !!showSchedule.value;
    });
  }

  return evs
    .filter(ev => ev && ev.start && ev.end)
    .map(ev => ({
      ...ev,
      start: new Date(ev.start), // Works for Date Object OR JSON String
      end: new Date(ev.end),     // Works for Date Object OR JSON String
      dataAttrs: ev.dataAttrs || {},
      slot: ev.slot || null
    }));
});

function resolveCountEventId(event = {}) {
  const raw = event?.raw && typeof event.raw === 'object' ? event.raw : {};
  const candidates = [
    event?.eventId,
    raw?.eventId,
    raw?.event?.eventId,
    raw?.eventCurrent?.eventId,
    raw?.eventSnapshot?.eventId,
    event?.id,
    raw?.id,
  ];

  const resolved = candidates
    .map((value) => String(value ?? '').trim())
    .find(Boolean);

  return resolved || null;
}

function resolveDayColumnEventId(event = {}) {
  return resolveCountEventId(event) || String(event?.eventId || event?.id || '').trim() || null;
}

function eventOverlapsDay(event = {}, day = null) {
  const dayStart = day ? SOD(day) : null;
  if (!dayStart || !event?.start || !event?.end) return false;

  const dayEnd = addDays(dayStart, 1);
  return event.start < dayEnd && event.end > dayStart;
}

function resolveDayColumnTitle(event = {}) {
  const candidates = [
    event?.title,
    event?.eventTitle,
    event?.raw?.title,
    event?.raw?.eventTitle,
    event?.raw?.event?.title,
    event?.raw?.eventCurrent?.title,
    event?.raw?.eventSnapshot?.title,
  ];

  return candidates
    .map((value) => String(value || '').trim())
    .find(Boolean) || '';
}

function toTimestampMs(value) {
  if (!value) return null;

  const parsed = new Date(value);
  const ms = parsed.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function resolveDayColumnCreatedAtMs(event = {}) {
  const raw = event?.raw && typeof event.raw === 'object' ? event.raw : {};
  const rawEvent = raw?.event && typeof raw.event === 'object' ? raw.event : {};
  const rawCurrent = raw?.eventCurrent && typeof raw.eventCurrent === 'object' ? raw.eventCurrent : {};
  const rawSnapshot = raw?.eventSnapshot && typeof raw.eventSnapshot === 'object' ? raw.eventSnapshot : {};

  const candidates = [
    event?.createdAt,
    event?.created_at,
    event?.createdOn,
    event?.created_on,
    raw?.createdAt,
    raw?.created_at,
    raw?.createdOn,
    raw?.created_on,
    rawEvent?.createdAt,
    rawEvent?.created_at,
    rawEvent?.createdOn,
    rawEvent?.created_on,
    rawCurrent?.createdAt,
    rawCurrent?.created_at,
    rawCurrent?.createdOn,
    rawCurrent?.created_on,
    rawSnapshot?.createdAt,
    rawSnapshot?.created_at,
    rawSnapshot?.createdOn,
    rawSnapshot?.created_on,
  ];

  for (const candidate of candidates) {
    const timestamp = toTimestampMs(candidate);
    if (timestamp != null) return timestamp;
  }

  return null;
}

function buildEventColumnsForDay(day) {
  const columns = new Map();

  normalized.value.forEach((event) => {
    if (!eventOverlapsDay(event, day)) return;

    const eventId = resolveDayColumnEventId(event);
    if (!eventId) return;

    const existing = columns.get(eventId) || {
      eventId,
      title: '',
      createdAtMs: Infinity,
      firstStartMs: Infinity,
      hasAvailability: false,
      hasBooking: false,
      isEmpty: false,
    };

    const createdAtMs = resolveDayColumnCreatedAtMs(event);
    if (createdAtMs != null) {
      existing.createdAtMs = Math.min(existing.createdAtMs, createdAtMs);
    }

    existing.firstStartMs = Math.min(existing.firstStartMs, event.start.getTime());
    existing.hasAvailability = existing.hasAvailability || event.isAvailabilityBlock === true;
    existing.hasBooking = existing.hasBooking || event.isAvailabilityBlock !== true;

    const title = resolveDayColumnTitle(event);
    if (title && (!existing.title || event.isAvailabilityBlock)) {
      existing.title = title;
    }

    columns.set(eventId, existing);
  });

  const sortedColumns = Array.from(columns.values()).sort((left, right) => {
    const leftCreatedAt = Number.isFinite(left.createdAtMs) ? left.createdAtMs : null;
    const rightCreatedAt = Number.isFinite(right.createdAtMs) ? right.createdAtMs : null;
    if (leftCreatedAt != null && rightCreatedAt != null && leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }
    if (leftCreatedAt != null && rightCreatedAt == null) return -1;
    if (leftCreatedAt == null && rightCreatedAt != null) return 1;

    const leftStart = Number.isFinite(left.firstStartMs) ? left.firstStartMs : 0;
    const rightStart = Number.isFinite(right.firstStartMs) ? right.firstStartMs : 0;
    if (leftStart !== rightStart) return leftStart - rightStart;

    const titleCompare = String(left.title || '').localeCompare(String(right.title || ''), locale.value);
    if (titleCompare !== 0) return titleCompare;

    return String(left.eventId).localeCompare(String(right.eventId));
  });

  return sortedColumns.length > 0
    ? sortedColumns
    : [{
      eventId: `__empty_${formatLocalDateKey(day) || 'day'}__`,
      title: '',
      createdAtMs: 0,
      firstStartMs: 0,
      hasAvailability: false,
      hasBooking: false,
      isEmpty: true,
    }];
}

const eventColumnDays = computed(() => {
  if (!isEventColumnMode.value) return [];
  return isWeekEventColumnMode.value ? weekDays.value : [selectedDay.value];
});

const eventColumnsByDay = computed(() => {
  if (!isEventColumnMode.value) return {};

  return eventColumnDays.value.reduce((acc, day) => {
    acc[formatLocalDateKey(day)] = buildEventColumnsForDay(day);
    return acc;
  }, {});
});

const eventColumnsForDay = (day) => (
  eventColumnsByDay.value[formatLocalDateKey(day)] || []
);

const dayEventColumns = computed(() => {
  if (!isDayEventColumnMode.value) return [];
  return eventColumnsForDay(selectedDay.value);
});

const weekEventDayGroups = computed(() => {
  if (!isWeekEventColumnMode.value) return [];

  return weekDays.value.map((day) => {
    const columns = eventColumnsForDay(day);
    const eventCount = columns.filter((column) => !column.isEmpty).length;
    const widthUnits = Math.max(eventCount, 1);

    return {
      day,
      dateKey: formatLocalDateKey(day),
      columns,
      isSelected: sameDay(day, selectedDay.value),
      widthUnits,
      baseWidthPercent: widthUnits * 8,
    };
  });
});

const weekEventTotalWidthUnits = computed(() => (
  weekEventDayGroups.value.reduce((total, group) => total + group.widthUnits, 0)
));

const weekEventTrackStyle = computed(() => {
  if (!isWeekEventColumnMode.value) return {};

  const trackWidthPercent = Math.max(100, weekEventTotalWidthUnits.value * 8);

  return {
    width: `${trackWidthPercent}%`,
    minWidth: `${trackWidthPercent}%`,
  };
});

const weekEventDayGroupStyle = (group = {}) => {
  const totalWidthUnits = Math.max(weekEventTotalWidthUnits.value, 1);
  const groupWidthPercent = (Math.max(Number(group.widthUnits) || 1, 1) / totalWidthUnits) * 100;

  return {
    flex: `0 0 ${groupWidthPercent}%`,
    width: `${groupWidthPercent}%`,
  };
};

const eventColumnsGridStyle = (columns = []) => ({
  gridTemplateColumns: `repeat(${Math.max(1, columns.length)}, minmax(0, 1fr))`,
});

const timeGridColumnStyle = computed(() => {
  if (isWeekEventColumnMode.value) return weekEventTrackStyle.value;
  if (!isDayEventColumnMode.value) return {};

  const count = Math.max(1, dayEventColumns.value.length);

  return {
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    width: '100%',
    minWidth: '0',
  };
});

const filteredBookedSlotsCount = computed(() => {
  const countedEventIds = new Set();

  normalized.value.forEach((event) => {
    if (event?.isDraftPreview) return;

    const eventId = resolveCountEventId(event);
    if (eventId) countedEventIds.add(eventId);
  });

  return countedEventIds.size;
});

const shortWeekdays = computed(() => [
  t("date_sun_short"),
  t("date_mon_short"),
  t("date_tue_short"),
  t("date_wed_short"),
  t("date_thu_short"),
  t("date_fri_short"),
  t("date_sat_short"),
]);

const title = computed(() => {
  if (isDayEventColumnMode.value) {
    return dayModeTitle.value;
  }

  const d = cursor.value;
  return d.toLocaleDateString(locale.value, { month: "long", year: "numeric" });
});

const currentMonth = computed(() => cursor.value.toLocaleDateString(locale.value, { month: "long" }));
const currentYear = computed(() => cursor.value.getFullYear());
const mobileCalendarTitle = computed(() => cursor.value.toLocaleDateString(locale.value, {
  month: "long",
  year: "numeric",
}).toUpperCase());

watch(() => props.focusDate, (v) => {
  if (!v) return;
  if (expandedDate.value && !sameDay(v, expandedDate.value)) {
    closeMonthDateOverlay();
  }
  cursor.value = new Date(v);
});
watch([isMobileDayEventColumnMode, selectedDayIso], () => {
  centerMobileDayStrip();
}, { flush: 'post' });
function formatTime(time) {
  const [hour, rest] = time.split(':');
  const period = rest.split(' ')[1]?.toLowerCase();
  const periodKey = period === 'pm' ? 'calendar_time_period_pm_short' : 'calendar_time_period_am_short';
  return `${hour}${t(periodKey)}`;
}

function formatMonthClock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale.value, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(/\s/g, '').toLowerCase();
}

function formatMonthEventTimeRange(event = {}) {
  const start = formatMonthClock(event.start);
  const end = formatMonthClock(event.end);
  return start && end ? `${start}-${end}` : start || end;
}

function monthEventAccent(event = {}) {
  if (event?.color) return event.color;
  if (event?.eventColorSkin) return event.eventColorSkin;
  if (event?.raw?.eventColorSkin) return event.raw.eventColorSkin;

  const eventType = String(event?.type || event?.eventType || event?.raw?.eventType || event?.raw?.type || '').toLowerCase();
  if (eventType.includes('group')) return '#E11D48';

  const callType = String(event?.eventCallType || event?.raw?.eventCallType || '').toLowerCase();
  if (callType.includes('audio')) return '#06B6D4';

  return '#5549FF';
}

function monthEventMeta(event = {}) {
  const raw = event?.raw && typeof event.raw === 'object' ? event.raw : {};
  const eventType = String(event?.type || event?.eventType || raw.eventType || raw.type || '').toLowerCase();
  if (eventType.includes('group')) return t('dashboard_group_event');
  const callType = String(event?.eventCallType || raw.eventCallType || '').toLowerCase();
  if (callType.includes('audio')) return t('dashboard_audio_call');
  return t('dashboard_video_call');
}

const eventStatusTranslationKeys = Object.freeze({
  active: 'dashboard_status_active',
  approved: 'calendar_event_status_confirmed',
  completed: 'calendar_event_status_completed',
  confirmed: 'calendar_event_status_confirmed',
  declined: 'calendar_event_status_declined',
  pending: 'calendar_event_status_pending',
  pending_hold: 'calendar_event_status_pending_hold',
  rejected: 'calendar_event_status_declined',
  canceled: 'calendar_event_status_cancelled',
  cancelled: 'calendar_event_status_cancelled',
});

function formatEventStatus(status) {
  const rawStatus = String(status || '').trim();
  const normalizedStatus = rawStatus.toLowerCase().replace(/[\s-]+/g, '_');
  const translationKey = eventStatusTranslationKeys[normalizedStatus];
  return translationKey ? t(translationKey) : rawStatus;
}

const sd = (d) => SOD(d);
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const shouldShowCurrentTimeForView = () => {
  const todayStart = SOD(new Date());
  if (isDayEventColumnMode.value) return sameDay(selectedDay.value, todayStart);
  if (isWeekEventColumnMode.value) return selectedWeekContainsToday.value;
  return sameDay(cursor.value, todayStart);
};
const isNowLabel = (label) => {
  const now = new Date();
  if (!shouldShowCurrentTimeForView()) return false;
  if (typeof label !== 'string') return false;
  const match = label.match(/^(\d{1,2}):(\d{2})\s?(am|pm)$/i);
  if (!match) return false;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toLowerCase();
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  const labelMinutes = h * 60 + m;
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= labelMinutes && cur < labelMinutes + props.slotMinutes;
};
const emitDate = (d) => { if (!d) return; emit('date-selected', new Date(d)); };
const emitFocusDate = (d) => {
  if (!d) return;
  const date = new Date(d);
  emit('date-selected', new Date(date));
  emit('update:focus-date', new Date(date));
};

const centerMobileDayStrip = ({ behavior = 'smooth' } = {}) => {
  nextTick(() => {
    if (!isMobileDayEventColumnMode.value) return;
    const container = mobileDayStripRef.value;
    if (!container) return;

    const selected = container.querySelector?.('[data-selected="true"]');
    if (!selected) return;

    const containerWidth = container.clientWidth;
    const itemLeft = selected.offsetLeft;
    const itemWidth = selected.offsetWidth || (containerWidth * 0.25);

    // Keep the selected date in the SECOND column (offset by 1 itemWidth from container left edge)
    const targetScrollLeft = Math.max(0, itemLeft - itemWidth);

    container.scrollTo({
      left: targetScrollLeft,
      behavior,
    });
  });
};

const syncWeekHorizontalScroll = (source) => {
  if (!isWeekEventColumnMode.value) return;

  const sourceEl = source === 'header' ? weekHeaderScrollRef.value : weekBodyScrollRef.value;
  const targetEl = source === 'header' ? weekBodyScrollRef.value : weekHeaderScrollRef.value;
  if (!sourceEl || !targetEl) return;

  const sourceMax = Math.max(0, sourceEl.scrollWidth - sourceEl.clientWidth);
  const targetMax = Math.max(0, targetEl.scrollWidth - targetEl.clientWidth);
  const ratio = sourceMax > 0 ? sourceEl.scrollLeft / sourceMax : 0;
  const targetLeft = targetMax > 0 ? ratio * targetMax : sourceEl.scrollLeft;

  // Ignore the matching scroll event generated by this assignment. Comparing
  // positions avoids a header/body feedback loop without dropping user input.
  if (Math.abs(targetEl.scrollLeft - targetLeft) > 0.5) {
    targetEl.scrollLeft = targetLeft;
  }
};

const revealSelectedWeekDay = ({ behavior = 'smooth' } = {}) => {
  nextTick(() => {
    if (!isWeekEventColumnMode.value || width.value < 1024) return;

    const scroller = weekHeaderScrollRef.value;
    const selected = scroller?.querySelector?.('[data-selected="true"]');
    if (!scroller || !selected) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    let delta = 0;

    if (selectedRect.left < scrollerRect.left) {
      delta = selectedRect.left - scrollerRect.left;
    } else if (selectedRect.right > scrollerRect.right) {
      delta = selectedRect.right - scrollerRect.right;
    }

    if (Math.abs(delta) < 1) return;

    const maxScrollLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const targetLeft = Math.max(0, Math.min(maxScrollLeft, scroller.scrollLeft + delta));
    if (Math.abs(targetLeft - scroller.scrollLeft) < 1) return;

    if (typeof scroller.scrollTo === 'function') {
      scroller.scrollTo({ left: targetLeft, behavior });
      return;
    }

    scroller.scrollLeft = targetLeft;
    syncWeekHorizontalScroll('header');
  });
};

const getWeekHorizontalScrollElement = (source) => (
  source === 'header' ? weekHeaderScrollRef.value : weekBodyScrollRef.value
);

const scrollWeekHorizontally = (source, delta) => {
  if (!isWeekEventColumnMode.value || !Number.isFinite(delta) || delta === 0) return false;

  const element = getWeekHorizontalScrollElement(source);
  if (!element) return false;

  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
  if (maxScrollLeft <= 1) return false;

  const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, element.scrollLeft + delta));
  if (Math.abs(nextScrollLeft - element.scrollLeft) < 0.5) return false;

  element.scrollLeft = nextScrollLeft;
  syncWeekHorizontalScroll(source);
  return true;
};

const handleWeekHorizontalWheel = (event, source) => {
  if (!isWeekEventColumnMode.value) return;

  // Horizontal trackpad gestures are handled natively for momentum and touch
  // physics. Translate only a vertical mouse-wheel gesture over the header.
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && scrollWeekHorizontally(source, event.deltaY)) {
    event.preventDefault();
  }
};

const handleWeekBodyWheel = (event) => {
  if (!isWeekEventColumnMode.value) return;
  if (!event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

  if (scrollWeekHorizontally('body', event.deltaY)) {
    event.preventDefault();
  }
};

const isWeekHeaderMouseDragging = computed(() => weekHeaderMouseDrag.value.dragging);

const beginWeekHeaderMouseDrag = (event) => {
  if (!isWeekEventColumnMode.value || event.button !== 0) return;

  const element = weekHeaderScrollRef.value;
  if (!element || element.scrollWidth - element.clientWidth <= 1) return;

  weekHeaderMouseDrag.value = {
    active: true,
    dragging: false,
    startX: event.clientX,
    startLeft: element.scrollLeft,
  };
  suppressWeekHeaderClick.value = false;
};

const moveWeekHeaderMouseDrag = (event) => {
  const drag = weekHeaderMouseDrag.value;
  if (!drag.active) return;

  const delta = drag.startX - event.clientX;
  if (!drag.dragging && Math.abs(delta) < 5) return;

  drag.dragging = true;
  suppressWeekHeaderClick.value = true;

  const element = weekHeaderScrollRef.value;
  if (!element) return;

  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
  element.scrollLeft = Math.max(0, Math.min(maxScrollLeft, drag.startLeft + delta));
  syncWeekHorizontalScroll('header');
  event.preventDefault();
};

const endWeekHeaderMouseDrag = () => {
  if (!weekHeaderMouseDrag.value.active) return;

  const dragged = weekHeaderMouseDrag.value.dragging;
  weekHeaderMouseDrag.value = {
    active: false,
    dragging: false,
    startX: 0,
    startLeft: 0,
  };

  if (dragged) {
    setTimeout(() => {
      suppressWeekHeaderClick.value = false;
    }, 0);
  }
};

const handleWeekHeaderClickCapture = (event) => {
  if (!suppressWeekHeaderClick.value) return;

  event.preventDefault();
  event.stopPropagation();
  suppressWeekHeaderClick.value = false;
};

const selectMobileDayDate = (date) => {
  if (!date) return;
  cursor.value = new Date(date);
  emitFocusDate(cursor.value);
  centerMobileDayStrip();
};

const selectWeekDate = (date) => {
  if (!date) return;
  cursor.value = new Date(date);
  emitFocusDate(cursor.value);
};

const selectTodayForMobileDay = () => {
  if (!isMobileDayEventColumnMode.value) return;

  const todayDate = SOD(new Date());
  if (!sameDay(cursor.value, todayDate)) {
    cursor.value = new Date(todayDate);
    emitFocusDate(cursor.value);
  }

  centerMobileDayStrip();
};

const dispatchEventClick = (event) => {
  // console.log('Event clicked:', event);
  // document.dispatchEvent(new CustomEvent('calendar:event-click', { detail: { event } }));
  selectedEvent.value = event;
  eventDetailsPopupOpen.value = true;
};

const openEventDetails = (event) => {
  if (!event || typeof event !== 'object') return;
  selectedEvent.value = event;
  eventDetailsPopupOpen.value = true;
};

const closeEventDetails = () => {
  eventDetailsPopupOpen.value = false;
};

const handleOpenChat = (payload) => {
  if (window.self !== window.top) {
    if (window.parent.chatEmbed && typeof window.parent.chatEmbed.openChat === 'function') {
      window.parent.chatEmbed.openChat(payload);
    } else {
      console.warn('chatEmbed is not available in embed mode');
    }
  } else {
    console.log('Open chat requested in normal mode:', payload);
  }
};

const handleApproveBooking = (payload) => {
  eventDetailsPopupOpen.value = false;
  emit('approve-booking', payload);
};

const handleAdjustBooking = (payload) => {
  eventDetailsPopupOpen.value = false;
  adjustBookingState.value = payload;
};

const handleAdjustSubmitted = async ({ item, booking }) => {
  const chatId = adjustBookingState.value?.chatId;
  const currentUserId = chatStore.currentUserId; 
  
  if (chatId && item) {
    const recipients = [booking.creatorId, booking.userId]
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));

    // Send original updated message to BOTH
    sendChatMessage(item, recipients);

    // Send Activity Log
    const logRes = await FlowHandler.run('chat.sendChatActivityLog', {
      chatId: chatId,
      senderId: currentUserId,
      text: 'Counter offer sent',
      meta: {
        is_booking_request: true,
        decision: 'counter_offer',
        bookingId: item.content?.booking_id,
      }
    });

    if (logRes?.ok) {
      sendChatMessage(logRes.data.item, recipients);
    }
  }

  adjustBookingState.value = null;
  emit('refresh-events');
};

const handleJoin = (payload) => {
  calendarPopupOpen.value = false;
  eventDetailsPopupOpen.value = false;
  emit('join-call', payload);
};

const handleReply = (payload) => {
  calendarPopupOpen.value = false;
  emit('reply-click', payload);
};

const handleMobileWidgetEventClick = (item) => {
  const event = item?.sourceEvent;
  if (!event || typeof event !== 'object') return;
  calendarPopupOpen.value = false;
  openEventDetails(event);
};

const handleMobileWidgetMenuAction = (payload) => {
  calendarPopupOpen.value = false;
  emit('menu-action', payload);
};

const handleMobileScheduleEdit = (event) => {
  calendarPopupOpen.value = false;
  emit('edit-schedule-event', event);
};

const handleMobileScheduleDelete = (event) => {
  calendarPopupOpen.value = false;
  emit('delete-schedule-event', event);
};

const handleMobileScheduleCardPreview = (event) => {
  calendarPopupOpen.value = false;
  emit('view-schedule-card', event);
};

const handleOpenNewEvents = () => {
  if (!canCreateEvents.value) return;
  newEventsPopupOpen.value = true;
};

const handleCreateEvent = (type) => {
  newEventsPopupOpen.value = false;
  calendarPopupOpen.value = false;
  emit('create-event', { type });
};

const handleRejectBooking = (payload) => {
  eventDetailsPopupOpen.value = false;
  emit('reject-booking', payload);
};

const handleCancelBooking = (payload) => {
  eventDetailsPopupOpen.value = false;
  emit('cancel-booking', payload);
};
const getEventMinutesForDay = (ev, day = null) => {
  const dayStart = day ? SOD(day) : SOD(ev.start);
  return {
    startMin: Math.floor((ev.start.getTime() - dayStart.getTime()) / (60 * 1000)),
    endMin: Math.ceil((ev.end.getTime() - dayStart.getTime()) / (60 * 1000)),
  };
};

const getVisualBounds = (ev, sMin, eMin, step, minHeightPx, day = null) => {
  const pixelsPerMinute = props.rowHeightPx / step;
  const { startMin, endMin } = getEventMinutesForDay(ev, day);
  const clippedStart = Math.max(startMin, sMin);
  const clippedEnd = Math.max(clippedStart, Math.min(endMin, eMin));
  
  if (clippedEnd <= clippedStart) {
    return { start: 0, end: 0, isValid: false };
  }
  
  const startPx = clippedStart * pixelsPerMinute;
  const durationPx = (clippedEnd - clippedStart) * pixelsPerMinute;
  const endPx = startPx + Math.max(minHeightPx || 20, durationPx);
  
  return { start: startPx, end: endPx, isValid: true };
};

const processedEventsByDay = computed(() => {
  const eventsByDay = {};
  bodyDays.value.forEach(d => {
    eventsByDay[SOD(d).getTime()] = [];
  });
  
  normalized.value.forEach(ev => {
    if (!ev || !ev.start || !ev.end) return;
    bodyDays.value.forEach(d => {
      const s = SOD(d);
      const e = addDays(s, 1);
      if (ev.start < e && ev.end > s) {
        eventsByDay[s.getTime()].push(ev);
      }
    });
  });

  const { sMin, eMin, step } = range.value;
  const minHeightPx = props.minEventHeightPx > 0 ? props.minEventHeightPx : 20;
  const processed = {};
  
  for (const [dayKeyStr, dayEvents] of Object.entries(eventsByDay)) {
    const dayKey = Number(dayKeyStr);
    const day = new Date(dayKey);
    const sorted = [...dayEvents].sort((a,b) => a.start - b.start || b.end - a.end);
    
    const stacked = [];
    sorted.forEach(ev => {
      const boundsEv = getVisualBounds(ev, sMin, eMin, step, minHeightPx, day);
      const stackGroup = isEventColumnMode.value ? (resolveDayColumnEventId(ev) || '__eventless__') : '__day__';
      let order = 0;
      
      if (!boundsEv.isValid) {
        stacked.push({...ev, stackOrder: 0, stackGroup});
        return;
      }

      while (true) {
        const overlappingInOrder = stacked.find(s => {
          if (s.stackOrder !== order) return false;
          if ((s.stackGroup || '__day__') !== stackGroup) return false;
          if (s.isAvailabilityBlock || ev.isAvailabilityBlock) return false;
          const boundsS = getVisualBounds(s, sMin, eMin, step, minHeightPx, day);
          if (!boundsS.isValid) return false;
          return boundsS.start < boundsEv.end && boundsS.end > boundsEv.start;
        });
        
        if (!overlappingInOrder) {
          stacked.push({...ev, stackOrder: order, stackGroup});
          break;
        }
        order++;
      }
    });
    processed[dayKey] = stacked;
  }
  
  return processed;
});

const gridMetrics = computed(() => {
  const rows = range.value.rowCount;
  const metrics = [];
  let currentOffset = 0;
  const { sMin, eMin, step } = range.value;
  const minHeightPx = props.minEventHeightPx > 0 ? props.minEventHeightPx : 20;
  const pixelsPerMinute = props.rowHeightPx / step;
  
  // Use a smaller stacking offset to reduce gaps between overlapping events (2px gap).
  const stackOffset = minHeightPx + 2;

  for (let i = 0; i < rows; i++) {
    let maxStackInRow = 0;
    let maxVisualEnd = props.rowHeightPx;

    for (const [dayKeyStr, dayEvents] of Object.entries(processedEventsByDay.value)) {
      const day = new Date(Number(dayKeyStr));
      for (const ev of dayEvents) {
        if (ev.isAvailabilityBlock) continue;
        
        const bounds = getVisualBounds(ev, sMin, eMin, step, minHeightPx, day);
        if (!bounds.isValid) continue;

        const rowStartMin = sMin + i * step;
        const rowEndMin = rowStartMin + step;
        const rowStartPx = rowStartMin * pixelsPerMinute;
        const rowEndPx = rowEndMin * pixelsPerMinute;

        if (bounds.start < rowEndPx && bounds.end > rowStartPx) {
          if (ev.stackOrder > maxStackInRow) {
            maxStackInRow = ev.stackOrder;
          }

          // If the event starts within this row, ensure the row expands to contain 
          // its full visual bottom (including shift and min-height offset).
          if (bounds.start >= rowStartPx && bounds.start < rowEndPx) {
            const relEnd = (bounds.end - rowStartPx) + ev.stackOrder * stackOffset;
            if (relEnd > maxVisualEnd) maxVisualEnd = relEnd;
          }
        }
      }
    }
    
    // Total row height is the max of traditional lane-based expansion or the furthest visual end of starting events.
    const height = Math.max(props.rowHeightPx + maxStackInRow * stackOffset, maxVisualEnd);
    metrics.push({ height, offset: currentOffset });
    currentOffset += height;
  }
  
  return { rows: metrics, totalHeight: currentOffset };
});

const eventsForDay = (day) => {
  const key = SOD(day).getTime();
  return processedEventsByDay.value[key] || [];
};

const monthBookingEventsForDay = (day) => eventsForDay(day).filter((event) => (
  event?.isAvailabilityBlock !== true && event?.slot !== 'availability'
));

const monthBookingVisibleCount = (day) => {
  const total = monthBookingEventsForDay(day).length;
  if (total === 0) return 0;

  const measured = monthBookingVisibleCounts.value[formatLocalDateKey(day)];
  return Math.max(1, Math.min(total, Number.isFinite(measured) ? measured : total));
};

const visibleMonthBookingEventsForDay = (day) => (
  monthBookingEventsForDay(day).slice(0, monthBookingVisibleCount(day))
);

const monthHiddenBookingCount = (day) => (
  Math.max(0, monthBookingEventsForDay(day).length - monthBookingVisibleCount(day))
);

const monthAvailabilityEventsForDay = (day) => {
  const seen = new Set();

  return eventsForDay(day).filter((event) => {
    if (event?.isAvailabilityBlock !== true && event?.slot !== 'availability') return false;

    const resourceKey = resolveDayColumnEventId(event)
      || event?.id
      || `${event?.title || ''}-${event?.start?.getTime?.() || event?.start || ''}`;
    if (seen.has(resourceKey)) return false;
    seen.add(resourceKey);
    return true;
  });
};

const monthAvailabilityVisibleCount = (day) => {
  const total = monthAvailabilityEventsForDay(day).length;
  if (total === 0) return 0;

  const measured = monthAvailabilityVisibleCounts.value[formatLocalDateKey(day)];
  return Math.max(1, Math.min(total, Number.isFinite(measured) ? measured : 1));
};

const visibleMonthAvailabilityEventsForDay = (day) => (
  monthAvailabilityEventsForDay(day).slice(0, monthAvailabilityVisibleCount(day))
);

const monthHiddenAvailabilityCount = (day) => (
  Math.max(0, monthAvailabilityEventsForDay(day).length - monthAvailabilityVisibleCount(day))
);

function setMonthObservedElement(collection, key, element) {
  const previous = collection.get(key);
  if (previous && previous !== element) {
    monthAvailabilityResizeObserver?.unobserve(previous);
  }

  if (!element) {
    collection.delete(key);
    return;
  }

  collection.set(key, element);
  monthAvailabilityResizeObserver?.observe(element);
  scheduleMonthAvailabilityLayout();
}

function setMonthCellRef(key, element) {
  setMonthObservedElement(monthCellRefs, key, element);
}

function setMonthBookingViewportRef(key, element) {
  setMonthObservedElement(monthBookingViewportRefs, key, element);
}

function setMonthBookingContentRef(key, element) {
  setMonthObservedElement(monthBookingContentRefs, key, element);
}

function recalculateMonthAvailabilityLayout() {
  if (effectiveView.value !== 'month' || typeof window === 'undefined') return;

  const nextAvailabilityCounts = { ...monthAvailabilityVisibleCounts.value };
  const nextBookingCounts = { ...monthBookingVisibleCounts.value };
  let availabilityChanged = false;
  let bookingChanged = false;

  monthCellRefs.forEach((cell, key) => {
    const day = days.value.find((candidate) => formatLocalDateKey(candidate) === key);
    if (!day) return;

    const bookingTotal = monthBookingEventsForDay(day).length;
    if (bookingTotal === 0) {
      if (key in nextBookingCounts) {
        delete nextBookingCounts[key];
        bookingChanged = true;
      }
    } else {
      const bookingViewportHeight = monthBookingViewportRefs.get(key)?.clientHeight || 0;
      const rowHeight = 22;
      const rowGap = 4;
      const fittingBookingRows = bookingViewportHeight > 0
        ? Math.floor((bookingViewportHeight + rowGap) / (rowHeight + rowGap))
        : bookingTotal;
      const visibleBookingCount = Math.max(1, Math.min(bookingTotal, fittingBookingRows));

      if (nextBookingCounts[key] !== visibleBookingCount) {
        nextBookingCounts[key] = visibleBookingCount;
        bookingChanged = true;
      }
    }

    const availabilityTotal = monthAvailabilityEventsForDay(day).length;
    if (availabilityTotal === 0) {
      if (key in nextAvailabilityCounts) {
        delete nextAvailabilityCounts[key];
        availabilityChanged = true;
      }
      return;
    }

    const cellStyle = window.getComputedStyle(cell);
    const paddingTop = Number.parseFloat(cellStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(cellStyle.paddingBottom) || 0;
    const dateLabel = cell.querySelector('[data-test="calendar-month-date-label"]');
    const dateLabelStyle = dateLabel ? window.getComputedStyle(dateLabel) : null;
    const dateLabelHeight = dateLabel
      ? dateLabel.offsetHeight + (Number.parseFloat(dateLabelStyle?.marginBottom) || 0)
      : 0;
    const estimatedBookingHeight = bookingTotal > 0
      ? bookingTotal * 22 + (bookingTotal - 1) * 4
      : 0;
    const bookingHeight = Math.max(
      estimatedBookingHeight,
      monthBookingContentRefs.get(key)?.scrollHeight || 0,
    );
    const availableHeight = Math.max(
      0,
      cell.clientHeight - paddingTop - paddingBottom - dateLabelHeight - bookingHeight,
    );
    const rowHeight = 22;
    const rowGap = 4;
    const fittingRows = Math.floor((availableHeight + rowGap) / (rowHeight + rowGap));
    const visibleCount = Math.max(1, Math.min(availabilityTotal, fittingRows));

    if (nextAvailabilityCounts[key] !== visibleCount) {
      nextAvailabilityCounts[key] = visibleCount;
      availabilityChanged = true;
    }
  });

  if (bookingChanged) {
    monthBookingVisibleCounts.value = nextBookingCounts;
  }
  if (availabilityChanged) {
    monthAvailabilityVisibleCounts.value = nextAvailabilityCounts;
  }
}

function scheduleMonthAvailabilityLayout() {
  if (typeof window === 'undefined') return;

  if (monthAvailabilityLayoutFrame != null && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(monthAvailabilityLayoutFrame);
  }

  if (typeof window.requestAnimationFrame === 'function') {
    monthAvailabilityLayoutFrame = window.requestAnimationFrame(() => {
      monthAvailabilityLayoutFrame = null;
      recalculateMonthAvailabilityLayout();
    });
    return;
  }

  nextTick(recalculateMonthAvailabilityLayout);
}

async function positionMonthDateOverlay(day = expandedDate.value) {
  if (!day || width.value < 1024 || effectiveView.value !== 'month') return;

  await nextTick();
  if (!expandedDate.value || !sameDay(day, expandedDate.value)) return;

  const root = monthViewRef.value;
  const cell = monthCellRefs.get(formatLocalDateKey(day));
  if (!root || !cell) return;

  const rootRect = root.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const viewportWidth = root.clientWidth || rootRect.width || 700;
  const viewportHeight = root.clientHeight || rootRect.height || 560;
  const cellWidth = cellRect.width || viewportWidth / 7;
  const cellHeight = cellRect.height || viewportHeight / Math.max(1, monthRows.value.length);
  const widthPx = Math.min(Math.max(cellWidth * 1.539, 194.4), Math.max(194.4, viewportWidth - 16));
  const maxHeightPx = Math.max(160, viewportHeight - 16);
  const contentHeightPx = 52 + expandedMonthEventCount.value * 26;
  const heightPx = Math.min(
    maxHeightPx,
    Math.max(cellHeight, 104, contentHeightPx),
  );
  const visibleLeft = (root.scrollLeft || 0) + 8;
  const visibleTop = (root.scrollTop || 0) + 8;
  const maxLeft = Math.max(visibleLeft, visibleLeft + viewportWidth - widthPx - 16);
  const maxTop = Math.max(visibleTop, visibleTop + viewportHeight - heightPx - 16);
  const naturalLeft = cellRect.left - rootRect.left + (root.scrollLeft || 0);
  const naturalTop = cellRect.top - rootRect.top + (root.scrollTop || 0);

  monthOverlayStyle.value = {
    left: `${Math.min(maxLeft, Math.max(visibleLeft, naturalLeft))}px`,
    top: `${Math.min(maxTop, Math.max(visibleTop, naturalTop))}px`,
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    maxHeight: `${maxHeightPx}px`,
  };
}

function handleMonthOverlayOutsideClick(event) {
  if (width.value < 1024 || !expandedDate.value) return;
  const target = event.target;
  if (monthOverlayRef.value?.contains(target)) return;
  if (target?.closest?.('[data-date]')) return;
  closeMonthDateOverlay();
}

function handleMonthOverlayKeydown(event) {
  if (event.key === 'Escape' && width.value >= 1024 && expandedDate.value) {
    closeMonthDateOverlay();
  }
}

watch([effectiveView, processedEventsByDay], () => {
  nextTick(scheduleMonthAvailabilityLayout);
}, { flush: 'post' });

watch(expandedMonthEventCount, () => {
  if (expandedDate.value && width.value >= 1024) {
    positionMonthDateOverlay();
  }
});

const eventsForBodyDay = (day) => {
  return eventsForDay(day);
};

const eventsForEventColumn = (column, day = selectedDay.value) => {
  if (!column || column.isEmpty) return [];

  return eventsForDay(day).filter((event) => (
    resolveDayColumnEventId(event) === column.eventId
  ));
};

const minuteToGridOffset = (minute) => {
  const { sMin, step } = range.value;
  const rows = gridMetrics.value.rows;
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  const rowFloat = (minute - sMin) / step;
  const rowIndex = Math.max(0, Math.min(rows.length - 1, Math.floor(rowFloat)));
  const rowMetric = rows[rowIndex];
  if (!rowMetric) return 0;

  const fraction = Math.max(0, Math.min(1, rowFloat - rowIndex));
  return rowMetric.offset + fraction * rowMetric.height;
};

const styleBlock = (ev, day = null) => {
  const { sMin, eMin, step } = range.value;
  const { startMin, endMin } = getEventMinutesForDay(ev, day);
  const clippedStart = Math.max(startMin, sMin);
  const clippedEnd = Math.min(endMin, eMin);
  if (clippedEnd <= clippedStart) return 'display:none';

  const baseTopPx = minuteToGridOffset(clippedStart);
  let topPx = baseTopPx;
  const endPx = minuteToGridOffset(clippedEnd);
  const minHeightPx = props.minEventHeightPx > 0 ? props.minEventHeightPx : 20;
  const stackOffset = minHeightPx + 2;

  if (ev.stackOrder) {
     topPx += ev.stackOrder * stackOffset;
  }

  let heightPx = endPx - baseTopPx;
  heightPx = Math.max(props.minEventHeightPx, heightPx);

  return `top:${topPx}px;height:${heightPx}px;left:2px;right:2px;`;
};

const currentMinute = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const showNowLine = computed(() => {
  void nowY.value;
  if (!isEventColumnMode.value) return false;
  if (!shouldShowCurrentTimeForView()) return false;

  const { sMin, eMin } = range.value;
  const minute = currentMinute();
  return minute >= sMin && minute <= eMin;
});

const nowLineTopPx = computed(() => {
  void nowY.value;
  const { sMin, eMin } = range.value;
  const minute = Math.min(eMin, Math.max(sMin, currentMinute()));
  return minuteToGridOffset(minute);
});

const setView = (v) => {
  closeMonthDateOverlay();
  const previousView = view.value;
  view.value = v;
  emit('view-changed', v);
  if (v === 'day') {
    selectTodayForMobileDay();
  } else if (v === 'week' && previousView === 'day') {
    revealSelectedWeekDay();
  }
};

const ensureMobileEventDayView = () => {
  if (width.value >= 1024 || props.variant !== 'default' || props.dayColumnMode !== 'events') return false;
  if (view.value === 'day') return false;

  setView('day');
  return true;
};

const shift = (n) => {
  closeMonthDateOverlay();
  const v = effectiveView.value;
  if (v === 'month') {
    cursor.value = addMonths(cursor.value, n);
  } else if (v === 'week') {
    cursor.value = addDays(cursor.value, n * 7);
  } else {
    // day view
    cursor.value = addDays(cursor.value, n);
  }
  // NEW: Emit the updated date so Mini Calendar can sync
  emit('date-selected', new Date(cursor.value));
};

const goToday = () => {
  closeMonthDateOverlay();
  const shouldRevealTodayInWeek = isWeekEventColumnMode.value;
  cursor.value = new Date();
  emit('date-selected', new Date(cursor.value)); // Sync on Today click
  if (shouldRevealTodayInWeek) {
    revealSelectedWeekDay();
  }
};
const updateNowLine = () => {
  const { sMin, eMin } = range.value;
  const now = new Date();
  currentTimeMs.value = now.getTime();
  if (!sameDay(cursor.value, SOD(now))) { nowY.value = 0; return; }
  const cur = now.getHours() * 60 + now.getMinutes();
  const pct = ((cur - sMin) / Math.max(1, (eMin - sMin))) * 100;
  nowY.value = Math.min(100, Math.max(0, pct));
};
const handleResize = () => {
  const previousWidth = width.value;
  width.value = window.innerWidth;
  const enteredMobile = previousWidth >= 1024 && width.value < 1024;

  if ((previousWidth < 1024) !== (width.value < 1024)) {
    closeMonthDateOverlay();
  } else if (width.value >= 1024 && expandedDate.value) {
    positionMonthDateOverlay();
  }

  if (enteredMobile) {
    ensureMobileEventDayView();
  }
};

// Toggle function
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const toggleViewSelector = () => {
  isViewSelectorOpen.value = !isViewSelectorOpen.value;
};

// Close dropdown if clicked outside
const handleClickOutside = (event) => {
  if (width.value >= 1024) {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isDropdownOpen.value = false;
    isViewSelectorOpen.value = false;
  }
  }
};
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('click', handleMonthOverlayOutsideClick);
  document.addEventListener('keydown', handleMonthOverlayKeydown);
  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', moveWeekHeaderMouseDrag);
  window.addEventListener('mouseup', endWeekHeaderMouseDrag);
  if (typeof window.ResizeObserver === 'function') {
    monthAvailabilityResizeObserver = new window.ResizeObserver(scheduleMonthAvailabilityLayout);
    monthCellRefs.forEach((element) => monthAvailabilityResizeObserver.observe(element));
    monthBookingViewportRefs.forEach((element) => monthAvailabilityResizeObserver.observe(element));
    monthBookingContentRefs.forEach((element) => monthAvailabilityResizeObserver.observe(element));
  }
  nowTimer.value = setInterval(updateNowLine, 60000);
  updateNowLine();
  if (!ensureMobileEventDayView()) {
    selectTodayForMobileDay();
  }
  scheduleMonthAvailabilityLayout();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', moveWeekHeaderMouseDrag);
  window.removeEventListener('mouseup', endWeekHeaderMouseDrag);
  monthAvailabilityResizeObserver?.disconnect();
  monthAvailabilityResizeObserver = null;
  if (monthAvailabilityLayoutFrame != null && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(monthAvailabilityLayoutFrame);
    monthAvailabilityLayoutFrame = null;
  }
  clearInterval(nowTimer.value);
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('click', handleMonthOverlayOutsideClick);
  document.removeEventListener('keydown', handleMonthOverlayKeydown);
});

watch(
  () => dropdownFilters.value.showSchedule,
  (value) => {
    if (showSchedule.value !== value) {
      showSchedule.value = value;
    }
  },
);

watch(showSchedule, (value) => {
  if (dropdownFilters.value.showSchedule !== value) {
    dropdownFilters.value = {
      ...dropdownFilters.value,
      showSchedule: value,
    };
  }
});

const resetElementScroll = (element) => {
  if (!element) return;
  if (typeof element.scrollTo === 'function') {
    element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return;
  }
  element.scrollTop = 0;
  element.scrollLeft = 0;
};

const resetScrollToTop = () => {
  resetElementScroll(calendarRootRef.value);
  resetElementScroll(timeGridBodyRef.value);
  resetElementScroll(timeGridScrollRef.value);
  resetElementScroll(weekHeaderScrollRef.value);
  resetElementScroll(weekBodyScrollRef.value);
  calendarRootRef.value?.querySelectorAll?.('[data-cal-scroll]').forEach(resetElementScroll);
};

const scrollToCurrentTime = async ({ behavior = 'smooth' } = {}) => {
  await nextTick();

  const element = timeGridScrollRef.value;
  if (!element || !showNowLine.value) return false;

  const viewportHeight = element.clientHeight || 0;
  const maxScrollTop = Math.max(0, element.scrollHeight - viewportHeight);
  const targetTop = Math.max(
    0,
    Math.min(maxScrollTop, nowLineTopPx.value - viewportHeight * 0.4),
  );

  if (typeof element.scrollTo === 'function') {
    element.scrollTo({
      top: targetTop,
      left: element.scrollLeft || 0,
      behavior,
    });
  } else {
    element.scrollTop = targetTop;
  }

  return true;
};

defineExpose({
  openEventDetails,
  closeEventDetails,
  resetScrollToTop,
  scrollToCurrentTime,
  revealSelectedWeekDay,
  recalculateMonthAvailabilityLayout,
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.month-date-overlay {
  animation: month-overlay-expand 140ms ease-out;
  transform-origin: top left;
}

.month-date-overlay :deep([data-test="dashboard-month-booking-marker"]) {
  display: flex;
  height: 1.375rem;
  min-height: 1.375rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  border-radius: 0.25rem;
  padding: 0 0.25rem;
}

.month-date-overlay :deep([data-test="dashboard-month-booking-marker"] > :first-child) {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.month-date-overlay :deep([data-test="dashboard-calendar-booking-title"]) {
  flex: 1 1 auto;
}

.month-date-overlay :deep([data-test="dashboard-calendar-booking-time"]) {
  min-width: max-content;
  flex: 0 0 auto;
  overflow: visible;
  white-space: nowrap;
}

.month-date-overlay :deep([data-test="dashboard-calendar-booking-time"] > :last-child) {
  min-width: max-content;
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}
@keyframes blink-border-blue {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(7, 244, 104, 0);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(85, 73, 255, 0.25);
  }
}
.blink-border-blue-effect {
  animation: blink-border-blue 1.5s ease-in-out infinite;
}

@keyframes month-overlay-expand {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .month-date-overlay {
    animation: none;
  }
}
</style>

<style>
/* Mobile Bottom Sheet for Event Details (Teleported to body) */
@media (max-width: 767px) {
  .mobile-event-details-sheet {
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    transform: translateY(0) !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    border-radius: 1.5rem 1.5rem 0 0 !important;
  }
}
</style>
