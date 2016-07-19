/**
 * Created by tongsh on 2016/5/26.
 */
var registry;
var contractIndex;
var quizContractABI = [{
    "constant": true,
    "inputs": [],
    "name": "playerCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
}, {"constant": false, "inputs": [], "name": "betDown", "outputs": [], "type": "function"}, {
    "constant": true,
    "inputs": [{"name": "", "type": "address"}],
    "name": "betRecords",
    "outputs": [{"name": "betUp", "type": "uint256"}, {"name": "betDown", "type": "uint256"}, {
        "name": "allowance",
        "type": "int256"
    }],
    "type": "function"
}, {"constant": false, "inputs": [], "name": "betUp", "outputs": [], "type": "function"}, {
    "constant": true,
    "inputs": [],
    "name": "summary",
    "outputs": [{"name": "_countBetUp", "type": "uint256"}, {
        "name": "_betUp",
        "type": "uint256"
    }, {"name": "_countBetDown", "type": "uint256"}, {"name": "_betDown", "type": "uint256"}, {
        "name": "_allowance",
        "type": "int256"
    }, {"name": "_status", "type": "uint8"}],
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "baseInfo",
    "outputs": [{"name": "_assetCode", "type": "string"}, {
        "name": "_assetName",
        "type": "string"
    }, {"name": "_targetDate", "type": "uint32"}, {"name": "_preClosePrice", "type": "uint32"}, {
        "name": "_closePrice",
        "type": "uint32"
    }, {"name": "_status", "type": "uint8"}],
    "type": "function"
}, {
    "anonymous": false,
    "inputs": [{"indexed": false, "name": "_countBetUp", "type": "uint256"}, {
        "indexed": false,
        "name": "_betUp",
        "type": "uint256"
    }, {"indexed": false, "name": "_countBetDown", "type": "uint256"}, {
        "indexed": false,
        "name": "_betDown",
        "type": "uint256"
    }, {"indexed": false, "name": "_allowance", "type": "int256"}, {
        "indexed": false,
        "name": "_status",
        "type": "QuizA.Status"
    }],
    "name": "OnChange",
    "type": "event"
}];
var quizContract;
var Const_Status = {"0": '竞投中', "1": '已封盘', "2": '已收盘'};
var registries = {
    "test": "0x8e65C683Cc8912cAcAE9bc515b38df51d2EEDF26",
    "main": "0x0000000000000000000000000000000000000000"
};
var pendingAmount = [0, 0, 0, -1];
var targetCode = null;
var preClosePrice = 0;
var contractStatus = -1;
$(function () {
    //Check Login
    if (global.wallet.getPrivateKey() == null) {
        document.location.href = "../../init/index.html#login";
        return false;
    }
    //2. 取当前选择的合约索引
    contractIndex = window.localStorage.getItem("QuizAContractIndex");
    if (contractIndex == null) {
        contractIndex = 0; //If not set, use default instead
    } else {
        contractIndex = parseInt(contractIndex);
    }
    $('#coverImg').attr('src', 'QuizA-' + contractIndex + '.jpg');

    // 1. 创建注册表合约
    var registryContractABI = [{
        "constant": true,
        "inputs": [{"name": "", "type": "uint256"}],
        "name": "contracts",
        "outputs": [{"name": "contractAddress", "type": "address"}, {"name": "code", "type": "string"}],
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "size",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }, {
        "constant": true,
        "inputs": [{"name": "index", "type": "uint256"}],
        "name": "next",
        "outputs": [{"name": "newIndex", "type": "uint256"}, {
            "name": "contractAddress",
            "type": "address"
        }, {"name": "code", "type": "string"}],
        "type": "function"
    }, {"inputs": [], "type": "constructor"}];
    var contract = web3.eth.contract(registryContractABI);
    registry = contract.at(registries[global.network]);
    var zero = web3.toBigNumber(0);
    pendingAmount = [zero, zero, zero, -1];
    setTimeout(function () {
        $('#coverImg').remove();
        $('#divTabbar').show();
    }, contractIndex * 1000 + 2200);
    registry.contracts(contractIndex, function (e, r) { //Get current quiz contract address
        if (e == null) {
            var address = r[0];
            contract = web3.eth.contract(quizContractABI); //Init ABI
            quizContract = contract.at(address); //Locate quiz contract instance
//            getBaseInfo(function (e, r) { //Fetch base info
            setTimeout(function () {
                reladInfo();
            }, 500);
            //getMyBetInfo();
            setInterval(reladInfo, 5000);
            $('a[name=navBetNow]').bind('click', function () {
                $('#about').hide();
                switch (pendingAmount[3]) {
                    case 0: //Open
                        $('#betForm').show();
                        break;
                    case 1: //Locked
                        $.alert('系统提示', '<strong>本期竞猜已经封盘</strong><p/>请下期再参加<p/>（预计在股市收盘后30分钟开始）');
                        break;
                    case 2: //Closed
                        $.alert('系统提示', '<strong>本期竞猜已经结束</strong><p/>请下期再参加<p/>（预计在15分钟内开始）');
                }
            })
            //           });
        } else {
            $.alert('初始化合约错误', e);
        }
    });

    //3. If it's mobile, bind touch move event
    if (isTouchDevice()) {
        document.addEventListener('touchstart', touchSatrtFunc, false);
        document.addEventListener('touchend', touchEndFunc, false);
    }
    $.get("http://light.hs.net/auth.json", function (r, e) {
        if (e == null || e == 'success') {
            access_token = r.access_token;
            setInterval(refreshQuota, 5000);
        }
    });
});

