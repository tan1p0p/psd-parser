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