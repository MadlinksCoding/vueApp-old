<template>
  <div>
    <h2>Publish & Sharing Settings</h2>

    <!-- Substep Tabs -->
    <!-- Tabs -->
    <div
      class="[scrollbar-width: none] border border-border-light flex-row items-stretch overflow-x-auto whitespace-nowrap rounded-[0.313rem] bg-secondary-bg hidden md:flex lg:flex xl:flex"
    >
      <button
        @click="uploader.goToSubstep('publishImmediately', { intent: 'user' })"
        :class="[
          'border-r flex flex-1 items-center px-4 py-2 justify-center gap-2 border-border-light cursor-pointer',
          uploader.substep === 'publishImmediately'
            ? 'bg-dark-text text-white'
            : '',
        ]"
      >
        Publish immediately after approval
      </button>

      <button
        @click="uploader.goToSubstep('schedulePublish', { intent: 'user' })"
        :class="[
          'border-r flex flex-1 items-center px-4 py-2 justify-center gap-2 border-border-light cursor-pointer',
          uploader.substep === 'schedulePublish'
            ? 'bg-dark-text text-white'
            : '',
        ]"
      >
        Schedule a publish time
      </button>
    </div>

    <!-- Substep: Publish Immediately -->
    <div v-if="uploader.substep === 'publishImmediately'">
      <div>Publish Immediately Content (Placeholder)</div>
    </div>

    <!-- Substep: Schedule Publish -->
    <div v-else-if="uploader.substep === 'schedulePublish'">
      <div>Schedule Publish Content (Placeholder)</div>
    </div>

    <div>
      <button @click="uploader.goToStep(3, { intent: 'user' })">Back</button>
      <br>
      <button @click="uploader.goToStep(5, { intent: 'user' })">Next</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "MediaUploaderStepPublishAndSharing",
  props: {
    uploader: {
      type: Object,
      required: true,
    },
  },
};
</script>
