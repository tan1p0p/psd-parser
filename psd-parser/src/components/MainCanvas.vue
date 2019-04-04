<template>
  <canvas width="2000" height="2000"/>
</template>

<script>
export default {
  name: 'MainCanvas',
  props: ['psd'],
  mounted() {
    this.ctx = this.$el.getContext('2d');
  },
  watch: {
    psd() {
      this.draw(this.psd);
    },
  },
  methods: {
    draw(psd) {
      this.ctx.drawImage(psd.imageDataSection.imageBitmap, 0, 0, 1000, 1000);
    },
  },
};
</script>
