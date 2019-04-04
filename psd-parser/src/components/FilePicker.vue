<template>
  <div>
    <input v-on:change="pickFile" type="file"/>
    <button v-on:click="parsePSD">parse file!</button>
  </div>
</template>

<script>
export default {
  name: 'FilePicker',
  data() {
    return {
      psd: {
        file: null,
        arrayBuffer: null,
        dataView: null,
        structure: null,
        fileHeaderSection: null,
        // colorModeDataSection: null,
        // imageResourcesSection: null,
        layerAndMaskInfoSection: null,
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
      if (this.psd.dataView != null) {
        this.psd.structure = this.getStructure(this.psd);
        console.log('Successfully got structure.');
        this.psd.fileHeaderSection = this.getFileHeaderSection(this.psd);
        console.log('Successfully got file header section.');
        // this.psd.layerAndMaskInfoSection = this.getLayerAndMaskInfoSection(this.psd);
        // console.log('Successfully got layer and mask info section.');
        this.psd.imageDataSection = this.getImageDataSection(this.psd);
        console.log('Successfully got image data section.');
        this.$emit('parsePSD', this.psd);
      }
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
