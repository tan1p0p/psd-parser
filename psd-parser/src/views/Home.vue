<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <file-picker v-on:parsePSD="psd = $event"/>
    <main-canvas v-bind:psd="psd"/>
  </div>
</template>

<script>
// @ is an alias to /src
import FilePicker from '@/components/FilePicker.vue';
import MainCanvas from '@/components/MainCanvas.vue';

export default {
  name: 'home',
  components: {
    FilePicker,
    MainCanvas,
  },
  data() {
    return {
      psd: null,
    };
  },
};
</script>
