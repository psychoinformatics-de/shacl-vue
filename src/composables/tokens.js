// src/composables/tokens.js
import { ref } from 'vue';

const tokenName = 'serviceToken';
const token = ref(sessionStorage.getItem(tokenName) || null);

export function useToken() {
    const setToken = (newToken) => {
        token.value = newToken;
        sessionStorage.setItem(tokenName, newToken);
    };

    const clearToken = () => {
        token.value = null;
        sessionStorage.removeItem(tokenName);
    };

    return { token, setToken, clearToken };
}
