/**
 * Created by tongsh on 2016/5/4.
 */
$.alert = function (title, message, cb) {
    if ($('#_alert_dialog').length == 0) {
        $('body').append('<div class="weui_dialog_alert" id="_alert_dialog" style="display: none;"><div class="weui_mask"></div><div class="weui_dialog"><div class="weui_dialog_hd"><strong class="weui_dialog_title" id="_alert_title">系统信息</strong></div><div class="weui_dialog_bd" id="_alert_message"></div><div class="weui_dialog_ft"><a href="javascript:;" class="weui_btn_dialog primary">确定</a></div></div></div>');
    }
    $('#_alert_title').text(title);
    $('#_alert_message').html(message);
    $('#_alert_dialog').show().on('click', '.weui_btn_dialog', function () {
        $('#_alert_dialog').off('click').hide();
        if (typeof cb === 'function') {
            setTimeout(cb, 0);
        }
    });
}
$.getContextPath = function getContextPath() {
    var rootContext = window.localStorage.getItem('rootContext');
    if(rootContext != null) return rootContext;
    var pathName = document.location.pathname;

    //Light use second path as root path
    if(document.location.hostname == 'light.hs.net') {
        var index = pathName.substr(8).indexOf("/");
        var result = pathName.substr(0, index + 8);
        return result;
    }else {
        var index = pathName.substr(1).indexOf("/");
        var result = pathName.substr(0, index + 1);
        return result;
    }
}
$.getClientType = function () {
    if(typeof $.clientType == 'undefined' || $.clientType == null) {
        $.clientType = $.isMobile()?'mobile':'desktop';
    }
    return $.clientType;
}
$.isMobile = function () {
    var mobileAgent = new Array("iphone", "ipod", "ipad", "android", "mobile", "blackberry", "webos", "incognito", "webmate", "bada", "nokia", "lg", "ucweb", "skyfire");
    var browser = navigator.userAgent.toLowerCase();
    var isMobile = false;
    for (var i = 0; i < mobileAgent.length; i++) {
        if (browser.indexOf(mobileAgent[i]) != -1) {
            isMobile = true;
            break;
        }
    }
    return isMobile;
}

$.getRequestParams = function () {
    var name, value;
    var str = (typeof location.hash == undefined ? location.href : location.hash); //取得整个地址栏
    var num = str.indexOf("?")
    if (num <= 0) return {};
    var r = new Object();
    str = str.substr(num + 1); //取得所有参数   stringvar.substr(start [, length ]
    var arr = str.split("&"); //各个参数放到数组里
    for (var i = 0; i < arr.length; i++) {
        num = arr[i].indexOf("=");
        if (num > 0) {
            name = arr[i].substring(0, num);
            value = arr[i].substr(num + 1);
            r[name] = decodeURI(value);
        }
    }
    return r;
}
$.loadTemplate = function (url, cb) {
    if (typeof router == 'undefined' || router == null) {
        router = new Router({
            container: '#container',
            enterTimeout: 0,
            leaveTimeout: 0
        });
    }

    var tpl = router._routes[url];
    if (tpl != null) {
        if(typeof cb == 'function') {
            setTimeout(cb,0);
        }
        return; //Already Existed
    }
    var ctxpath =  $.getContextPath();
    var uri;

    if (url.charAt(0) != '/') {
        var num = document.location.pathname.lastIndexOf('/');
         uri =  document.location.pathname.substr(ctxpath.length,num - ctxpath.length + 1) + url;
    }else {
        uri = url;
    }


    if (uri.charAt(uri.length - 1) == '/') {
        uri = uri + 'index';
    }

    var id = 'tpl' + uri.replace(/\//g, "_");

    tpl = document.getElementById(id);

    if (tpl == null && ((typeof _cache_enabled == 'undefined') || _cache_enabled)) {
        tpl = window.localStorage.getItem(id);
        //if (tpl != null) {
            //$('body').append('<script type="text/html" id="' + id + '">' + tpl + '</script>')
        //}
    }

    if (typeof tpl == undefined || tpl == null) {
        $.get( $.getContextPath() +  '/templates/' + $.getClientType()  + uri + '.html', function (r, e) {
                if (e == 'success') {
                    window.localStorage.setItem(id, r);
                    //$('body').append('<script type="text/html" id="' + id + '">' + r + '</script>')
                    router.push({
                        url: url,
                        className: 'w' + uri.replace(/\//g, "-"),
                        render: function () {
                            var t = juicer(localStorage.getItem(id));
                            var params = $.getRequestParams();
                            return t.render(params);
                        }
                    });
                    if(typeof cb == 'function') {
                        setTimeout(cb,10);
                    }
                } else {
                    alert(e);
                }
            }
        );
    } else {
        //already existed
        router.push({
            url: url,
            className: 'w' + url.replace(/\//g, "-"),
            render: function () {
                var t = juicer(localStorage.getItem(id));
                var params = $.getRequestParams();
                return t.render(params);
            }
        });
        if(typeof cb == 'function') {
            setTimeout(cb,10);
        }
    }
}

/**
 * 发送交易
 */
$.sendTransaction = function (address, amount, payload, cb) {
    var gasPrice = web3.eth.gasPrice;
    var gasPriceHex = web3.toHex(gasPrice);
    var gasLimitHex = web3.toHex(300000);
//	console.log('Current gasPrice: ' + gasPrice + ' OR ' + gasPriceHex);
    var nonce = web3.eth.getTransactionCount(global.wallet.getAddressString());
    var nonceHex = web3.toHex(nonce);

    var rawTx = {
        nonce : nonceHex,
        gasPrice : gasPriceHex,
        gasLimit : gasLimitHex,
        to : address,
        from : global.wallet.getAddressString(),
        value : web3.toHex(amount)
    };
    if (payload != undefined && payload != null) {
        rawTx.data = payload;
    }
    console.log('Build Transaction: ' + JSON.stringify(rawTx,' ','\t'));
    var tx = new EthJS.Tx(rawTx);
    try{
        tx.sign(global.wallet.getPrivateKey());
    }catch(e) {
        alert(e);
        return false;
    }
    var serializedTx = tx.serialize();
    console.log('Sign Transaction: ' + serializedTx.toString('hex'));
    console.log("Send Transaction");
    if(typeof cb == 'function') {
        return web3.eth.sendRawTransaction(serializedTx.toString('hex'),cb);
    }else {
        return web3.eth.sendRawTransaction(serializedTx.toString('hex'));
    }
}
