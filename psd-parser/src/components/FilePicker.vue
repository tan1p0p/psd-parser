<template>
  <div>
    <input v-on:change="pickFile" type="file"/>
    <button v-on:click="parsePSD">parse file!</button>
  </div>
</template>

<script>
import parser from '@/utils/parser';

export default {
  name: 'FilePicker',
  // props: {
  //   msg: String,
  // },
  data() {
    return {
      psd: {
        file: null,
        arrayBuffer: null,
        dataView: null,
        fileHeaderSection: null,
        colorModeDataSection: null,
        imageResourcesSection: null,
        layerAndMaskImfoSection: null,
        imageDataSection: null,
      },
    };
  },
  methods: {
    pickFile(event) {
      if (event.target.files) {
        [this.psd.file] = event.target.files;
        this.setArrayBufferAndDataView(this.psd.file);
      }
    },
    setArrayBufferAndDataView(file) {
      const fileReader = new FileReader();
      const component = this;
      fileReader.onload = (event) => {
        component.psd.arrayBuffer = event.target.result;
        component.psd.dataView = new DataView(event.target.result);
      };
      fileReader.readAsArrayBuffer(file);
    },
    parsePSD() {
      parser();
    },
  },
};
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
