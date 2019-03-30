// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // alert('Great success! All the File APIs are supported.');
} else {
    alert('The File APIs are not fully supported in this browser.');
}

const hideCanvas = document.getElementById('hideCanvas');
const canvas = document.getElementById('hideCanvas');

const hideCanvasCtx = hideCanvas.getContext('2d');
const ctx = hideCanvas.getContext('2d');

document.getElementById('files').addEventListener('change', handleFileSelect, false);


function handleFileSelect(evt) {
    const files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    // let output = [];
    for (let i = 0, f; f = files[i]; i++) {
        // console.log(escape(f.name), f.type, f.size, f.lastModifiedDate.toLocaleDateString());
        onFileSelected(f);
    }

    // document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

// Main function which run when file selected.
function onFileSelected(file) {
    let fileReader = new FileReader();
    let psd = file;

    fileReader.onload = function() {
        const arrayBuffer = this.result;
        const dataview = new DataView(arrayBuffer);

        // ===================
        // File Header Section
        // ===================
        let offset = 0;
        [psd.fileHeader, offset] = getFileHeader(dataview, arrayBuffer);


        // =======================
        // Color Mode Data Section
        // =======================
        // Only indexed color and duotone have color mode data.
        // For all other modes, this section is just the 4-byte length field, which is set to zero.

        psd.colorModeData = {};
        psd.colorModeData.offset = 26;

        const colorModeDataOffset = psd.colorModeData.offset
        psd.colorModeData.length = decodeNumeric(dataview, colorModeDataOffset, 'uint32')[0];


        // =======================
        // Image Resources Section
        // =======================
        // Some settings section.

        psd.imageResources = {};
        psd.imageResources.offset = psd.colorModeData.offset + psd.colorModeData.length + 4;

        const imageResourcesOffset = psd.imageResources.offset;
        psd.imageResources.length = decodeNumeric(dataview, imageResourcesOffset, 'uint32')[0];


        // ==================================
        // Layer and Mask Information Section
        // ==================================

        psd.layerMask = {};
        psd.layerMask.offset = psd.imageResources.offset + psd.imageResources.length + 4;
        [psd.layerMask.length, offset] = decodeNumeric(dataview, psd.layerMask.offset, 'uint32');
        // 透明度情報はいるとバグる？
        if (psd.layerMask.length > 0){
            [psd.layerMask.layerInfo, offset] = getLayerInfo(dataview, arrayBuffer, offset);
        }


        // ==================
        // Image Data Section
        // ==================
        // Image pixel data.

        const imageDataOffset = psd.layerMask.offset + psd.layerMask.length + 4;
        const imageDataLength = psd.size - (imageDataOffset + 2);
        psd.imageData = getImageData(
            dataview,
            imageDataLength,
            imageDataOffset,
            psd.fileHeader.width,
            psd.fileHeader.height,
            psd.fileHeader.channels
        );
        psd.imageData.offset = imageDataOffset;
        psd.imageData.length = imageDataLength;

        console.log(psd);
        canvas.width = psd.fileHeader.width;
        canvas.height = psd.fileHeader.height;
        ctx.putImageData(psd.imageData.imageData, 0, 0);
    }

    fileReader.readAsArrayBuffer(file);
}

function decodeString(arrayBuffer, begin, length){
    const subArrayBuffer = arrayBuffer.slice(begin, begin + length);
    const str = String.fromCharCode.apply("", new Uint8Array(subArrayBuffer))
    return [str, begin + length];
}

function decodeNumeric(dataview, begin, type){
    switch (type){
        case 'int8':
            return [dataview.getInt8(begin), begin + 1];
        case 'uint8':
            return [dataview.getUint8(begin), begin + 1];
        case 'int16':
            return [dataview.getInt16(begin), begin + 2];
        case 'uint16':
            return [dataview.getUint16(begin), begin + 2];
        case 'int32':
            return [dataview.getInt32(begin), begin + 4];
        case 'uint32':
            return [dataview.getUint32(begin), begin + 4];
    }
}

function decodeTypedArray(dataview, begin, length, type){
    const typeLengthList = {uint8: 1, uint16: 2, uint32: 4};
    const typeLength = typeLengthList[type];

    const epoch = Math.floor(length / typeLength);
    let decodedArray = new Array(epoch);

    let offset = begin
    for (let idx = 0; idx < epoch; idx++) {
        [decodedArray[idx], offset] = decodeNumeric(dataview, offset, type);
    }

    switch (type){
        case 'uint8':
            return [new Uint8Array(decodedArray), begin + length];
        case 'uint16':
            return [new Uint16Array(decodedArray), begin + length];
        case 'uint32':
            return [new Uint32Array(decodedArray), begin + length];
    }
}

function decodeRLE(dataview, rowSizes, offset){
    let channelData = [];

    rowSizes.forEach(rowSize => {
        const firstOffset = offset;
        while (offset - firstOffset < rowSize) {
            sign = decodeNumeric(dataview, offset, 'int8')[0];
            offset += 1;

            if (sign < 0) {
                value = decodeNumeric(dataview, offset, 'uint8')[0];
                offset += 1;
                for (let j = 0; j < Math.abs(sign) + 1; j++) {
                    channelData.push(value);
                }
            } else {
                for (let j = 0; j < sign + 1; j++) {
                    value = decodeNumeric(dataview, offset, 'uint8')[0];
                    offset += 1;
                    channelData.push(value);
                }
            }
        }
    });

    return [channelData, offset];
}

function getFileHeader(dataview, arrayBuffer){
    let offset = 0;
    fileHeader = {};
    [fileHeader.signature, offset] = decodeString(arrayBuffer, offset, 4);
    [fileHeader.version, offset]   = decodeNumeric(dataview, offset, 'uint16');
    offset += 6; // Reserve 6 bytes.
    [fileHeader.channels, offset]  = decodeNumeric(dataview, offset, 'uint16');
    [fileHeader.height, offset]    = decodeNumeric(dataview, offset, 'uint32');
    [fileHeader.width, offset]     = decodeNumeric(dataview, offset, 'uint32');
    [fileHeader.depth, offset]     = decodeNumeric(dataview, offset, 'uint16');
    [fileHeader.colorMode, offset] = decodeNumeric(dataview, offset, 'uint16');
    fileHeader.imageSize = fileHeader.height * fileHeader.width;
    return [fileHeader, offset]
}

function getLayerInfo(dataview, arrayBuffer, offset){
    const layerInfo = {};
    const firstOffset = offset;
    [layerInfo.length, offset] = decodeNumeric(dataview, offset, 'uint32');
    [layerInfo.layerCount, offset] = decodeNumeric(dataview, offset, 'uint16');

    console.log(layerInfo)

    // get layer records
    layerInfo.layerRecords = [];
    for (let i = 0; i < layerInfo.layerCount; i++) {
        const layerRecord = {};

        // [top, left, bottom, right]
        const rectangle = [];
        for (let j = 0; j < 4; j++) {
            [value, offset] = decodeNumeric(dataview, offset, 'uint32')
            rectangle.push(value);
        }
        layerRecord.rectangle = rectangle

        const channelInfo = [];
        [layerRecord.channels, offset]  = decodeNumeric(dataview, offset, 'uint16');
        for (let j = 0; j < layerRecord.channels; j++) {
            let info = [];
            [info[0], offset] = decodeNumeric(dataview, offset, 'int16');
            [info[1], offset] = decodeNumeric(dataview, offset, 'uint32');
            channelInfo.push(info);
        }
        layerRecord.channelInfo = channelInfo;

        [layerRecord.blendModeSignature, offset] = decodeString(arrayBuffer, offset, 4);
        [layerRecord.blendModeKey, offset]       = decodeString(arrayBuffer, offset, 4);
        [layerRecord.opacity, offset]            = decodeNumeric(dataview, offset, 'uint8');
        [layerRecord.clipping, offset]           = decodeNumeric(dataview, offset, 'uint8');
        [layerRecord.flags, offset]              = decodeNumeric(dataview, offset, 'uint8');
        [layerRecord.fillter, offset]            = decodeNumeric(dataview, offset, 'uint8');
        [layerRecord.extraDataLength, offset]    = decodeNumeric(dataview, offset, 'uint32');

        offset += layerRecord.extraDataLength; // TODO: to get full info

        layerInfo.layerRecords.push(layerRecord)
    }

    // get channel image data
    // for (let layerIdx = 0; layerIdx < layerInfo.layerCount; layerIdx++) {
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

    return [layerInfo, firstOffset + layerInfo.length]
}

function getImageData(dataview, length, offset, width, height, channels){
    let imageData = {}
    const imageSize = height * width;

    [imageData.compressionMethod, offset] = decodeNumeric(dataview, offset, 'uint16');
    const imageDataArray = decodeTypedArray(dataview, offset, length, 'uint8');

    console.log(imageData)

    let channelData = []
    // Raw image data.
    if (imageData.compressionMethod === 0){
        channelData[0] = imageDataArray.slice(imageSize, imageSize * 2);
        channelData[1] = imageDataArray.slice(0, imageSize);
        channelData[2] = imageDataArray.slice(imageSize * 2, imageSize * 3);
        if (channels === 4){
            channelData[3] = imageDataArray.slice(imageSize * 3, imageSize * 4);
        } else {
            channelData[3] = new Array(imageSize).fill(255);
        }

    // RLE compressed image data.
    } else if (imageData.compressionMethod === 1) {
        let rowSizes = [];
        for (let i = 0; i < channels; i++) {
            [rowSizes[i], offset] = decodeTypedArray(dataview, offset, height * 2, 'uint16');
        }

        for (let i = 0; i < channels; i++) {
            [channelData[i], offset] = decodeRLE(dataview, rowSizes[0], offset);
        }

        if (channels < 4) {
            channelData[3] = new Array(imageSize).fill(255);
        }

    // Zip files.
    } else {
        console.log('Unsupported compression method.')
    }

    let rgbaImage = [];
    for (let i = 0; i < channelData[0].length; i++) {
        rgbaImage.push(channelData[0][i]);
        rgbaImage.push(channelData[1][i]);
        rgbaImage.push(channelData[2][i]);
        rgbaImage.push(channelData[3][i]);
    }
    const clampedImage = new Uint8ClampedArray(rgbaImage);
    imageData.imageData = new ImageData(clampedImage, width, height)

    return imageData
}

function getImageDom(psd){
    const img = new Image(psd.fileHeader.width, psd.fileHeader.height);

    hideCanvas.width = psd.fileHeader.width;
    hideCanvas.height = psd.fileHeader.height;

    hideCanvasCtx.putImageData(psd.imageData.imageData, 0, 0);
    img.src = hideCanvas.toDataURL("image/png");
    hideCanvasCtx.clearRect(0, 0, hideCanvas.width, hideCanvas.height);

    return img
}