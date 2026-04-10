<template>
    <div
        class="w-full md:w-[42.188rem] h-full overflow-y-auto flex flex-col bg-gray-200 shadow-[0_0_10px_0_rgba(0,0,0,0.25)] backdrop-blur-[50px]">

        <!-- Header -->
        <div class="self-stretch min-h-14 px-2 inline-flex justify-between items-center">
            <div class="justify-start text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">New Message</div>
            <button @click="emit('close')" class="relative">
                <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close"
                    class="w-3 h-3 filter brightness-0 cursor-pointer" />
            </button>
        </div>

        <!-- To / Search -->
        <div class="self-stretch h-12 inline-flex flex-col justify-start items-start gap-1.5">
            <div class="self-stretch flex-1 flex flex-col justify-start items-start gap-1.5">
                <div
                    class="self-stretch flex-1 px-3 py-2 bg-white/50 border-b-[1.50px] border-gray-900 inline-flex justify-start items-center gap-2 overflow-hidden">
                    <div class="flex-1 flex justify-start items-center gap-2">
                        <div
                            class="justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-6 line-clamp-1">
                            To</div>
                        <input v-model="searchQuery" type="text" placeholder="Search fans and models by username..."
                            class="w-full h-full bg-transparent border-none outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-6" />
                    </div>
                    <button v-if="searchQuery" @click="clearSearch" class="relative">
                        <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close"
                            class="w-2.5 h-2.5 cursor-pointer" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex-1 flex items-center justify-center py-12">
            <div class="text-gray-400 text-sm font-['Poppins']">Loading...</div>
        </div>

        <!-- Search results view -->
        <div v-else-if="searchQuery.length > 0"
            class="flex flex-col bg-[rgba(242,244,247,0.7)] flex-1 p-2 md:p-4 gap-2">

            <div v-if="searchLoading" class="flex items-center justify-center py-8">
                <div class="text-gray-400 text-sm font-['Poppins']">Searching...</div>
            </div>

            <template v-else-if="searchResults.length > 0">
                <div class="text-gray-500 text-xs font-medium font-['Poppins'] py-1">{{ searchResults.length }} results
                </div>
                <div v-for="user in searchResults" :key="user.id"
                    class="self-stretch px-1 inline-flex justify-between items-center">
                    <div class="flex justify-start items-center gap-2">
                        <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                            <img :src="user.avatar || SmilingPeachIcon"
                                class="w-[3.625rem] h-[3.625rem] object-cover" />
                        </div>
                        <div class="inline-flex flex-col justify-center items-start gap-1">
                            <div class="text-gray-900 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">{{
                                user.display_name }}</div>
                            <div class="text-gray-500 text-xs font-medium font-['Poppins'] leading-4">@{{ user.username
                                }}</div>
                        </div>
                    </div>
                    <button
                        @click="onMessage(user)"
                        class="min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                        <img :src="MessageCircleIconPink" alt="" class="w-4 h-4" />
                        <span class="text-center text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</span>
                    </button>
                </div>
            </template>

            <div v-else class="flex flex-col items-center justify-center py-12 gap-4">
                <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="no result" class="w-20 h-20 opacity-30" />
                <div class="text-gray-500 text-sm font-['Poppins'] text-center">No result under the keyword '{{
                    searchQuery }}'.
                </div>
            </div>

        </div>

        <!-- Default sections view -->
        <div v-else class="flex flex-col bg-[rgba(242,244,247,0.7)] shadow-[0_0_8px_0_rgba(0,0,0,0.10)]">
            <div class="flex p-2 md:p-4 flex-col gap-6">

                <!-- Missed Call Users -->
                <div v-if="data.missed_call_users && data.missed_call_users.length"
                    class="self-stretch inline-flex flex-col justify-start items-start gap-2">
                    <div class="self-stretch py-1 inline-flex justify-between items-center">
                        <div class="flex-1 text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">Missed Call
                            Users
                        </div>
                    </div>
                    <div class="self-stretch inline-flex justify-start items-start gap-2 flex-col md:flex-row">
                        <div v-for="user in data.missed_call_users" :key="user.id"
                            class="flex-1 flex justify-start items-start gap-2 w-full">
                            <div
                                class="flex-1 md:px-1 inline-flex md:flex-col justify-between md:justify-start items-center md:items-center gap-2">
                                <div class="self-stretch flex md:flex-col justify-center items-center gap-2 md:gap-1">
                                    <div class="inline-flex justify-start items-center">
                                        <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                            <img :src="user.avatar || SmilingPeachIcon" alt=""
                                                class="w-[3.625rem] h-[3.625rem] object-cover" />
                                        </div>
                                    </div>
                                    <div class="md:self-stretch flex flex-col justify-start items-center gap-1">
                                        <div class="self-stretch flex flex-col justify-center items-center gap-1">
                                            <div
                                                class="justify-center text-slate-700 text-base md:text-lg font-medium md:font-semibold font-['Poppins'] md:leading-5 line-clamp-2">
                                                {{ user.display_name }}</div>
                                        </div>
                                        <div
                                            class="self-stretch md:text-center text-gray-500 text-xs md:text-[10px] font-medium font-['Poppins'] leading-4">
                                            @{{ user.username }}</div>
                                    </div>
                                </div>
                                <button @click="onMessage(user)"
                                    class="w-36 min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer">
                                    <img :src="MessageCircleIconPink" alt="" class="w-4 h-4" />
                                    <span class="text-center text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Subscribers -->
                <div v-if="data.subscribers && data.subscribers.length" class="flex flex-col gap-6">
                    <div class="self-stretch inline-flex flex-col justify-start items-start gap-2">
                        <div class="self-stretch py-1 inline-flex justify-between items-center">
                            <div class="flex-1 text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">
                                Subscribers</div>
                        </div>
                        <div class="self-stretch flex-col md:flex-row inline-flex justify-start items-start gap-2">
                            <div v-for="tier in data.subscribers" :key="tier.tier_id"
                                class="inline-flex justify-start items-start gap-2 w-full md:w-auto">
                                <div
                                    class="flex-1 md:px-1 inline-flex md:flex-col justify-between md:justify-start items-center md:items-start gap-2">
                                    <div class="self-stretch flex md:flex-col justify-center items-center gap-1">
                                        <div class="inline-flex justify-start items-center">
                                            <div class="flex items-center">
                                                <div v-for="(sub, i) in tier.subscribers.slice(0, 3)" :key="sub.id"
                                                    class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]"
                                                    :class="i > 0 ? '-ml-8' : ''" :style="{ zIndex: 30 - i * 10 }">
                                                    <img :src="sub.avatar || SmilingPeachIcon"
                                                        class="w-12 h-12 md:w-[3.625rem] md:h-[3.625rem] object-cover" />
                                                </div>
                                            </div>
                                        </div>
                                        <div class="self-stretch flex flex-col justify-start items-center gap-1">
                                            <div
                                                class="self-stretch flex flex-col justify-center md:items-center gap-1">
                                                <div
                                                    class="text-slate-700 text-lg font-semibold font-['Poppins'] leading-7 line-clamp-2 flex items-center gap-1 md:gap-0">
                                                    {{ tier.tier_title }}
                                                    <span class="text-xs font-medium text-[#344054] md:hidden">({{
                                                        tier.subscriber_count }})</span>
                                                </div>
                                                <div
                                                    class="text-slate-700 text-xs font-medium font-['Poppins'] leading-4 hidden md:flex">
                                                    {{ tier.subscriber_count }} subscriber</div>
                                            </div>
                                            <div
                                                class="self-stretch text-center text-gray-500 text-[10px] font-medium font-['Poppins'] leading-4">
                                                {{ tier.subscriber_preview.join(', ') }}</div>
                                        </div>
                                    </div>
                                    <button @click="messageAll(tier.tier_title, 'subscribers_' + tier.tier_id, tier.tier_id)"
                                        :disabled="!!loadingGroupType"
                                        class="md:self-stretch min-w-14 px-2 py-1 bg-rose-600 inline-flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none opacity-30">
                                        <svg v-if="loadingGroupType === 'subscribers_' + tier.tier_id" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                        </svg>
                                        <img v-else :src="MessageCircleIcon" alt="" class="w-4 h-4" />
                                        <span class="text-center text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">
                                            {{ loadingGroupType === 'subscribers_' + tier.tier_id ? '...' : 'Message All' }}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Followers -->
                <div v-if="data.top_followers" class="flex flex-col gap-2">
                    <div class="self-stretch py-1 inline-flex justify-between items-center">
                        <div class="flex-1 text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">Top Followers
                        </div>
                        <button @click="messageAll('Top Followers', 'top_followers')"
                            :disabled="!!loadingGroupType"
                            class="min-w-14 px-2 py-1 bg-rose-600 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none opacity-30">
                            <svg v-if="loadingGroupType === 'top_followers'" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            <img v-else :src="MessageCircleIcon" alt="" class="w-4 h-4" />
                            <div class="h-4 flex justify-start items-center gap-1">
                                <span class="text-center text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">
                                    {{ loadingGroupType === 'top_followers' ? '...' : 'Message All' }}
                                </span>
                                <span v-if="loadingGroupType !== 'top_followers'" class="w-4 text-center text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">{{ data.top_followers.total }}</span>
                            </div>
                        </button>
                    </div>
                    <div class="flex flex-col gap-2 self-stretch">
                        <div v-for="user in topFollowersList" :key="user.id"
                            class="self-stretch px-1 inline-flex justify-between items-center">
                            <div class="flex justify-start items-center gap-2">
                                <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                    <img :src="user.avatar || SmilingPeachIcon"
                                        class="w-[3.625rem] h-[3.625rem] object-cover" />
                                </div>
                                <div class="inline-flex flex-col justify-center items-start gap-1">
                                    <div
                                        class="text-gray-900 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">
                                        {{
                                        user.display_name }}</div>
                                    <div class="text-gray-500 text-xs font-medium font-['Poppins'] leading-4">@{{
                                        user.username
                                        }}</div>
                                </div>
                            </div>
                            <button @click="onMessage(user)"
                                class="min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 flex justify-center items-center gap-2 cursor-pointer">
                                <img :src="MessageCircleIconPink" alt="" class="w-4 h-4" />
                                <span class="text-center text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</span>
                            </button>
                        </div>
                    </div>
                    <div v-if="data.top_followers.has_more || topFollowersPage > 1">
                        <button v-if="canLoadMoreTop" @click="loadMoreTopFollowers" :disabled="loadingMoreTop"
                            class="self-stretch text-center text-pink-500 text-xs font-bold font-['Poppins'] leading-4 w-full">
                            {{ loadingMoreTop ? 'Loading...' : 'View more' }}
                        </button>
                    </div>
                </div>

                <!-- Unsubscribed Users -->
                <div v-if="data.unsubscribed" class="flex flex-col gap-2">
                    <div class="self-stretch py-1 inline-flex justify-between items-center">
                        <div class="flex-1 text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">Unsubscribed
                            Users
                        </div>
                        <button @click="messageAll('Unsubscribed Users', 'unsubscribed')"
                            :disabled="!!loadingGroupType"
                            class="min-w-14 px-2 py-1 bg-rose-600 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none opacity-30">
                            <svg v-if="loadingGroupType === 'unsubscribed'" class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            <img v-else :src="MessageCircleIcon" alt="" class="w-4 h-4" />
                            <div class="h-4 flex justify-start items-center gap-1">
                                <span class="text-center text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">
                                    {{ loadingGroupType === 'unsubscribed' ? '...' : 'Message All' }}
                                </span>
                                <span v-if="loadingGroupType !== 'unsubscribed'" class="w-4 text-center text-white text-xs font-semibold font-['Poppins'] capitalize tracking-tight">{{ data.unsubscribed.total }}</span>
                            </div>
                        </button>
                    </div>
                    <div class="flex flex-col gap-2 self-stretch">
                        <div v-for="user in unsubscribedList" :key="user.id"
                            class="self-stretch px-1 inline-flex justify-between items-center">
                            <div class="flex justify-start items-center gap-2">
                                <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
                                    <img :src="user.avatar || SmilingPeachIcon"
                                        class="w-[3.625rem] h-[3.625rem] object-cover" />
                                </div>
                                <div class="inline-flex flex-col justify-center items-start gap-1">
                                    <div
                                        class="text-gray-900 text-base font-medium font-['Poppins'] leading-6 line-clamp-1">
                                        {{
                                        user.display_name }}</div>
                                    <div class="text-gray-500 text-xs font-medium font-['Poppins'] leading-4">@{{
                                        user.username
                                        }}</div>
                                </div>
                            </div>
                            <button @click="onMessage(user)"
                                class="min-w-14 px-2 py-1 outline outline-[1.50px] outline-offset-[-1.50px] outline-rose-600 flex justify-center items-center gap-2 cursor-pointer">
                                <img :src="MessageCircleIconPink" alt="" class="w-4 h-4" />
                                <span class="text-center text-rose-600 text-xs font-semibold font-['Poppins'] capitalize tracking-tight">Message</span>
                            </button>
                        </div>
                    </div>
                    <div v-if="data.unsubscribed.has_more || unsubscribedPage > 1">
                        <button v-if="canLoadMoreUnsub" @click="loadMoreUnsubscribed" :disabled="loadingMoreUnsub"
                            class="self-stretch text-center text-pink-500 text-xs font-bold font-['Poppins'] leading-4 w-full">
                            {{ loadingMoreUnsub ? 'Loading...' : 'View more' }}
                        </button>
                    </div>
                </div>

            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SmilingPeachIcon from '@/assets/images/icons/smiling-peach.png'
