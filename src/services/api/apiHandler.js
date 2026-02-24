/**
 * APIHandler
 * API-only request layer for flow handlers and services.
 *
 * Key goals:
 * - Centralize HTTP calls
 * - Add auth headers consistently
 * - Normalize errors in one shape
 * - Provide optional legacy bridge via handleRequest(...)
 */
class APIHandler {
    constructor(defaults = {}, options = {}) {
        this.defaultParams = {
            apiBaseUrl: "",
            queryParams: {},
            httpMethod: "GET",
            requestData: undefined,
            headers: {},
            ...defaults
        };

        this.options = {
            emitEvents: true,
            uiAdapter: null,
            authTokenResolver: null,
            ...options
        };
    }

    getToken() {
        if (typeof this.options.authTokenResolver === "function") {
            const token = this.options.authTokenResolver();
            if (token) return token;
        }

        if (typeof window !== "undefined" && window.localStorage) {
            return (
                window.localStorage.getItem("idToken") ||
                window.localStorage.getItem("accessToken") ||
                ""
            );
        }

        return "";
    }

    buildHeaders(headers = {}, body) {
        const token = this.getToken();
        const mergedHeaders = { ...headers };

        if (token && !mergedHeaders.Authorization) {
            mergedHeaders.Authorization = `Bearer ${token}`;
        }

        const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
        if (!isFormData && body !== undefined && !mergedHeaders["Content-Type"]) {
            mergedHeaders["Content-Type"] = "application/json";
        }

        return mergedHeaders;
    }

    constructUrl(baseUrl, queryParams = {}) {
        if (!queryParams || Object.keys(queryParams).length === 0) return baseUrl;

        const search = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "") return;

            if (Array.isArray(value)) {
                value.forEach((item) => search.append(key, String(item)));
                return;
            }

