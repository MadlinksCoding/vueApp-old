<template>
  <div class="px-[24px] py-[14px]">
    <div
    @click="uploader.goToStep(1, { intent: 'user' })"
    class="flex gap-2 items-center cursor-pointer">
      <img src="/images/backIcon.png" alt="" srcset="" />
      <button  class="text-xs font-medium leading-[1.125rem] text-medium-text break-words">Back</button>
    </div>

    <h2>Subscription and P2V</h2>

    <div>
      <div>Subscription and P2V Content (Placeholder)</div>
    </div>

    <div>
      <button @click="uploader.goToStep(3, { intent: 'user' })">Next</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "MediaUploaderStepSubscriptionP2v",
  props: {
    uploader: {
      type: Object,
      required: true,
    },
  },
};
</script>
