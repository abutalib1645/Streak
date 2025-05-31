// Bybit API Client Scaffold
const axios = require('axios');

const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_SECRET_KEY = process.env.BYBIT_SECRET_KEY;

module.exports = {
    async getWalletBalance() {
        return await axios.get('https://api.bybit.com/v2/private/wallet/balance', {
            headers: { 'X-BYBIT-APIKEY': BYBIT_API_KEY }
        });
    }
};