function submitBet() {
    //Get Payload
    var payload;
    if ($('input[name=radioAction]')[0].checked) {
        payload = quizContract.betUp.getData();
    } else {
        payload = quizContract.betDown.getData();
    }
    //Get amount to be paid
    var amount = web3.toBigNumber(web3.toWei($('input[name=txtAmount]')[0].value, 'ether'));

    //Check if balance enough
    var balance = web3.eth.getBalance(global.wallet.getAddressString());
    var establishedGas = web3.eth.estimateGas({
        from: global.wallet.getAddressString(),
        amount: amount,
        payload: payload
    });
    var establishedFee = web3.eth.gasPrice.mul(establishedGas);
    balance = balance.sub(establishedFee);
    if (balance.lt(amount)) {
        alert('警告：余额不足以支付\n您至多能够投注(' + web3.fromWei(balance, 'ether').round(1).toNumber() + ') Ether');
        return false;
    }
    if (amount.mul(100).div(balance).gt(80)) {
        if (confirm('股市有风险，投入需谨慎！\n您确认要投入吗？') == false) {
            $('#betForm').hide();
            return false;
        }
    }

    $('#loadingToast').show();
    //Send Transaction
    return $.sendTransaction(quizContract.address, amount, payload, function (e, r) {
        if (e == null) {
            $('#betForm').hide();

            if ($('input[name=radioAction]')[0].checked) {//Bet Up
                pendingAmount[1] = pendingAmount[1].plus(amount);
                window.localStorage.setItem('tx-betUp-' + targetCode, r);
            } else { //Bet Down
                pendingAmount[2] = pendingAmount[2].plus(amount);
                window.localStorage.setItem('tx-betDown-' + targetCode, r);
            }
            getMyBetInfo();
            setTimeout(function () {
                $('#loadingToast').hide();
            }, 3000);
            console.log(JSON.stringify(r));
        } else {
            alert('系统错误:' + e);
            $('#loadingToast').hide();
        }
    });
}
function reladInfo() {
    //20160712 优化减少流量
    if (contractStatus <= 0) {
        //1st Open Page or is open status
        getSummaryInfo();
    } else if (contractStatus == 1) {
        //If it's lock status, only need load after 15:00
        var now = new Date();
        if (now.getHours() > 15) {
            getSummaryInfo();
        }
    } else {
        //it's already be settlement
        var now = new Date();
        if (now.getHours() > 17 || (now.getHours() == 17 && now.getMinutes() > 30)) {
            getSummaryInfo();
        }
    }

    if (pendingAmount[1].gt(0) || pendingAmount[2].gt(0)) {
        var balance = web3.eth.getBalance(global.wallet.getAddressString());
        if (!balance.eq(pendingAmount[0])) {
            //Balance Changed
            $('#loadingToast').hide();
            pendingAmount = [balance, web3.toBigNumber(0), web3.toBigNumber(0)];
            getMyBetInfo();
        }
    }
}
function getBaseInfo(cb) {
    quizContract.baseInfo(function (e1, r1) { //Fetch base info
        if (e1 == null) {
            targetCode = r1[0];
            $('#targetInfo').text(r1[1] + '(' + r1[0] + ')');
            $('#targetDate').text(r1[2]);
            var price = r1[3].toNumber();
            preClosePrice = price / 100;
            if (price > 0) {
                $('#targetPreClose').text(preClosePrice);
            } else {
                $('#targetPreClose').text('-');
            }
            var price = r1[4].toNumber();
            if (price > 0) {
                $('#targetClose').text(price / 100);
                $('#lblTargetClose').text('今收盘');
            } else {
                $('#lblTargetClose').text('最新价');
            }
            contractStatus = r1[5].toNumber();
            $('#targetStatus').text(Const_Status[contractStatus]);

            pendingAmount[0] = web3.eth.getBalance(global.wallet.getAddressString());
        } else {
            $.alert('取合约基本信息错误', e1);
        }
        if (typeof cb == 'function') {
            cb(e1, r1);
        }
    });
}
function getSummaryInfo() {
    quizContract.summary(function (e1, r1) { //Fetch gambling summary information
        if (e1 == null) {
            $('#countBetUp').text(r1[0].toNumber());
            $('#sumAmountBetUp').text(web3.fromWei(r1[1]).round(2));
            $('#countBetDown').text(r1[2].toNumber());
            $('#sumAmountBetDown').text(web3.fromWei(r1[3]).round(2));
            contractStatus = r1[5].toNumber();
            $('#targetStatus').text(Const_Status[contractStatus]);

            if (pendingAmount[0] == 0 || pendingAmount[1] > 0 || pendingAmount[2] > 0 || pendingAmount[3] != contractStatus) {
                //If first load or with pending submitiong, get my bet info or status changed
                setTimeout(getMyBetInfo,1000);
            }

            if (pendingAmount[3] != contractStatus) {
                //If status changed
                setTimeout(getBaseInfo,0);
                pendingAmount[3] = contractStatus;
            }

            if (contractStatus == 0) {
                $('a[name=btnBet]').show();
            } else {
                $('a[name=btnBet]').hide();
            }
        } else {
            $.alert('取合约基本信息错误', e1);
        }
    });
}

