/**
 * Created by tongsh on 2016/5/8.
 */
_cache_enabled = false; //Local Cache Indicator
//Global Config
if(typeof global == 'undefined' || global == null) {
    var network = window.localStorage.getItem('network');
    if(network == null) {
        network = 'test';
    }
    var rpcAddress = 'http://' + network + 'net.51chain.net:8545';
    global = {network:network,
        remoteRPC: rpcAddress,
        pbkdf2 : {
            kdf : "pbkdf2",
            cipher : "aes-128-ctr",
            kdfparams : {
                c : 6037,
                dklen : 32,
                hash: "sha256",
                prf : "hmac-sha256"
            }
        },scrypt: {
            kdf : "scrypt",
            kdfparams : {
                dklen: 32,
                n: 4096,
                r: 8,
                p: 1
            }
        }
    };
}

$(function(){
    var pk = window.sessionStorage.getItem(global.network + '-pk');
    if(pk == null || pk == undefined ) {
        if(window.location.pathname.indexOf('/init/index.html') < 0) {
            window.location.href = $.getContextPath() + 'init/index.html' ;
            return;
        }
    }else {
        var wallet = EthJS.Wallet.fromPrivateKey(EthJS.Util.toBuffer(pk,'hex'));
        global.wallet = wallet;
        //初始化 Web3
        if (typeof web3 == 'undefined' || web3 == null) {
            // set the provider you want from Web3.providers
            web3 = new Web3(new Web3.providers.HttpProvider(global.remoteRPC));
        } else {
            web3 = new Web3(web3.currentProvider)
        }
}});
