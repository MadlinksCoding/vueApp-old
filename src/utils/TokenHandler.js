import { logFanBookingDebug } from "@/embeds/fanBooking/debug.js";
import { getRuntimeBackendJwtToken } from "@/utils/backendJwt.js";

const TOKEN_HANDLER_TOKEN_FALLBACK = typeof __FS_DEV_TOKEN_HANDLER_KEY__ === "string" ? __FS_DEV_TOKEN_HANDLER_KEY__ : "";

function normalizeToken(value) {
    if (typeof value !== "string") return "";
    return value.trim();
}

function normalizeTokenHandlerApiUrl(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/\/+$/, "");
}

const TOKEN_HANDLER_API_URL = normalizeTokenHandlerApiUrl(import.meta.env?.VITE_TOKEN_HANDLER_API_URL);

class TokenHandler {
    static apiUrl = TOKEN_HANDLER_API_URL;
    static tokenFallback = TOKEN_HANDLER_TOKEN_FALLBACK;

    constructor() { }

    static setApiUrl(apiUrl = "") {
        this.apiUrl = normalizeTokenHandlerApiUrl(apiUrl);
        return this.apiUrl;
    }

    static getApiUrl() {
        return normalizeTokenHandlerApiUrl(this.apiUrl);
    }

    static requireApiUrl() {
        const apiUrl = this.getApiUrl();
        if (!apiUrl) {
            throw new Error("Token handler API URL is not configured.");
        }
        return apiUrl;
    }

    static buildUrl(path = "") {
        return `${this.requireApiUrl()}${path}`;
    }

    static getToken() {
        return getRuntimeBackendJwtToken() || normalizeToken(this.tokenFallback);
    }