function getMyBetInfo() {
    quizContract.betRecords(global.wallet.getAddressString(), function (e1, r1) { //Fetch My Bet Record
        if (e1 == null) {
            var amount = web3.fromWei(r1[0].plus(pendingAmount[1]));
            $('#myBetUp').text(amount.round(2));

            var tx = window.localStorage.getItem('tx-betUp-' + targetCode);
            if (amount.eq(0)) {
                window.localStorage.removeItem('tx-betUp-' + targetCode);
                tx = null;
            }

            if (tx == null) {
                $('#lblBetUp').html('买涨');
            } else {
                $('#lblBetUp').html('<a href="http://testnet.etherscan.io/tx/' + tx + '">买涨</a>');
            }

            amount = web3.fromWei(r1[1].plus(pendingAmount[2]));
            tx = window.localStorage.getItem('tx-betDown-' + targetCode);
            if (amount.eq(0)) {
                window.localStorage.removeItem('tx-betDown-' + targetCode);
                tx = null;
            }

            $('#myBetDown').text(amount.round(2));
            if (tx == null) {
                $('#lblBetDown').html('买跌');
            } else {
                $('#lblBetDown').html('<a href="http://testnet.etherscan.io/tx/' + tx + '">买跌</a>');
            }

            $('#myWin').text(web3.fromWei(r1[2]).round(2));
            if (r1[2].gt(0)) {
                $('#myWin').css('color', 'red');
                $('#betResult').css('color', 'red');
                $('#betResult').text('赢');
            } else if (r1[2].lt(0)) {
                $('#myWin').css('color', 'green');
                $('#betResult').css('color', 'green');
                $('#betResult').text('输');
            } else {
                $('#betResult').text('');
            }
        } else {
            $.alert('取合约投注信息错误', e1);
        }
    });
}


