import struct

import matplotlib.pyplot as plt
import numpy as np

path = 'psd/illust2.psd'
with open(path, 'rb') as f:
    psd_data = f.read()

offset = 0

def continue_unpack(fmt, fmt_size, buffer, offset=0):
    data = struct.unpack_from(fmt, buffer, offset)
    next_offset = offset + fmt_size
    return data, next_offset

def get_RLE_data(compressed_sizes, img_np, psd_data, offset):
    for row_count, compressed_size in enumerate(compressed_sizes):
        row_num = int(compressed_size / 2)

        for _ in range(row_num):
            sign, offset = continue_unpack('>b', 1, psd_data, offset)
            if sign[0] < 0:
                value, offset = continue_unpack('>B', 1, psd_data, offset)
                for col_count in range(abs(sign[0]) + 1):
                    img_np[row_count][col_count] = value[0]
            else:
                for col_count in range(abs(sign[0]) + 1):
                    value, offset = continue_unpack('>B', 1, psd_data, offset)
                    img_np[row_count][col_count] = value[0]

    return img_np, offset

# ===================
# File Header Section
# ===================
signature,  offset = continue_unpack('>4s', 4, psd_data, offset) # '8BPS'
version,    offset = continue_unpack('>H',  2, psd_data, offset) # 1
reserved,   offset = continue_unpack('>3H', 6, psd_data, offset) # 0, 0, 0
channels,   offset = continue_unpack('>H',  2, psd_data, offset) # 3
height,     offset = continue_unpack('>I',  4, psd_data, offset) # 4500
width,      offset = continue_unpack('>I',  4, psd_data, offset) # 3209
depth,      offset = continue_unpack('>H',  2, psd_data, offset) # 8
color_mode, offset = continue_unpack('>H',  2, psd_data, offset) # 3(RGB)

print('header info:', signature, version, channels, height, width, depth, color_mode)



# =======================
# Color Mode Data Section
# =======================
## Only indexed color and duotone have color mode data.
## For all other modes, this section is just the 4-byte length field, which is set to zero.

color_mode_sec_length, offset = continue_unpack('>I', 4, psd_data, offset)
offset += color_mode_sec_length[0]
# TODO: Read color mode data section when color mode is indexed color.
print('color_mode_sec_length:', color_mode_sec_length)



# =======================
# Image Resources Section
# =======================
## Some settings section. 

img_resources_sec_length, offset = continue_unpack('>I', 4, psd_data, offset)
offset += img_resources_sec_length[0]
# TODO: Read image resources section.
print('img_resources_sec_length:', img_resources_sec_length)



# ==================================
# Layer and Mask Information Section
# ==================================
## Some settings section. 

layer_mask_sec_length, offset = continue_unpack('>I', 4, psd_data, offset)
print('layer_mask_sec_length:', layer_mask_sec_length)

# Layer info
layer_length, offset = continue_unpack('>I', 4, psd_data, offset)
layer_count, offset = continue_unpack('>H', 2, psd_data, offset)
print('layer_length, layer_count:', layer_length, layer_count)

ch_list = {
    -1: 'a',
    0: 'r',
    1: 'g',
    2: 'b',
}