            search.append(key, String(value));
        });

        const separator = baseUrl.includes("?") ? "&" : "?";
        return `${baseUrl}${separator}${search.toString()}`;
    }

    async parseResponseBody(response) {
        if (response.status === 204 || response.status === 304) {
            return null;
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return response.json();
        }

        const text = await response.text();
        return { raw: text };
    }

    buildResponseMeta(response) {
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        return {
            status: response.status,
            headers,
        };
    }

    withResponseMeta(parsedBody, response) {
        const meta = this.buildResponseMeta(response);

        if (parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody)) {
            return { ...parsedBody, __meta: meta };
        }

        return {
            data: parsedBody,
            __meta: meta,
        };
    }

    normalizeError({ error, response, body, request }) {
        // Network / runtime error
        if (!response) {
            const errorMessage = error?.message || "Network request failed";
            const isTimeout = /timed out/i.test(errorMessage);
            return {
                ok: false,
                error: {
                    code: isTimeout ? "FLOW_TIMEOUT" : "NETWORK_ERROR",
                    message: errorMessage,
                    details: error || null
                },
                meta: { request }
            };
        }

        const message =
            body?.error ||
            body?.message ||
            `Request failed with status ${response.status}`;

        return {
            ok: false,
            error: {
                code: `HTTP_${response.status}`,
                message,
                details: body || null
            },
            meta: {
                status: response.status,
                request
            }
        };
    }

    dispatchSuccessEvent(requestArgs, response, data) {
        if (!this.options.emitEvents || typeof document === "undefined") return;

        document.dispatchEvent(new CustomEvent("dash-api-handler-response", {
            detail: { success: true, error: false, args: requestArgs, response, data }
        }));
    }

    dispatchErrorEvent(requestArgs, normalizedError) {
        if (!this.options.emitEvents || typeof document === "undefined") return;

        document.dispatchEvent(new CustomEvent("dash-api-handler-response", {
            detail: {
                success: false,
                error: true,
                args: requestArgs,
                error_message: normalizedError.error?.message || "Unknown error",
                error_object: normalizedError
            }
        }));
    }

    async request({
        url,
        method = "GET",
        params = {},
        data = undefined,
        headers = {},
        signal,
        timeoutMs
    }) {
        const finalUrl = this.constructUrl(url, params);
        const upperMethod = method.toUpperCase();

        const hasBodyMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod);
        const body =
            hasBodyMethod && data !== undefined
                ? ((typeof FormData !== "undefined" && data instanceof FormData) ? data : JSON.stringify(data))
                : undefined;

        const requestArgs = { url: finalUrl, method: upperMethod, params, data };
        let timeoutId = null;
        let combinedSignal = signal;
        let internalController = null;

        try {
            const hasTimeout = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0;
            if (hasTimeout) {
                internalController = new AbortController();
                combinedSignal = internalController.signal;
                timeoutId = setTimeout(() => {
                    internalController.abort(new Error(`Request timed out after ${timeoutMs}ms`));
                }, Number(timeoutMs));

                if (signal) {
                    if (signal.aborted) {
                        internalController.abort(signal.reason || new Error("Request aborted"));
                    } else if (typeof signal.addEventListener === "function") {
                        signal.addEventListener("abort", () => {
                            internalController.abort(signal.reason || new Error("Request aborted"));
                        }, { once: true });
                    }
                }
            }

            const response = await fetch(finalUrl, {
                method: upperMethod,
                headers: this.buildHeaders(headers, body),
                body,
                signal: combinedSignal
            });

            const parsedBody = await this.parseResponseBody(response);
            const payloadWithMeta = this.withResponseMeta(parsedBody, response);

            if (response.status === 304) {
                const notModifiedPayload = {
                    ok: true,
                    notModified: true,
                    ...payloadWithMeta,
                };
                this.dispatchSuccessEvent(requestArgs, response, notModifiedPayload);
                return notModifiedPayload;
            }

            if (!response.ok) {
                const normalizedError = this.normalizeError({
                    response,
                    body: parsedBody,
                    request: requestArgs
                });
                this.dispatchErrorEvent(requestArgs, normalizedError);
                throw normalizedError;
            }

            this.dispatchSuccessEvent(requestArgs, response, payloadWithMeta);
            return payloadWithMeta;
        } catch (err) {
            // Pass through already normalized errors.
            if (err && err.ok === false && err.error) {
                throw err;
            }

            const normalizedError = this.normalizeError({
                error: err,
                request: requestArgs
            });
            this.dispatchErrorEvent(requestArgs, normalizedError);
            throw normalizedError;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    get(url, options = {}) {
        return this.request({ url, method: "GET", ...options });
    }

    post(url, data, options = {}) {
        return this.request({ url, method: "POST", data, ...options });
    }

    put(url, data, options = {}) {
        return this.request({ url, method: "PUT", data, ...options });
    }

    patch(url, data, options = {}) {
        return this.request({ url, method: "PATCH", data, ...options });
    }

    delete(url, options = {}) {
        return this.request({ url, method: "DELETE", ...options });
    }

    /**
     * Legacy bridge for existing call sites.
     * Maps old keys to the new request API.
     */
    async handleRequest(apiParams = {}) {
        const params = {
            apiBaseUrl: apiParams.baseUrl || this.defaultParams.apiBaseUrl,
            queryParams: apiParams.params || this.defaultParams.queryParams,
            httpMethod: apiParams.method || this.defaultParams.httpMethod,
            requestData: apiParams.data !== undefined ? apiParams.data : this.defaultParams.requestData,
            responseCallback: apiParams.callback || this.defaultParams.responseCallback,
            popupIdToOpen: apiParams.openPopupId || this.defaultParams.popupIdToOpen,
            targetContainer: apiParams.container || this.defaultParams.targetContainer,
            headers: apiParams.headers || this.defaultParams.headers || {},
            signal: apiParams.signal,
            ...apiParams
        };

        const {
            apiBaseUrl,
            queryParams,
            httpMethod,
            requestData,
            responseCallback,
            popupIdToOpen,
            targetContainer,
            headers,
            signal
        } = params;

        if (popupIdToOpen && this.options.uiAdapter?.preparePopup) {
            this.options.uiAdapter.preparePopup(popupIdToOpen);
        }

        const responseData = await this.request({
            url: apiBaseUrl,
            method: httpMethod,
            params: queryParams,
            data: requestData,
            headers,
            signal
        });

        if (targetContainer && this.options.uiAdapter?.populateContainer) {
            this.options.uiAdapter.populateContainer(targetContainer, responseData, queryParams?.per_page);
        } else if (popupIdToOpen && this.options.uiAdapter?.populatePopup) {
            this.options.uiAdapter.populatePopup(popupIdToOpen, responseData);
        } else if (typeof responseCallback === "function") {
            responseCallback(responseData);
        }

        return responseData;
    }
}

const apiHandler = new APIHandler();

export { APIHandler };
export default apiHandler;
