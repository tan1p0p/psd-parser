<template>
  <div class="home">
    <h1>PSDの中身を見るやつ</h1>
    <thumbnail-canvas
      v-if="isFileParsed"
      :thumbnail="thumbnail"
    />
    <router-link
      v-if="isFileParsed" 
      :to="{ name: 'edit', params: { psd: psd }}"
    >
      <p>このPSDのレイヤーを見る</p>
    </router-link>
    <file-picker
      @createImageBitmap="setFileData"
    />
  </div>
</template>

<script>
import FilePicker from '@/components/FilePicker.vue';
import ThumbnailCanvas from '@/components/ThumbnailCanvas.vue';

export default {
  name: 'Home',
  components: {
    FilePicker,
    ThumbnailCanvas,
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
