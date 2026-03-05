import { createStepStateEngine, attachEngineLogging, useShiftLogger, setComponentPath, hydrateFromSnapshot } from "@/utils/stateEngine.js";
import FlowHandler from "@/services/flow-system/FlowHandler.js";

function applyEnhancers(engine, enhancers = [], ctx = {}) {
    return enhancers.reduce((acc, enhancer) => enhancer(acc, ctx), engine);
}

function withFlowHandler(engine, { flowOptions = {} } = {}) {
    engine.callFlow = async function callFlow(flowName, payload = null, options = {}) {
        const effectivePayload = payload ?? engine.state;
        const run = await FlowHandler.run(flowName, effectivePayload, {
            ...flowOptions,
            ...options,
        });
        return run;
    };

    return engine;
}

export { attachEngineLogging, useShiftLogger, setComponentPath, hydrateFromSnapshot };

export function createFlowStateEngine(config = {}, options = {}) {
    const engine = createStepStateEngine(config);
    const enhancers = [withFlowHandler, ...(options.enhancers || [])];
    return applyEnhancers(engine, enhancers, options);
}
