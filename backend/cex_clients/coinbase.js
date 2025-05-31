// Coinbase API Client Scaffold
const axios = require('axios');

const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const COINBASE_SECRET = process.env.COINBASE_SECRET;

module.exports = {
    async getAccounts() {
        return await axios.get('https://api.coinbase.com/v2/accounts', {
            headers: { 'Authorization': `Bearer ${COINBASE_API_KEY}` }
        });
    }
};