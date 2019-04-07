export default {
  methods: {
    getStructure(psd) {
      const structure = {
        offset: [0],
        length: [26],
      };

      for (let i = 0; i < 3; i += 1) {
        const sectionOffset = structure.offset[i] + structure.length[i];
        const sectionLength = this.decodeNumeric(psd.dataView, sectionOffset, 'uint32')[0] + 4;
        structure.offset.push(sectionOffset);
        structure.length.push(sectionLength);
      }

      const sectionOffset = structure.offset[3] + structure.length[3];
      structure.offset.push(sectionOffset);
      structure.length.push(psd.file.size - sectionOffset);

      return structure;
    },

    getFileHeaderSection(psd) {
      let offset = psd.structure.offset[0];
      const { dataView, arrayBuffer } = psd;
      const fileHeader = {};
      [fileHeader.signature, offset] = this.decodeString(arrayBuffer, offset, 4);
      [fileHeader.version, offset] = this.decodeNumeric(dataView, offset, 'uint16');
      offset += 6; // Reserve 6 bytes.
      [fileHeader.channels, offset] = this.decodeNumeric(dataView, offset, 'uint16');
      [fileHeader.height, offset] = this.decodeNumeric(dataView, offset, 'uint32');
      [fileHeader.width, offset] = this.decodeNumeric(dataView, offset, 'uint32');
      [fileHeader.depth, offset] = this.decodeNumeric(dataView, offset, 'uint16');
      [fileHeader.colorMode, offset] = this.decodeNumeric(dataView, offset, 'uint16');
      fileHeader.imageSize = fileHeader.height * fileHeader.width;

      return fileHeader;
    },

    getLayerAndMaskInfoSection(psd) {
      const { arrayBuffer, dataView } = psd;
      let offset = psd.structure.offset[3] + 4;

      const layerInfo = {};
      [layerInfo.length, offset] = this.decodeNumeric(dataView, offset, 'uint32');
      [layerInfo.layerCount, offset] = this.decodeNumeric(dataView, offset, 'int16');

      // get layer records
      layerInfo.layerRecords = [];
      for (let i = 0; i < Math.abs(layerInfo.layerCount); i += 1) {
        const layerRecord = {};

        // [top, left, bottom, right]
        const rectangle = [];
        for (let j = 0; j < 4; j += 1) {
          let value = 0;
          [value, offset] = this.decodeNumeric(dataView, offset, 'uint32');
          rectangle.push(value);
        }
        layerRecord.rectangle = rectangle;

        const channelInfo = [];
        [layerRecord.channels, offset] = this.decodeNumeric(dataView, offset, 'uint16');

        for (let j = 0; j < layerRecord.channels; j += 1) {
          const info = [];
          [info[0], offset] = this.decodeNumeric(dataView, offset, 'int16');
          [info[1], offset] = this.decodeNumeric(dataView, offset, 'uint32');
          channelInfo.push(info);
        }
        layerRecord.channelInfo = channelInfo;

        [layerRecord.blendModeSignature, offset] = this.decodeString(arrayBuffer, offset, 4);
        [layerRecord.blendModeKey, offset] = this.decodeString(arrayBuffer, offset, 4);
        [layerRecord.opacity, offset] = this.decodeNumeric(dataView, offset, 'uint8');
        [layerRecord.clipping, offset] = this.decodeNumeric(dataView, offset, 'uint8');
        [layerRecord.flags, offset] = this.decodeNumeric(dataView, offset, 'uint8');
        [layerRecord.fillter, offset] = this.decodeNumeric(dataView, offset, 'uint8');
        [layerRecord.extraDataLength, offset] = this.decodeNumeric(dataView, offset, 'uint32');

        offset += layerRecord.extraDataLength; // TODO: get full infomation

        layerInfo.layerRecords.push(layerRecord);
      }

      // get channel image data
      layerInfo.imageBitmap = [];
      for (let layerIdx = 0; layerIdx < Math.abs(layerInfo.layerCount); layerIdx += 1) {
        const layerRecord = layerInfo.layerRecords[layerIdx];

        const channels = layerRecord.channelInfo.length;
        const width = layerRecord.rectangle[2] - layerRecord.rectangle[0];
        const height = layerRecord.rectangle[3] - layerRecord.rectangle[1];
        const imageSize = width * height;

        const layerImageData = {};
        for (let channelIdx = 0; channelIdx < channels; channelIdx += 1) {
          let compressionMethod = 0;
          [compressionMethod, offset] = this.decodeNumeric(dataView, offset, 'uint16');

          const channelColor = layerRecord.channelInfo[channelIdx][0];
          // Raw image data.
          if (compressionMethod === 0) {
            [layerImageData[channelColor], offset] = this.decodeTypedArray(dataView, offset, imageSize, 'uint8');

          // RLE compressed image data.
          } else if (compressionMethod === 1) {
            let rowSize = null;
            [rowSize, offset] = this.decodeTypedArray(dataView, offset, height * 2, 'uint16');
            [layerImageData[channelColor], offset] = this.decodeRLE(dataView, rowSize, offset);

          // Zip files.
          } else {
            throw new Error('Unsupported compression method.');
          }
        }

        const rgbaImage = [];
        for (let i = 0; i < layerImageData[0].length; i += 1) {
          rgbaImage.push(layerImageData['0'][i]);
          rgbaImage.push(layerImageData['1'][i]);
          rgbaImage.push(layerImageData['2'][i]);
          rgbaImage.push(layerImageData['-1'][i]);
        }
        const clampedImage = new Uint8ClampedArray(rgbaImage);
        const imageData = new ImageData(clampedImage, width, height);
        createImageBitmap(imageData).then((imageBitmap) => {
          layerInfo.imageBitmap.push(imageBitmap);
        });
      }

      return layerInfo;
    },

    getImageDataSection(psd) {
      const { dataView } = psd;
      const {
        imageSize,
        height,
        width,
        channels,
      } = psd.fileHeaderSection;
      let offset = psd.structure.offset[4];

      const imageDataSection = {};
      [imageDataSection.compressionMethod, offset] = this.decodeNumeric(dataView, offset, 'uint16');
      const channelData = [];

      // Raw image data.
      if (imageDataSection.compressionMethod === 0) {
        for (let i = 0; i < channels; i += 1) {
          [channelData[i], offset] = this.decodeTypedArray(dataView, offset, imageSize, 'uint8');
        }
      // RLE compressed image data.
      } else if (imageDataSection.compressionMethod === 1) {
        const rowSizes = [];
        for (let i = 0; i < channels; i += 1) {
          [rowSizes[i], offset] = this.decodeTypedArray(dataView, offset, height * 2, 'uint16');
        }
        for (let i = 0; i < channels; i += 1) {
          [channelData[i], offset] = this.decodeRLE(dataView, rowSizes[i], offset);
        }
        // Zip files.
      } else {
        throw new Error('Unsupported compression method.');
      }

      if (channels < 4) {
        channelData[3] = new Array(imageSize).fill(255);
      }

      const rgbaImage = [];
      for (let i = 0; i < channelData[0].length; i += 1) {
        rgbaImage.push(channelData[0][i]);
        rgbaImage.push(channelData[1][i]);
        rgbaImage.push(channelData[2][i]);
        rgbaImage.push(channelData[3][i]);
      }
      const clampedImage = new Uint8ClampedArray(rgbaImage);
      imageDataSection.imageData = new ImageData(clampedImage, width, height);

      // For set image Bitmap in utils.
      // createImageBitmap(imageDataSection.imageData).then((imageBitmap) => {
      //   imageDataSection.imageBitmap = imageBitmap;
      // });
      return imageDataSection;
    },
  },
};