import MessageCircleIcon from '@/assets/images/icons/message-circle.webp'
import MessageCircleIconPink from '@/assets/images/icons/message-dots-circle.webp'
import { fetchNewMessageUsersFlow } from '@/services/chat/flows/fetchNewMessageUsersFlow.js'
import { fetchGroupUserIdsFlow } from '@/services/chat/flows/fetchGroupUserIdsFlow.js'

const props = defineProps({
    creatorId: { type: [String, Number], required: true },
    currentUserId: { type: [String, Number], default: null },
    visible: { type: Boolean, default: false },
})

const emit = defineEmits(['start-chat', 'close'])

// --- State ---
const loading = ref(false)
const data = ref({
    missed_call_users: [],
    subscribers: [],
    top_followers: null,
    unsubscribed: null,
})

const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)


const topFollowersPage = ref(1)
const topFollowersList = ref([])
const loadingMoreTop = ref(false)

const unsubscribedPage = ref(1)
const unsubscribedList = ref([])
const loadingMoreUnsub = ref(false)
const loadingGroupType = ref(null)

// --- Computed ---
const canLoadMoreTop = computed(() => {
    if (!data.value.top_followers) return false
    const loaded = topFollowersList.value.length
    return loaded < data.value.top_followers.total
})

const canLoadMoreUnsub = computed(() => {
    if (!data.value.unsubscribed) return false
    const loaded = unsubscribedList.value.length
    return loaded < data.value.unsubscribed.total
})

