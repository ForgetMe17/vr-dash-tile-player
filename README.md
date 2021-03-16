# vr-dash-tile-player

### Tools and Frameworks we use

1. dash.js - For adaptive bitrate streaming via DASH.
2. three.js - For 3D rendering, with CSS3DRenderer.js so far (WebXR not supported).
3. aframe - For 3D rendering (WebXR supported for any videos based on VP9).

### ABR Algorithms we use

1. FOVRule - Choose the bitrates for each tile according to FOV.
2. HighestBitrateRule - Always choose the highest bitrate for each tile.

Default: Using FOVRule as default. If need please change the config in HTML page.

### How to run

##### Player over three.js (No more updates)

1. Run the HTML file via HTTP address (e.g., http://localhost/vr-dash-tile-player/CSS_VR6_dashjs.html).
2. Confirm the location of JSON file and the Rule you want to use in HTML page, then click "link".
3. Click "load" to initialize MediaPlayer according to JSON description.
4. Click "Play" and "Pause" to control the player.

##### Player over aframe

1. Run the HTML file via HTTP address (e.g., http://localhost/vr-dash-tile-player/aframe_VR6_dashjs_list.html).
2. Confirm the location of JSON file, the Mode (VOD/LIVE) and the Rule(FOVRule/HighestBitrateRule) you want to use in HTML page, then click "link".
3. Click "aframe" to load aframe page.
4. Click "load" to initialize MediaPlayer according to JSON description.
5. Click "Play" and "Pause" to control the player.
6. When using FOVRule, dragging the view in iframe would activate bitrate selection based on FOV.

### Media Preprocessing

1. DASH Adaptive Streaming for HTML 5 Video (Webm) : https://developer.mozilla.org/en-US/docs/Web/Media/DASH_Adaptive_Streaming_for_HTML_5_Video
2. FFMPEG + Bento4 (MP4)
3. If you want to load the media files locally, you need to set up a HTTP file server on your device: https://www.jianshu.com/p/1f53e649b932 (Chinese only)

( Processed dataset in HUST: http://222.20.77.111/processed )

( Precessed dataset in Cloud Drive: https://pan.baidu.com/s/1sfRAl8zdqnERUhsLAqo6rA Password：hust )