for i in range(layer_count[0]):
    # Information about each layer.
    layer_coordinates, offset = continue_unpack('>4I', 16, psd_data, offset)
    layer_channels, offset = continue_unpack('>H', 2, psd_data, offset)
    print('    coordinates, channels:', layer_coordinates, layer_channels)

    layer_ch_info = []
    for j in range(layer_channels[0]):
        layer_channel_id, offset = continue_unpack('>h', 2, psd_data, offset)
        layer_channel_len, offset = continue_unpack('>I', 4, psd_data, offset)
        layer_ch_info.append([layer_channel_id[0], layer_channel_len[0]])
        print('        channel_id, channel_len:', layer_channel_id, layer_channel_len)

    layer_blend_mode_sig, offset = continue_unpack('>4s', 4, psd_data, offset)
    layer_blend_mode_key, offset = continue_unpack('>4s', 4, psd_data, offset)
    print('    blend_mode_sig, blend_mode_key:', layer_blend_mode_sig, layer_blend_mode_key)

    layer_opacity, offset = continue_unpack('>B', 1, psd_data, offset)
    layer_clipping, offset = continue_unpack('>B', 1, psd_data, offset)
    layer_flags, offset = continue_unpack('>B', 1, psd_data, offset)
    print('    opacity, clipping, flags:', layer_opacity, layer_clipping, layer_flags)

    filler, offset = continue_unpack('>B', 1, psd_data, offset) # Data only for fill.

    layer_extra_length, offset = continue_unpack('>I', 4, psd_data, offset)
    print('    extra_length:', layer_extra_length)

    offset += layer_extra_length[0]
    # TODO: Read extra data field.


    layer_top, layer_left, layer_bottom, layer_right = layer_coordinates
    layer_height, layer_width = (layer_bottom - layer_top), (layer_right - layer_left)
    layer_size = layer_height * layer_width


    # Channel image data.
    layer_data = {}
    for ch_info in layer_ch_info:
        ch_color = ch_list[ch_info[0]]
        ch_length = ch_info[1] - 2

        ch_compression, offset = continue_unpack('>H', 2, psd_data, offset)

        if ch_compression[0] == 0:
            ch_tuple, offset = continue_unpack('>{}B'.format(ch_length), ch_length, psd_data, offset)
            ch_np = np.array(list(ch_tuple)).reshape(layer_height, layer_width)
        elif ch_compression[0] == 1:
            compressed_sizes, offset = continue_unpack('>{}H'.format(height[0]), height[0] * 2, psd_data, offset)
            ch_np = np.zeros((layer_height, layer_width), dtype='uint8')
            ch_np, offset = get_RLE_data(compressed_sizes, ch_np, psd_data, offset)
        else:
            print('Unsupported format.')

        layer_data[ch_color] = ch_np

    layer_img = np.stack([layer_data['r'], layer_data['g'], layer_data['b']], axis=-1)
    plt.imshow(layer_img.astype('uint8'))
    plt.show()

    break


"""
offset += layer_mask_sec_length[0]


# ==================
# Image Data Section
# ==================
## Image pixel data.


img_length = width[0] * height[0]

# image_data_sec_length, offset = continue_unpack('>I', 4, psd_data, offset)
compression, offset = continue_unpack('>H', 2, psd_data, offset)
print('compression:', compression)

if compression[0] == 0:
    r, offset = continue_unpack('>{}B'.format(img_length), img_length, psd_data, offset)
    g, offset = continue_unpack('>{}B'.format(img_length), img_length, psd_data, offset)
    b, offset = continue_unpack('>{}B'.format(img_length), img_length, psd_data, offset)

    r_np = np.array(list(r)).reshape(height[0], width[0])
    g_np = np.array(list(g)).reshape(height[0], width[0])
    b_np = np.array(list(b)).reshape(height[0], width[0])

    img = np.stack([r_np, g_np, b_np], axis=-1)
    plt.imshow(img.astype('uint8'))
    plt.show()

elif compression[0] == 1:
    compressed_sizes_r, offset = continue_unpack('>{}H'.format(height[0]), height[0] * 2, psd_data, offset)
    compressed_sizes_g, offset = continue_unpack('>{}H'.format(height[0]), height[0] * 2, psd_data, offset)
    compressed_sizes_b, offset = continue_unpack('>{}H'.format(height[0]), height[0] * 2, psd_data, offset)

    r_np = np.zeros((height[0], width[0]), dtype='uint8')
    r_np, offset = get_RLE_data(compressed_sizes_r, r_np, psd_data, offset)

    g_np = np.zeros((height[0], width[0]), dtype='uint8')
    g_np, offset = get_RLE_data(compressed_sizes_g, g_np, psd_data, offset)

    b_np = np.zeros((height[0], width[0]), dtype='uint8')
    b_np, offset = get_RLE_data(compressed_sizes_b, b_np, psd_data, offset)

    img = np.stack([r_np, g_np, b_np], axis=-1)
    plt.imshow(img)
    plt.show()

"""