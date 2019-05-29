export default {
  methods: {
    decodeString(arrayBuffer, begin, length) {
      const subArrayBuffer = arrayBuffer.slice(begin, begin + length);
      const str = String.fromCharCode.apply('', new Uint8Array(subArrayBuffer));
      return [str, begin + length];
    },

    decodeNumeric(dataView, begin, type) {
      switch (type) {
        case 'int8':
          return [dataView.getInt8(begin), begin + 1];
        case 'uint8':
          return [dataView.getUint8(begin), begin + 1];
        case 'int16':
          return [dataView.getInt16(begin), begin + 2];
        case 'uint16':
          return [dataView.getUint16(begin), begin + 2];
        case 'int32':
          return [dataView.getInt32(begin), begin + 4];
        case 'uint32':
          return [dataView.getUint32(begin), begin + 4];
        default:
          return 'please set type';
      }
    },

    decodeTypedArray(dataView, begin, length, type) {
      const typeLengthList = {
        int8: 1,
        uint8: 1,
        int16: 2,
        uint16: 2,
        int32: 4,
        uint32: 4,
      };
      const typeLength = typeLengthList[type];

      const epoch = Math.floor(length / typeLength);
      const decodedArray = new Array(epoch);

      let offset = begin;
      for (let idx = 0; idx < epoch; idx += 1) {
        [decodedArray[idx], offset] = this.decodeNumeric(dataView, offset, type);
      }

      switch (type) {
        case 'int8':
          return [new Int8Array(decodedArray), begin + length];
        case 'uint8':
          return [new Uint8Array(decodedArray), begin + length];
        case 'int16':
          return [new Int16Array(decodedArray), begin + length];
        case 'uint16':
          return [new Uint16Array(decodedArray), begin + length];
        case 'int32':
          return [new Int32Array(decodedArray), begin + length];
        case 'uint32':
          return [new Uint32Array(decodedArray), begin + length];
        default:
          return 'please set type';
      }
    },

    decodeRLE(dataView, rowSizes, firstOffset) {
      const channelData = [];
      let offset = firstOffset;
      rowSizes.forEach((rowSize) => {
        const rowOffset = offset;
        while (offset - rowOffset < rowSize) {
          const sign = this.decodeNumeric(dataView, offset, 'int8')[0];
          offset += 1;

          if (sign < 0) {
            const value = this.decodeNumeric(dataView, offset, 'uint8')[0];
            offset += 1;
            for (let j = 0; j < Math.abs(sign) + 1; j += 1) {
              channelData.push(value);
            }
          } else {
            for (let j = 0; j < sign + 1; j += 1) {
              const value = this.decodeNumeric(dataView, offset, 'uint8')[0];
              offset += 1;
              channelData.push(value);
            }
          }
        }
      });

      return [channelData, offset];
    },
  },
};
