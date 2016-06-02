# 股指竞猜-牛熊争霸A
> 牛熊争霸A - 是一款股指日线为标的预测游戏。玩家可以在开盘之前预测股指涨跌，如果预测成功，可以赢得奖池中的额度分配

## 简介
### 1.1 游戏规则
1) 股指收盘后1小时（16:00）后会开启一个下一交易日为标的的新盘，玩家可以提交自己对下一交易日的预测结果, 合约记录金额和提交时间

2) 在标的交易日的下午13点，系统会封盘 - 停止接受新的预测

3) 在标的日期的下午15:05(收盘后5分钟)，系统获取当日的收盘价并与上一交易日收盘价比较

4) 预测错误的玩家投入金额会计入资金池，系统也会根据根据投注金额进行补贴

5) 预测正确的玩家参与资金池的分配，资金按照玩家投入金额和提交预测的时间加权平均分配

6) 如果恰好平盘，则退还各自投入的金额（没有补贴）

### 1.2 奖池分配规则
1) 预测正确的玩家参与分配

2) 奖池中的资金按照预测成功的投注金额和预测时间早晚加权平均分配：投入多者多得、预测早者多得

3) 奖池资金分配公式：

![奖池资金分配公式](http://light.hs.net/apps/yi_tai_fang_qing_qian_bao-test/apps/quiza/f1.png)

4) 其中:

![奖池资金](http://light.hs.net/apps/yi_tai_fang_qing_qian_bao-test/apps/quiza/f2.png)

同一账户多次准确预测，奖励金额累加计算

预测正确方向的本金不计入奖池，并且会在清算后一并返回

## 系统补贴

### 2.1 什么是补贴
为鼓励参与，系统会根据玩家参与的金额适当补贴。补贴即系统会投入部分资金进入奖池并分配给所有赢家

### 2.2 系统补贴规则
系统补贴根据合计预测金额累计分阶段计算

1) 金额 <=10 Ether: 补贴总金额的50%

2) 金额 10┈20 Ether: 补贴金额的25%

3) 金额 20┈30 Ether: 补贴金额的12.5%

4) 金额 30┈50 Ether: 无补贴

5) 金额 >50 Ether: 提成2%

### 2.3 补贴规则补充
补贴计算是阶段累进计算的，例如总金额为25Ether, 则补贴 = 10*50% + 10*25% + 5*12.5%；于此类推

## 合约信息
股指竞猜合约ABI:

 `[{"constant":true,"inputs":[],"name":"playerCount","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[],"name":"betDown","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"betRecords","outputs":[{"name":"betUp","type":"uint256"},{"name":"betDown","type":"uint256"},{"name":"allowance","type":"int256"}],"type":"function"},{"constant":false,"inputs":[],"name":"betUp","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"summary","outputs":[{"name":"_countBetUp","type":"uint256"},{"name":"_betUp","type":"uint256"},{"name":"_countBetDown","type":"uint256"},{"name":"_betDown","type":"uint256"},{"name":"_allowance","type":"int256"},{"name":"_status","type":"uint8"}],"type":"function"},{"constant":true,"inputs":[],"name":"baseInfo","outputs":[{"name":"_assetCode","type":"string"},{"name":"_assetName","type":"string"},{"name":"_targetDate","type":"uint32"},{"name":"_preClosePrice","type":"uint32"},{"name":"_closePrice","type":"uint32"},{"name":"_status","type":"uint8"}],"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_countBetUp","type":"uint256"},{"indexed":false,"name":"_betUp","type":"uint256"},{"indexed":false,"name":"_countBetDown","type":"uint256"},{"indexed":false,"name":"_betDown","type":"uint256"},{"indexed":false,"name":"_allowance","type":"int256"},{"indexed":false,"name":"_status","type":"QuizA.Status"}],"name":"OnChange","type":"event"}]`
 
合约地址（测试链）：

上证指数：0xC326D75CFF9fAa64Dc4DB1B131BE7b9BEA6FFB97

恒生电子：0x181F94AE0EEA3a6F0757dB65023fe54ba877E4f2

您可以在MIST钱包上直接关注并对合约进行操作