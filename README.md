# vr-dash-tile-player

### Tools and Frameworks we use

1. dash.js - For adaptive bitrate streaming via DASH.
2. three.js - For 3D rendering, with CSS3DRenderer.js so far (WebXR not supported).

### ABR Algorithms we use

1. FOVRule - Choose the bitrates for each tile according to FOV.
2. HighestBitrateRule - Always choose the highest bitrate for each tile.

Default: Using FOVRule as default. If need please change the config in HTML page.

### How to run

1. Run the HTML file via HTTP address (e.g., http://localhost/vr-dash-tile-player/CSS_VR6_dashjs.html).
2. Confirm the location of JSON file and the Rule you want to use in HTML page, then click "link".
3. Click "load" to initialize MediaPlayer according to JSON description.
4. Click "Play" and "Pause" to control the player.

### Media Preprocessing

1. DASH Adaptive Streaming for HTML 5 Video (Webm) : https://developer.mozilla.org/en-US/docs/Web/Media/DASH_Adaptive_Streaming_for_HTML_5_Video
2. FFMPEG + Bento4 (MP4)
