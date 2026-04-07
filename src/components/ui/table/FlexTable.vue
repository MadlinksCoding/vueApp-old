<script setup>
/* eslint-disable no-console */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

/* PROPS */
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },

  theme: { type: Object, default: () => ({
    container: 'relative bg-white border border-zinc-200 rounded-lg shadow-sm ',
    header: 'bg-zinc-50 text-zinc-700',
    headerRow: 'flex items-center',
    headerCell: 'px-4 py-2 text-xs font-semibold uppercase tracking-wide',
    row: 'flex items-center odd:bg-white even:bg-zinc-50 hover:bg-zinc-100',
    cell: 'py-2 text-sm text-zinc-800',
    footer: 'p-3 text-center'
  })},
  themeMobile: { type: Object, default: () => ({
    container: 'relative bg-white border border-zinc-200 rounded-lg shadow-sm',
    card: 'rounded-lg border border-zinc-200 p-4 space-y-2',
    cardRow: 'flex items-start justify-between gap-3',
    cardLabel: 'text-xs text-zinc-500',
    cardValue: 'text-sm text-zinc-800',
    footer: 'p-3 text-center'
  })},

  innerScroll: { type: Boolean, default: false },
  stickyHeader: { type: Boolean, default: false },
  maxHeight: { type: String, default: '' },
  desktopBreakpoint: { type: String, default: 'md' },

  showMobile: { type: Boolean, default: false },
  mobileInnerScroll: { type: Boolean, default: false },
  mobileMaxHeight: { type: String, default: '' },

  infinite: { type: Boolean, default: false },
  revealButtonOnThreshold: { type: Boolean, default: false },
  alwaysShowLoadMore: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  threshold: { type: [String, Number], default: '100px' },
  useScrollEvents: { type: Boolean, default: true },

  variantForRow: { type: Function, default: null },
  rowAttrs: { type: Function, default: null },
  alignDefault: { type: String, default: 'left' },
  skeleton: { type: Boolean, default: false }
})

const emit = defineEmits(['load-more','row-click','row-context','cell-click'])

/* REFS & HELPERS */
const containerEl = ref(null)
const bodyEl = ref(null)
const mobileEl = ref(null)
const hasEl = (el) => !!(el && el instanceof Element)
const getVal = (row, key) => key ? row[key] : null

/* CLASSES */
const bp = computed(() => props.desktopBreakpoint || 'md')
const showDesktopClass = computed(() => `${bp.value}:block block`)
const showMobileClass  = computed(() => `${bp.value}:hidden block`)
const hasScrollArea = computed(() => props.innerScroll && !!props.maxHeight)
const bodyStyle = computed(() => (props.innerScroll && props.maxHeight) ? { maxHeight: props.maxHeight, overflowY: 'auto' } : {})
const mobileBodyStyle = computed(() => (props.mobileInnerScroll) ? { maxHeight: props.mobileMaxHeight || '70vh', overflowY: 'auto' } : {})

/* ✅ FIXED ALIGNMENT LOGIC (Supports sm, md, lg, xl & default) */
const alignClass = (a) => {
  // Helper to convert 'left/right/center' to tailwind class
  const getAlign = (dir) => dir === 'center' ? 'text-center' : dir === 'right' ? 'text-right' : 'text-left'

  // Case 1: Simple String ('center') -> apply on all screens
  if (typeof a === 'string') {
    return getAlign(a)
  }
  
  // Case 2: Object ({ default: 'left', sm: 'right' })
  if (typeof a === 'object' && a !== null) {
    let classes = []

    // 1. Base / Default (Mobile XS view)
    if (a.default || a.xs) {
      classes.push(getAlign(a.default || a.xs))
    } else {
      classes.push('text-left') // Fallback base style
    }

    // 2. Breakpoints (sm, md, lg, xl) 
    if (a.sm) classes.push(`sm:${getAlign(a.sm)}`)
    if (a.md) classes.push(`md:${getAlign(a.md)}`)
    if (a.lg) classes.push(`lg:${getAlign(a.lg)}`)
    if (a.xl) classes.push(`xl:${getAlign(a.xl)}`)

    return classes.join(' ')
  }
  
  return 'text-left' // Fallback
}

