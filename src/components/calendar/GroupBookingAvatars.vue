<template>
  <div class="inline-flex min-w-0 items-center gap-1.5" data-test="group-booking-fans">
    <span class="inline-flex -space-x-2">
      <img
        v-for="(fan, index) in visibleFans"
        :key="fan.userId || index"
        :src="fanAvatar(fan)"
        :alt="profiles[fan.userId]?.displayName || fan.name || t('common_fan')"
        class="relative h-5 w-5 shrink-0 rounded-full border border-white bg-white object-cover"
        :style="{ zIndex: 3 - index }"
        data-test="group-booking-fan-avatar"
      />
    </span>
    <span v-if="totalFans > 3" class="text-[0.6875rem] font-medium leading-[1.125rem] text-gray-500" data-test="group-booking-fan-count">+{{ totalFans - 3 }}</span>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { fetchBookingNoticeProfile } from '@/components/ui/card/event/bookingNoticeProfile.js';
import { resolveWpSiteBaseUrl } from '@/utils/wpApiBaseUrl.js';

const props = defineProps({ event: { type: Object, required: true } });
const { t } = useBookingTranslations();
const profiles = reactive({});
const DEFAULT_AVATAR = 'https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png';
const loading = new Set();
let disposed = false;

const rawEvent = computed(() => props.event?.sourceEvent?.raw || props.event?.raw || {});
const participants = computed(() => {
  const fans = rawEvent.value.participants;
  if (Array.isArray(fans) && fans.length) return fans;
  return Array.isArray(props.event.avatars) ? props.event.avatars : [];
});
const visibleFans = computed(() => participants.value.slice(0, 3));
const totalFans = computed(() => {
  const total = Number(props.event.participantCount ?? rawEvent.value.participantCount);
  return Number.isFinite(total) && total > 0 ? Math.floor(total) : participants.value.length;
});

function fanAvatar(fan) {
  const src = profiles[fan.userId]?.avatar || fan.avatarUrl || fan.src || DEFAULT_AVATAR;
  const siteUrl = resolveWpSiteBaseUrl();
  return src.startsWith('/') && !src.startsWith('//') && siteUrl ? `${siteUrl}${src}` : src;
}

watch(visibleFans, fans => {
  for (const fan of fans) {
    const userId = fan.userId;
    if (userId == null || userId === '' || userId in profiles || loading.has(userId)) continue;
    loading.add(userId);
    fetchBookingNoticeProfile(userId)
      .catch(() => null)
      .then(profile => { if (!disposed) profiles[userId] = profile; })
      .finally(() => loading.delete(userId));
  }
}, { immediate: true });

onBeforeUnmount(() => { disposed = true; });
</script>
