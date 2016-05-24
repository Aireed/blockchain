# 积分兑换
 一个标准的代币合约，可以通过该合约实现代币的交易、转让、兑换；此应用展示调用合约的基本过程

## 功能说明
 用户可以通过此APP实现基准元币和代币之间的兑换，通过调用合约的buy和sell接口，对代币进行买卖
#### 操作流程
1. 获取合约定义：
> 合约定义ABI保存在服务器的./ScoreTokenContract.json，通过AJAX调用获取
2. 创建合约定义: 
> 调用Web3JS的eth.contract 接口创建定义 - var contract = web3.eth.contract(abi);
3. 获取积分合约实例: 
> coinContractInstance = contract.at(contractAddress);
4. 准备调用合约的数据
> 与直接调用sendTransaction不同，执行需要签名的合约需要提前准备发送数据并对数据进行签名；通过调用合约对应接口的getData方法(传入需要的参数)，可以获取到调用该接口的编码过的数据
5. 对交易数据进行签名
> 将上一步获取的调用合约方法的数据放入transaction对象的data属性中，并使用私钥对交易数据进行签名
6. 发送raw交易
> 将签名后的交易数据通过sendRawTransaction提交到连接的节点

 通过流程可以了解到，私钥是不会发送到远程服务器的；链上的节点在收到交易请求之后，会使用交易的from属性（也就是私钥对应的地址）对应的公钥对数据进行验签，只有正确的私钥进行签名才可以验证通过

 验证通过后，节点会把此交易放到自己的未处理交易池中，并通过P2P网络把交易发给其他节点；其他节点在收到交易后会执行相同的操作
 
 在任何一个节点在生成区块时，会把此交易放到区块中；如果区块被成功确认，交易的确认数也就加一（确认数就是交易所在区块之后又产生了几个有效区块）
 
#### 相关技术
1. 创建合约定义并获取合约实例
2. 组织交易数据并签名
3. 使用watch侦听交易状态变化

## 合约信息
 地址: 0x81867a79f4939E77418696Bf363089F220a0368B 
 
 ABI: [ScoreTokenContract.json](http://light.hs.net/apps/yi_tai_fang_qing_qian_bao-test/apps/coin/ScoreTokenContract.json)
 
 合约源码: [ScoreToken.sol](http://light.hs.net/apps/yi_tai_fang_qing_qian_bao-test/apps/coin/ScoreToken.sol)