/* ✅ ✅ MAIN FIX: HIDDEN LOGIC */
const hiddenAtClasses = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return ''

  // Logic: If user says 'xs' (Mobile) to hide, then we apply 'hidden' class.
  // But 'hidden' class will hide everything, so we need to tell it when to show again.

  // Scenario 1: Hide on Mobile AND Tablet (xs, sm) -> Show on Desktop (md)
  if (arr.includes('xs') && arr.includes('sm')) {
    return 'hidden md:block' 
  }

  // Scenario 2: Hide ONLY on Mobile (xs) -> Show on Tablet (sm)
  if (arr.includes('xs')) {
    return 'hidden sm:block'
  }

  // Scenario 3: Hide on Tablet (sm) -> Show on Desktop (md)
  if (arr.includes('sm')) {
    return 'sm:hidden md:block'
  }

  // Standard fallback for lg, xl etc.
  return arr.map(bp => `${bp}:hidden`).join(' ')
}

// ... (Existing imports and props)

/* ✅ NEW: RESPONSIVE BASIS LOGIC */
const getBasisClass = (basis) => {
  // Case 1: If string (Old method), return it
  if (typeof basis === 'string') return basis;

  // Case 2: If Object ({ default: '...', md: '...' })
  if (typeof basis === 'object' && basis !== null) {
    let classes = [];
    
    // 1. Mobile / Default (xs se start hoga)
    if (basis.default) classes.push(basis.default);

    // 2. Breakpoints (sm, md, lg, xl)
    // Helper function taake agar user "basis-1/4" de toh hum "md:basis-1/4" bana dein
    const addPrefix = (bp, val) => val.includes(':') ? val : `${bp}:${val}`;

    if (basis.sm) classes.push(addPrefix('sm', basis.sm));
    if (basis.md) classes.push(addPrefix('md', basis.md));
    if (basis.lg) classes.push(addPrefix('lg', basis.lg));
    if (basis.xl) classes.push(addPrefix('xl', basis.xl));

    return classes.join(' ');
  }

  // Fallback agar kuch na ho
  return 'basis-1/3'; 
}

const colClass = (col) => [ 
  getBasisClass(col.basis),
  col.grow ? 'grow' : 'grow-0', 
  'shrink-0', 
  alignClass(col.align || props.alignDefault), 
  hiddenAtClasses(col.hiddenAt) 
].join(' ')


/* SCROLL LOGIC */
function toPx(raw, el) {
  try { const v = window.ScrollEvents?.toPixelThreshold?.(raw, el); if (typeof v === 'number') return v } catch (e) {}
  const n = Number(raw); return Number.isFinite(n) ? n : 100
}
const nearBottom = ref(false)
function checkWindowNearBottom() {
  if (!hasEl(containerEl.value)) return
  const rect = containerEl.value.getBoundingClientRect()
  const dist = rect.bottom - (window.innerHeight || document.documentElement.clientHeight)
  nearBottom.value = dist <= toPx(props.threshold, containerEl.value)
}
function maybeEmitLoad() { if (!props.loading && props.hasMore) emit('load-more') }

let seInner = null, seWindow = null, seMobile = null
function attachInner() {
    if (!props.innerScroll || !hasEl(bodyEl.value)) return
    const el = bodyEl.value
    const onScroll = () => {
        const d = el.scrollHeight - (el.scrollTop + el.clientHeight)
        if (props.revealButtonOnThreshold) nearBottom.value = d <= toPx(props.threshold, el)
        else if (props.infinite && d <= toPx(props.threshold, el)) maybeEmitLoad()
    }
    el.__ftScroll = onScroll; el.addEventListener('scroll', onScroll, { passive: true })
}
function detachInner() { const el = bodyEl.value; if(el?.__ftScroll) el.removeEventListener('scroll', el.__ftScroll) }

