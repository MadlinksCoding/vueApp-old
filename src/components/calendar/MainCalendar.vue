<template>
  <section ref="calendarRootRef" :class="theme.main.wrapper" v-bind="dataAttrs" :data-view="effectiveView"
    :data-focus="cursor ? cursor.toISOString().slice(0, 10) : ''">

    <!-- default-header-theme-1 -->
    <div v-if="variant === 'default'" class="flex items-center flex-col gap-4 sticky top-0 z-30 py-0 px-1 md:px-0 md:pl-0">
      <div class="w-full flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="font-bold w-[9rem] uppercase" :class="theme.main.title">{{ title }}</div>
          <!-- mobile-view-start-->
          <div class="cursor-pointer flex lg:hidden" @click="toggleMobileCalendar">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.00024 12L16.0002 20L24.0002 12" stroke="#667085" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>

          </div>

          <div v-if="isMobileCalendarOpen" ref="mobileCalendarRef"
            class="absolute top-12 left-0 z-[100] w-full lg:hidden rounded-bl-[0.75rem] rounded-br-[0.75rem] overflow-hidden">
            <div
              class="p-2 bg-white/80 backdrop-blur-[0.625rem] rounded-br-xl rounded-bl-xl md:rounded-xl shadow-[0px_5px_5px_0px_rgba(0,0,0,0.10)]">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2 cursor-pointer" @click="isDatePopupOpen = true">
                  <div class="text-gray-900 text-base font-medium uppercase">{{ currentMonth }}</div>
                  <svg width="15" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.00024 12L16.0002 20L24.0002 12" stroke="#667085" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>
                  <div class="text-gray-900 text-base font-medium uppercase">{{ currentYear }}</div>
                  <svg width="15" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.00024 12L16.0002 20L24.0002 12" stroke="#667085" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>
                </div>

                <span class="flex items-center justify-between gap-4">
                  <button class="w-[0.375rem] h-[0.75rem] flex items-center justify-center" @click="shift(-1)" data-main-prev>
                    <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.9995L1 8.99951L9 0.999512" stroke="#FF0066" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button class="w-[0.375rem] h-[0.75rem] flex items-center justify-center" @click="shift(1)" data-main-next>
                    <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 16.9995L9 8.99951L1 0.999512" stroke="#FF0066" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                  </button>
                </span>
              </div>
              <MiniCalendar class="w-full" :month-date="cursor" :selected-date="focusDate" :events="events" :theme="{
                ...theme,
                mini: {
                  wrapper: 'flex flex-col w-full font-medium text-gray-500 mt-[0.625rem] gap-[0.625rem] rounded-xl w-[20.375rem]',
                  header: 'font-semibold',
                  // CHANGE 1: 'hover:bg-slate-50' yahan se HATA diya hai.
                  // CHANGE 2: 'focus:ring-inset' ADD kiya hai taake outline andar bane aur cut na ho.
                  dayBase: 'w-[2.339rem] h-[2.313rem] rounded-full flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500',
                  outside: 'opacity-0',
                  expired: 'opacity-100',
                  today: 'bg-[#FF0066] font-semibold text-white',
                  selected: 'rounded-full',
                  dot: 'mt-[2rem] w-1.5 h-1.5 rounded-full absolute'
                }
              }" @date-selected="(d) => { emitDate(d); isMobileCalendarOpen = false; }">
              </MiniCalendar>
            </div>
          </div>
          <!-- mobile-view-end-->


          <button
            class="px-[1.5rem] hidden xl:flex justify-center items-center py-[0.25rem] h-[3rem] rounded-[2rem] border border-pink-400 hover:bg-slate-50"
            @click="goToday" data-main-today>
            <p class="font-medium text-sm text-pink-500">{{ t("common_today") }}</p>
          </button>
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
          <div class="px-2 hidden ipad-portrait:hidden lg:flex items-center gap-2">
            <CheckboxGroup label="SHOW LEGEND" v-model="showLegend"
              checkboxClass="appearance-none bg-white border border-[#D0D5DD] rounded-[0.25rem] w-4 min-w-4 h-4 checked:bg-[#FF0066] checked:border-[#FF0066] checked:relative checked:after:content-[''] checked:after:absolute checked:after:left-[0.3rem] checked:after:top-[0.15rem] checked:after:w-1 checked:after:h-2 checked:after:border checked:after:border-solid checked:after:border-t-0 checked:after:border-l-0 checked:after:border-white checked:after:border-b-2 checked:after:border-r-2 checked:after:rotate-45 checked:after:box-border cursor-pointer"
              labelClass="text-xs font-semibold leading-normal tracking-[0.0175rem] text-slate-700 cursor-pointer uppercase mt-[0.125rem]"
              wrapperClass="flex items-center" />
          </div>
          <div class="relative inline-block text-left hidden xl:flex">

            <div @click="toggleDropdown"
              :class="isDropdownOpen ? 'bg-[#000]' : 'bg-gradient-to-l from-pink-500/20 to-pink-500/10'"
              class="w-[11.25rem] px-[1.5rem] py-[0.5rem] rounded-[3rem] flex items-center justify-between cursor-pointer select-none transition-all duration-300">
              <span class="flex items-center justify-center h-full py-2">
                <h2 class="text-[0.875rem] font-medium " :class="isDropdownOpen ? 'text-white' : 'text-black'">{{ t("dashboard_all_events") }}
                </h2>
                <p data-test="all-events-count" class="text-pink-500 text-[0.625rem] font-bold h-full ml-1">
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

            <div v-if="isDropdownOpen" class="absolute top-full right-0 mt-2 z-50 origin-top-left">
              <EventDropdownContent v-model="dropdownFilters" />
            </div>

          </div>

          <span
            class="xl:flex items-center hidden w-[14.375rem] rounded-[3rem] p-[0.25rem] bg-white/20 border border-pink-400/80">

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


          <!-- mobile-view-today-button -->
          <button
            class="px-6 flex xl:hidden justify-center items-center py-1 rounded-[2rem] border border-pink-400 hover:bg-slate-50"
            @click="goToday" data-main-today>
            <p class="font-medium text-sm text-pink-500">{{ t("common_today") }}</p>
          </button>
          <div class="cursor-pointer relative flex xl:hidden">
            <div @click="toggleDropdown">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.38589 5.66687C2.62955 4.82155 2.25138 4.39889 2.23712 4.03968C2.22473 3.72764 2.35882 3.42772 2.59963 3.22889C2.87684 3 3.44399 3 4.57828 3H19.4212C20.5555 3 21.1227 3 21.3999 3.22889C21.6407 3.42772 21.7748 3.72764 21.7624 4.03968C21.7481 4.39889 21.3699 4.82155 20.6136 5.66687L14.9074 12.0444C14.7566 12.2129 14.6812 12.2972 14.6275 12.3931C14.5798 12.4781 14.5448 12.5697 14.5236 12.6648C14.4997 12.7721 14.4997 12.8852 14.4997 13.1113V18.4584C14.4997 18.6539 14.4997 18.7517 14.4682 18.8363C14.4403 18.911 14.395 18.9779 14.336 19.0315C14.2692 19.0922 14.1784 19.1285 13.9969 19.2012L10.5969 20.5612C10.2293 20.7082 10.0455 20.7817 9.89802 20.751C9.76901 20.7242 9.6558 20.6476 9.583 20.5377C9.49975 20.4122 9.49975 20.2142 9.49975 19.8184V13.1113C9.49975 12.8852 9.49975 12.7721 9.47587 12.6648C9.45469 12.5697 9.41971 12.4781 9.37204 12.3931C9.31828 12.2972 9.2429 12.2129 9.09213 12.0444L3.38589 5.66687Z"
                  stroke="#667085" stroke-width="1.77778" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <div v-if="isDropdownOpen" class="absolute top-full right-5 mt-2 z-50 origin-top-left">
              <EventDropdownContent v-model="dropdownFilters" />
            </div>

          </div>
          <div class="cursor-pointer flex xl:hidden" @click="calendarPopupOpen = true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z"
                stroke="#667085" stroke-width="1.78" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

        </div>
      </div>

      <div v-show="showLegend" class="w-full hidden ipad-portrait:hidden lg:flex items-start gap-2 self-stretch rounded-[10px]">
        <!-- Event type -->
        <div class="flex flex-1 items-start justify-between rounded-[50px] bg-[rgba(251,91,162,0.10)] px-5 py-2">
          <span class="font-medium text-xs leading-[18px] text-[#F06] uppercase">EVENT TYPE</span>
          <div class="flex justify-end items-start gap-5">
            <!-- Item-1 -->
             <div class="flex items-center gap-2">
                <PhoneIcon />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D]">1 on 1 call</span>
             </div>
             <!-- Item-2 -->
             <div class="flex items-center gap-2">
                 <GroupCallIcon />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D]">Group call</span>
             </div>
             <!-- Item-3 -->
             <div class="flex items-center gap-2">
                <BookingScheduleIcon />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D]">Booking schedule</span>
             </div>
          </div>
        </div>
        <!-- /Event type -->
         <!-- Status -->
        <div class="flex flex-1 items-start justify-between rounded-[50px] bg-[rgba(251,91,162,0.10)] px-5 py-2">
          <span class="font-medium text-xs leading-[18px] text-[#F06] uppercase">Status</span>
          <div class="flex justify-end items-start gap-5">
            <!-- Item-1 -->
             <div class="flex items-center gap-2">
                <PendingStatus />
                <span class="font-medium text-xs leading-[18px] text-[#0C111D]">Pending</span>
             </div>
             <!-- Item-2 -->
             <div class="flex items-center gap-2">
                 <div class="w-[10px] h-[10px] rounded-full bg-[#07F468] flex items-center justify-center aspect-square"></div>
                <span class="font-medium text-xs leading-[18px] text-[#0C111D]">Confirmed</span>
             </div>
             <!-- Item-3 -->
             <div class="flex items-center gap-2">
                <div class="w-[10px] h-[10px] rounded-full bg-[#FF4405] flex items-center justify-center aspect-square"></div>
                <span class="font-medium text-xs leading-[18px] text-[#0C111D]">Declined/Canceled</span>
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


    <div ref="timeGridBodyRef" v-if="effectiveView !== 'month'" data-cal-time-grid class="h-full flex flex-col px-1 md:px-0 w-full h-full overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div class="flex" :class="[effectiveView === 'day' ? 'grid-cols-2' : 'grid-cols-8', theme.main.xHeader]">

        <div :class="theme.main.axisXLabel">
          <div v-if="variant === 'default'" class="lg:flex hidden justify-end items-center px-[0.25rem] gap-[0.125rem]">
            <span class="flex items-center justify-center w-[0.625rem] h-[0.625rem] flex-1 text-right">
              <svg width="6" height="5" viewBox="0 0 6 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.5 1.36523L3 3.86523L5.5 1.36523" stroke="#98A2B3" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </span>
            <p class="text-xs text-gray-400 font-medium leading-[1.125rem]">GMT +08</p>
          </div>
          <div v-else class="flex flex-col items-center justify-end pb-2">
            <span class="text-[0.625rem] font-bold text-slate-400">GMT+5</span>
          </div>
        </div>

        <div class="grid w-full" :class="[
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
        class="flex gap-2 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div class="flex flex-col">
          <div v-for="(t, idx) in range.labels" :key="'slot-label-' + t"
            :class="[theme.main.axisYRow, isNowLabel(t) ? ' !text-brand-textPink font-bold' : '']"
            :style="idx < gridMetrics.rows.length ? { height: gridMetrics.rows[idx].height + 'px' } : {}">
            {{ formatTime(t) }}
          </div>
        </div>

        <span class="grid w-full relative rounded-md overflow-hidden"
          :class="[effectiveView === 'day' ? 'grid-cols-3' : 'grid-cols-7']">
          <div v-for="(d, idx) in bodyDays" :key="'col-' + idx" :data-date="d.toISOString().slice(0, 10)"
            :data-expired="sd(d) < today ? 'true' : 'false'" :class="theme.main.colBase" @click.self="emitDate(d)">

            <div class="absolute z-[0] inset-0 pointer-events-none">
              <div v-for="(metric, i) in gridMetrics.rows" :key="'grid-' + i" :class="theme.main.gridRow" :style="{ height: metric.height + 'px' }"></div>
            </div>

            <div class="relative z-[0]" data-cal-scroll
              :style="{ height: gridMetrics.totalHeight + 'px', overflowY: 'auto' }">
              <template v-for="ev in eventsForBodyDay(d)" :key="ev.id||ev.title+ev.start">
                <slot v-if="ev.slot === 'availability'" name="event-availability" :event="ev" :day="d" :view="effectiveView"
                  :style="styleBlock(ev, d)" :onClick="dispatchEventClick"></slot>
                <slot v-if="ev.slot === 'alt'" name="event-alt" :event="ev" :day="d" :view="effectiveView"
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
        </span>
      </div>
    </div>

    <div v-if="effectiveView === 'month'" class="flex flex-col h-full">

      <div class="grid grid-cols-7 shrink-0 top-[4rem] sticky w-full backdrop-blur-md z-10">
        <div v-for="(w, index) in shortWeekdays" :key="w"
          class="text-center text-sm sm:text-lg font-semibold uppercase leading-7 mb-[0.625rem]"
          :class="index === 0 ? 'text-red-400' : 'text-gray-500'">
          {{ w }}
        </div>
      </div>

      <div class="flex-1 flex flex-col">

        <div v-for="(row, rowIndex) in monthRows" :key="'row-' + rowIndex" class="contents">

          <div class="grid grid-cols-7 flex-1">
            <button v-for="(d, i) in row" :key="'m-' + i" type="button" :data-date="d.toISOString().slice(0, 10)" @click="handleMonthDateClick(d)" :class="[
              theme.month.cellBase,
              d.getMonth() !== cursor.getMonth() ? theme.month.outside : '',
              (highlightTodayColumn && sameDay(d, today)) ? theme.month.today : '',
              d.getDay() === 0 ? 'text-red-400' : '',
              expandedDate && sameDay(d, expandedDate) ? 'bg-slate-50' : ''
            ]">
              <div class="text-sm mb-1" :class="d.getDay() === 0 ? 'text-red-400 font-semibold' : ''">
                {{ d.getDate() }}
              </div>

              <div class="space-y-1 w-full">
                <template v-for="ev in eventsForDay(d)" :key="ev.id || ev.title + ev.start">
                  <slot :name="resolveEventSlotName(ev)" :event="ev" :day="d" view="month"
                    :onClick="dispatchEventClick" />
                </template>
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
                      {{ event.status }}
                    </div>
                  </div>
                </button>
              </div>
            </slot>
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
        :event="selectedEvent"
        :user-role="props.userRole"
        :can-review-pending="props.canReviewPending"
        @join-call="handleJoin"
        @approve-booking="handleApproveBooking"
        @reject-booking="handleRejectBooking"
        @cancel-booking="handleCancelBooking"
      />
    </PopupHandler>

    <PopupHandler v-model="isDatePopupOpen" :config="datePopupConfig">
      <MobileDateSelector :current-date="cursor" @update:date="handleDateUpdate" @close="isDatePopupOpen = false" />
    </PopupHandler>


  </section>


