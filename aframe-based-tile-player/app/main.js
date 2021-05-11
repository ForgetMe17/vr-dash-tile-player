var app = angular.module('DashPlayer', ['angular-flot']);

app.controller('DashController', ['$scope','$interval', function ($scope, $interval) {

    $interval(function () {}, 1);

    //// Global variables for storage
    $scope.players = [];  // Container for players, which is easy for us to operate in them.
    $scope.playerCount = 0;
    $scope.buffer_empty_flag = [];  // Flags for players, showing whether the player is frozen or not.
    $scope.lon = 90, $scope.lat = 0;  // Longitude and latitude in spherical coordinates.
    $scope.pointerX, $scope.pointerY;  // Position of mouse click
    $scope.contents = {};  // Contents from JSON file
    $scope.startupTime = new Date().getTime();  // Initialize the startup time
    $scope.totalQOE = 0;  // Compute the QoE considering all playing tiles
    $scope.viewerQOE = 0;  // Compute the QoE considering the tiles in FOV
    $scope.contentQOE = 0;  // Compute the QoE considering the tiles in FOV with contents as well

    $scope.normalizedTime = 0;  // Set the fastest mediaplayer's timeline as the normalized time
    $scope.totalThroughput = 0;  // Data from monitor
    $scope.playerBufferLength = [];  // Data from monitor
    $scope.playerAverageThroughput = [];  // Data from monitor
    $scope.playerTime = [];  // Data from monitor
    $scope.playerDownloadingQuality = [];  // Data from monitor
    $scope.playerFOVScore = [];  // Data from monitor
    $scope.playerContentScore = [];  // Data from monitor
    $scope.playerPastDownloadingQuality = [];  // Data from monitor's playerDownloadingQuality
    $scope.playerCatchUp = [];  // Data from playback controller

    $scope.playerBitrateList = [];  // Data from bitrate list
    $scope.requestList = [];  // Data from all HTTPRequests
    $scope.ssresults = {};  // Data from contents analytics CSV files

    $scope.selectedItem = {  // Save the selected media source
        type:"json",
        value:"http://localhost/CMPVP907/aframeVP907.json"
    };
    $scope.optionButton = "Show Options";  // Save the state of option button
    $scope.selectedRule = "FOVRule";  // Save the selected media source
    $scope.stats = [];  // Save all the stats need to put on the charts
    $scope.chartData_quality = [];  // Save the qualtiy data need to put on the charts
    $scope.chartData_buffer = [];  // Save the buffer data need to put on the charts
    $scope.chartData_throughput = [];  // Save the throughput data need to put on the charts
    $scope.chartState = {  // Save the charts' states
        quality:{
            video_0: {
                data: [], color: '#00CCBE', label: 'video_0'
            },
            video_1:{
                data: [], color: '#ffd446', label: 'video_1'
            },
            video_2:{
                data: [], color: '#FF6700', label: 'video_2'
            },
            video_3: {
                data: [], color: '#44c248', label: 'video_3'
            },
            video_4:{
                data: [], color: '#ff000a', label: 'video_4'
            },
            video_5:{
                data: [], color: '#b300ff', label: 'video_5'
            },
            audio:{
                data: [], color: '#1100ff', label: 'audio'
            }
        },
        buffer:{
            video_0: {
                data: [], color: '#00CCBE', label: 'video_0'
            },
            video_1:{
                data: [], color: '#ffd446', label: 'video_1'
            },
            video_2:{
                data: [], color: '#FF6700', label: 'video_2'
            },
            video_3: {
                data: [], color: '#44c248', label: 'video_3'
            },
            video_4:{
                data: [], color: '#ff000a', label: 'video_4'
            },
            video_5:{
                data: [], color: '#b300ff', label: 'video_5'
            },
            audio:{
                data: [], color: '#1100ff', label: 'audio'
            }
        },
        throughput:{
            video_0: {
                data: [], color: '#00CCBE', label: 'video_0'
            },
            video_1:{
                data: [], color: '#ffd446', label: 'video_1'
            },
            video_2:{
                data: [], color: '#FF6700', label: 'video_2'
            },
            video_3: {
                data: [], color: '#44c248', label: 'video_3'
            },
            video_4:{
                data: [], color: '#ff000a', label: 'video_4'
            },
            video_5:{
                data: [], color: '#b300ff', label: 'video_5'
            },
            audio:{
                data: [], color: '#1100ff', label: 'audio'
            }
        }
    };


    //// Global variables (flexible)
    $scope.mycanvas = {  // [For capturing each frame] Set the width and height of the canvases
        "width":"120",
        "height":"120"
    };
    $scope.drawmycanvas = {  // [For capturing each frame] Set the width and height of the capture pictures
        "width":"300",
        "height":"150"
    };
    $scope.requestDuration = 3000;  // [For computing total throughput] Set the duration we consider (ms)
    $scope.requestLayBack = 0;  // [For computing total throughput] Set the lay-back time for avoiding the on-going requests (ms)
    $scope.rotateRatio = 0.1148;  // [For focusing FOV] Set the ratio of rotating when switching the angle of view
    $scope.playerBufferToKeep = 6;  // [For initializing mediaplayers] Allows you to modify the buffer that is kept in source buffer in seconds
    $scope.playerStableBufferTime = 6;  // [For initializing mediaplayers] The time that the internal buffer target will be set to post startup/seeks (NOT top quality)
    $scope.playerBufferTimeAtTopQuality = 10;  // [For initializing mediaplayers] The time that the internal buffer target will be set to once playing the top quality
    $scope.playerMinDrift = 0.02;  // [For initializing mediaplayers] The minimum latency deviation allowed
    $scope.lambdaQOE = 1.0;  // [For computing QoE] Value of the quality switches constant
    $scope.miuQOE = 4.3;  // [For computing QoE] Stall weight
    $scope.omegaQOE = 4.3;  // [For computing QoE] Content weight
    $scope.qQOE = 'log';  // [For computing QoE] a mapping function that translates the bitrate of chunk to the quality perceived by the user (Linear || Log)
    $scope.a1QOE = 0.7;  // [For computing QoE] Influence of the quality of Zone 1
    $scope.a2QOE = 0.3;  // [For computing QoE] Influence of the quality of Zone 2
    $scope.a3QOE = 0.0;  // [For computing QoE] Influence of the quality of Zone 3
    $scope.availableStreams = [  // [For setting up the media source] All the available preset media sources
        {
            name:"LVOD",
            json:"http://localhost/CMPVP907/aframeVP907.json",
        },
        {
            name:"SVOD",
            json:"http://222.20.77.111/processed/CMPVP907/aframeVP907.json",
        },
        {
            name:"LIVE",
            json:"http://222.20.77.111/dash/default.json",
        },
        {
            name:"BUNNY",
            url:"https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
        }
    ];
    $scope.rules = ["FOVRule", "HighestBitrateRule", "FOVContentRule", "DefaultRule"];  // [For seeting the ABR rule] All the available preset ABR rules
    $scope.chartOptions = {  // [For printing the chart] Set up the style of the charts
        legend: {
            labelBoxBorderColor: '#ffffff',
            placement: 'outsideGrid',
            container: '#legend-wrapper',
            // labelFormatter: function (label, series) {
            //     return '<div  style="cursor: pointer;" id="' + series.type + '.' + series.id + '" onclick="legendLabelClickHandler(this)">' + label + '</div>';
            // }
        },
        series: {
            lines: {
                show: true,
                lineWidth: 2,
                shadowSize: 1,
                steps: false,
                fill: false,
            },
            points: {
                radius: 4,
                fill: true,
                show: true
            }
        },
        grid: {
            clickable: false,
            hoverable: false,
            autoHighlight: true,
            color: '#136bfb',
            backgroundColor: '#ffffff'
        },
        axisLabels: {
            position: 'left'
        },
        xaxis: {
            tickFormatter: function tickFormatter(value) {
                return $scope.players[0].convertToTimeCode(value);
            },
            tickDecimals: 0,
            color: '#136bfb',
            alignTicksWithAxis: 1
        },
        yaxis: {
            min: 0,
            tickLength: 0,
            tickDecimals: 0,
            color: '#136bfb',
            position: 'right',
            axisLabelPadding: 20,
        },
        yaxes: []
    };
    $scope.maxPointsToChart = 30;  // [For printing the chart] Set the maximum of the points printed on the charts
    $scope.IntervalOfSetNormalizedTime = 10;  // [For setting interval] Set the fastest mediaplayer's timeline as the normalized time
    $scope.IntervalOfComputetotalThroughput = 1000;  // [For setting interval] Compute total throughput according to recent HTTP requests
    $scope.IntervalOfComputeQoE = 1000;  // [For setting interval] Compute QoE
    $scope.IntervalOfUpdateStats = 100;  // [For setting interval] Show the data in monitor
    $scope.IntervalOfUpdateFigures = 1000;  // [For setting interval] Show the data in figures
    $scope.IntervalOfCaptures = 500;  // [For setting interval] Capture the pictures from mediaplayers


    //// Variables and functions for UI and options
    // For setting up the media source
    $scope.setStream = function (item) {
        if(item.json){
            $scope.selectedItem.type = "json";
            $scope.selectedItem.value = item.json;
        }else{
            $scope.selectedItem.type = "url";
            $scope.selectedItem.value = item.url;
        }
    };
    $scope.changeStream = function () {
        console.log($scope.selectedItem.value.slice(-4));
        if($scope.selectedItem.value.length > 5 && $scope.selectedItem.value.slice(-4) == "json"){
            $scope.selectedItem.type = "json";
        }else{
            $scope.selectedItem.type = "url";
        }
    };

    // For setting up the ABR rule
    $scope.showoption = function () {
        if($scope.optionButton == "Show Options"){
            document.getElementById('option').style = "background-color: #e2e1e4; z-index: 1000; position: absolute;";
            $scope.optionButton = "Hide Options";
        }else{
            document.getElementById('option').style = "display: none;";
            $scope.optionButton = "Show Options";
        }
    };
    $scope.changeABRStrategy = function (strategy) {
        for(let i = 0; i < $scope.rules.length; i++){
            let d = document.getElementById($scope.rules[i]);
            d.checked = false;
        }
        document.getElementById(strategy).checked = true;
        $scope.selectedRule = strategy;
    };

    // For printing the charts
    $scope.pushData = function (id, type) {
        switch(type) {
            case "quality":
                var data = {
                    id: id,
                    data: $scope.chartState[type][id].data,
                    label: $scope.chartState[type][id].label,
                    color: $scope.chartState[type][id].color,
                    yaxis: $scope.chartData_quality.length + 1,
                    type: type
                };
                $scope.chartData_quality.push(data);
                $scope.chartOptions.yaxes.push({
                    axisLabel: data.label
                });
                break;
            case "buffer":
                var data = {
                    id: id,
                    data: $scope.chartState[type][id].data,
                    label: $scope.chartState[type][id].label,
                    color: $scope.chartState[type][id].color,
                    yaxis: $scope.chartData_buffer.length + 1,
                    type: type
                };
                $scope.chartData_buffer.push(data);
                $scope.chartOptions.yaxes.push({
                    axisLabel: data.label
                });
                break;
            case "throughput":
                var data = {
                    id: id,
                    data: $scope.chartState[type][id].data,
                    label: $scope.chartState[type][id].label,
                    color: $scope.chartState[type][id].color,
                    yaxis: $scope.chartData_throughput.length + 1,
                    type: type
                };
                $scope.chartData_throughput.push(data);
                $scope.chartOptions.yaxes.push({
                    axisLabel: data.label
                });
                break;
        }
        $scope.chartOptions.legend.noColumns = Math.min($scope.chartData_quality.length, 5);
    };
    $scope.plotPoint = function (name, type, value, time) {
        var specificChart = $scope.chartState[type];
        if (specificChart) {
            var data = specificChart[name].data;
            data.push([time, value]);
            if (data.length > $scope.maxPointsToChart) {
                data.splice(0, 1);
            }
        }
    };
    $scope.clearchartData_quality = function () {
        for (var key in $scope.chartState) {
            for (var i in $scope.chartState[key]) {
                $scope.chartState[key][i].data.length = 0;
            }
        }
    };
    $scope.initChartingByMediaType = function (type) {
        var arr = $scope.chartState[type];
        for (var key in arr) {
            var obj = arr[key];
            $scope.pushData(key, type);
        }
    };


    //// Loading sources
    // Get contents through HTTP requests
    function getContents(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = callback;
        xhr.send();
    }

    // Read json file if json is available
     $scope.openJSON = function(url) {
        $scope.players = [];
        $scope.buffer_empty_flag = [];
        $scope.playerCount = 0;
        $scope.lon = 90;
        $scope.lat = 0;
        $scope.contents = {};
        getContents(url, function() {
            $scope.contents = JSON.parse(this.responseText);
            if ($scope.contents.ssresults && $scope.contents.ssresults != "") {
                getContents($scope.contents.baseUrl + $scope.contents.ssresults, function() {
                    $scope.ssresults = JSON.parse(this.responseText);
                });
            }
            document.getElementById('Link').style = "display: none;";
            document.getElementById('Render').style = "display: inline;";
        });
    };

    // Read default json file if json is unavailable, then change the srcs
    $scope.openURLs = function(url) {
        $scope.contents = {};
        getContents('./default.json', function() {
            $scope.contents = JSON.parse(this.responseText);
            let urls = url.split(/[(\n)\n]+/);
            for (let i = 0; i < $scope.contents.face; i++) {
                for (let j = 0; j < $scope.contents.row; j++) {
                    for (let k = 0; k < $scope.contents.col; k++) {
                        $scope.contents.tiles[i][j][k].src = (i * $scope.contents.row * $scope.contents.col + j * $scope.contents.col + k) < urls.length ? urls[i * $scope.contents.row * $scope.contents.col + j * $scope.contents.col + k] : urls[urls.length - 1];
                    }
                }
            }
            document.getElementById('Link').style = "display: none;";
            document.getElementById('Render').style = "display: inline;";
        });
    }


    //// Initialize the aframe page
    // Open the iframe according to the number of faces, rows and cols
    $scope.aframe_init = function() {
        if ($scope.contents == {}) {
            return;
        }
        document.getElementById( 'frame' ).src = "./" + $scope.contents.face + "_" + $scope.contents.row + "_" + $scope.contents.col + ".html";
        $scope.lon = 90;
        $scope.lat = 0;
        document.getElementById('Render').style = "display: none;";
        document.getElementById('Load').style = "display: inline;";
    }


    //// Building mediaplayers
    // Pause in all the players
    $scope.pause_all = function() {
        for (let i = 0; i < $scope.playerCount; i++) {
            $scope.players[i].pause();
            console.log("Player_" + i + " pauses.");
        }
        if ($scope.contents.audio && $scope.contents.audio != "") {
            $scope.players[$scope.playerCount].pause();
            console.log("Audio pauses.");
        }
        document.getElementById('Pause').style = "display: none;";
        document.getElementById('Play').style = "display: inline;";
    };

    // Play in all the players
    $scope.play_all = function() {
        for (let i = 0; i < $scope.playerCount; i++) {
            $scope.players[i].play();
            console.log("Player_" + i + " plays.");
        }
        if ($scope.contents.audio && $scope.contents.audio != "") {
            $scope.players[$scope.playerCount].play();
            console.log("Audio plays.");
        }
        document.getElementById('Play').style = "display: none;";
        document.getElementById('Pause').style = "display: inline;";
    };

    // Triggered when any player's buffer is empty, which to stop all the players and wait for rebuffering.
    function buffer_empty_event(e) {
        $scope.buffer_empty_flag[e.info.count] = true;
        $scope.pause_all();
    }

    // Triggered when any player's buffer is loaded (again), which to start all the players when all-set.
    function buffer_loaded_event(e) {
        if ($scope.buffer_empty_flag[e.info.count] == true) {
            $scope.buffer_empty_flag[e.info.count] = false;
            for (let i = 0; i < $scope.playerCount; i++) {
                if ($scope.buffer_empty_flag[i] == true) {
                    return;
                }
            }
            if ($scope.contents.audio && $scope.contents.audio != "" && $scope.buffer_empty_flag[$scope.playerCount] == true) {
                return;
            }
            $scope.play_all();
        }
    }

    // Initialize when loading the videos
    $scope.initial = function() {
        $scope.initChartingByMediaType('quality');
        $scope.initChartingByMediaType('buffer');
        $scope.initChartingByMediaType('throughput');
        let video, url;

        // Video part
        for (let i = 0; i < $scope.contents.face; i++) {
            for (let j = 0; j < $scope.contents.row; j++) {
                for (let k = 0; k < $scope.contents.col; k++) {
                    video = document.getElementById( "frame" ).contentWindow.document.querySelector("#" + "video_" + [i * $scope.contents.row * $scope.contents.col + j * $scope.contents.col + k]);
                    $scope.players[$scope.playerCount] = new dashjs.MediaPlayer().create();
                    url = $scope.contents.baseUrl + $scope.contents.tiles[i][j][k].src;
                    $scope.buffer_empty_flag[$scope.playerCount] = true;

                    // Don't use dash.js default rules
                    $scope.players[$scope.playerCount].updateSettings({
                        'info': {
                            'id': "video_" + [i * $scope.contents.row * $scope.contents.col + j * $scope.contents.col + k],
                            'count': $scope.playerCount,
                            'face': i,
                            'row': j,
                            'col': k,
                            'duration': $scope.contents.duration,
                            'width': $scope.contents.tiles[i][j][k].width,
                            'height': $scope.contents.tiles[i][j][k].height,
                            'location': {'x': $scope.contents.tiles[i][j][k].x, 'y': $scope.contents.tiles[i][j][k].y, 'z': $scope.contents.tiles[i][j][k].z},
                            'rotation': {'rx': $scope.contents.tiles[i][j][k].rx, 'ry': $scope.contents.tiles[i][j][k].ry, 'rz': $scope.contents.tiles[i][j][k].rz},
                            'totalThroughputNeeded': true
                        },
                        'streaming': {
                            'abr': {
                                'useDefaultABRRules': false
                            },
                            'bufferToKeep': $scope.playerBufferToKeep,
                            'stableBufferTime': $scope.playerStableBufferTime,
                            'bufferTimeAtTopQuality': $scope.playerBufferTimeAtTopQuality,
                            'fastSwitchEnabled': true,
                            'liveDelay': 0, 
                            'liveCatchup': {
                                'enabled': true,
                                    'minDrift': $scope.playerMinDrift
                            }
                        }
                    });

                    // Add my custom quality switch rule, look at [].js to know more about the structure of a custom rule
                    switch ($scope.selectedRule) {
                        case "FOVRule":
                            $scope.players[$scope.playerCount].addABRCustomRule('qualitySwitchRules', 'FOVRule', FOVRule);
                            break;
                        // case "ThroughputRule":
                        // 	$scope.players[$scope.playerCount].addABRCustomRule('qualitySwitchRules', 'MyThroughputRule', MyThroughputRule);
                        // 	break;
                        case "HighestBitrateRule":
                            $scope.players[$scope.playerCount].addABRCustomRule('qualitySwitchRules', 'HighestBitrateRule', HighestBitrateRule);
                            break;
                        case "FOVContentRule":
                            $scope.players[$scope.playerCount].addABRCustomRule('qualitySwitchRules', 'FOVContentRule', FOVContentRule);
                            break;
                        default:
                            $scope.players[$scope.playerCount].updateSettings({
                                'streaming': {
                                    'abr': {
                                        'useDefaultABRRules': true
                                    }
                                }
                            });
                            break;
                    }

                    // Turn on the event listeners and add actions for triggers 
                    $scope.players[$scope.playerCount].on(dashjs.MediaPlayer.events["BUFFER_EMPTY"], buffer_empty_event);
                    $scope.players[$scope.playerCount].on(dashjs.MediaPlayer.events["BUFFER_LOADED"], buffer_loaded_event);

                    // Initializing
                    $scope.players[$scope.playerCount].initialize(video, url, false);
                    $scope.playerBufferLength[$scope.playerCount] = $scope.players[$scope.playerCount].getBufferLength();
                    $scope.playerAverageThroughput[$scope.playerCount] = $scope.players[$scope.playerCount].getAverageThroughput("video");
                    $scope.playerTime[$scope.playerCount] = $scope.players[$scope.playerCount].time();
                    $scope.playerDownloadingQuality[$scope.playerCount] = $scope.players[$scope.playerCount].getQualityFor("video");
                    $scope.playerFOVScore[$scope.playerCount] = 0;
                    $scope.playerContentScore[$scope.playerCount] = 0;
                    $scope.playerBitrateList[$scope.playerCount] = [];
                    $scope.playerCatchUp[$scope.playerCount] = false;

                    $scope.playerCount++;
                }
            }
        }

        // Audio part
        if ($scope.contents.audio && $scope.contents.audio != "") {
            var audio = document.getElementById( "frame" ).contentWindow.document.querySelector("#audio");
            $scope.players[$scope.playerCount] = new dashjs.MediaPlayer().create();
            url = $scope.contents.baseUrl + $scope.contents.audio;
            $scope.buffer_empty_flag[$scope.playerCount] = true;

            $scope.players[$scope.playerCount].updateSettings({
                'info': {
                    'id': "audio",
                    'count': $scope.playerCount,
                    'duration': $scope.contents.duration
                }
            });

            // Turn on the event listeners and add actions for triggers 
            $scope.players[$scope.playerCount].on(dashjs.MediaPlayer.events["BUFFER_EMPTY"], buffer_empty_event);
            $scope.players[$scope.playerCount].on(dashjs.MediaPlayer.events["BUFFER_LOADED"], buffer_loaded_event);

            // Initializing
            $scope.players[$scope.playerCount].initialize(audio, url, false);
            $scope.playerBufferLength[$scope.playerCount] = $scope.players[$scope.playerCount].getBufferLength();;
            $scope.playerAverageThroughput[$scope.playerCount] = $scope.players[$scope.playerCount].getAverageThroughput("audio");
            $scope.playerTime[$scope.playerCount] = $scope.players[$scope.playerCount].time();
            $scope.playerDownloadingQuality[$scope.playerCount] = $scope.players[$scope.playerCount].getQualityFor("audio");
            $scope.playerCatchUp[$scope.playerCount] = false;
        }

        $scope.startupTime = new Date().getTime();
        // Set the fastest mediaplayer's timeline as the normalized time
        setInterval(setNormalizedTime, $scope.IntervalOfSetNormalizedTime);
        // Compute total throughput according to recent HTTP requests
        setInterval(computetotalThroughput, $scope.IntervalOfComputetotalThroughput);
        // Compute QoE
        setInterval(computeQoE, $scope.IntervalOfComputeQoE);
        // Show the data in monitor
        setInterval(updateStats, $scope.IntervalOfUpdateStats);
        // Show the data in figures
        setInterval(updateFigures, $scope.IntervalOfUpdateFigures);
        // Capture the pictures from mediaplayers
        setInterval(function () {
            for (let i = 0; i < $scope.playerCount; i++) {
                document.getElementById("capture_" + i).getContext('2d').drawImage(document.getElementById( "frame" ).contentWindow.document.querySelector("#" + "video_" + i), 0, 0, $scope.drawmycanvas.width, $scope.drawmycanvas.height);
                // img.src = canvas.toDataURL("image/png");
            }
        }, $scope.IntervalOfCaptures);
        document.getElementById('Load').style = "display: none;";
        document.getElementById('Play').style = "display: inline;";
    };

    // Set the fastest mediaplayer's timeline as the normalized time
    function setNormalizedTime() {
        $scope.normalizedTime = $scope.players[0].time();
        for (let i = 0; i < $scope.playerCount; i++) {
            if ($scope.players[i].time() > $scope.normalizedTime) {
                $scope.normalizedTime = $scope.players[i].time();
            }
        }
        if ($scope.contents.audio && $scope.contents.audio != "") {
            if ($scope.players[$scope.playerCount].time() > $scope.normalizedTime) {
                $scope.normalizedTime = $scope.players[$scope.playerCount].time();
            }
        }
    }

    // Compute total throughput according to recent HTTP requests (Total data in ONE second)
    function computetotalThroughput() {
        const precurTime = new Date().getTime();  // Get current time
        const curTime = precurTime - $scope.requestLayBack;
        let TotalDataInAnInterval = 0;  // Byte
        let TotalTimeInAnInterval = $scope.requestDuration;  // ms
        let requestListLength = $scope.requestList.length;
        let requestListIndex = requestListLength - 1;
        let requestTimeIndex = curTime;
        while (requestListLength > 0 && requestListIndex >= 0) {
            let requestFinishTime = $scope.requestList[requestListIndex]._tfinish.getTime();
            let requestResponseTime  = $scope.requestList[requestListIndex].tresponse.getTime();
            if (requestFinishTime > curTime - $scope.requestDuration && requestResponseTime < curTime) {
                // Accumulate the downloaded data (Byte)
                let requestDownloadBytes = $scope.requestList[requestListIndex].trace.reduce((a, b) => a + b.b[0], 0);
                if (requestResponseTime > curTime - $scope.requestDuration) {
                    if (requestFinishTime <= curTime) {
                        TotalDataInAnInterval += requestDownloadBytes;
                    } else {
                        TotalDataInAnInterval += ( requestDownloadBytes * ( ( curTime - requestResponseTime ) / ( requestFinishTime - requestResponseTime ) ) );
                    }
                } else {
                    if (requestFinishTime <= curTime) {
                        TotalDataInAnInterval += ( requestDownloadBytes * ( ( requestFinishTime - (curTime - $scope.requestDuration) ) / ( requestFinishTime - requestResponseTime ) ) );
                    } else {
                        TotalDataInAnInterval += ( requestDownloadBytes * ( $scope.requestDuration / ( requestFinishTime - requestResponseTime ) ) );
                    }
                }
                // Subtract the free time (ms)
                if (requestTimeIndex > requestFinishTime) {
                    TotalTimeInAnInterval -= (requestTimeIndex - requestFinishTime);
                }
                requestTimeIndex = requestResponseTime;						
            }
            requestListIndex--;
        }
        if (curTime - $scope.requestDuration < requestTimeIndex) {
            TotalTimeInAnInterval -= (requestTimeIndex - (curTime - $scope.requestDuration));
        }
        if (TotalDataInAnInterval != 0 && TotalTimeInAnInterval != 0) {
            $scope.totalThroughput = Math.round((8 * TotalDataInAnInterval) / (TotalTimeInAnInterval / 1000));  // bps
        }
    }

    // Compute QoE
    function computeQoE() {
        if ($scope.playerPastDownloadingQuality.length == 0 || $scope.playerDownloadingQuality.length == 0) {
            $scope.totalQOE = NaN;
            $scope.viewerQOE = NaN;
            $scope.contentQOE = NaN;
            $scope.playerPastDownloadingQuality = $scope.playerDownloadingQuality;
            return;
        }
        let pretotalQOE = 0;  // = Quality - miu * Stalls - lambda * Quality switches
        let previewerQOE = 0;  // = [a1 a2 a3] * (Quality - miu * Stalls - lambda * Quality switches)
        let precontentQOE = 0;  // = [a1 a2 a3] * (Quality - miu * Stalls - lambda * Quality switches + omega * Content score)
        for (let i = 0; i < $scope.playerCount; i++) {
            ////////////////////////////////// Regardless of stall, only totalQOE //////////////////////////////////
            let playerSettings = $scope.players[i].getSettings().info;
            // Compute divation between angle of view and location of tile
            let r = Math.sqrt(playerSettings.location.x * playerSettings.location.x + playerSettings.location.y * playerSettings.location.y + playerSettings.location.z * playerSettings.location.z);
            let tile_theta = Math.acos(playerSettings.location.y / (r == 0 ? 1 : r));
            let tile_phi = Math.atan(playerSettings.location.x / (playerSettings.location.z == 0 ? 1 : playerSettings.location.z));
            let view_theta = (90 - $scope.lat) * (Math.PI / 180);
            let view_phi = (270 - $scope.lon >= 0 ? 270 - $scope.lon : 270 - $scope.lon + 360) * (Math.PI / 180);
            let tile_z = Math.sin(tile_theta) * Math.cos(tile_phi);
            tile_z = playerSettings.location.z < 0 ? tile_z < 0 ? tile_z : -tile_z : tile_z;
            let tile_x = Math.sin(tile_theta) * Math.sin(tile_phi);
            let tile_y = Math.cos(tile_theta);
            let view_z = Math.sin(view_theta) * Math.cos(view_phi);
            let view_x = Math.sin(view_theta) * Math.sin(view_phi);
            let view_y = Math.cos(view_theta);
            let divation = Math.acos((tile_z * view_z + tile_x * view_x + tile_y * view_y) / (Math.sqrt(tile_z * tile_z + tile_x * tile_x + tile_y * tile_y) * Math.sqrt(view_z * view_z + view_x * view_x + view_y * view_y))) * (180 / Math.PI);
            switch ($scope.qQOE) {
                case 'linear':
                    pretotalQOE = pretotalQOE + ($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate - $scope.playerBitrateList[i][0].bitrate) - $scope.lambdaQOE * Math.abs($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate - $scope.playerBitrateList[i][$scope.playerPastDownloadingQuality[i]].bitrate);
                    previewerQOE = previewerQOE + (divation < 61 ? $scope.a1QOE : divation < 121 ? $scope.a2QOE : $scope.a3QOE) * (($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate - $scope.playerBitrateList[i][0].bitrate) - $scope.lambdaQOE * Math.abs($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate - $scope.playerBitrateList[i][$scope.playerPastDownloadingQuality[i]].bitrate));
                    break;
                case 'log':
                    pretotalQOE = pretotalQOE + Math.log(($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate - $scope.playerBitrateList[i][0].bitrate) + 1) - $scope.lambdaQOE * Math.abs(Math.log($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate + 1) - Math.log($scope.playerBitrateList[i][$scope.playerPastDownloadingQuality[i]].bitrate + 1));
                    previewerQOE = previewerQOE + (divation < 61 ? $scope.a1QOE : divation < 121 ? $scope.a2QOE : $scope.a3QOE) * (Math.log(($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate - $scope.playerBitrateList[i][0].bitrate) + 1) - $scope.lambdaQOE * Math.abs(Math.log($scope.playerBitrateList[i][$scope.playerDownloadingQuality[i]].bitrate + 1) - Math.log($scope.playerBitrateList[i][$scope.playerPastDownloadingQuality[i]].bitrate + 1)));
                    break;
                default:
                    break;
            }
        }
        $scope.totalQOE = pretotalQOE;
        $scope.viewerQOE = previewerQOE;
        $scope.contentQOE = precontentQOE;
        $scope.playerPastDownloadingQuality = $scope.playerDownloadingQuality;
    }

    // Show the data in monitor
    function updateStats() {
        $scope.stats.splice(0, $scope.stats.length);
        for (let i = 0; i <= $scope.playerCount; i++) {
            if(i == $scope.playerCount) {
                if ($scope.contents.audio && $scope.contents.audio != "") {
                    $scope.playerBufferLength[i] = $scope.players[i].getBufferLength("audio");
                    $scope.playerAverageThroughput[i] = $scope.players[i].getAverageThroughput("audio");
                    $scope.playerTime[i] = $scope.players[i].time();
                    $scope.playerDownloadingQuality[i] = $scope.players[i].getQualityFor("audio");
                    $scope.stats.push({
                        playerid : "audio",
                        bufferlevel : $scope.playerBufferLength[i].toFixed(2) + " s",
                        throughput : $scope.playerAverageThroughput[i].toFixed(0)+ " kbps",
                        time : $scope.playerTime[i].toFixed(2) + " s",
                        quality : $scope.players[i].getQualityFor("audio").toFixed(0),
                        fovscore : NaN,
                        playerContentScore : NaN,
                        totaltime : ($scope.playerBufferLength[i] + $scope.playerTime[i]).toFixed(2) + " s",
                        playerCatchUp : ($scope.playerCatchUp[$scope.i] ? "Catching up" : "Synchronizing")
                    });
                }
            } else {
                if (i < $scope.playerCount && $scope.playerBitrateList[i].length == 0) {
                    $scope.playerBitrateList[i] = $scope.players[i].getBitrateInfoListFor("video");
                }
                $scope.playerBufferLength[i] = $scope.players[i].getBufferLength("video");
                $scope.playerAverageThroughput[i] = $scope.players[i].getAverageThroughput("video");
                $scope.playerTime[i] = $scope.players[i].time();
                $scope.playerDownloadingQuality[i] = $scope.players[i].getQualityFor("video");
                $scope.stats.push({
                    playerid : "video_" + i,
                    bufferlevel : $scope.playerBufferLength[i].toFixed(2) + " s",
                    throughput : $scope.playerAverageThroughput[i].toFixed(0)+ " kbps",
                    time : $scope.playerTime[i].toFixed(2) + " s",
                    quality : $scope.playerDownloadingQuality[i].toFixed(0),
                    fovscore : $scope.playerFOVScore[i].toFixed(0),
                    playerContentScore : $scope.playerContentScore[i].toFixed(0),
                    totaltime : ($scope.playerBufferLength[i] + $scope.playerTime[i]).toFixed(2) + " s",
                    playerCatchUp : ($scope.playerCatchUp[i] ? "Catching up" : "Synchronizing")
                });
            }
        }
    }

    // Show the data in figures
    function updateFigures() {
        let time = getTimeForPlot();
        for (let i = 0; i < $scope.playerCount; i++) {
            //$.plot(plotArea, scope.dataset, scope.options)
            $scope.plotPoint("video_" + i, 'quality', $scope.playerDownloadingQuality[i], time);
            $scope.plotPoint("video_" + i, 'buffer', $scope.playerBufferLength[i], time);
            $scope.plotPoint("video_" + i, 'throughput', $scope.playerAverageThroughput[i], time);
        }
        if ($scope.contents.audio && $scope.contents.audio != "") {
            $scope.plotPoint("audio", 'quality', $scope.playerDownloadingQuality[$scope.playerCount], time);
            $scope.plotPoint("audio", 'buffer', $scope.playerBufferLength[$scope.playerCount], time);
            $scope.plotPoint("audio", 'throughput', $scope.playerAverageThroughput[$scope.playerCount], time);
        }
    }
    function getTimeForPlot() {
        let now = new Date().getTime() / 1000;
        return Math.max(now - $scope.startupTime / 1000, 0);
    }


    //// Enable the FOV event listener in iframe
    document.getElementById('frame').onload = function () {
        document.getElementById('frame').contentDocument.addEventListener( 'pointerdown', onPointerDown );
    }

    function onPointerDown( event ) {
        if ( event.isPrimary === false ) return;
        $scope.pointerX = event.clientX;
        $scope.pointerY = event.clientY;
        document.getElementById('frame').contentDocument.addEventListener( 'pointermove', onPointerMove );
        document.getElementById('frame').contentDocument.addEventListener( 'pointerup', onPointerUp );
        console.log("Pointer downs. lon: "+ $scope.lon + "; lat: " + $scope.lat + ".");
    }

    function onPointerMove( event ) {
        if ( event.isPrimary === false ) return;
        $scope.lon += ( event.clientX - $scope.pointerX ) * $scope.rotateRatio;  // In Chrome, turn right then the lon increases.
        $scope.lon > 360 ? $scope.lon = $scope.lon - 360 : null;
        $scope.lon < 0 ? $scope.lon = $scope.lon + 360 : null;
        $scope.lat -= ( event.clientY - $scope.pointerY ) * $scope.rotateRatio;  // In Chrome, turn up then the lat increases.
        $scope.lat > 90 ? $scope.lat = 90 : null;
        $scope.lat < -90 ? $scope.lat = -90 : null;
        $scope.pointerX = event.clientX;
        $scope.pointerY = event.clientY;
        console.log("Pointer moves. lon: "+ $scope.lon + "; lat: " + $scope.lat + ".");
    }

    function onPointerUp() {
        if ( event.isPrimary === false ) return;
        document.getElementById('frame').contentDocument.removeEventListener( 'pointermove', onPointerMove );
        document.getElementById('frame').contentDocument.removeEventListener( 'pointerup', onPointerUp );
        console.log("Pointer ups. lon: "+ $scope.lon + "; lat: " + $scope.lat + ".");
    }


}]);