function attachMobile() {
    if (!props.mobileInnerScroll || !hasEl(mobileEl.value)) return
    const el = mobileEl.value
    const onScroll = () => {
        const d = el.scrollHeight - (el.scrollTop + el.clientHeight)
        if (props.revealButtonOnThreshold) nearBottom.value = d <= toPx(props.threshold, el)
        else if (props.infinite && d <= toPx(props.threshold, el)) maybeEmitLoad()
    }
    el.__ftMob = onScroll; el.addEventListener('scroll', onScroll, { passive: true })
}
function detachMobile() { const el = mobileEl.value; if(el?.__ftMob) el.removeEventListener('scroll', el.__ftMob) }

function attachWindow() {
    if (props.innerScroll || props.mobileInnerScroll) return
    const onWin = () => {
        checkWindowNearBottom()
        if (!props.revealButtonOnThreshold && props.infinite && nearBottom.value) maybeEmitLoad()
    }
    window.__ftWin = onWin; window.addEventListener('scroll', onWin, { passive: true }); onWin()
}
function detachWindow() { if (window.__ftWin) { window.removeEventListener('scroll', window.__ftWin); delete window.__ftWin } }

onMounted(async () => { await nextTick(); attachInner(); attachMobile(); attachWindow(); if (!props.innerScroll && !props.mobileInnerScroll && props.revealButtonOnThreshold) checkWindowNearBottom() })
onBeforeUnmount(() => { detachInner(); detachMobile(); detachWindow() })
watch(() => [props.infinite, props.threshold, props.innerScroll], async () => { detachInner(); detachMobile(); detachWindow(); await nextTick(); attachInner(); attachMobile(); attachWindow() })

