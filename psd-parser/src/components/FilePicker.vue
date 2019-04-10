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
      <basic-button
        :class="{'disable':isFileNotPicked}"
        message="parse file!"
        @click.native="setPSD"
      />
    </div>
  </div>
</template>

<script>
import BasicButton from '@/components/basics/BasicButton.vue';

export default {
  name: 'FilePicker',
  components: {
    BasicButton,
  },
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
    setPSD() {
      if (this.psd.dataView != null) {
        this.psd.structure = this.getStructure(this.psd);
        this.psd.fileHeaderSection = this.getFileHeaderSection(this.psd);
        this.psd.layerAndMaskInfoSection = this.getLayerAndMaskInfoSection(this.psd);
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
</style>