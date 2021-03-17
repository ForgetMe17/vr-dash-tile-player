import FactoryMaker from '../../../core/FactoryMaker';
import Debug from '../../../core/Debug';
import SwitchRequest from '../SwitchRequest';
import Constants from '../../constants/Constants';
import MetricsConstants from '../../constants/MetricsConstants';

function ThroughputRule(config) {

    config = config || {};
    const context = this.context;
    const dashMetrics = config.dashMetrics;

    let instance,
        logger;

    function setup() {
        logger = Debug(context).getInstance().getLogger(instance);
    }

    function checkConfig() {
        if (!dashMetrics || !dashMetrics.hasOwnProperty('getCurrentBufferState')) {
            throw new Error(Constants.MISSING_CONFIG_ERROR);
        }
    }

    function getMaxIndex(rulesContext) {
        const switchRequest = SwitchRequest(context).create();

        if (!rulesContext || !rulesContext.hasOwnProperty('getMediaInfo') || !rulesContext.hasOwnProperty('getMediaType') || !rulesContext.hasOwnProperty('useBufferOccupancyABR') ||
            !rulesContext.hasOwnProperty('getAbrController') || !rulesContext.hasOwnProperty('getScheduleController')) {
            return switchRequest;
        }

        checkConfig();

        const mediaInfo = rulesContext.getMediaInfo();
        const mediaType = rulesContext.getMediaType();
        const currentBufferState = dashMetrics.getCurrentBufferState(mediaType);
        const scheduleController = rulesContext.getScheduleController();
        const abrController = rulesContext.getAbrController();
        const streamInfo = rulesContext.getStreamInfo();
        const isDynamic = streamInfo && streamInfo.manifestInfo ? streamInfo.manifestInfo.isDynamic : null;
        const throughputHistory = abrController.getThroughputHistory();
        const throughput = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic);
        const latency = throughputHistory.getAverageLatency(mediaType);
        const useBufferOccupancyABR = rulesContext.useBufferOccupancyABR();


        if (isNaN(throughput) || !currentBufferState || useBufferOccupancyABR) {
            return switchRequest;
        }

        if (abrController.getAbandonmentStateFor(mediaType) !== MetricsConstants.ABANDON_LOAD) {
            if (currentBufferState.state === MetricsConstants.BUFFER_LOADED || isDynamic) {
                switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, throughput, latency);
                scheduleController.setTimeToLoadDelay(0);
                logger.debug('[' + mediaType + '] requesting switch to index: ', switchRequest.quality, 'Average throughput', Math.round(throughput), 'kbps');
                switchRequest.reason = {throughput: throughput, latency: latency};
            }
        }

        return switchRequest;
    }

    function reset() {
        // no persistent information to reset
    }

    instance = {
        getMaxIndex: getMaxIndex,
        reset: reset
    };

    setup();

    return instance;
}

ThroughputRule.__dashjs_factory_name = 'ThroughputRule';
export default FactoryMaker.getClassFactory(ThroughputRule);
