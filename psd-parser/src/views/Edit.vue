<template>
  <div class="edit">
    <h1>This is an edit page</h1>
  </div>
</template>

<script>
export default {
  name: 'Edit',
  props: {
    psd: {
      type: Object,
      default: function() {
        return new Object
      }
    },
  },
};
</script>