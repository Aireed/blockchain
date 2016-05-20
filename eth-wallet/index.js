/**
 * Created by tongsh on 2016/5/3.
 */
//Global Config

$(function () {
    var path = document.location.pathname;
    var rootContext = path.substring(0,path.lastIndexOf('/'));
    window.localStorage.setItem('rootContext', rootContext);
    var pk = window.sessionStorage.getItem(global.network + '-pk');
    if(pk == null || pk == undefined ) {
        window.location.href = 'init/index.html';
        return;
    }else {
        if(global.wallet == undefined || global.wallet == null) {
            var wallet = EthJS.Wallet.fromPrivateKey(EthJS.Util.toBuffer(pk,'hex'));
            global.wallet = wallet;
        }
        //初始化 Web3
        if (typeof web3 == 'undefined' || web3 == null) {
            // set the provider you want from Web3.providers
            web3 = new Web3(new Web3.providers.HttpProvider(global.remoteRPC));
        } else {
            web3 = new Web3(web3.currentProvider)
        }
    }

    // 1. get private key
        setTimeout(getBalances,1000);
        setInterval(getBalances,10000);

    $.getJSON('./apps/config-' + global.network +'.json',function(r,e) {
        if(e == 'success') {
            var tpl = juicer($('#tpl_home').html());
            var homePage = tpl.render({"apps": r, "network": global.network});
            $('#container').html(homePage);
        }else {
            $.alert('系统错误',e);
        }
    });
});
/**
 * 刷新余额
 */
function getBalances() {
   web3.eth.getBalance(global.wallet.getAddressString(),function(e,balance) {
       if(e==null || e=='success') {
           $('#ethBalance').text(web3.fromWei(balance,'ether').round(4).toString());
       }else {
           $.alert('系统异常', e);
       }

   });
}
/**
 * 改变网络
 */
function changeNet() {

    $('#dlg_selectnet').off('click').hide();
    var newNet = global.network;
    $.each($('input[name=radioNet]'),function(){
        if($(this)[0].checked)
        {
            newNet = $(this)[0].value;
            if(newNet != global.network) {
                window.localStorage.setItem('network', newNet);
                global.network = newNet;
                window.location.reload();
                return;
            }
        }
    });
}