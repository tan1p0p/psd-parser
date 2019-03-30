<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <FilePicker/>
  </div>
</template>

<script>
// @ is an alias to /src
import FilePicker from '@/components/FilePicker.vue';

export default {
  name: 'home',
  components: {
    FilePicker,
  },
};
</script>