    static getAuthHeaders() {
        const token = this.getToken();

        if (!token) {
            throw new Error("Backend JWT token is not configured.");
        }

        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    static async get({ userId, receiverId = null, defaultValue = null, signal } = {}) {
        let url = "";

        try {
            url = this.buildUrl("/balance/" + userId);
            logFanBookingDebug("token-handler", "get:start", {
                userId,
                receiverId,
                url,
            });

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                ...(signal ? { signal } : {}),
            });

            logFanBookingDebug("token-handler", "get:http-response", {
                ok: response.ok,
                status: response.status,
                url,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const res = await response.json();
            logFanBookingDebug("token-handler", "get:json", res);

            if (!res.ok) {
                throw new Error('API response was not ok');
            }

            if (receiverId !== null) {
                const data = (res && typeof res === "object" ? res.data : null) || {};
                const beneficiaryMap = (data && typeof data.freeTokensPerBeneficiary === "object")
                    ? data.freeTokensPerBeneficiary
                    : {};

                const paidTokens = Number(data.paidTokens || data.balance || 0);
                const freeTokens = Number(beneficiaryMap?.[receiverId] || 0);
                const systemTokens = Number(beneficiaryMap?.system || 0);

                const totalTokens = paidTokens + freeTokens + systemTokens;
                logFanBookingDebug("token-handler", "get:beneficiary-total", {
                    totalTokens,
                    paidTokens,
                    freeTokens,
                    systemTokens,
                });

                // if inside an iframe, also dispatch the event to the parent window
                if (window.parent && window.parent !== window) {
                    window.parent.document.dispatchEvent(new CustomEvent('token:balance-retrieved', {
                        detail: {
                            userId: userId,
                            receiverId,
                            balance: {
                                total: totalTokens,
                                paid: paidTokens,
                                free: freeTokens,
                                system: systemTokens,
                            },
                            timestamp: Date.now(),
                        }
                    }));
                }

                return totalTokens;
            }

            logFanBookingDebug("token-handler", "get:success", res);
            return res;
        }
        catch (error) {
            const wasAborted = error?.name === "AbortError" || signal?.aborted;
            if (!wasAborted) {
                console.error('There has been a problem with your fetch operation:', error);
            }
            logFanBookingDebug("token-handler", "get:error", {
                message: error?.message || String(error),
                name: error?.name || null,
                aborted: wasAborted,
                url,
            });
            return defaultValue;
        }
    }

    /**
     * Wait until the beneficiary-aware usable balance reaches a required amount.
     * Token credits are queried through a secondary index and may not be visible
     * immediately after checkout reports success, so booking hold adjustments must
     * gate on this authoritative read instead of a cosmetic balance UI refresh.
     */
    static async waitForBalance({
        userId,
        receiverId,
        minimumBalance,
        timeoutMs = 15000,
        delaysMs = [250, 500, 1000, 2000],
        initialDelayMs = 0,
        signal,
    } = {}) {
        const required = Number(minimumBalance);
        const timeout = Math.max(0, Number(timeoutMs) || 0);
        const schedule = Array.isArray(delaysMs) && delaysMs.length > 0
            ? delaysMs.map((value) => Math.max(0, Number(value) || 0))
            : [250, 500, 1000, 2000];
        const startedAt = Date.now();
        let attempts = 0;
        let lastBalance = null;
        let hadValidBalance = false;

        const result = (ready, reason) => ({
            ready,
            reason,
            balance: lastBalance,
            attempts,
            elapsedMs: Math.max(0, Date.now() - startedAt),
        });

        if (!userId || receiverId === null || receiverId === undefined || !Number.isFinite(required) || required < 0) {
            return result(false, "invalid_request");
        }
        if (signal?.aborted) return result(false, "aborted");

        const wait = (duration) => new Promise((resolve) => {
            if (signal?.aborted) {
                resolve(false);
                return;
            }
            if (duration <= 0) {
                resolve(true);
                return;
            }
            let timerId = null;
            const onAbort = () => {
                clearTimeout(timerId);
                signal?.removeEventListener("abort", onAbort);
                resolve(false);
            };
            timerId = setTimeout(() => {
                signal?.removeEventListener("abort", onAbort);
                resolve(true);
            }, duration);
            signal?.addEventListener("abort", onAbort, { once: true });
        });

        const readBalance = (duration) => new Promise((resolve) => {
            const requestController = new AbortController();
            let settled = false;
            let timerId = null;
            const finish = (reason, value = null) => {
                if (settled) return;
                settled = true;
                clearTimeout(timerId);
                signal?.removeEventListener("abort", onAbort);
                resolve({ reason, value });
            };
            const onAbort = () => {
                requestController.abort();
                finish("aborted");
            };

            if (signal?.aborted) {
                finish("aborted");
                return;
            }

            signal?.addEventListener("abort", onAbort, { once: true });
            timerId = setTimeout(() => {
                requestController.abort();
                finish("deadline");
            }, Math.max(0, duration));

            Promise.resolve(this.get({
                userId,
                receiverId,
                defaultValue: null,
                signal: requestController.signal,
            })).then(
                (value) => finish("value", value),
                () => finish("value", null),
            );
        });

        if (initialDelayMs > 0) {
            const continued = await wait(Math.min(Math.max(0, Number(initialDelayMs) || 0), timeout));
            if (!continued || signal?.aborted) return result(false, "aborted");
        }

        while (!signal?.aborted) {
            const elapsedBeforeRead = Math.max(0, Date.now() - startedAt);
            const readBudget = timeout - elapsedBeforeRead;
            if (readBudget <= 0) break;
            attempts += 1;
            const read = await readBalance(readBudget);
            if (read.reason === "aborted") return result(false, "aborted");
            if (read.reason === "deadline") break;
            const value = read.value;
            const numeric = Number(value);
            if (value !== null && value !== undefined && value !== "" && Number.isFinite(numeric)) {
                hadValidBalance = true;
                lastBalance = Math.max(0, numeric);
                if (lastBalance >= required) return result(true, "ready");
            }

            const elapsed = Math.max(0, Date.now() - startedAt);
            const remaining = timeout - elapsed;
            if (remaining <= 0) break;
            const delay = schedule[Math.min(attempts - 1, schedule.length - 1)];
            const continued = await wait(Math.min(delay, remaining));
            if (!continued) return result(false, "aborted");
        }

        if (signal?.aborted) return result(false, "aborted");
        return result(false, hadValidBalance ? "timeout" : "unavailable");
    }

    static async deduct({ userId, amount, args } = {}) {
        // Default data structure
        const data = {
            userId: String(userId),
            amount,
            ...args,
        };

        try {
            const url = this.buildUrl('/deduct');

            // Send POST request to the API with JSON data
            const response = await fetch(url, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            // Check if HTTP request failed
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Parse JSON
            const responseJson = await response.json();

            // Validate JSON structure
            if (typeof responseJson !== "object" || responseJson === null) {
                throw new Error("Invalid JSON response from API.");
            }

            // Check API's logical "ok" flag
            if (!responseJson.ok) {
                throw new Error(`API error: ${responseJson.error ?? "Unknown error"}`);
            }

            // Return the successful response
            return { ok: true, tx: responseJson.tx };
        } catch (error) {
            // Equivalent to returning WP_Error in PHP
            console.error("Error:", error.message);
            return { ok: false, error };
        }
    }

    static async hold({ userId, receiverId, amount, args } = {}) {
        // Default data structure
        const data = {
            userId: String(userId),
            beneficiaryId: String(receiverId),
            amount,
            ...args,
        };

        try {
            const url = this.buildUrl('/hold');

            // Send POST request to the API with JSON data
            const response = await fetch(url, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            // Check if HTTP request failed
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Parse JSON
            const responseJson = await response.json();

            // Validate JSON structure
            if (typeof responseJson !== "object" || responseJson === null) {
                throw new Error("Invalid JSON response from API.");
            }

            // Check API's logical "ok" flag
            if (!responseJson.ok) {
                throw new Error(`API error: ${responseJson.error ?? "Unknown error"}`);
            }

            // Return the successful response
            return { ok: true, tx: responseJson.tx };
        } catch (error) {
            // Equivalent to returning WP_Error in PHP
            console.error("Error:", error.message);
            return { ok: false, error };
        }
    }

    static async capture({ txId = '', refId = '', args = {} } = {}) {
        const transactionId = typeof txId === 'string' ? String(txId).trim() : '';
        const referenceId = typeof refId === 'string' ? String(refId).trim() : '';

        if (transactionId === '' && referenceId === '') {
            throw new Error("Either txId or refId must be provided.");
        }

        // Default data structure
        const data = { ...args };

        if (transactionId !== '') {
            data.transactionId = transactionId;
        }

        if (referenceId !== '') {
            data.refId = referenceId;
        }

        try {
            const url = this.buildUrl('/capture');

            // Send POST request to the API with JSON data
            const response = await fetch(url, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            // Check if HTTP request failed
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Parse JSON
            const responseJson = await response.json();

            // Validate JSON structure
            if (typeof responseJson !== "object" || responseJson === null) {
                throw new Error("Invalid JSON response from API.");
            }

            // Check API's logical "ok" flag
            if (!responseJson.ok) {
                throw new Error(`API error: ${responseJson.error ?? "Unknown error"}`);
            }

            // Return the successful response
            return { ok: true, data: responseJson.data };
        } catch (error) {
            // Equivalent to returning WP_Error in PHP
            console.error("Error:", error.message);
            return { ok: false, error };
        }
    }

    static async reverse({ txId = '', refId = '', args = {} } = {}) {
        const transactionId = typeof txId === 'string' ? String(txId).trim() : '';
        const referenceId = typeof refId === 'string' ? String(refId).trim() : '';

        if (transactionId === '' && referenceId === '') {
            throw new Error("Either txId or refId must be provided.");
        }

        // Default data structure
        const data = { ...args };

        if (transactionId !== '') {
            data.transactionId = transactionId;
        }

        if (referenceId !== '') {
            data.refId = referenceId;
        }

        try {
            const url = this.buildUrl('/reverse');

            // Send POST request to the API with JSON data
            const response = await fetch(url, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            // Check if HTTP request failed
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Parse JSON
            const responseJson = await response.json();

            // Validate JSON structure
            if (typeof responseJson !== "object" || responseJson === null) {
                throw new Error("Invalid JSON response from API.");
            }

            // Check API's logical "ok" flag
            if (!responseJson.ok) {
                throw new Error(`API error: ${responseJson.error ?? "Unknown error"}`);
            }

            // Return the successful response
            return { ok: true, data: responseJson.data };
        } catch (error) {
            // Equivalent to returning WP_Error in PHP
            console.error("Error:", error.message);
            return { ok: false, error };
        }
    }

    static async send({ userId, receiverId, amount, args } = {}) {
        const type = args?.type || 'transfer';
        const context = args?.context || null;
        if (args && (Object.prototype.hasOwnProperty.call(args, 'type') || Object.prototype.hasOwnProperty.call(args, 'context'))) {
            // eslint-disable-next-line no-unused-vars
            const { type: _removedType, context: _removedContext, ...remainingArgs } = args;
            args = remainingArgs;
        }

        // Default data structure
        const data = {
            senderId: String(userId),
            beneficiaryId: String(receiverId),
            amount,
            ...args,
        };

        try {
            const url = this.buildUrl(type === 'tip' ? '/tip' : '/transfer');

            // Send POST request to the API with JSON data
            const response = await fetch(url, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            // Check if HTTP request failed
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Parse JSON
            const responseJson = await response.json();

            // Validate JSON structure
            if (typeof responseJson !== "object" || responseJson === null) {
                throw new Error("Invalid JSON response from API.");
            }

            // Check API's logical "ok" flag
            if (!responseJson.ok) {
                throw new Error(`API error: ${responseJson.error ?? "Unknown error"}`);
            }

            // Return the successful response
            return { ok: true, data: responseJson.data };
        } catch (error) {
            // Equivalent to returning WP_Error in PHP
            console.error("Error:", error.message);
            return { ok: false, error };
        }
    }
}

export function setRuntimeTokenHandlerApiUrl(apiUrl = "") {
    return TokenHandler.setApiUrl(apiUrl);
}

export default TokenHandler;
