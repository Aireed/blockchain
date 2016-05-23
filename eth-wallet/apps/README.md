# 应用列表
钱包轻应用统一保存在/apps/目录下，有配置文件config-test.json控制

config-test.json是一个数组，内容如下：
> [{"name":"讨红包","url":"gift/index.html","icon":"apps/gift/askgift.jpg"}, {"name":"积分","url":"coin/index.html","icon":"img/icon_scorecoin.png","login":true}]

#### 其中
* name: 应用名称，必填；会在首页的APP图标下显示
* url: 应用入口URL，必填；用户在首页App列表中选择一个App时跳转URL
* icon: 应用图标，必填
* login: 布尔变量，可选；是否需要登录，默认无需登录，如果设置值为true, 在用户选择应用时会检查是否已经登录（即钱包解锁）；对于需要签名的交易类的应用，必须将钱包解锁才可继续操作

