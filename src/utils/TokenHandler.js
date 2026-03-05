const TOKEN_HANDLER_API_URL = "https://sy9ci2wju3.execute-api.ap-northeast-1.amazonaws.com/dev-tokens-handler-lambda";
const TOKEN_HANDLER_TOKEN = "7da80697cf54a3a12e6fa4dd8162d3011749723e414b5b9c688d71c3582e43a1";

class TokenHandler {
    static apiUrl = TOKEN_HANDLER_API_URL;
    static token = TOKEN_HANDLER_TOKEN;

    constructor() { }

    static getAuthHeaders() {
        if (!this.token) {
            throw new Error("TOKEN_HANDLER_TOKEN is not configured.");
        }

        return {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
        };
    }

    static async get({ userId, receiverId = null, defaultValue = null } = {}) {
        // API URL
        const url = this.apiUrl + "/balance/" + userId;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const res = await response.json();

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
                return totalTokens;
            }

            return res;
        }
        catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
            return defaultValue;
        }
    }

    static async deduct({ userId, amount, args } = {}) {
        // Default data structure
        const data = {
            userId: String(userId),
            amount,
            ...args,
        };

        // Construct the API URL
        const url = this.apiUrl + '/deduct';

        try {
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

        // Construct the API URL
        const url = this.apiUrl + '/hold';

        try {
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

        // Construct the API URL
        const url = this.apiUrl + '/capture';

        try {
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

        // Construct the API URL
        const url = this.apiUrl + '/reverse';

        try {
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

        // Construct the API URL
        const url = this.apiUrl + (type === 'tip' ? '/tip' : '/transfer');

        try {
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

export default TokenHandler;
