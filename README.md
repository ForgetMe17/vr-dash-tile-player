# vr-dash-tile-player

### Tools and Frameworks we use

1. dash.js - For adaptive bitrate streaming via DASH.
2. three.js - For 3D rendering, with CSS3DRenderer.js so far (WebXR not supported).
3. aframe - For 3D rendering (WebXR supported for any videos based on VP9).
4. sensitive segmentation suites - For video's content analystics.

### ABR Algorithms we use

1. FOVRule - Choose the bitrates for each tile according to FOV.
2. HighestBitrateRule - Always choose the highest bitrate for each tile.
3. FOVContentRule - Choose the bitrates for each tile according to FOV and contents.
4. ThroughputRule - Choose the bitrates by observing each tile's throughput history independently (by dash.js). 

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
2. FFMPEG + Bento4 (MP4)
3. If you want to load the media files locally, you need to set up a HTTP file server on your device: https://www.jianshu.com/p/1f53e649b932 (Chinese only)
4. When applying FOVContentRule offline, it's necessary to compute the contents' weights in advanced. We capture each tile's with a interval by FFMPEG then adopt Semantic-Segmentation-Suite (based on Tensorflow v2) to do the content analytics, with the result showing as an embedded JSON file. A sample JSON file based on dataset CMPVP907 is embedded in the dataset which can be used directly when playing the related video.

( All processed dataset in HUST: http://222.20.77.111/processed )

( Precessed dataset CMPVP907 in Cloud Drive: https://pan.baidu.com/s/1LAku9Pq6d6_mP6jntEFkGw Password：hust )
