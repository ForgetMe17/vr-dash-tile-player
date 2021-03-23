var FOVContentRule;

// Rule that selects the possible bitrate according to FOV and Content
function FOVContentRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let context = this.context;
    let instance;

    let FOV_weight = 0.5;
    let content_weight = 0.5;
    let content_curTile_bias = 0.1;
    // All the priorites are from 0 to 100
    // So far we set five levels (0, 25, 50, 75, 100) when computing priorite_FOV
    // There is no specific level set up for computing priorite_Content

    function setup() {
    }

    // Always select a bitrate according to FOV and Content
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

        var info = abrController.getSettings().info;
        var streaming = abrController.getSettings().streaming;
        // Compute the bitrate according to FOV
        var priorite_FOV = computeFOVQualities(info);  // From 0 to 100
        // Compute the bitrate according to Content
        var priorite_Content = computeContentQualities(info);  // From 0 to 100
        // Balance the weights according to buffer level
        if (playerBufferLength[info.count] >= streaming.bufferToKeep - info.duration) {
            FOV_weight = 0.5;
            content_weight = 0.7;
        } else if (playerBufferLength[info.count] <= info.duration) {
            FOV_weight = 0.8;
            content_weight = 0.2;
        } else {
            FOV_weight = 0.5;
            content_weight = 0.5;
        }
        console.log([FOV_weight, " ", content_weight]);
        // Compute the bitrate according to FOV and Content
        var priorite_FOVContent = Math.min(FOV_weight * priorite_FOV + content_weight * priorite_Content, 100);
        playerFOVScore[info.count] = priorite_FOV;
        playerContentScore[info.count] = priorite_Content;

        // Ask to switch to the bitrate according to FOV and Content
        switchRequest.quality = 0;
        switchRequest.reason = 'Always switching to the bitrate according to FOV and content';
        switchRequest.priority = SwitchRequest.PRIORITY.STRONG;

        const bitrateList = abrController.getBitrateList(mediaInfo);  // List of all the selectable bitrates (A - Z)
        for (let i = bitrateList.length - 1; i >= 0; i--) {
            if (priorite_FOVContent >= (i * 100 / bitrateList.length)) {
                switchRequest.quality = i;
                break;
            }
        }

        return switchRequest;
    }

    function computeFOVQualities(info) {

        if (!info) {
            console.log("Lack of info when computing FOV-based qualities!!!");
            return 0;
        }

        if (lat == NaN || lon == NaN || lat > 90 || lat < -90 || lon > 360 || lon < 0) {
            console.log("Wrong lat & lon when computing FOV-based qualities!!!");
            return 0;
        }
    
        if ( info.face == '0' ) {
            if ( lat == 0 && lon % 360 == 180 ) {
                return 100;
            } else {
                if ( lon % 360 <= 225 && lon % 360 >= 135 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 75;
                    } else if ( lat >= -80 && lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( lon % 360 <= 270 && lon % 360 >= 90 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 50;
                    } else if ( lat >= -80 && lat <= 80 ) {
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
            if ( lat == 0 && lon % 360 == 0 ) {
                return 100;
            } else {
                if ( lon % 360 <= 45 || lon % 360 >= 315 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 75;
                    } else if ( lat >= -80 && lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( lon % 360 <= 90 || lon % 360 >= 270 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 50;
                    } else if ( lat >= -80 && lat <= 80 ) {
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
            if ( lat >= 85 ) {
                return 100;
            } else if ( lat >= 80 ) {
                return 75;
            } else if ( lat >= 45 ) {
                return 50;
            } else if ( lat >= 0 ) {
                return 25;
            } else {
                return 0;
            }
        }

        if ( info.face == '3' ) {
            if ( lat <= -85 ) {
                return 100;
            } else if ( lat <= -80 ) {
                return 75;
            } else if ( lat <= -45 ) {
                return 50;
            } else if ( lat <= 0 ) {
                return 25;
            } else {
                return 0;
            }
        }

        if ( info.face == '4' ) {
            if ( lat == 0 && lon % 360 == 90 ) {
                return 100;
            } else {
                if ( lon % 360 <= 135 && lon % 360 >= 45 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 75;
                    } else if ( lat >= -80 && lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( lon % 360 <= 180 && lon % 360 >= 0 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 50;
                    } else if ( lat >= -80 && lat <= 80 ) {
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
            if ( lat == 0 && lon % 360 == 270 ) {
                return 100;
            } else {
                if ( lon % 360 <= 315 && lon % 360 >= 225 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 75;
                    } else if ( lat >= -80 && lat <= 80 ) {
                        return 50;
                    } else {
                        return 0;
                    }
                } else if ( lon % 360 <= 360 && lon % 360 >= 180 ) {
                    if ( lat <= 45 && lat >= -45 ) {
                        return 50;
                    } else if ( lat >= -80 && lat <= 80 ) {
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

    function computeContentQualities(info) {
        
        if (!info) {
            console.log("Lack of info when computing content-based qualities!!!");
            return 0;
        }

        if (!ssresults) {
            console.log("Lack of ssresults when computing content-based qualities!!!");
            return 0;
        }

        // gains from current segment's level
        let currentTime = parseInt(playerTime[info.face * contents.row * contents.col + info.row * contents.col + info.col] + playerBufferLength[info.face * contents.row * contents.col + info.row * contents.col + info.col]);
        let currentIndex = parseInt(currentTime / info.duration) + 1;
        let currentIndexString = info.face.toString() + "_" + (info.row * contents.col + info.col).toString() + "_" + currentIndex.toString();
        if (ssresults[currentIndexString] == NaN || ssresults['maximum'] == NaN || ssresults['minimum'] == NaN) {
            console.log("Lack of current/maximum/minimum csv_result when computing content-based qualities!!!");
            return 0;
        }
        let currentResult = ssresults[currentIndexString];
        let MaximumResult = ssresults['maximum'];
        let MinimumResult = ssresults['minimum'];
        let RankingResult = (currentResult - MinimumResult) / (MaximumResult - MinimumResult);

        // gains from tile's level
        let curTileIndexString = info.face.toString() + "_" + (info.row * contents.col + info.col).toString();
        if (ssresults[curTileIndexString] != NaN || ssresults['average'] != NaN) {
            let curTileResult = ssresults[curTileIndexString];
            let AverageResult = ssresults['average'];
            if (curTileResult >= AverageResult) {
                RankingResult = Math.min(RankingResult + content_curTile_bias, 1);
            } else {
                RankingResult = Math.max(RankingResult - content_curTile_bias, 0);
            }
        }
        
        return RankingResult.toFixed(2) * 100;
    }

    instance = {
        getMaxIndex: getMaxIndex,
        computeFOVQualities: computeFOVQualities,
        computeContentQualities: computeContentQualities
    };

    setup();

    return instance;
}

FOVContentRuleClass.__dashjs_factory_name = 'FOVContentRule';
FOVContentRule = dashjs.FactoryMaker.getClassFactory(FOVContentRuleClass);