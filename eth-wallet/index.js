/**
 * Created by tongsh on 2016/5/3.
 */
//Global Config

$(function () {
    //1. Init Page
    loadSubApps();
    //2. Start timer to get balance
    setTimeout(getBalances, 1000);
    setInterval(getBalances, 10000);
});

/**
 * Load sub app
 */
function loadSubApps() {
    $.getJSON('./app/config-' + global.network + '.json?v=' + global.version, function (r, e) {
        if (e == 'success') {
            var tpl = juicer($('#tpl_home').html());
            var homePage = tpl.render({"apps": r, "network": global.network,
                "wallet":global.wallet,
                "keyObject": window.localStorage.getItem(global.network + '-ko')});
            $('#container').html(homePage);
            $('#kwd').bind('touchstart',function() {setTimeout(selectText, 800);});
        } else {
            $.alert('系统错误', e);
        }
    });
}
/**
 * 刷新余额
 */
function getBalances() {
    web3.eth.getBalance(global.wallet.getAddressString(), function (e, balance) {
        if (e == null || e == 'success') {
            $('#ethBalance').text(web3.fromWei(balance, 'ether').round(4).toString());
        } else {
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
    $.each($('input[name=radioNet]'), function () {
        if ($(this)[0].checked) {
            newNet = $(this)[0].value;
            if (newNet != global.network) {
                window.localStorage.setItem('network', newNet);
                global.network = newNet;
                window.location.reload();
                return;
            }
        }
    });
}

function selectText() {
    var doc = document,
        text = doc.getElementById('kwd'),
        range,
        selection;

    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
        /*if(selection.setBaseAndExtent){
         selection.setBaseAndExtent(text, 0, text, 1);
         }*/
    }else{
        alert("none");
    }
}