// --- Methods ---
async function fetchData() {
    loading.value = true
    try {
        const res = await fetchNewMessageUsersFlow({
            payload: { creatorId: props.creatorId },
            context: {},
            api: buildApi(),
        })
        if (res?.ok) {
            data.value = res.data
            topFollowersList.value = res.data.top_followers?.users || []
            unsubscribedList.value = res.data.unsubscribed?.users || []
        }
    } finally {
        loading.value = false
    }
}

let searchTimer = null
watch(searchQuery, (val) => {
    clearTimeout(searchTimer)
    if (!val) {
        searchResults.value = []
        return
    }
    searchLoading.value = true
    searchTimer = setTimeout(async () => {
        try {
            const res = await fetchNewMessageUsersFlow({
                payload: { creatorId: props.creatorId, search: val },
                context: {},
                api: buildApi(),
            })
            if (res?.ok) {
                searchResults.value = res.data.results || []
            }
        } finally {
            searchLoading.value = false
        }
    }, 300)
})

function clearSearch() {
    searchQuery.value = ''
    searchResults.value = []
}

async function loadMoreTopFollowers() {
    if (loadingMoreTop.value) return
    loadingMoreTop.value = true
    try {
        const nextPage = topFollowersPage.value + 1
        const res = await fetchNewMessageUsersFlow({
            payload: { creatorId: props.creatorId, section: 'top_followers', page: nextPage, perPage: 10 },
            context: {},
            api: buildApi(),
        })
        if (res?.ok) {
            topFollowersPage.value = nextPage
            topFollowersList.value = [...topFollowersList.value, ...(res.data.users || [])]
            data.value.top_followers = {
                ...data.value.top_followers,
                has_more: res.data.has_more,
                total: res.data.total,
            }
        }
    } finally {
        loadingMoreTop.value = false
    }
}

