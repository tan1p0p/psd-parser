<template>
  <canvas />
</template>

<script>
export default {
  name: 'SampleCanvas',
  props: {
    thumbnail: {
      type: ImageBitmap,
      required: true,
      default: function() {
        return new ImageBitmap
      }
    },
  },
  watch: {
    thumbnail: {
      handler: function (thumbnail) {
        this.draw(thumbnail);
      },
      deep: true
    },
  },
  mounted() {
    this.ctx = this.$el.getContext('2d');
    this.draw(this.thumbnail);
  },
  methods: {
    draw(imageBitmap) {
      this.ctx.clearRect(0, 0, this.$el.width, this.$el.height);
      if (imageBitmap) {
        const width = imageBitmap.width;
        const height = imageBitmap.height;

        let canvasLength = 0;
        let [x, y] = [0, 0];
        if (width >= height) {
          y = (width - height) / 2;
          canvasLength = width;
        } else {
          x = (height - width) / 2;
          canvasLength = height;
        }

        this.$el.width = canvasLength;
        this.$el.height = canvasLength;
        this.ctx.drawImage(imageBitmap, x, y);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
canvas {
  width: 300px;
  height: 300px;
}
</style>