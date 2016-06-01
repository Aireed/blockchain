/**
 * Created by tongsh on 2016/5/26.
 */
var registry;
var contractIndex;
var quizContractABI = [{"constant":true,"inputs":[],"name":"playerCount","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[],"name":"betDown","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"betRecords","outputs":[{"name":"betUp","type":"uint256"},{"name":"betDown","type":"uint256"},{"name":"allowance","type":"int256"}],"type":"function"},{"constant":false,"inputs":[],"name":"betUp","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"summary","outputs":[{"name":"_countBetUp","type":"uint256"},{"name":"_betUp","type":"uint256"},{"name":"_countBetDown","type":"uint256"},{"name":"_betDown","type":"uint256"},{"name":"_allowance","type":"int256"},{"name":"_status","type":"uint8"}],"type":"function"},{"constant":true,"inputs":[],"name":"baseInfo","outputs":[{"name":"_assetCode","type":"string"},{"name":"_assetName","type":"string"},{"name":"_targetDate","type":"uint32"},{"name":"_preClosePrice","type":"uint32"},{"name":"_closePrice","type":"uint32"},{"name":"_status","type":"uint8"}],"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_countBetUp","type":"uint256"},{"indexed":false,"name":"_betUp","type":"uint256"},{"indexed":false,"name":"_countBetDown","type":"uint256"},{"indexed":false,"name":"_betDown","type":"uint256"},{"indexed":false,"name":"_allowance","type":"int256"},{"indexed":false,"name":"_status","type":"QuizA.Status"}],"name":"OnChange","type":"event"}];
var quizContract;
var Const_Status = {"0": '竞投中', "1": '已封盘', "2": '已收盘'};
var registries = {"test": "0x8e65C683Cc8912cAcAE9bc515b38df51d2EEDF26","main": "0x0000000000000000000000000000000000000000"};
var pendingAmount = [0, 0, 0, 2];
$(function () {
    //Check Login
    if(global.wallet.getPrivateKey() == null) {
        document.location.href = "../../init/index.html#login";
        return false;
    }
    // 1. 创建注册表合约
    var registryContractABI = [{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"contracts","outputs":[{"name":"contractAddress","type":"address"},{"name":"code","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"size","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"index","type":"uint256"}],"name":"next","outputs":[{"name":"newIndex","type":"uint256"},{"name":"contractAddress","type":"address"},{"name":"code","type":"string"}],"type":"function"},{"inputs":[],"type":"constructor"}];
    var contract = web3.eth.contract(registryContractABI);
    registry = contract.at(registries[global.network]);
    var zero = web3.toBigNumber(0);
    pendingAmount = [zero, zero, zero, 2];
    //2. 取当前选择的合约缩影
    contractIndex = window.localStorage.getItem("QuizAContractIndex")
    if (contractIndex == null) {
        contractIndex = 0; //If not set, use default instead
    }
    setTimeout(function() {
        $('#coverImg').remove();
    },2200);
    registry.contracts(contractIndex, function (e, r) { //Get current quiz contract address
        if (e == null) {
            var address = r[0];
            contract = web3.eth.contract(quizContractABI); //Init ABI
            quizContract = contract.at(address); //Locate quiz contract instance
            getBaseInfo(function (e, r) { //Fetch base info
                setTimeout(function () {
                    reladInfo();
                }, 1000);
                getMyBetInfo();
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
            });
        } else {
            $.alert('初始化合约错误', e);
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
    if(amount.mul(100).div(balance).gt(80)) {
        if(confirm('股市有风险，投入需谨慎！\n您确认要投入吗？') == false) {
            $('#betForm').hide();
            return false;
        }
    }

    $('#loadingToast').show();
    //Send Transaction
    return $.sendTransaction(quizContract.address, amount, payload, function (e, r) {
        if (e == null) {
            $('#betForm').hide();

            if ($('input[name=radioAction]')[0].checked) {
                pendingAmount[1] = pendingAmount[1].plus(amount);
            } else {
                pendingAmount[2] = pendingAmount[2].plus(amount);
            }
            getMyBetInfo();
            setTimeout(function() {$('#loadingToast').hide();},3000);
            console.log(JSON.stringify(r));
        } else {
            alert('系统错误:' + e);
            $('#loadingToast').hide();
        }
    });
}
function reladInfo() {
    var balance = web3.eth.getBalance(global.wallet.getAddressString());
    if (!balance.eq(pendingAmount[0])) {
        //Balance Changed
        $('#loadingToast').hide();
        pendingAmount = [balance, web3.toBigNumber(0), web3.toBigNumber(0)];
        getMyBetInfo();
    }
    getSummaryInfo();
}
function getBaseInfo(cb) {
    quizContract.baseInfo(function (e1, r1) { //Fetch base info
        if (e1 == null) {
            $('#targetInfo').text(r1[1] + '(' + r1[0] + ')');
            $('#targetDate').text(r1[2]);
            var price = r1[3].toNumber();
            if (price > 0) {
                $('#targetPreClose').text(price / 100);
            } else {
                $('#targetPreClose').text('-');
            }
            var price = r1[4].toNumber();
            if (price > 0) {
                $('#targetClose').text(price / 100);
            } else {
                $('#targetClose').text('-');
            }
            $('#targetStatus').text(Const_Status[r1[5]]);

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
            $('#targetStatus').text(Const_Status[r1[5]]);
            if(pendingAmount[3] != r1[5].toNumber()) {
                setTimeout(function() {
                    getBaseInfo();
                    getMyBetInfo();
                },1000);
                pendingAmount[3] = r1[5].toNumber();
            }

            if (pendingAmount[3] == 0) {
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
            $('#myBetUp').text(web3.fromWei(r1[0].plus(pendingAmount[1])).round(2));
            $('#myBetDown').text(web3.fromWei(r1[1].plus(pendingAmount[2])).round(2));
            $('#myWin').text(web3.fromWei(r1[2]).round(2));
            if (r1[2].gt(0)) {
                $('#myWin').css('color', 'red');
                $('#betResult').text('赢');
            } else if (r1[2].lt(0)) {
                $('#myWin').css('color', 'green');
                $('#betResult').text('输');
            } else {
                $('#betResult').text('');
            }
        } else {
            $.alert('取合约投注信息错误', e1);
        }
    });
}
