<template>
  <div>
    <h2>Submit</h2>

    <div>
      <div>Submit Content (Placeholder)</div>
    </div>

    <div >
      <button @click="uploader.goToStep(4, { intent: 'user' })">Back</button>
      <br>
      <button @click="handleSubmit">Submit</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaUploaderStepSubmit',
  props: {
    uploader: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    function handleSubmit() {
      console.log('[MediaUploader] Submit:', props.uploader.state);
      alert('Submitted! (Check console)');
    }

    return { handleSubmit };
  }
};
</script>