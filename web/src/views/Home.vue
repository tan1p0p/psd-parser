<template>
  <div class="home">
    <h1>PSDの中身を見るやつ</h1>
    <file-picker
      @createImageBitmap="setFileData"
    />
  </div>
</template>

<script>
import FilePicker from '@/components/FilePicker.vue';

export default {
  name: 'Home',
  components: {
    FilePicker,
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
    },
  }
};
</script>