function onRowClick(row) { emit('row-click', row) }
function onRowContext(e, row) { e?.preventDefault?.(); emit('row-context', row) }
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<template>
  <div ref="containerEl">
    <div :class="showDesktopClass">
      <div :class="theme.container">
        <div ref="bodyEl" class="scroll-smooth no-scrollbar" :style="bodyStyle">
          <div v-if="columns && columns.length" :class="[theme.header, theme.headerRow, (stickyHeader && hasScrollArea) ? 'sticky top-0 z-10' : '']">
            <template v-for="col in columns" :key="'h-'+col.key">
              <div :class="[theme.headerCell, colClass(col)]">
                <slot :name="'header.'+col.key" :col="col">{{ col.label }}</slot>
              </div>
            </template>
          </div>

          <template v-if="skeleton">
            <div 
              v-for="r in (rows.length > 0 ? rows.length : 8)" 
              :key="'skel-row-'+r" 
              class="w-full h-[4.5rem] bg-[#EBE3EB] dark:bg-[#322C32] animate-skeleton-loading mb-[2px] rounded-[1px]"
            ></div>
          </template>

          <template v-else-if="rows.length > 0">
            <template v-for="(row, rIdx) in rows" :key="row[rowKey] ?? rIdx">
              <div :class="[theme.row, 'w-full']" v-bind="rowAttrs ? rowAttrs(row, rIdx) : {}"
                   @click="onRowClick(row)" @contextmenu="onRowContext($event, row)">
                <template v-for="(col, cIdx) in columns" :key="(row[rowKey] ?? rIdx)+'-'+col.key">
                  <div :class="[theme.cell, colClass(col), 'overflow-hidden']" @click="$emit('cell-click', { row, col })">
                    <slot :name="'cell.'+col.key" :value="row[col.key]" :row="row" :col="col">
                      
                      <div v-if="col.type === 'rich-icon'" class="flex items-center p-0 h-full">
                         <div class="flex justify-center items-center h-[4.5rem] w-[3.5rem] md:w-[4.5rem] border-b md:border-b-0 border-zinc-100 shrink-0"
                              :style="{ backgroundColor: getVal(row, col.config?.bgKey) || '#f4f4f5' }">
                            <img v-if="col.config?.iconKey && getVal(row, col.config.iconKey)" :src="getVal(row, col.config.iconKey)" class="w-9 h-9 object-contain"/>
                         </div>
                         <div class="flex flex-col justify-center items-start flex-1 min-h-[4.5rem] p-2 md:p-3 overflow-hidden">
                            <span class="truncate text-xs font-semibold text-zinc-900 w-full dark:text-text">{{ row[col.key] }}</span>
                            <div class="flex items-center w-full mt-0.5">
                               <span class=" text-xs text-[#344054] dark:text-[#B6C2D8]">{{ getVal(row, col.config?.subtextKey) }}</span>
                               <span v-if="col.config?.mobileRightKey" class="md:hidden truncate text-xs text-[#667085] whitespace-nowrap ml-2">{{ getVal(row, col.config.mobileRightKey) }}</span>
                            </div>
                            <div v-if="col.config?.mobileBottomUserKey" class="md:hidden flex items-center gap-1.5 mt-1.5">
                                <img :src="getVal(row, col.config.mobileBottomUserKey)" class="w-4 h-4 rounded-full"/>
                                <span class="text-[10px] text-zinc-500 truncate">{{ getVal(row, col.config.mobileBottomUserTextKey) }}</span>
                            </div>
                         </div>
                      </div>

                      <div v-else-if="col.type === 'user'" class="flex items-center gap-[6px] p-2.5 h-full">
                         <img v-if="col.config?.avatarKey" :src="getVal(row, col.config.avatarKey)" class="w-5 h-5 rounded-full object-cover shrink-0" />
                         <span class="truncate text-xs text-zinc-600 dark:text-[#96959F]">{{ row[col.key] }}</span>
                      </div>

                      <div v-else-if="col.type === 'status'" class="flex items-center p-2.5 h-full">
                         <div class="flex items-center">
                            <!-- Status Icon -->
                            <span class="flex justify-center items-center h-6 w-6 shrink-0"
                                  :class="col.config?.styles?.[row[col.key]]?.iconBg || 'bg-gray-100'">
                               <svg v-if="col.config?.styles?.[row[col.key]]?.isCompleted" width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12.3333 1L4.99996 8.33333L1.66663 5" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                               </svg>
                               <svg v-else-if="col.config?.styles?.[row[col.key]]?.isCancelled" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M11 1L1 11M1 1L11 11" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                               </svg>
                               <img v-else-if="col.config?.styles?.[row[col.key]]?.iconSrc || col.config?.defaultIcon"
                                    :src="col.config?.styles?.[row[col.key]]?.iconSrc || col.config?.defaultIcon" 
                                    class="w-4 h-4 object-contain dark:[filter:invert(1)]"/>
                            </span>
                            <!-- Status Text -->
                            <span class="flex justify-center items-center text-[11px] font-semibold h-6 px-2 whitespace-nowrap"
                                  :class="col.config?.styles?.[row[col.key]]?.textClass || 'text-gray-800'">
                               {{ col.config?.styles?.[row[col.key]]?.label || row[col.key] }}
                            </span>
                         </div>
                      </div>

                      <div v-else class="p-2.5">{{ row[col.key] }}</div>
                    </slot>
                  </div>
                </template>
              </div>
            </template>
          </template>

          <template v-else>
            <div class="flex flex-col items-center justify-center w-full min-h-[300px] text-center p-6">
              <span class="text-zinc-500 dark:text-[#96959F] text-sm">
                <slot name="empty">You haven't received any orders yet</slot>
              </span>
            </div>
          </template>

          <div :class="theme.footer" v-if="alwaysShowLoadMore || loading || (hasMore && nearBottom)">
             <button v-if="hasMore" class="inline-flex items-center gap-2 border border-zinc-300 px-4 py-2 text-sm rounded hover:bg-zinc-50" :disabled="loading" @click="maybeEmitLoad">Load more</button>
             <div v-else class="text-xs text-zinc-500">No more rows</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showMobile" :class="showMobileClass">
       <div :class="themeMobile.container">

          <div class="p-2 space-y-3">
            
             <div v-for="(row, rIdx) in rows" :key="'m-'+rIdx" :class="themeMobile.card" @click="onRowClick(row)">
                <template v-for="(col, cIdx) in columns" :key="'m-col-'+cIdx">
                   <div v-if="!col.hiddenAt?.includes('xs')" :class="themeMobile.cardRow">
                      <span :class="themeMobile.cardLabel">{{ col.label }}</span>
                      <span :class="themeMobile.cardValue">{{ row[col.key] }}</span>
                   </div>
                </template>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>