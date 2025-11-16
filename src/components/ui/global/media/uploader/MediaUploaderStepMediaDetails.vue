<template>
  <div>
    <h2>Media Details</h2>

    <div>
      <div>Media Details Content (Placeholder)</div>
    </div>

    <div>
      <button @click="uploader.goToStep(2, { intent: 'user' })">Back</button>
      <br>
      <button @click="uploader.goToStep(4, { intent: 'user' })">Next</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaUploaderStepMediaDetails',
  props: {
    uploader: {
      type: Object,
      required: true
    }
  }
};
</script>