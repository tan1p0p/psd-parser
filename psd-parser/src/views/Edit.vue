<template>
  <div>
    <h1>Drawing process GIF</h1>
    <div class="viewer-wrapper">
      <svg
        class="viewer"
        :viewBox="`0 0 ${psd.fileHeaderSection.width} ${psd.fileHeaderSection.height}`"
        xmlns="http://www.w3.org/2000/svg" 
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <image
          v-for="(value, key, index) in psd.layerAndMaskInfoSection.layerRecords"
          :key="index"
          :x="calcLayerSize(value.rectangle, 'x')"
          :y="calcLayerSize(value.rectangle, 'y')"
          :width="calcLayerSize(value.rectangle, 'width')"
          :height="calcLayerSize(value.rectangle, 'height')"
          :xlink:href="psd.layerAndMaskInfoSection.base64[key]"
          :class="`layer-${key}`"
          :style="`mix-blend-mode:${value.blendMode};`"
        />
      </svg>
    </div>
  </div>
</template>

<script>
// import BasicButton from '@/components/basics/BasicButton.vue';

export default {
  name: 'Edit',
  components: {
    // BasicButton,
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
    },
    calcLayerSize(rectangle, mode) {
      switch (mode){
        case 'x':
          return rectangle[1];
        case 'y':
          return rectangle[0];
        case 'height':
          return rectangle[2] - rectangle[0];
        case 'width':
          return rectangle[3] - rectangle[1];
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.viewer-wrapper {
  height: 80vh;
}
.viewer {
  max-height: 100%;
}
</style>
