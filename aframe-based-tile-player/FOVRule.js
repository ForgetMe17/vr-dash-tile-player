var FOVRule;

// Rule that selects the possible bitrate according to FOV
function FOVRuleClass() {

    var appElement = document.querySelector('[ng-controller=DashController]');
    var $scope = angular.element(appElement).scope();
    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let context = this.context;
    let instance;

    function setup() {
    }

    // Always select a bitrate according to FOV
    function getMaxIndex(rulesContext) {
        const switchRequest = SwitchRequest(context).create();

        if (!rulesContext || !rulesContext.hasOwnProperty('getMediaInfo') || !rulesContext.hasOwnProperty('getAbrController')) {
            return switchRequest;
        }

        const mediaType = rulesContext.getMediaInfo().type;
        const mediaInfo = rulesContext.getMediaInfo();
        const abrController = rulesContext.getAbrController();

        if (mediaType != "video") {  // Default settings for audio
            return switchRequest;           
        }

        // Compute the bitrate according to FOV
        var info = abrController.getSettings().info;
        var priority = computeQualitiesOnTile(info);  // From 0 to 100
        $scope.playerFOVScore[info.count] = priority;

        // Ask to switch to the bitrate according to FOV
        switchRequest.quality = 0;
        // switchRequest.reason = 'Always switching to the bitrate according to FOV';
        // switchRequest.reason = {
        //     forceReplace: true
        // };
        switchRequest.priority = SwitchRequest.PRIORITY.STRONG;

        let prev_quality = switchRequest.quality;
        const bitrateList = abrController.getBitrateList(mediaInfo);  // List of all the selectable bitrates (A - Z)
        for (let i = bitrateList.length - 1; i >= 0; i--) {
            if (priority >= (i * 100 / bitrateList.length)) {
                switchRequest.quality = i;
                break;
            }
        }

        // if(switchRequest.quality > prev_quality && !$scope.players[info.count].isPaused()){
        //     var curr_time = $scope.players[info.count].getVideoElement().currentTime;
        //     $scope.pause_all();
        //     $scope.players[info.count].getVideoElement().currentTime = 0;
        //     setTimeout(function () {
        //         $scope.players[info.count].getVideoElement().currentTime = curr_time;
        //         $scope.play_all();
        //         }, 10)
        // }

        return switchRequest;
    }

    function computeQualities(info) {

        if (!info) {
            console.log("Lack of info when computing FOV-based qualities!!!");
            return 0;
        }

        if ($scope.lat == NaN || $scope.lon == NaN || $scope.lat > 90 || $scope.lat < -90 || $scope.lon > 360 || $scope.lon < 0) {
            console.log("Wrong $scope.lat & $scope.lon when computing FOV-based qualities!!!");
            return 0;
        }
    
        if ( info.face == '0' ) {
            if ( $scope.lat == 0 && $scope.lon % 360 == 180 ) {
                return 100;
            } else {
                if ( $scope.lon % 360 <= 225 && $scope.lon % 360 >= 135 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 75;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( $scope.lon % 360 <= 270 && $scope.lon % 360 >= 90 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 50;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 25;
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            }
        }

        if ( info.face == '1' ) {
            if ( $scope.lat == 0 && $scope.lon % 360 == 0 ) {
                return 100;
            } else {
                if ( $scope.lon % 360 <= 45 || $scope.lon % 360 >= 315 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 75;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( $scope.lon % 360 <= 90 || $scope.lon % 360 >= 270 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 50;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 25;
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            }
        }

        if ( info.face == '2' ) {
            if ( $scope.lat >= 85 ) {
                return 100;
            } else if ( $scope.lat >= 80 ) {
                return 75;
            } else if ( $scope.lat >= 45 ) {
                return 50;
            } else if ( $scope.lat >= 0 ) {
                return 25;
            } else {
                return 0;
            }
        }

        if ( info.face == '3' ) {
            if ( $scope.lat <= -85 ) {
                return 100;
            } else if ( $scope.lat <= -80 ) {
                return 75;
            } else if ( $scope.lat <= -45 ) {
                return 50;
            } else if ( $scope.lat <= 0 ) {
                return 25;
            } else {
                return 0;
            }
        }

        if ( info.face == '4' ) {
            if ( $scope.lat == 0 && $scope.lon % 360 == 90 ) {
                return 100;
            } else {
                if ( $scope.lon % 360 <= 135 && $scope.lon % 360 >= 45 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 75;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( $scope.lon % 360 <= 180 && $scope.lon % 360 >= 0 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 50;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 25;
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            }
        }

        if ( info.face == '5' ) {
            if ( $scope.lat == 0 && $scope.lon % 360 == 270 ) {
                return 100;
            } else {
                if ( $scope.lon % 360 <= 315 && $scope.lon % 360 >= 225 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 75;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( $scope.lon % 360 <= 360 && $scope.lon % 360 >= 180 ) {
                    if ( $scope.lat <= 45 && $scope.lat >= -45 ) {
                        return 50;
                    } else if ( $scope.lat >= -80 && $scope.lat <= 80 ) {
                        return 25;
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            }
        }

        return 0;
    }
    // 计算每个tile的质量，存在Bug，需要修改
    function computeQualitiesOnTile(info) {
        let r = Math.sqrt(info.location.x * info.location.x + info.location.y * info.location.y + info.location.z * info.location.z);
        let tile_theta = Math.acos(info.location.y / (r == 0 ? 1 : r));
        let tile_phi = Math.atan(info.location.x / (info.location.z == 0 ? 1 : info.location.z));
        let view_theta = (90 - $scope.lat) * (Math.PI / 180);
        let view_phi = (270 - $scope.lon >= 0 ? 270 - $scope.lon : 270 - $scope.lon + 360) * (Math.PI / 180);
        let tile_z = Math.sin(tile_theta) * Math.cos(tile_phi);
        tile_z = info.location.z < 0 ? tile_z < 0 ? tile_z : -tile_z : tile_z;
        let tile_x = Math.sin(tile_theta) * Math.sin(tile_phi);
        let tile_y = Math.cos(tile_theta);
        let view_z = Math.sin(view_theta) * Math.cos(view_phi);
        let view_x = Math.sin(view_theta) * Math.sin(view_phi);
        let view_y = Math.cos(view_theta);
        let divation = Math.acos((tile_z * view_z + tile_x * view_x + tile_y * view_y) / (Math.sqrt(tile_z * tile_z + tile_x * tile_x + tile_y * tile_y) * Math.sqrt(view_z * view_z + view_x * view_x + view_y * view_y))) * (180 / Math.PI);
        if(divation < 61) return 100
        return 0
}

    instance = {
        getMaxIndex: getMaxIndex,
        computeQualities: computeQualities
    };

    setup();

    return instance;
}

FOVRuleClass.__dashjs_factory_name = 'FOVRule';
FOVRule = dashjs.FactoryMaker.getClassFactory(FOVRuleClass);

