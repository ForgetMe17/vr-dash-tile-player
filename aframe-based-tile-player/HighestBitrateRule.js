var HighestBitrateRule;

// Rule that selects the possible highest bitrate
function HighestBitrateRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let context = this.context;
    let instance;

    function setup() {
    }

    // Always select the highest bitrate
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

        // Ask to switch to the highest bitrate
        switchRequest.quality = 0;
        switchRequest.reason = 'Always switching to the highest bitrate';
        switchRequest.priority = SwitchRequest.PRIORITY.STRONG;

        const bitrateList = abrController.getBitrateList(mediaInfo);  // List of all the selectable bitrates
        let tag = 0;
        if (bitrateList.length <= 1) {
            return switchRequest;
        }
        for (let i = 1; i < bitrateList.length; i++) {  // Choose the highest bitrate
            if (bitrateList[i].bitrate > bitrateList[tag].bitrate) {
                tag = i;
            }
        }
        switchRequest.quality = tag;

        return switchRequest;
    }

    instance = {
        getMaxIndex: getMaxIndex,
    };

    setup();

    return instance;
}

HighestBitrateRuleClass.__dashjs_factory_name = 'HighestBitrateRule';
HighestBitrateRule = dashjs.FactoryMaker.getClassFactory(HighestBitrateRuleClass);

