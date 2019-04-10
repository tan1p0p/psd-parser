<template>
  <canvas />
</template>

<script>
export default {
  name: 'MainCanvas',
  props: {
    psd: {
      type: Object,
      required: true,
      default: function() {
        return new Object
      }
    },
    downloadStatus: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      layerNum: 0,
      rendererID: null,
      interval: 1000,
    };
  },
  watch: {
    downloadStatus() {
      this.createGIF();
    }
  },
  mounted() {
    this.ctx = this.$el.getContext('2d');
    this.$el.width = this.psd.fileHeaderSection.width;
    this.$el.height = this.psd.fileHeaderSection.height;
    this.draw();
    this.rendererID = setInterval(this.draw, this.interval);
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
    createGIF() {
      clearInterval(this.rendererID);

      const gifAnimation = new window.GIFEncoder();
      gifAnimation.setQuality(256);
      gifAnimation.setDelay(this.interval); // time(msec) per frame
      gifAnimation.start(0);
      this.layerNum = 0;

      for (let i = 0; i < this.psd.layerAndMaskInfoSection.layerCount; i++) {
        this.draw();
        gifAnimation.addFrame(this.ctx);
      }
      gifAnimation.finish();

      //バイナリデータの編集
      var byteString = gifAnimation.stream().getData() ;
      var imageArrayBuffer = new ArrayBuffer(byteString.length);
      var imageArray = new Uint8Array(imageArrayBuffer);
      for (var i = 0; i < byteString.length; i++) {
        imageArray[i] = byteString.charCodeAt(i);
      }

      // Blobオブジェクトの生成
      var blob = new Blob( [imageArrayBuffer], {type: "image/gif" });

      //a要素の生成
      var a = document.createElement("a");

      //BlobURLを取得しa要素のsrcへ与える
      a.href = window.URL.createObjectURL( blob );

      a.download = "animation.gif";
      a.innerHTML = "Download GIF";

      //body要素にa要素を追加
      document.getElementsByTagName( "body" )[0].appendChild(a);
    }
  },
};
</script>