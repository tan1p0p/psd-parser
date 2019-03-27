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

        const layerMaskOffset = psd.layerMask.offset;
        psd.layerMask.length = decodeNumeric(dataview, layerMaskOffset, 'uint32')[0];
        psd.layerMask.layerInfo = getLayerInfo(dataview, arrayBuffer, layerMaskOffset + 4);


        // ==================
        // Image Data Section
        // ==================
        // Image pixel data.

        psd.imageData = {};
        psd.imageData.offset = psd.layerMask.offset + psd.layerMask.length + 4;

        const imageDataOffset = psd.imageData.offset;
        psd.imageData.length = psd.size - (imageDataOffset + 2);

        psd.imageData.compressionMethod = decodeNumeric(dataview, imageDataOffset, 'uint16')[0];
        psd.imageData.imageDataArray = decodeTypedArray(dataview, imageDataOffset + 2, psd.imageData.length, 'uint8');

        psd.imageData.imageData = getImageData(dataview, psd);

        // image = getImageDom(psd);

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

    return channelData;
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
    const  layerInfo = {};
    [layerInfo.length, offset] = decodeNumeric(dataview, offset, 'uint32');
    [layerInfo.layerCount, offset] = decodeNumeric(dataview, offset, 'uint16');

    layerInfo.layerRecords = [];
    for (let i = 0; i < layerInfo.layerCount; i++) {
        const layerRecord = {};

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

        console.log(layerRecord)
        break
    }
}

function getImageData(dataview, psd){
    const imageSize = psd.fileHeader.imageSize;
    const height = psd.fileHeader.height;

    if (psd.imageData.compressionMethod === 0){
        // Raw image data.
        psd.imageData.gChannel = psd.imageData.imageDataArray.slice(imageSize, imageSize * 2);
        psd.imageData.rChannel = psd.imageData.imageDataArray.slice(0, imageSize);
        psd.imageData.bChannel = psd.imageData.imageDataArray.slice(imageSize * 2, imageSize * 3);
        psd.imageData.aChannel = new Array(imageSize).fill(255);

        if (psd.fileHeader.channels === 4){
            psd.imageData.aChannel = psd.imageData.imageDataArray.slice(imageSize * 3, imageSize * 4);
        }

    } else if (psd.imageData.compressionMethod === 1) {
        // RLE compressed image data.
        let offset = psd.imageData.offset + 2;

        [rRowSizes, offset] = decodeTypedArray(dataview, offset, height * 2, 'uint16');
        [gRowSizes, offset] = decodeTypedArray(dataview, offset, height * 2, 'uint16');
        [bRowSizes, offset] = decodeTypedArray(dataview, offset, height * 2, 'uint16');
        if (psd.fileHeader.channels === 4){
            [aRowSizes, offset] = decodeTypedArray(dataview, offset, height * 2, 'uint16');
        }

        const reducer = (sum, currentValue) => sum + currentValue;
        psd.imageData.rChannel = decodeRLE(dataview, rRowSizes, offset);
        offset += rRowSizes.reduce(reducer);
        psd.imageData.gChannel = decodeRLE(dataview, gRowSizes, offset);
        offset += gRowSizes.reduce(reducer);
        psd.imageData.bChannel = decodeRLE(dataview, bRowSizes, offset);
        offset += bRowSizes.reduce(reducer);
        if (psd.fileHeader.channels === 4){
            psd.imageData.aChannel = decodeRLE(dataview, bRowSizes, offset);
        } else {
            psd.imageData.aChannel = new Array(imageSize).fill(255);
        }

    } else {
        console.log('Unsupported compression method.')
    }

    let rgbaImage = [];
    for (let i = 0; i < psd.imageData.rChannel.length; i++) {
        rgbaImage.push(psd.imageData.rChannel[i]);
        rgbaImage.push(psd.imageData.gChannel[i]);
        rgbaImage.push(psd.imageData.bChannel[i]);
        rgbaImage.push(psd.imageData.aChannel[i]);
    }
    const clampedImage = new Uint8ClampedArray(rgbaImage);

    return new ImageData(clampedImage, psd.fileHeader.width, psd.fileHeader.height);
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