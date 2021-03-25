var app = angular.module('DashPlayer', ['angular-flot']); /* jshint ignoreMyThroughputRule:line */

app.controller('DashController', ['$scope','$interval', function ($scope, $interval) {
    $interval(function () {}, 100);

    $scope.json = "http://localhost/CMPVP907/aframeVP907.json";
    $scope.url = "";
    $scope.type="LVOD";

    $scope.chartOptions = {
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
    $scope.maxPointsToChart = 30;
    $scope.chartData_quality = [];
    $scope.chartData_buffer = [];
    $scope.chartData_throughput = [];
    $scope.chartState = {
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
    $scope.playerQuality = [];  // Data from monitor
    $scope.playerFOVScore = [];  // Data from monitor
    $scope.playerContentScore = [];  // Data from monitor
    $scope.playerPastQuality = [];  // Data from monitor's playerQuality
    $scope.playerCatchUp = [];  // Data from playback controller

    $scope.playerBitrateList = [];  // Data from bitrate list
    $scope.requestList = [];  // Data from all HTTPRequests
    $scope.ssresults = {};  // Data from contents analytics CSV files

    //// Global variables (flexible)
    $scope.captureWidth = 128;  // [For capturing each frame] Set the width of the capture pictures
    $scope.captureHeight = 128;  // [For capturing each frame] Set the height of the capture pictures
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


    //// Loading sources
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
            if ($scope.contents.ssresults != "") {
                getContents($scope.contents.baseUrl + $scope.contents.ssresults, function() {
                    $scope.ssresults = JSON.parse(this.responseText);
                });
            }
            document.getElementById('Reset').style = "display: inline;";
            document.getElementById('Link').style = "display: none;";
            document.getElementById('Render').style = "display: inline;";
            document.getElementById('json').value += " (Loaded!)";
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
            document.getElementById('Reset').style = "display: inline;";
            document.getElementById('Link').style = "display: none;";
            document.getElementById('Render').style = "display: inline;";
            document.getElementById('url').value += " (Loaded!)";
        });
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
    }

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
    }

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
        $scope.sessionStartTime = new Date().getTime() / 1000;

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
                            'fastswitchenabled': true,
                            'liveDelay': 0, 
                            'liveCatchup': {
                                'enabled': true,
                                    'minDrift': $scope.playerMinDrift
                            }
                        }
                    });
                    // Add my custom quality switch rule, look at [].js to know more about the structure of a custom rule
                    let index = document.getElementById("rule").selectedIndex;
                    let selectedRule = document.getElementById("rule").options[index].text;
                    switch (selectedRule) {
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
                    $scope.playerQuality[$scope.playerCount] = $scope.players[$scope.playerCount].getQualityFor("video");
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
            $scope.playerQuality[$scope.playerCount] = $scope.players[$scope.playerCount].getQualityFor("audio");
            $scope.playerCatchUp[$scope.playerCount] = false;
        }
        // Get video captures
        for (let i = 0; i < $scope.playerCount; i++) {
            let canvas = document.createElement( "canvas" );
            canvas.id = "capture_" + i;
            canvas.width = $scope.captureWidth;
            canvas.height = $scope.captureHeight;
            document.getElementById("captures").appendChild(canvas);
        }
        $scope.startupTime = new Date().getTime();
        // Set the fastest mediaplayer's timeline as the normalized time
        setInterval(setNormalizedTime, 10);
        // Compute total throughput according to recent HTTP requests
        setInterval(computetotalThroughput, 1000);
        // Compute QoE
        setInterval(computeQoE, 1000);
        // Show the data in monitor
        setInterval(updateStats, 100);
        // Show the data in figures
        setInterval(updateFigures, 1000);
        // Capture the pictures from mediaplayers
        setInterval(function () {
            for (let i = 0; i < $scope.playerCount; i++) {
                document.getElementById("capture_" + i).getContext('2d').drawImage(document.getElementById( "frame" ).contentWindow.document.querySelector("#" + "video_" + i), 0, 0, $scope.captureWidth, $scope.captureHeight);
                // img.src = canvas.toDataURL("image/png");
            }
        }, 500);
        document.getElementById('Load').style = "display: none;";
        document.getElementById('Play').style = "display: inline;";
        document.getElementById('Pause').style = "display: inline;";
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
        if (TotalTimeInAnInterval == 0) {
            TotalTimeInAnInterval = 1;
        }
        $scope.totalThroughput = Math.round((8 * TotalDataInAnInterval) / (TotalTimeInAnInterval / 1000));  // bps
    }

    // Compute QoE
    function computeQoE() {
        if ($scope.playerPastQuality.length == 0 || $scope.playerQuality.length == 0) {
            $scope.totalQOE = NaN;
            $scope.viewerQOE = NaN;
            $scope.contentQOE = NaN;
            $scope.playerPastQuality = $scope.playerQuality;
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
            // console.log([i, playerSettings, r, tile_theta, tile_phi, view_theta, view_phi, tile_z, tile_x, tile_y, view_z, view_x, view_y, divation]);
            switch ($scope.qQOE) {
                case 'linear':
                    pretotalQOE = pretotalQOE + $scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate - $scope.lambdaQOE * Math.abs($scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate - $scope.playerBitrateList[i][$scope.playerPastQuality[i]].bitrate);
                    previewerQOE = previewerQOE + (divation < 61 ? $scope.a1QOE : divation < 121 ? $scope.a2QOE : $scope.a3QOE) * ($scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate - $scope.lambdaQOE * Math.abs($scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate - $scope.playerBitrateList[i][$scope.playerPastQuality[i]].bitrate));
                    break;
                case 'log':
                    pretotalQOE = pretotalQOE + Math.log($scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate + 1) - $scope.lambdaQOE * Math.abs(Math.log($scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate + 1) - Math.log($scope.playerBitrateList[i][$scope.playerPastQuality[i]].bitrate + 1));
                    previewerQOE = previewerQOE + (divation < 61 ? $scope.a1QOE : divation < 121 ? $scope.a2QOE : $scope.a3QOE) * (Math.log($scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate + 1) - $scope.lambdaQOE * Math.abs(Math.log($scope.playerBitrateList[i][$scope.playerQuality[i]].bitrate + 1) - Math.log($scope.playerBitrateList[i][$scope.playerPastQuality[i]].bitrate + 1)));
                    break;
                default:
                    break;
            }
        }
        $scope.totalQOE = pretotalQOE;
        $scope.viewerQOE = previewerQOE;
        $scope.contentQOE = precontentQOE;
        $scope.playerPastQuality = $scope.playerQuality;
    }

    // Show the data in monitor
    function updateStats() {
        let tablecontent = "";
        tablecontent += "<table><thead><tr><th>Normalized Time</th><th>Total Throughput</th><th>Total QoE</th><th>Viewer's QoE</th><th>Content-based QoE</th></tr></thead><tbody><tr><td>";
        tablecontent += $scope.normalizedTime.toFixed(2);
        tablecontent += " s</td><td>";
        tablecontent += $scope.totalThroughput >= 8000000 ? ($scope.totalThroughput / 8000000).toFixed(2) : ($scope.totalThroughput / 8000).toFixed(0);
        tablecontent += $scope.totalThroughput >= 8000000 ? " MB/s" : " kB/s";
        tablecontent += "</td><td>";
        tablecontent += $scope.totalQOE.toFixed(2);
        tablecontent += "</td><td>";
        tablecontent += $scope.viewerQOE.toFixed(2);
        tablecontent += "</td><td>";
        tablecontent += $scope.contentQOE.toFixed(2);
        tablecontent += "</td></tr></tbody></table><br>";
        tablecontent += "<table><thead><tr><th>Player ID</th><th>Buffer Level</th><th>Average Throughput</th><th>Timeline</th><th>Quality</th><th>FOV Score</th><th>Content Score</th><th>Total loaded Time</th><th>Catchup State</th></tr></thead><tbody>";
        for (let i = 0; i < $scope.playerCount; i++) {
            if ($scope.playerBitrateList[i].length == 0) {
                $scope.playerBitrateList[i] = $scope.players[i].getBitrateInfoListFor("video");
            }
            $scope.playerBufferLength[i] = $scope.players[i].getBufferLength();
            $scope.playerAverageThroughput[i] = $scope.players[i].getAverageThroughput("video");
            $scope.playerTime[i] = $scope.players[i].time();
            $scope.playerQuality[i] = $scope.players[i].getQualityFor("video");
            tablecontent += "<tr>";
            tablecontent += ("<td>video_" + i + "</td>" );
            tablecontent += ("<td>" + $scope.playerBufferLength[i].toFixed(2) + " s</td>");
            tablecontent += ("<td>" + $scope.playerAverageThroughput[i].toFixed(0) + " bps</td>");
            tablecontent += ("<td>" + $scope.playerTime[i].toFixed(2) + " s</td>");
            tablecontent += ("<td>" + $scope.playerQuality[i].toFixed(0) + "</td>");
            tablecontent += ("<td>" + $scope.playerFOVScore[i].toFixed(0) + "</td>");
            tablecontent += ("<td>" + $scope.playerContentScore[i].toFixed(0) + "</td>");
            tablecontent += ("<td>" + ($scope.playerBufferLength[i] + $scope.playerTime[i]).toFixed(2) + " s</td>");
            tablecontent += ("<td>" + ($scope.playerCatchUp[$scope.playerCount] ? "Catching up" : "Synchronizing") + "</td>");
            tablecontent += "</tr>";
        }
        if ($scope.contents.audio && $scope.contents.audio != "") {
            $scope.playerBufferLength[$scope.playerCount] = $scope.players[$scope.playerCount].getBufferLength();
            $scope.playerAverageThroughput[$scope.playerCount] = $scope.players[$scope.playerCount].getAverageThroughput("audio");
            $scope.playerTime[$scope.playerCount] = $scope.players[$scope.playerCount].time();
            $scope.playerQuality[$scope.playerCount] = $scope.players[$scope.playerCount].getQualityFor("audio");
            tablecontent += "<tr>";
            tablecontent += ("<td>audio</td>" );
            tablecontent += ("<td>" + $scope.playerBufferLength[$scope.playerCount].toFixed(2) + " s</td>");
            tablecontent += ("<td>" + $scope.playerAverageThroughput[$scope.playerCount].toFixed(0) + " bps</td>");
            tablecontent += ("<td>" + $scope.playerTime[$scope.playerCount].toFixed(2) + " s</td>");
            tablecontent += ("<td>" + $scope.playerQuality[$scope.playerCount].toFixed(0) + "</td>");
            tablecontent += ("<td></td>");
            tablecontent += ("<td></td>");
            tablecontent += ("<td>" + ($scope.playerBufferLength[$scope.playerCount] + $scope.playerTime[$scope.playerCount]).toFixed(2) + " s</td>");
            tablecontent += ("<td>" + ($scope.playerCatchUp[$scope.playerCount] ? "Catching up" : "Synchronizing") + "</td>");
            tablecontent += "</tr>";
        }
        tablecontent += "</tbody></table>";
        document.getElementById("statstable").innerHTML = tablecontent;
        // document.querySelector("#stats").innerHTML = "---STATS MONITOR---<br><br><br>";
        // document.querySelector("#stats").innerHTML += "Normalized time: ";
        // document.querySelector("#stats").innerHTML += $scope.normalizedTime.toFixed(2);
        // document.querySelector("#stats").innerHTML += " s<br>";
        // document.querySelector("#stats").innerHTML += "Total Throughput: ";
        // document.querySelector("#stats").innerHTML += $scope.totalThroughput >= 8000000 ? ($scope.totalThroughput / 8000000).toFixed(2) : ($scope.totalThroughput / 8000).toFixed(0);  // MB/s or kB/s
        // document.querySelector("#stats").innerHTML += $scope.totalThroughput >= 8000000 ? " MB/s<br>" : " kB/s<br>";
        // document.querySelector("#stats").innerHTML += "Total QoE: ";
        // document.querySelector("#stats").innerHTML += $scope.totalQOE.toFixed(2);
        // document.querySelector("#stats").innerHTML += "<br>"
        // document.querySelector("#stats").innerHTML += "Viewer's QoE: ";
        // document.querySelector("#stats").innerHTML += $scope.viewerQOE.toFixed(2);
        // document.querySelector("#stats").innerHTML += "<br>"
        // document.querySelector("#stats").innerHTML += "Content-based QoE: ";
        // document.querySelector("#stats").innerHTML += $scope.contentQOE.toFixed(2);
        // document.querySelector("#stats").innerHTML += "<br><br>"
        // for (let i = 0; i < $scope.playerCount; i++) {
        //     if ($scope.playerBitrateList[i].length == 0) {
        //         $scope.playerBitrateList[i] = $scope.players[i].getBitrateInfoListFor("video");
        //     }
        //     $scope.playerBufferLength[i] = $scope.players[i].getBufferLength();
        //     $scope.playerAverageThroughput[i] = $scope.players[i].getAverageThroughput("video");
        //     $scope.playerTime[i] = $scope.players[i].time();
        //     $scope.playerQuality[i] = $scope.players[i].getQualityFor("video");
        //     document.querySelector("#stats").innerHTML += ( "Video_" + i + ":<br>" );
        //     document.querySelector("#stats").innerHTML += "Buffer level ";
        //     document.querySelector("#stats").innerHTML += $scope.playerBufferLength[i].toFixed(2);
        //     document.querySelector("#stats").innerHTML += " s<br>";
        //     document.querySelector("#stats").innerHTML += "Average Throughput ";
        //     document.querySelector("#stats").innerHTML += $scope.playerAverageThroughput[i].toFixed(0);
        //     document.querySelector("#stats").innerHTML += " bps<br>";
        //     document.querySelector("#stats").innerHTML += "Timeline ";
        //     document.querySelector("#stats").innerHTML += $scope.playerTime[i].toFixed(2);
        //     document.querySelector("#stats").innerHTML += " s<br>";
        //     document.querySelector("#stats").innerHTML += "Quality ";
        //     document.querySelector("#stats").innerHTML += $scope.playerQuality[i].toFixed(0);
        //     document.querySelector("#stats").innerHTML += "<br>";
        //     document.querySelector("#stats").innerHTML += "FOV Score ";
        //     document.querySelector("#stats").innerHTML += $scope.playerFOVScore[i].toFixed(0);
        //     document.querySelector("#stats").innerHTML += "<br>";
        //     document.querySelector("#stats").innerHTML += "Content Score ";
        //     document.querySelector("#stats").innerHTML += $scope.playerContentScore[i].toFixed(0);
        //     document.querySelector("#stats").innerHTML += "<br>";
        //     document.querySelector("#stats").innerHTML += "Total loaded time: ";
        //     document.querySelector("#stats").innerHTML += ($scope.playerBufferLength[i] + $scope.playerTime[i]).toFixed(2);
        //     document.querySelector("#stats").innerHTML += " s<br><br>";
        // }
        // if ($scope.contents.audio && $scope.contents.audio != "") {
        //     $scope.playerBufferLength[$scope.playerCount] = $scope.players[$scope.playerCount].getBufferLength();
        //     $scope.playerAverageThroughput[$scope.playerCount] = $scope.players[$scope.playerCount].getAverageThroughput("audio");
        //     $scope.playerTime[$scope.playerCount] = $scope.players[$scope.playerCount].time();
        //     $scope.playerQuality[$scope.playerCount] = $scope.players[$scope.playerCount].getQualityFor("audio");
        //     document.querySelector("#stats").innerHTML += ( "Audio:<br>" );
        //     document.querySelector("#stats").innerHTML += "Buffer level ";
        //     document.querySelector("#stats").innerHTML += $scope.playerBufferLength[$scope.playerCount].toFixed(2);
        //     document.querySelector("#stats").innerHTML += " s<br>";
        //     document.querySelector("#stats").innerHTML += "Average Throughput ";
        //     document.querySelector("#stats").innerHTML += $scope.playerAverageThroughput[$scope.playerCount].toFixed(0);
        //     document.querySelector("#stats").innerHTML += " bps<br>";
        //     document.querySelector("#stats").innerHTML += "Timeline ";
        //     document.querySelector("#stats").innerHTML += $scope.playerTime[$scope.playerCount].toFixed(2);
        //     document.querySelector("#stats").innerHTML += " s<br>";
        //     document.querySelector("#stats").innerHTML += "Quality ";
        //     document.querySelector("#stats").innerHTML += $scope.playerQuality[$scope.playerCount].toFixed(0);
        //     document.querySelector("#stats").innerHTML += "<br>";
        //     document.querySelector("#stats").innerHTML += "Total loaded time: ";
        //     document.querySelector("#stats").innerHTML += ($scope.playerBufferLength[$scope.playerCount] + $scope.playerTime[$scope.playerCount]).toFixed(2);
        //     document.querySelector("#stats").innerHTML += " s<br><br>";
        // }
    }

    // Show the data in figures
    function updateFigures() {
        let time = getTimeForPlot();
        for (let i = 0; i < $scope.playerCount; i++) {
            //$.plot(plotArea, scope.dataset, scope.options)
            $scope.plotPoint("video_" + i, 'quality', $scope.playerQuality[i], time);
            $scope.plotPoint("video_" + i, 'buffer', $scope.playerBufferLength[i], time);
            $scope.plotPoint("video_" + i, 'throughput', $scope.playerAverageThroughput[i], time);
        }
        if ($scope.contents.audio && $scope.contents.audio != "") {
            $scope.plotPoint("audio", 'quality', $scope.playerQuality[$scope.playerCount], time);
            $scope.plotPoint("audio", 'buffer', $scope.playerBufferLength[$scope.playerCount], time);
            $scope.plotPoint("audio", 'throughput', $scope.playerAverageThroughput[$scope.playerCount], time);
        }
    }

    function getTimeForPlot() {
        let now = new Date().getTime() / 1000;
        return Math.max(now - $scope.sessionStartTime, 0);
    }


    //// Operations connected to buttons
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

    // Switch the source automatically according to the situation
    $scope.VOD_LIVE = function(type) {
        // let index = document.getElementById("type").selectedIndex;
        // let selectedRule = document.getElementById("type").options[index].text;
        switch (type) {
            case "LVOD":
                $scope.json = "http://localhost/CMPVP907/aframeVP907.json";
                $scope.url = "";
                break;
            case "SVOD":
                $scope.json = "http://222.20.77.111/processed/CMPVP907/aframeVP907.json";
                $scope.url = "";
                break;
            case "LIVE":
                $scope.json = "http://222.20.77.111/dash/default.json";
                $scope.url = "";
                break;
            case "BUNNY":
                $scope.json = "";
                $scope.url = "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd";
                break;
            default:
                $scope.json = "";
                $scope.url = "";
                break;
        }
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
// function legendLabelClickHandler(obj) { /* jshint ignore:line */
//     var scope = angular.element($('body')).scope(); /* jshint ignore:line */
//     var id = obj.id.split('.');
//     var target = scope.chartState[id[0]][id[1]];
//     target.selected = !target.selected;
//     scope.pushData(id[1], id[0]);
// }