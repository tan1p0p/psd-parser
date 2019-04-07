<template>
  <div>
    <div
      id="dropPoint"
      class="drop_point"
      :class="{ 'drop_point--active':isOnBox }"
      @dragover.prevent
      @dragenter.prevent="fileOnBox = true"
      @dragleave.prevent="fileOnBox = false"
      @drop.prevent="onDropFile"
    >
      <label class="input_button">
        PSDファイルを選択
        <input
          class="input"
          type="file"
          accept="*,.psd"
          @change="onPickFile"
        >
      </label>
      もしくはここにドラッグ<br>
      <p>{{ filename }}</p>
      <label
        class="parse_button"
        :class="{ 'parse_button--disable':isFileNotPicked }"
        @click="parsePSD"
      >
        parse file!
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilePicker',
  data() {
    return {
      fileOnBox: false,
      filename: null,
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
      // imageBitmap: null,
    };
  },
  computed: {
    isOnBox() {
      return this.fileOnBox
    },
    isFilePicked() {
      return this.filename != null ? true : false
    },
    isFileNotPicked() {
      return this.isFilePicked ? false : true
    },
  },
  methods: {
    onPickFile(event) {
      if (event.target.files[0].type == "image/vnd.adobe.photoshop") {
        this.setPSDfile(event.target.files);
      }
    },
    onDropFile(event) {
      if (this.isOnBox && event.dataTransfer.files[0].type == "image/vnd.adobe.photoshop") {
        this.fileOnBox = false;
        this.setPSDfile(event.dataTransfer.files);
      }
    },
    setPSDfile(files) {
      this.filename = files[0].name;
      [this.psd.file] = files;
      this.setArrayBufferAndDataView(this.psd.file);
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
        this.psd.fileHeaderSection = this.getFileHeaderSection(this.psd);
        // this.psd.layerAndMaskInfoSection = this.getLayerAndMaskInfoSection(this.psd);
        // console.log('Successfully got layer and mask info section.');
        this.psd.imageDataSection = this.getImageDataSection(this.psd);
        this.setImageBitmap();
      }
    },
    setImageBitmap() {
      const imageData = this.psd.imageDataSection.imageData;
      createImageBitmap(imageData).then((imageBitmap) => {
        this.psd.imageDataSection.imageBitmap = imageBitmap;
        this.$emit('createImageBitmap', this.psd);
      });
    }
  },
};
</script>

<style lang="scss" scoped>
.drop_point {
  margin: 2rem 1rem;
  padding: 100px 0;
  border: 1px dashed #555;
  border-radius: 6px;

  &.drop_point--active {
    background-color: #ccc;
  }
}

.input_button {
  color: #6EA1C1;
}

.input {
  display: none;
}

.parse_button {
  padding: 5px 20px;
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

  &.parse_button--disable {
    background-color: rgb(155, 155, 155);
  }
}
</style>