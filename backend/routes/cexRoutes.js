// CEX API Routes
const express = require('express');
const router = express.Router();
const binance = require('../cex_clients/binance');
const bybit = require('../cex_clients/bybit');
const coinbase = require('../cex_clients/coinbase');

router.get('/binance/balance', async (req, res) => {
    try {
        const result = await binance.getBalances();
        res.json(result.data);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

router.get('/bybit/balance', async (req, res) => {
    try {
        const result = await bybit.getWalletBalance();
        res.json(result.data);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

router.get('/coinbase/balance', async (req, res) => {
    try {
        const result = await coinbase.getAccounts();
        res.json(result.data);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

module.exports = router;
