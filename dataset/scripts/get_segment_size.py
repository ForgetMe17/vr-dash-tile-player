# 要添加一个新单元，输入 '# %%'
# 要添加一个新的标记单元，输入 '# %% [markdown]'
# %%
import numpy as np
import os
import sys
import argparse


# %%
parser = argparse.ArgumentParser(description="自动生成dash所需要的streaming.json和6.html")
parser.add_argument('--base_dirname')
parser.add_argument('--row')
parser.add_argument('--gop')
args = parser.parse_args()
print(args)


# %%
def sortm4s(s):
    return int(s.split(".")[0][4:])


# %%
def get_view_data(tile_row, gop, dash_dir):
    if not os.path.exists(dash_dir):
        print("Not found: " + dash_dir)
        sys.exit(0)
    face_list = []
    for face in range(0, 6):
        tile_list = []
        for tile_idx in range(0, tile_row * tile_row):
            tile_folder = "%s/face%d/tile%d/dash" % (dash_dir, face, tile_idx)

            high_quality = "%s/video/avc1/1" % (tile_folder)
            high_list = []
            # print(os.path.exists(high_quality))
            for _, _, files in os.walk(high_quality):
                init_file = files[0]
                m4s_files = files[1:]
                m4s_files.sort(key=sortm4s)
                m4s_files.append(init_file)
                for f in m4s_files:
                    file_path = os.path.join(high_quality, f)
                    high_list.append(f)
                    high_list.append(os.path.getsize(file_path))
            
            low_quality = "%s/video/avc1/2" % (tile_folder)
            low_list = []
            for _, _, files in os.walk(low_quality):
                init_file = files[0]
                m4s_files = files[1:]
                m4s_files.sort(key=sortm4s)
                m4s_files.append(init_file)
                for f in m4s_files:
                    file_path = os.path.join(low_quality, f)
                    low_list.append(f)
                    low_list.append(os.path.getsize(file_path))
            tile_list.append([high_list, low_list])
        face_list.append(tile_list)
    return face_list


# %%
tile_row = int(args.row)
gop = int(args.gop)
base_dirname = args.base_dirname
dash_dir = "dashed/%s" % (base_dirname)
face_list = get_view_data(tile_row, gop, dash_dir)
file_name = "segment_size/%s.npy" % (base_dirname)
np.save(file_name, face_list)