//Touch Event
var startX = 0, startY = 0;
//touchstart事件
function touchSatrtFunc(evt) {
    try {
        //evt.preventDefault(); //阻止触摸时浏览器的缩放、滚动条滚动等
        var touch = evt.touches[0]; //获取第一个触点
        var x = Number(touch.pageX); //页面触点X坐标
        var y = Number(touch.pageY); //页面触点Y坐标
        //记录触点初始位置
        startX = x;
        startY = y;
        //console.log('Touch Start: ' + x +', ' + y);
    }
    catch (e) {
        alert('touchSatrtFunc：' + e.message);
    }
}

//touchend事件
function touchEndFunc(evt) {
    try {
        //evt.preventDefault(); //阻止触摸时浏览器的缩放、滚动条滚动等
        var touch = evt.changedTouches[0]; //获取第一个触点
        var x = Number(touch.pageX); //页面触点X坐标
        var y = Number(touch.pageY); //页面触点Y坐标
        //判断滑动方向
//        console.log('Touch End: ' + x +', ' + y);
        var xchange = x - startX;
        if (Math.abs(xchange) > Math.abs(y - startY)) {
            //Only move dist on x greater than on y
            if (xchange > 50) {
                contractIndex = contractIndex - 1;
                if (contractIndex < 0) {
                    contractIndex = registry.size().toNumber() - 1;
                }
                window.localStorage.setItem("QuizAContractIndex", contractIndex);
                evt.preventDefault(); //阻止触摸时浏览器的缩放、滚动条滚动等
                document.location.reload();
            } else if (xchange < -50) {
                contractIndex = contractIndex + 1;
                if (contractIndex >= registry.size().toNumber()) {
                    contractIndex = 0;
                }
                window.localStorage.setItem("QuizAContractIndex", contractIndex);
                evt.preventDefault(); //阻止触摸时浏览器的缩放、滚动条滚动等
                document.location.reload();
            }
        }

    }
    catch (e) {
        alert('touchEndFunc：' + e.message);
    }
}

//判断是否支持触摸事件
function isTouchDevice() {
    try {
        document.createEvent("TouchEvent");
        return true;
    }
    catch (e) {
        return false;
    }
}

function refreshQuota() {
    if (targetCode != null && typeof access_token != 'undefined') {
        var now = new Date();
        var hm = now.getHours() * 100 + now.getMinutes();
        if ($('#targetClose').text() == '' || (hm > 930 && hm < 1505)) {
            //Only load first time or during trading time
            $.getJSON('http://open.hscloud.cn/quote/v1/real?en_prod_code=' + targetCode + '&fields=last_px&access_token=' + access_token, function (r, e) {
                if (e == 'success') {
                    var lastPrice = r.data.snapshot[targetCode][2];
                    if (lastPrice < preClosePrice) {
                        $('#targetClose').css('color', 'green');
                        $('#targetClose').text(lastPrice.toFixed(2) + ' ↓');
                    } else if (lastPrice > preClosePrice){
                        $('#targetClose').css('color', 'red');
                        $('#targetClose').text(lastPrice.toFixed(2) + ' ↑');
                    }else {
                        $('#targetClose').text(lastPrice.toFixed(2));
                    }

                }
            });
        }
    }
}