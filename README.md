# vr-dash-tile-player

### Tools and Frameworks we use

1. dash.js - For adaptive bitrate streaming via DASH.
2. three.js - For 3D rendering.

### ABR Algorithms we use

1. FOVRule - Choose the bitrates for each tile according to FOV.
2. HighestBitrateRule - Always choose the highest bitrate for each tile.

Default: Using FOVRule as default. If need please change the config in HTML file.

### How to run

1. Confirm the location of JSON file and the Rule you want to use in HTML file, then save it.
2. Run the HTML file via HTTP address (e.g., http://localhost/vr-dash-tile-player/CSS_VR6_dashjs.html).
