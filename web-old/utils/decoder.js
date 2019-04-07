// decode functions

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