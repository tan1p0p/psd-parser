<template>
  <div class="edit">
    <h1>Drawing process GIF</h1>
    <div class="editor_wrapper">
      <div class="editor">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg" 
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <image
            v-for="(value, key, index) in psd.layerAndMaskInfoSection.base64"
            :key="index"
            x="0"
            y="0"
            height="100"
            width="100"
            :xlink:href="value"
            :class="'layer-' + key"
            :style="'mix-blend-mode:' + psd.layerAndMaskInfoSection.layerRecords[key].blendMode + ';'"
          />
        </svg>
        <basic-button
          message="Create GIF file"
          @click.native="setDownloadStatus"
        />
      </div>
    </div>
  </div>
</template>

<script>
// import MainCanvas from '@/components/MainCanvas.vue';
import BasicButton from '@/components/basics/BasicButton.vue';

export default {
  name: 'Edit',
  components: {
    // MainCanvas,
    BasicButton,
  },
  props: {
    psd: {
      type: Object,
      default: function() {
        return new Object
      }
    },
  },
  data() {
    return {
      downloadStatus: false,
    }
  },
  methods: {
    setDownloadStatus() {
      this.downloadStatus = true;
    }
  }
};
</script>

<style lang="scss" scoped>
.editor_wrapper {
  display: flex;
  justify-content: center;
}
.editor {
  width: 100vw;
  max-width: 500px;
  max-height: 500px;

  &__canvas {
    max-width: 100%;
    max-height: 100%;
  }
}
</style>
