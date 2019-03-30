import {
  decodeString, decodeNumeric, decodeTypedArray, decodeRLE,
} from '@/utils/decoder';

// parse each section
function getFileHeader(dataview, arrayBuffer) {
  let offset = 0;
  const fileHeader = {};
  [fileHeader.signature, offset] = decodeString(arrayBuffer, offset, 4);
  [fileHeader.version, offset] = decodeNumeric(dataview, offset, 'uint16');
  offset += 6; // Reserve 6 bytes.
  [fileHeader.channels, offset] = decodeNumeric(dataview, offset, 'uint16');
  [fileHeader.height, offset] = decodeNumeric(dataview, offset, 'uint32');
  [fileHeader.width, offset] = decodeNumeric(dataview, offset, 'uint32');
  [fileHeader.depth, offset] = decodeNumeric(dataview, offset, 'uint16');
  [fileHeader.colorMode, offset] = decodeNumeric(dataview, offset, 'uint16');
  fileHeader.imageSize = fileHeader.height * fileHeader.width;
  return [fileHeader, offset];
}

function getLayerInfo(dataview, arrayBuffer, firstOffset) {
  const layerInfo = {};
  let offset = firstOffset;
  [layerInfo.length, offset] = decodeNumeric(dataview, offset, 'uint32');
  [layerInfo.layerCount, offset] = decodeNumeric(dataview, offset, 'uint16');

  // get layer records
  layerInfo.layerRecords = [];
  for (let i = 0; i < layerInfo.layerCount; i += 1) {
    const layerRecord = {};

    // [top, left, bottom, right]
    const rectangle = [];
    for (let j = 0; j < 4; j += 1) {
      let value = 0;
      [value, offset] = decodeNumeric(dataview, offset, 'uint32');
      rectangle.push(value);
    }
    layerRecord.rectangle = rectangle;

    const channelInfo = [];
    [layerRecord.channels, offset] = decodeNumeric(dataview, offset, 'uint16');
    for (let j = 0; j < layerRecord.channels; j += 1) {
      const info = [];
      [info[0], offset] = decodeNumeric(dataview, offset, 'int16');
      [info[1], offset] = decodeNumeric(dataview, offset, 'uint32');
      channelInfo.push(info);
    }
    layerRecord.channelInfo = channelInfo;

    [layerRecord.blendModeSignature, offset] = decodeString(arrayBuffer, offset, 4);
    [layerRecord.blendModeKey, offset] = decodeString(arrayBuffer, offset, 4);
    [layerRecord.opacity, offset] = decodeNumeric(dataview, offset, 'uint8');
    [layerRecord.clipping, offset] = decodeNumeric(dataview, offset, 'uint8');
    [layerRecord.flags, offset] = decodeNumeric(dataview, offset, 'uint8');
    [layerRecord.fillter, offset] = decodeNumeric(dataview, offset, 'uint8');
    [layerRecord.extraDataLength, offset] = decodeNumeric(dataview, offset, 'uint32');

    offset += layerRecord.extraDataLength; // TODO: to get full info

    layerInfo.layerRecords.push(layerRecord);
  }

  // get channel image data
  // for (let layerIdx = 0; layerIdx < layerInfo.layerCount; layerIdx += 1) {
  //     const layerRecord = layerInfo.layerRecords[layerIdx];
  //     const height = layerRecord.rectangle[2] - layerRecord.rectangle[0];
  //     const width = layerRecord.rectangle[3] - layerRecord.rectangle[1];
  //     let length = 0;
  //     let channel = 0;
  //     layerRecord.channelInfo.forEach(channelInfo => {
  //         length += channelInfo[1];
  //         channel += 1;
  //     });
  //     console.log(getImageData(dataview, length, offset, width, height, channel))
  // }

  return [layerInfo, firstOffset + layerInfo.length];
}

function getImageData(dataview, length, firstOffset, width, height, channels) {
  const imageData = {};
  const imageSize = height * width;
  let offset = firstOffset;

  [imageData.compressionMethod, offset] = decodeNumeric(dataview, offset, 'uint16');
  const imageDataArray = decodeTypedArray(dataview, offset, length, 'uint8')[0];

  const channelData = [];
  // Raw image data.
  if (imageData.compressionMethod === 0) {
    channelData[0] = imageDataArray.slice(0, imageSize);
    channelData[1] = imageDataArray.slice(imageSize, imageSize * 2);
    channelData[2] = imageDataArray.slice(imageSize * 2, imageSize * 3);
    if (channels === 4) {
      channelData[3] = imageDataArray.slice(imageSize * 3, imageSize * 4);
    } else {
      channelData[3] = new Array(imageSize).fill(255);
    }

    // RLE compressed image data.
  } else if (imageData.compressionMethod === 1) {
    const rowSizes = [];
    for (let i = 0; i < channels; i += 1) {
      [rowSizes[i], offset] = decodeTypedArray(dataview, offset, height * 2, 'uint16');
    }

    for (let i = 0; i < channels; i += 1) {
      [channelData[i], offset] = decodeRLE(dataview, rowSizes[i], offset);
    }

    if (channels < 4) {
      channelData[3] = new Array(imageSize).fill(255);
    }

    // Zip files.
  } else {
    throw new Error('Unsupported compression method.');
  }

  const rgbaImage = [];
  for (let i = 0; i < channelData[0].length; i += 1) {
    rgbaImage.push(channelData[0][i]);
    rgbaImage.push(channelData[1][i]);
    rgbaImage.push(channelData[2][i]);
    rgbaImage.push(channelData[3][i]);
  }
  const clampedImage = new Uint8ClampedArray(rgbaImage);
  imageData.imageData = new ImageData(clampedImage, width, height);

  return imageData;
}

// function getImageDom(psd){
//     const img = new Image(psd.fileHeader.width, psd.fileHeader.height);

//     hideCanvas.width = psd.fileHeader.width;
//     hideCanvas.height = psd.fileHeader.height;

//     hideCanvasCtx.putImageData(psd.imageData.imageData, 0, 0);
//     img.src = hideCanvas.toDataURL("image/png");
//     hideCanvasCtx.clearRect(0, 0, hideCanvas.width, hideCanvas.height);

//     return img
// }

export default function parsePSD() {
  // decodeTest();
}
