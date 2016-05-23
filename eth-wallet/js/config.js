/**
 * Created by tongsh on 2016/5/8.
 */
_cache_enabled = false; //Local Cache Indicator
//Global Config
if (typeof global == 'undefined' || global == null) {
    var network = window.localStorage.getItem('network');
    if (network == null) {
        network = 'test';
    }
    var rpcAddress = 'http://' + network + 'net.51chain.net:8545';
    global = {
        network: network,
        remoteRPC: rpcAddress,
        pbkdf2: {
            kdf: "pbkdf2",
            cipher: "aes-128-ctr",
            kdfparams: {
                c: 6037,
                dklen: 32,
                hash: "sha256",
                prf: "hmac-sha256"
            }
        }, scrypt: {
            kdf: "scrypt",
            main: {
                dklen: 32,
                n: 32766,
                r: 8,
                p: 1
            },
            test: {
                dklen: 32,
                n: 2048,
                r: 8,
                p: 1
            }
        }
    };
}

$(function () {
    var pk = window.sessionStorage.getItem(global.network + '-pk');
    if (pk == null || pk == undefined) {
        var ko = JSON.parse(window.localStorage.getItem(global.network + '-ko'));
        if (ko == null) {
            window.location.href = 'init/index.html';
            return;
        } else {
            var DummyWallet = function (keyObject) {
                this.ko = keyObject;
                this.getAddressString = function () {
                    return EthJS.Util.addHexPrefix(this.ko.address);
                };
            }
            DummyWallet.prototype.getPrivateKey = function () {
                return null;
            };
            DummyWallet.prototype.getPrivateKeyString = function () {
                return null;
            };
            var wallet = new DummyWallet(ko);
            global.wallet = wallet;
        }
    } else {
        var wallet = EthJS.Wallet.fromPrivateKey(EthJS.Util.toBuffer(pk, 'hex'));
        global.wallet = wallet;
    }
    initWeb3JS();
});
/**
 * 初始化 Web3
 * @returns {*|Web3}
 */
function initWeb3JS() {
    if(typeof Web3 == 'undefined') return null;
    if (typeof web3 == 'undefined' || web3 == null) {
        // set the provider you want from Web3.providers
        web3 = new Web3(new Web3.providers.HttpProvider(global.remoteRPC));
    } else {
        web3 = new Web3(web3.currentProvider)
    }
    return web3;
}
function checkLogin() {
    if(global.wallet.getPrivateKey() == null) {
        document.location.href = "init/index.html#login?callback=coin/index.html";
        return false;
    }else {
        return true;
    }
}