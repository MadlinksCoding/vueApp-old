<template>
  <div class="status-messages" data-component-path="MediaUploaderStatusMessages.vue">
    <div v-if="errors.length" class="message error">
      <strong>Errors:</strong>
      <ul>
        <li v-for="(err, idx) in errors" :key="idx">{{ err }}</li>
      </ul>
    </div>

    <div v-if="warnings.length" class="message warning">
      <strong>Warnings:</strong>
      <ul>
        <li v-for="(warn, idx) in warnings" :key="idx">{{ warn }}</li>
      </ul>
    </div>

    <div v-if="tips.length" class="message tip">
      <strong>Tips:</strong>
      <ul>
        <li v-for="(tip, idx) in tips" :key="idx">{{ tip }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaUploaderStatusMessages',
  props: {
    errors: {
      type: Array,
      default: () => []
    },
    warnings: {
      type: Array,
      default: () => []
    },
    tips: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped>
.status-messages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message {
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.message.error {
  background: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
}

.message.warning {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #92400e;
}

.message.tip {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1e40af;
}

.message ul {
  margin: 0.5rem 0 0 1rem;
  padding: 0;
}

.message li {
  margin: 0.25rem 0;
}
</style>