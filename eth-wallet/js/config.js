/**
 * Created by tongsh on 2016/5/8.
 */
_cache_enabled = true; //Local Cache Indicator
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
        version: 27,
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
    //判断是否已经登录（已经获得私钥）
    var pk = window.sessionStorage.getItem(global.network + '-pk');
    if (pk == null || pk == undefined) {
        //未获得私钥, 检查KeyObject是否存在
        var ko = JSON.parse(window.localStorage.getItem(global.network + '-ko'));
        if (ko == null) {
            //KeyObject也不存在，跳转到初始化
            var path = document.location.pathname;
            if(path.indexOf('/init/index.html')>=0) {
                return; //如果是初始化界面，不要执行跳转
            }else {
                window.location.href = $.getContextPath() + '/init/index.html';
                return;
            }
        } else {
            //有KeyObject但是没有登录，使用Dummy代替钱包
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
        //创建钱包实例
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
/**
 * 检查是否登录，如果应用APP的配置上设置了需要登录，会在跳转之前执行此方法
 * @returns {boolean}
 */
function checkLogin(cburi) {
    if(global.wallet.getPrivateKey() == null) {
        document.location.href = "init/index.html#login?callback=" + cburi;
        return false;
    }else {
        return true;
    }
}