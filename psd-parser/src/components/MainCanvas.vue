<template>
  <canvas />
</template>

<script>
export default {
  name: 'ThumbnailCanvas',
  props: {
    psd: {
      type: Object,
      required: true,
      default: function() {
        return new Object
      }
    },
  },
  data() {
    return {
      layerNum: 0,
    };
  },
  mounted() {
    this.ctx = this.$el.getContext('2d');
    this.$el.width = this.psd.fileHeaderSection.width;
    this.$el.height = this.psd.fileHeaderSection.height;
    this.draw();
    setInterval(this.draw, 1000);
  },
  methods: {
    draw() {
      if (this.layerNum + 1 > this.psd.layerAndMaskInfoSection.layerCount) {
        this.ctx.clearRect(0, 0, this.$el.width, this.$el.height);
        this.layerNum = 0;
      }

      const imageBitmap = this.psd.layerAndMaskInfoSection.imageBitmap[this.layerNum];
      const layerRecord = this.psd.layerAndMaskInfoSection.layerRecords[this.layerNum];
      this.ctx.drawImage(imageBitmap, layerRecord.rectangle[1], layerRecord.rectangle[0]);

      this.layerNum += 1;
    },
  },
};
</script>