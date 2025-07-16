// src/composables/tokens.js
import { ref } from 'vue';

const tokenNames = {
    "serviceToken": "serviceToken",
    "gitAnnexUserName": "gitAnnexUserName",
    "gitAnnexPassword": "gitAnnexPassword",
}
const tokens = {};
for (var t of Object.keys(tokenNames)) {
    tokens[t] = ref(sessionStorage.getItem(tokenNames[t]) || null);
}
const token = tokens["serviceToken"]

export function useTokens() {
    function setToken(name, newToken) {
        tokens[name].value = newToken;
        sessionStorage.setItem(name, newToken);
    };

    function clearToken(name) {
        tokens[name].value = null;
        sessionStorage.removeItem(name);
    };

    return { tokens, setToken, clearToken};
}