async function loadMoreUnsubscribed() {
    if (loadingMoreUnsub.value) return
    loadingMoreUnsub.value = true
    try {
        const nextPage = unsubscribedPage.value + 1
        const res = await fetchNewMessageUsersFlow({
            payload: { creatorId: props.creatorId, section: 'unsubscribed', page: nextPage, perPage: 10 },
            context: {},
            api: buildApi(),
        })
        if (res?.ok) {
            unsubscribedPage.value = nextPage
            unsubscribedList.value = [...unsubscribedList.value, ...(res.data.users || [])]
            data.value.unsubscribed = {
                ...data.value.unsubscribed,
                has_more: res.data.has_more,
                total: res.data.total,
            }
        }
    } finally {
        loadingMoreUnsub.value = false
    }
}

function onMessage(user) {
    emit('start-chat', {
        userId: user.id,
        displayName: user.display_name || user.username,
        username: user.username || '',
        avatar: user.avatar || null,
    })
}

async function messageAll(name, groupType, tierId = null) {
    if (loadingGroupType.value) return
    loadingGroupType.value = groupType
    try {
        const res = await fetchGroupUserIdsFlow({
            payload: { creatorId: props.creatorId, section: groupType.startsWith('subscribers_') ? 'subscribers' : groupType, tierId: tierId || undefined },
            context: {},
            api: buildApi(),
        })
        if (res?.ok) {
            emit('start-chat', {
                userIds: res.data.userIds.map(String),
                displayName: name,
                groupType,
            })
        }
    } finally {
        loadingGroupType.value = null
    }
}

// Minimal api adapter matching flow expectations
function buildApi() {
    return {
        async get(url, options = {}, extras = {}) {
            const params = options.params || {}
            const qs = new URLSearchParams(
                Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
            ).toString()
            const fullUrl = qs ? `${url}?${qs}` : url
            const resp = await fetch(fullUrl, {
                method: 'GET',
                headers: extras.headers || {},
                signal: extras.signal,
            })
            const json = await resp.json()
            if (!resp.ok) return { ok: false, error: json?.error || 'Request failed' }
            return json
        },
    }
}

watch(() => props.visible, (val) => {
    if (val) fetchData()
})
</script>
