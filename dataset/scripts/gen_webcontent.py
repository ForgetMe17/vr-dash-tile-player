#!/usr/bin/env python
# coding: utf-8

# In[1]:


import sys
import argparse
import json

parser = argparse.ArgumentParser(description="自动生成dash所需要的streaming.json和6.html")
parser.add_argument('--base_dir')
parser.add_argument('--row')
parser.add_argument('--gop')
args = parser.parse_args()
print(args)


# In[2]:


# input: arg1-base_dir arg2-row arg3-col arg4-gop
gop=int(args.gop)
num_row=int(args.row)
num_col=int(args.row)
face_w=852
face_h=720
face_cubic=720
dash_len=gop*0.033
base_dir=args.base_dir


# In[3]:


def get_cor_pos(face, row, col, tile_row, tile_col, face_cubic):
    const_off = face_cubic * 0.5
    if face == 0:
        off_row = -(row+0.5) * face_cubic + tile_row/2 * face_cubic
        off_col = (col+0.5) * face_cubic - tile_col/2 * face_cubic
        [rx, ry, rz] = [0, 270, 0]
        [x_, y_, z_] = [const_off, off_row / tile_row, off_col / tile_col]
    elif face == 1:
        off_row = -(row+0.5) * face_cubic + tile_row/2 * face_cubic
        off_col = -(col+0.5) * face_cubic + tile_col/2 * face_cubic
        [rx, ry, rz] = [0, 90, 0]
        [x_, y_, z_] = [-const_off, off_row / tile_row, off_col / tile_col]
    elif face == 2:
        off_row = -(row+0.5) * face_cubic + tile_row/2 * face_cubic
        off_col = (col+0.5) * face_cubic - tile_col/2 * face_cubic
        [rx, ry, rz] = [90, 0, 0]
        [x_, y_, z_] = [off_col / tile_col, const_off, off_row / tile_row]
    elif face == 3:
        off_row = (row+0.5) * face_cubic - tile_row/2 * face_cubic
        off_col = (col+0.5) * face_cubic - tile_col/2 * face_cubic
        [rx, ry, rz] = [-90, 0, 0]
        [x_, y_, z_] = [off_col / tile_col, -const_off, off_row / tile_row]
    elif face == 4:
        off_row = -(row+0.5) * face_cubic + tile_row/2 * face_cubic
        off_col = (col+0.5) * face_cubic - tile_col/2 * face_cubic
        [rx, ry, rz] = [0, 0, 0]
        [x_, y_, z_] = [off_col / tile_col, off_row / tile_row, -const_off]
    elif face == 5:
        off_row = -(row+0.5) * face_cubic + tile_row/2 * face_cubic
        off_col = -(col+0.5) * face_cubic + tile_col/2 * face_cubic
        [rx, ry, rz] = [0, 180, 0]
        [x_, y_, z_] = [off_col / tile_col, off_row / tile_row, const_off]
    return [rx, ry, rz, x_, y_, z_]


# In[4]:


face_list = []
label_video = ""
label_a_entity = ""
video_idx = 0
for face in range(0, 6):
    row_list = []
    for row in range(0, num_row):
        col_list = []
        for col in range(0, num_col):
            # json doc
            col_dict = {}
            col_dict['src'] = "face%d/tile%d/dash/stream.mpd" % (face, row * num_col + col)
            col_dict['width'] = face_w / num_col
            col_dict['height'] = face_h / num_row
            [rx, ry, rz, x_, y_, z_] = get_cor_pos(face, row, col, num_row, num_col, face_cubic)
            col_dict['rx'] = rx
            col_dict['ry'] = ry
            col_dict['rz'] = rz
            col_dict['x'] = x_
            col_dict['y'] = y_
            col_dict['z'] = z_
            col_list.append(col_dict)
            
            # html doc
            label_video += """<video id="video_%d" preload="auto" width="%d" height="%d" autoplay loop="false" crossOrigin="anonymous" muted>
            </video>""" % (video_idx, face_cubic/num_row, face_cubic/num_row)
            label_a_entity += """<a-entity material="shader: flat; src: #video_%d" 
            geometry="primitive: plane; width: %d; height: %d;"
                        position="%d %d %d"
                        rotation="%d %d %d"
                        visible="true">
                        </a-entity>	""" % (video_idx, face_cubic/num_row, face_cubic/num_row, x_, y_, z_, rx, ry, rz)
            video_idx += 1
        row_list.append(col_list)
    face_list.append(row_list)


# In[5]:


json_file = {}
json_file['tiles'] = face_list
json_file['baseUrl'] = "https://10.134.116.112:5555/dataset/" + base_dir + '/'
json_file['face'] = 6
json_file['row'] = num_row
json_file['col'] = num_col
json_file['duration'] = dash_len
json_file['ssresults'] = "ssresultstile.json"
with open(base_dir + "/streaming.json", "w") as f:
    json.dump(json_file, f)


# In[6]:


html_doc = """<!DOCTYPE html>

<html lang="en">

    <head>

		<meta charset="utf-8"/>
		<title>ball_video</title>
		
		<script src="./aframe/dist/aframe-master.js"></script>

		<style>
			body {
				background-color: #000000;
			}
		</style>
		
	</head>
	
    <body>

		<a-scene>

			<a-camera></a-camera>

			<a-assets>
%s
			</a-assets>
	  
%s

		</a-scene>
        
	</body>
	
</html>""" % (label_video, label_a_entity)
with open("../aframe-based-tile-player/6_%d_%d.html"%(num_row, num_col), "w+") as f:
    f.write(html_doc)


# In[ ]:





# In[7]:


# import matplotlib.pyplot as plt
# def get_cor_pos(face, row, col, tile_row, tile_col, face_cubic):
#     off_row = -(row+0.5) * face_cubic / tile_row + 0.5 * face_cubic
#     off_col = -(col+0.5) * face_cubic / tile_col + 0.5 * face_cubic
#     off_row *= 2
#     off_col *= 2
#     if face == 0:
#         [rx, ry, rz] = [0, 270, 0]
#         [x_, y_, z_] = [face_cubic/2, off_row, off_col]
#     elif face == 1:
#         [rx, ry, rz] = [0, 90, 0]
#         [x_, y_, z_] = [-face_cubic/2, off_row, off_col]
#     elif face == 2:
#         [rx, ry, rz] = [90, 0, 180]
#         [x_, y_, z_] = [off_col, face_cubic/2, off_row]
#     elif face == 3:
#         [rx, ry, rz] = [-90, 0, 180]
#         [x_, y_, z_] = [off_col, -face_cubic/2, off_row]
#     elif face == 4:
#         [rx, ry, rz] = [0, 0, 0]
#         [x_, y_, z_] = [off_col, off_row, face_cubic/2]
#     elif face == 5:
#         [rx, ry, rz] = [0, 180, 0]
#         [x_, y_, z_] = [off_col, 0, -face_cubic/2]
#     return [x_, y_, z_]
# %matplotlib notebook
# fig = plt.figure() 
# colorc= ['red', 'green', 'blue', 'yellow', 'black', 'white']
# ax = fig.add_subplot(111, projection='3d') 
# for i in range(0, 6):
#     for j in range(0, 3):
#         for k in range(0, 3):
#             [x_, y_, z_] = get_cor_pos(i, j, k, 3, 3,100)
#             print([x_, y_, z_])
#             ax.scatter(x_, y_, z_, c=colorc[i])


# In[8]:


3/2


# In[ ]:




