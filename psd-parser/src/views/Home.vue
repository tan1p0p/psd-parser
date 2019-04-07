<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <h1>PSDの中身を見るやつ</h1>
    <sample-canvas
      v-if="isFileParsed"
      :thumbnail="thumbnail"
    />
    <router-link
      v-if="isFileParsed" 
      :to="{ name: 'edit', params: { psd: this.psd }}"
    >
      <p>このPSDを編集する</p>
    </router-link>
    <file-picker
      @createImageBitmap="setFileData"
    />
  </div>
</template>

<script>
// @ is an alias to /src
import FilePicker from '@/components/FilePicker.vue';
import SampleCanvas from '@/components/SampleCanvas.vue';

export default {
  name: 'Home',
  components: {
    FilePicker,
    SampleCanvas,
  },
  data() {
    return {
      psd: null,
      thumbnail: null,
    };
  },
  computed: {
    isFileParsed() {
      return this.thumbnail != null ? true : false
    },
  },
  methods: {
    setFileData(psd) {
      this.psd = psd;
      this.thumbnail = psd.imageDataSection.imageBitmap;
    }
  }
};
</script>
