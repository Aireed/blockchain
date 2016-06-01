/**
 * Created by tongsh on 2016/4/27.
 */
var watcher = null;
var pendingAmount = 0;
$(function() {
	//Check Login
	if(global.wallet.getPrivateKey() == null) {
		document.location.href = "../../init/index.html#login";
		return false;
	}

	$.isValid = function() {
		var result = true;
		$.each($('input'), function(t, e) {
			if (e.pattern != undefined) {
				if (!e.value.match(e.pattern)) {
					result = false;
					e.parentNode.parentNode.className += ' weui_cell_warn';
					e.focus();
					return false;
				}
			}
		});
		return result;
	}
	$('button').bind(
					'click',
					function() {

						if ($.isValid()) {
							var coinAmount = parseInt($('#amount').val());
							var operation = $('#operation').val();
							if (operation == 1) {
								// 买入
								// 获取买入价（以Wei为单位）
								var buyPrice = coinContractInstance.buyPrice();

								// 获取以太币余额
								var balance = web3.eth.getBalance(global.wallet
										.getAddressString());
								$('#ethBalance').text(
										web3.fromWei(balance, 'ether').round(6).toString());

								// 检查余额是否足，+ 80000是预计汽油费，以wei为单位
								var ethAmount = buyPrice.mul(coinAmount);
								if (ethAmount.plus(80000).gt(balance)) {
									// 余额不足
									$.alert('系统信息',
													'<div class="weui_cell_warn"><i class="weui_icon_warn"></i>&nbsp;持币余额不足！</div>');
									return false;
								} 
								pendingAmount += coinAmount;
								$('#pendingAmount').text(pendingAmount);
								$('#lblPendingCoins').show();
								return buy(ethAmount);

							} else {
								var myCoins = coinContractInstance.balanceOf(
										global.wallet.getAddressString())
										.toNumber();
								$('#lblMyCoins').text(myCoins);
								if (coinAmount > myCoins) {
									$
											.alert('系统信息',
													'<div class="weui_cell_warn"><i class="weui_icon_warn"></i>&nbsp;持有积分不足！</div>');

									return false;
								} 
								pendingAmount -= coinAmount;
								$('#pendingAmount').text(pendingAmount);
								$('#lblPendingCoins').show();
								sell(coinAmount);
							}
						}
						;
					});

	// 3. 初始化合约
	$.getJSON('./ScoreTokenContract.json', function(abi, e) {
		if (e == 'success') {
			var contract = web3.eth.contract(abi);

			// 4. 获取合约实例
			var contractAddress = "0x81867a79f4939E77418696Bf363089F220a0368B";
			coinContractInstance = contract.at(contractAddress);
			refreshInfo();
		} else {
			$.alert('初始化合约错误', e);
		}
	});

	if (/Android/gi.test(navigator.userAgent)) {
		window.addEventListener('resize', function () {
			if (document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') {
				window.setTimeout(function () {
					document.activeElement.scrollIntoViewIfNeeded();
				}, 0);
			}
		})
	}
})

/**
 * 买入积分代币 参数: 需要花费的以太币
 */
function buy(ethAmount) {
	var payload = coinContractInstance.buy.getData();
	return sendTransaction(coinContractInstance.address, ethAmount, payload);
}

/** * 卖出积分
 */
function sell(coinAmount) {
	var payload = coinContractInstance.sell.getData(coinAmount);
	return sendTransaction(coinContractInstance.address, 0, payload);
}

/**
 * 发送交易
 */
function sendTransaction(address, amount, payload) {
	var gasPrice = web3.eth.gasPrice;
	var gasPriceHex = web3.toHex(gasPrice);
	var gasLimitHex = web3.toHex(300000);
//	console.log('Current gasPrice: ' + gasPrice + ' OR ' + gasPriceHex);
	var nonce = web3.eth.getTransactionCount(global.wallet.getAddressString());
	var nonceHex = web3.toHex(nonce);
//	alert('nonce (transaction count on fromAccount): ' + nonce + '(' + nonceHex + ')');

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
		return;
	}
	var serializedTx = tx.serialize(); 
	console.log('Sign Transaction: ' + serializedTx.toString('hex'));
	if(watcher == null) {
		watcher =  coinContractInstance.Transfer({},'');
		watcher.watch(function(e,r) {
			console.log("Event Transfer from " +  r.args.from + " to " + r.args.to + " with coin count " + r.args.value);
/*			if(r.args.from == global.wallet.getAddressString()) {
				pendingAmount += r.args.value.toNumber();
			}else {
				pendingAmount -= r.args.value.toNumber();
			}
*/
            pendingAmount = 0;
            $('#pendingAmount').text(pendingAmount);
			if(pendingAmount == 0) {
				$('#lblPendingCoins').hide();
			}
			$('#loadingToast').hide();
			$('button').show();
			setTimeout(refreshInfo, 10);
			$('#amount').val('');
		});
	}

	console.log("Send Transaction");
	var result = web3.eth.sendRawTransaction(serializedTx.toString('hex'),
			function(err, txhash) {

				if (err == null) {

					console.log('txhash: ' + txhash);
					$('#loadingToast').show();
					$('button').hide();
				} else {
					console.log('error: ' + err);
					$.alert('系统错误', err);
				}
			});
	return result;
}
/**
 * 刷新信息
 */
function refreshInfo() {
	// 1. 获取以太币余额
	var balance = web3.eth.getBalance(global.wallet.getAddressString());
	$('#ethBalance').text(web3.fromWei(balance, 'ether').round(6).toString());
	// 2. 获取我的持币
	var myCoins = coinContractInstance.balanceOf(
			global.wallet.getAddressString()).toNumber();
	$('#lblMyCoins').text(myCoins);

	// 3. 获取买入价卖出价
	var buyPrice = Math.floor(web3.toWei(1, 'ether')
			/ coinContractInstance.buyPrice().toNumber());
	var sellPrice = Math.ceil(web3.toWei(1, 'ether')
			/ coinContractInstance.sellPrice().toNumber());
	$('#lblBuyPrice').text(buyPrice);
	$('#lblSellPrice').text(sellPrice);
}
