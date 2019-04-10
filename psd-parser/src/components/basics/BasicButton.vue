<template>
  <button>{{ message }}</button>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      required: true,
      default: function() {
        return 'basic button'
      }
    },
  }
}
</script>

<style lang="scss" scoped>
button {
  padding: 8px 20px;
  color: #fff;
  border-radius: 2px;
  user-select: none;
  background-color: rgb(46, 89, 145);

  &:hover {
    background-color: rgb(54, 109, 180);
  }

  &:active {
    background-color: rgb(32, 65, 109);
  }

  &.disable {
    background-color: rgb(155, 155, 155);
  }
}
</style>
