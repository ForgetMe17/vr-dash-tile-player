# vr-dash-tile-player

### Tools and Frameworks we use

1. dash.js - For adaptive bitrate streaming via DASH.
2. three.js - For 3D rendering, with CSS3DRenderer.js so far (WebXR not supported).
3. aframe - For 3D rendering (WebXR supported for any videos based on VP9).
4. angular.js - For data virtualization and code optimization.
5. sensitive segmentation suites - For video's content analystics.

### ABR Algorithms we use

1. FOVRule - Choose the bitrates for each tile according to FOV.
2. HighestBitrateRule - Always choose the highest bitrate for each tile.
3. FOVContentRule - Choose the bitrates for each tile according to FOV and contents.
4. DefaultRule - Using default ABR rules by dash.js (observing each tile's stats independently). 

Default: Using FOVRule as default. If need please change the config in HTML page.

### How to run

##### Player over three.js (No more updates)

1. Run the HTML file via HTTP address (e.g., http://localhost/vr-dash-tile-player/CSS_VR6_dashjs.html).
2. Confirm the location of JSON file and the Rule you want to use in HTML page, then click "link". (Choosing a CSV file is necessary if FOVContentRule is selected.)
3. Click "load" to initialize MediaPlayer according to JSON description.
4. Click "Play" and "Pause" to control the player.

##### Player over aframe

1. Run the HTML file via HTTP address (e.g., http://localhost/vr-dash-tile-player/Index.html).
2. Confirm the location of JSON file, the Mode (VOD/LIVE) and the Rule(FOVRule/HighestBitrateRule/FOVContentRule/ThroughputRule) you want to use in HTML page, then click "link".
3. Click "aframe" to load aframe page.
4. Click "load" to initialize MediaPlayer according to JSON description.
5. Click "Play" and "Pause" to control the player.
6. When using FOVRule/FOVContentRule, dragging the view in iframe would activate bitrate selection based on FOV.

### Media Preprocessing

1. DASH Adaptive Streaming for HTML 5 Video (Webm) : https://developer.mozilla.org/en-US/docs/Web/Media/DASH_Adaptive_Streaming_for_HTML_5_Video
2. FFMPEG + Bento4 (MP4) : http://www.ffmpeg.org/documentation.html , https://www.bento4.com/documentation/
3. If you want to load the media files locally, you need to set up a HTTP file server on your device: https://www.jianshu.com/p/1f53e649b932 (Chinese only)
4. When applying FOVContentRule offline, it's necessary to compute the contents' weights in advanced. We capture each tile's with a interval by FFMPEG then adopt Semantic-Segmentation-Suite (based on Tensorflow v2) to do the content analytics, with the result showing as an embedded JSON file. A sample JSON file based on dataset CMPVP907 is embedded in the dataset which can be used directly when playing the related video.


Here is an example of media preprocessing for our platform with an ERP video. Use all the commands in a .sh file would be simpler.
(if you have a CMP video, just skip the steps of ERP/CMP converting.)

1. Make sure you have installed the tools we need to use: FFMPEG, Bento4.
2. Use FFMPEG to convert your video from ERP mode to CMP mode (if you have a CMP video, just skip this step). Here's the code for converting an ERP video to a CMP video with the size 4320 x 2880 (each face with 1440 x 1440) using VP9 coder (all the parameters can be customized according to your requirement, more info please check FFMPEG official documentation):
```
ffmpeg -i ERP_video.mp4 -vf v360=e:c3x2:cubic:w=4320:h=2880:out_pad=0 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an CMP_video.mp4
```
3. The output video from step 2 should be a single video with 2 x 3 faces embedded together. Use FFMPEG to slice it into 6 video files:
```
ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=0*(in_w/3):y=0*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face0.mp4
ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=1*(in_w/3):y=0*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face1.mp4
ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=2*(in_w/3):y=0*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face2.mp4
ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=0*(in_w/3):y=1*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face3.mp4
ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=1*(in_w/3):y=1*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face4.mp4
ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=2*(in_w/3):y=1*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face5.mp4
```
4. The output videos from step 3 should be six videos as six faces in CMP mode. Use FFMPEG to trancode the videos in different bitrates. ```-crf``` is used to control the video's quality (the parameter smaller, the quality better):
```
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face0_60.mp4
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face0_40.mp4
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face0_20.mp4
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face0_0.mp4
...
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face5_60.mp4
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face5_40.mp4
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face5_20.mp4
ffmpeg -i face0.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an face5_0.mp4
```
5. The output videos from step 4 should be six sets of videos with different qualities. Use Bento4 to convert them into fragment format for segmentation. ```--fragment-duration``` is used to set the length of each segment (millisecond):
```
mp4fragment --fragment-duration 1000 face0_60.mp4 f_face0_60.mp4
mp4fragment --fragment-duration 1000 face0_40.mp4 f_face0_40.mp4
mp4fragment --fragment-duration 1000 face0_20.mp4 f_face0_20.mp4
mp4fragment --fragment-duration 1000 face0_0.mp4 f_face0_0.mp4
...
mp4fragment --fragment-duration 1000 face5_60.mp4 f_face5_60.mp4
mp4fragment --fragment-duration 1000 face5_40.mp4 f_face5_40.mp4
mp4fragment --fragment-duration 1000 face5_20.mp4 f_face5_20.mp4
mp4fragment --fragment-duration 1000 face5_0.mp4 f_face5_0.mp4
```
6. Use Bento4 to convert them into segments for DASH streaming:
```
mp4dash --output-dir=face0 --mpd-name=face0.mpd f_face0_60.mp4 f_face0_40.mp4 f_face0_20.mp4 f_face0_0.mp4
...
mp4dash --output-dir=face5 --mpd-name=face5.mpd f_face5_60.mp4 f_face5_40.mp4 f_face5_20.mp4 f_face5_0.mp4
```
7. If audio is necessary, please follow the steps to extract it from the original video file. Here we set audio as an independent track, you can also embed it into any one of faces' tracks:
```
ffmpeg -i ERP_video.mp4 -vn -acodec copy -y audio.mp4
mp4fragment --fragment-duration 1000 audio.mp4 f_audio.mp4
mp4dash --output-dir=audio --mpd-name=audio.mpd f_audio.mp4
```
8. Here we finish all the steps. A JSON file would be necessary if you want to play it more convenient in our platform. If audio or ssresults (results from sensitive segmentation) is unavailable, please change it as ```"audio": ""``` or ```"ssresults": ""```:
```
{
	"baseUrl": "[Your files' location]",
	"face": 6,
	"row": 1,
	"col": 1,
	"duration": 1,
    "tiles": [
		[[{"src": "face0/face0.mpd", "width": "1440", "height": "1440", "x": 720, "y": 0, "z": 0, "rx": 0, "ry": 270, "rz": 0}]],
		[[{"src": "face1/face1.mpd", "width": "1440", "height": "1440", "x": -720, "y": 0, "z": 0, "rx": 0, "ry": 90, "rz": 0}]],
		[[{"src": "face2/face2.mpd", "width": "1440", "height": "1440", "x": 0, "y": 720, "z": 0, "rx": 90, "ry": 0, "rz": 180}]],
		[[{"src": "face3/face3.mpd", "width": "1440", "height": "1440", "x": 0, "y": -720, "z": 0, "rx": -90, "ry": 0, "rz": 180}]],
		[[{"src": "face4/face4.mpd", "width": "1440", "height": "1440", "x": 0, "y": 0, "z": -720, "rx": 0, "ry": 0, "rz": 0}]],
		[[{"src": "face5/face5.mpd", "width": "1440", "height": "1440", "x": 0, "y": 0, "z": 720, "rx": 0, "ry": 180, "rz": 0}]]
	],
	"audio": "audio/audio.mpd",
	"ssresults": "ssresults.json"
}
```

( All processed dataset in HUST: http://222.20.77.111/processed )

( Precessed dataset CMPVP907 in Cloud Drive: https://pan.baidu.com/s/1LAku9Pq6d6_mP6jntEFkGw Password：hust )