</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
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
import MobileDateSelector from './MobileDateSelector.vue';
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

import MiniCalendar from './MiniCalendar.vue';

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
  minEventHeightPx: { type: Number, default: 0 }
});

const emit = defineEmits(['date-selected', 'update:focus-date', 'preview-schedule', 'join-call', 'reply-click', 'approve-booking', 'reject-booking', 'cancel-booking', 'menu-action', 'create-event', 'edit-schedule-event', 'delete-schedule-event']);
const { t, locale } = useBookingTranslations();
const today = ref(SOD(new Date()));
const width = ref(window.innerWidth);
const cursor = ref(new Date(props.focusDate));
const view = ref(props.initialView);
const calendarRootRef = ref(null);
const timeGridBodyRef = ref(null);
const nowTimer = ref(null);
const nowY = ref(0);
// State for dropdown
const isDropdownOpen = ref(false);
const dropdownContainer = ref(null);
const showSchedule = ref(true); // Checkbox state
const showLegend = ref(false);
const dropdownFilters = ref({
  video: true,
  audio: true,
  groupCall: true,
  showSchedule: true,
});
const calendarPopupOpen = ref(false);
const newEventsPopupOpen = ref(false);
const eventDetailsPopupOpen = ref(false);
const selectedEvent = ref({});
const isMobileCalendarOpen = ref(false);
const isDatePopupOpen = ref(false); // New state for Date Popup
const expandedDate = ref(null);
const mobileCalendarRef = ref(null);
const canCreateEvents = computed(() => props.userRole === 'creator');

const handleMobileCalendarClickOutside = (event) => {
  if (
    isMobileCalendarOpen.value &&
    mobileCalendarRef.value &&
    !mobileCalendarRef.value.contains(event.target) &&
    // Check if the click was on the toggle button itself (to avoid immediate re-opening)
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

const resolveEventSlotName = (event = {}) => {
  if (!event?.slot || event.slot === 'event') return 'event';
  return `event-${event.slot}`;
};

const handleMonthDateClick = (d) => {
  // Check if it's a large screen (lg breakpoint is usually 1024px)
  if (window.innerWidth >= 1024) return;

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
  width: { default: "24rem", "<500": "90%" },
  height: { default: "100%", "<768": "100%" },
  scrollable: true,
  closeSpeed: "250ms",
  closeEffect: "cubic-bezier(0.4, 0, 0.2, 1)",
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

const headerDays = computed(() => {
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
  if (effectiveView.value === 'day') {
    return [addDays(cursor.value, -1), cursor.value, addDays(cursor.value, 1)];
  }
  return days.value;
});

// CHANGE 4: Refined Normalized Logic for JSON Handling
// The .map function with `new Date(ev.start)` automatically handles ISO strings.
// Added a filter check to ensure ev.start/ev.end exist before processing to prevent crashes on bad JSON.
const normalized = computed(() => {
  let evs = props.events || [];

  if (props.variant === 'default') {
    evs = evs.filter((ev) => {
      const isAvailabilityBlock = ev?.isAvailabilityBlock === true;
      if (isAvailabilityBlock && !showSchedule.value) return false;

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
  const d = cursor.value;
  return d.toLocaleDateString(locale.value, { month: "long", year: "numeric" });
});

const currentMonth = computed(() => cursor.value.toLocaleDateString(locale.value, { month: "long" }));
const currentYear = computed(() => cursor.value.getFullYear());

watch(() => props.focusDate, (v) => { if (v) { cursor.value = new Date(v); } });

function formatTime(time) {
  const [hour, rest] = time.split(':');
  const period = rest.split(' ')[1];
  return `${hour}${period}`;
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

const sd = (d) => SOD(d);
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isNowLabel = (label) => {
  const now = new Date();
  if (!sameDay(cursor.value, SOD(now))) return false;
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

const handleApproveBooking = (payload) => {
  eventDetailsPopupOpen.value = false;
  emit('approve-booking', payload);
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
      let order = 0;
      
      if (!boundsEv.isValid) {
        stacked.push({...ev, stackOrder: 0});
        return;
      }

      while (true) {
        const overlappingInOrder = stacked.find(s => {
          if (s.stackOrder !== order) return false;
          if (s.isAvailabilityBlock || ev.isAvailabilityBlock) return false;
          const boundsS = getVisualBounds(s, sMin, eMin, step, minHeightPx, day);
          if (!boundsS.isValid) return false;
          return boundsS.start < boundsEv.end && boundsS.end > boundsEv.start;
        });
        
        if (!overlappingInOrder) {
          stacked.push({...ev, stackOrder: order});
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

const eventsForBodyDay = (day) => {
  return eventsForDay(day);
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
const setView = (v) => { view.value = v; };
const shift = (n) => {
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
  cursor.value = new Date();
  emit('date-selected', new Date(cursor.value)); // Sync on Today click
};
const updateNowLine = () => {
  const { sMin, eMin } = range.value;
  const now = new Date();
  if (!sameDay(cursor.value, SOD(now))) { nowY.value = 0; return; }
  const cur = now.getHours() * 60 + now.getMinutes();
  const pct = ((cur - sMin) / Math.max(1, (eMin - sMin))) * 100;
  nowY.value = Math.min(100, Math.max(0, pct));
};
const handleResize = () => { width.value = window.innerWidth; };

// Toggle function
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Close dropdown if clicked outside
const handleClickOutside = (event) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isDropdownOpen.value = false;
  }
};
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  nowTimer.value = setInterval(updateNowLine, 60000);
  updateNowLine();
});
// Resize listener taake agar koi window khuli rakh kar screen bari kare toh section band ho jaye
onMounted(() => {
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      expandedDate.value = null;
    }
  });
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  clearInterval(nowTimer.value);
});
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
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
  calendarRootRef.value?.querySelectorAll?.('[data-cal-scroll]').forEach(resetElementScroll);
};

defineExpose({
  openEventDetails,
  closeEventDetails,
  resetScrollToTop,
});
</script>
