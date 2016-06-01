/**
 * Created by tongsh on 2016/5/6.
 */
var w = c.width = window.innerWidth,
    h = c.height = window.innerHeight,
    ctx = c.getContext('2d'),

    opts = {

        range: 180,
        baseConnections: 3,
        addedConnections: 5,
        baseSize: 5,
        minSize: 1,
        dataToConnectionSize: .4,
        sizeMultiplier: .7,
        allowedDist: 40,
        baseDist: 40,
        addedDist: 30,
        connectionAttempts: 100,

        dataToConnections: 1,
        baseSpeed: .04,
        addedSpeed: .05,
        baseGlowSpeed: .4,
        addedGlowSpeed: .4,

        rotVelX: .003,
        rotVelY: .002,

        repaintColor: '#111',
        connectionColor: 'hsla(200,60%,light%,alp)',
        rootColor: 'hsla(0,60%,light%,alp)',
        endColor: 'hsla(160,20%,light%,alp)',
        dataColor: 'hsla(40,80%,light%,alp)',

        wireframeWidth: .1,
        wireframeColor: '#88f',

        depth: 250,
        focalLength: 250,
        vanishPoint: {
            x: w / 2,
            y: h / 2
        }
    },

    squareRange = opts.range * opts.range,
    squareAllowed = opts.allowedDist * opts.allowedDist,
    mostDistant = opts.depth + opts.range,
    sinX = sinY = 0,
    cosX = cosY = 0,

    connections = [],
    toDevelop = [],
    data = [],
    all = [],
    tick = 0,
    totalProb = 0,

    animating = false,

    Tau = Math.PI * 2;

ctx.fillStyle = '#222';
ctx.fillRect(0, 0, w, h);
ctx.fillStyle = '#ccc';
ctx.font = '50px Verdana';
ctx.fillText('  ', w / 2 - ctx.measureText('Calculating Nodes').width / 2, h / 2 - 15);

window.setTimeout(init, 4); // to render the loading screen

function init() {

    connections.length = 0;
    data.length = 0;
    all.length = 0;
    toDevelop.length = 0;

    var connection = new Connection(0, 0, 0, opts.baseSize);
    connection.step = Connection.rootStep;
    connections.push(connection);
    all.push(connection);
    connection.link();

    while (toDevelop.length > 0) {

        toDevelop[0].link();
        toDevelop.shift();
    }

    if (!animating) {
        animating = true;
        anim();
    }
}
function Connection(x, y, z, size) {

    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;

    this.screen = {};

    this.links = [];
    this.probabilities = [];
    this.isEnd = false;

    this.glowSpeed = opts.baseGlowSpeed + opts.addedGlowSpeed * Math.random();
}
Connection.prototype.link = function () {

    if (this.size < opts.minSize)
        return this.isEnd = true;

    var links = [],
        connectionsNum = opts.baseConnections + Math.random() * opts.addedConnections | 0,
        attempt = opts.connectionAttempts,

        alpha, beta, len,
        cosA, sinA, cosB, sinB,
        pos = {},
        passedExisting, passedBuffered;

    while (links.length < connectionsNum && --attempt > 0) {

        alpha = Math.random() * Math.PI;
        beta = Math.random() * Tau;
        len = opts.baseDist + opts.addedDist * Math.random();

        cosA = Math.cos(alpha);
        sinA = Math.sin(alpha);
        cosB = Math.cos(beta);
        sinB = Math.sin(beta);

        pos.x = this.x + len * cosA * sinB;
        pos.y = this.y + len * sinA * sinB;
        pos.z = this.z + len * cosB;

        if (pos.x * pos.x + pos.y * pos.y + pos.z * pos.z < squareRange) {

            passedExisting = true;
            passedBuffered = true;
            for (var i = 0; i < connections.length; ++i)
                if (squareDist(pos, connections[i]) < squareAllowed)
                    passedExisting = false;

            if (passedExisting)
                for (var i = 0; i < links.length; ++i)
                    if (squareDist(pos, links[i]) < squareAllowed)
                        passedBuffered = false;

            if (passedExisting && passedBuffered)
                links.push({x: pos.x, y: pos.y, z: pos.z});

        }

    }

    if (links.length === 0)
        this.isEnd = true;
    else {
        for (var i = 0; i < links.length; ++i) {

            var pos = links[i],
                connection = new Connection(pos.x, pos.y, pos.z, this.size * opts.sizeMultiplier);

            this.links[i] = connection;
            all.push(connection);
            connections.push(connection);
        }
        for (var i = 0; i < this.links.length; ++i)
            toDevelop.push(this.links[i]);
    }
}
Connection.prototype.step = function () {

    this.setScreen();
    this.screen.color = ( this.isEnd ? opts.endColor : opts.connectionColor ).replace('light', 30 + ( ( tick * this.glowSpeed ) % 30 )).replace('alp', .2 + ( 1 - this.screen.z / mostDistant ) * .8);

    for (var i = 0; i < this.links.length; ++i) {
        ctx.moveTo(this.screen.x, this.screen.y);
        ctx.lineTo(this.links[i].screen.x, this.links[i].screen.y);
    }
}
Connection.rootStep = function () {
    this.setScreen();
    this.screen.color = opts.rootColor.replace('light', 30 + ( ( tick * this.glowSpeed ) % 30 )).replace('alp', ( 1 - this.screen.z / mostDistant ) * .8);

    for (var i = 0; i < this.links.length; ++i) {
        ctx.moveTo(this.screen.x, this.screen.y);
        ctx.lineTo(this.links[i].screen.x, this.links[i].screen.y);
    }
}
Connection.prototype.draw = function () {
    ctx.fillStyle = this.screen.color;
    ctx.beginPath();
    ctx.arc(this.screen.x, this.screen.y, this.screen.scale * this.size, 0, Tau);
    ctx.fill();
}
function Data(connection) {

    this.glowSpeed = opts.baseGlowSpeed + opts.addedGlowSpeed * Math.random();
    this.speed = opts.baseSpeed + opts.addedSpeed * Math.random();

    this.screen = {};

    this.setConnection(connection);
}
Data.prototype.reset = function () {

    this.setConnection(connections[0]);
    this.ended = 2;
}
Data.prototype.step = function () {

    this.proportion += this.speed;

    if (this.proportion < 1) {
        this.x = this.ox + this.dx * this.proportion;
        this.y = this.oy + this.dy * this.proportion;
        this.z = this.oz + this.dz * this.proportion;
        this.size = ( this.os + this.ds * this.proportion ) * opts.dataToConnectionSize;
    } else
        this.setConnection(this.nextConnection);

    this.screen.lastX = this.screen.x;
    this.screen.lastY = this.screen.y;
    this.setScreen();
    this.screen.color = opts.dataColor.replace('light', 40 + ( ( tick * this.glowSpeed ) % 50 )).replace('alp', .2 + ( 1 - this.screen.z / mostDistant ) * .6);

}
Data.prototype.draw = function () {

    if (this.ended)
        return --this.ended; // not sre why the thing lasts 2 frames, but it does

    ctx.beginPath();
    ctx.strokeStyle = this.screen.color;
    ctx.lineWidth = this.size * this.screen.scale;
    ctx.moveTo(this.screen.lastX, this.screen.lastY);
    ctx.lineTo(this.screen.x, this.screen.y);
    ctx.stroke();
}
Data.prototype.setConnection = function (connection) {

    if (connection.isEnd)
        this.reset();

    else {

        this.connection = connection;
        this.nextConnection = connection.links[connection.links.length * Math.random() | 0];

        this.ox = connection.x; // original coordinates
        this.oy = connection.y;
        this.oz = connection.z;
        this.os = connection.size; // base size

        this.nx = this.nextConnection.x; // new
        this.ny = this.nextConnection.y;
        this.nz = this.nextConnection.z;
        this.ns = this.nextConnection.size;

        this.dx = this.nx - this.ox; // delta
        this.dy = this.ny - this.oy;
        this.dz = this.nz - this.oz;
        this.ds = this.ns - this.os;

        this.proportion = 0;
    }
}
Connection.prototype.setScreen = Data.prototype.setScreen = function () {

    var x = this.x,
        y = this.y,
        z = this.z;

    // apply rotation on X axis
    var Y = y;
    y = y * cosX - z * sinX;
    z = z * cosX + Y * sinX;

    // rot on Y
    var Z = z;
    z = z * cosY - x * sinY;
    x = x * cosY + Z * sinY;

    this.screen.z = z;

    // translate on Z
    z += opts.depth;
    this.screen.scale = opts.focalLength / z;
    this.screen.x = opts.vanishPoint.x + x * this.screen.scale;
    this.screen.y = opts.vanishPoint.y + y * this.screen.scale;

}
function squareDist(a, b) {

    var x = b.x - a.x,
        y = b.y - a.y,
        z = b.z - a.z;

    return x * x + y * y + z * z;
}

function anim() {

    window.requestAnimationFrame(anim);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = opts.repaintColor;
    ctx.fillRect(0, 0, w, h);

    ++tick;

    var rotX = tick * opts.rotVelX,
        rotY = tick * opts.rotVelY;

    cosX = Math.cos(rotX);
    sinX = Math.sin(rotX);
    cosY = Math.cos(rotY);
    sinY = Math.sin(rotY);

    if (data.length < connections.length * opts.dataToConnections) {
        var datum = new Data(connections[0]);
        data.push(datum);
        all.push(datum);
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.lineWidth = opts.wireframeWidth;
    ctx.strokeStyle = opts.wireframeColor;
    all.map(function (item) {
        item.step();
    });
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    all.sort(function (a, b) {
        return b.screen.z - a.screen.z
    });
    all.map(function (item) {
        item.draw();
    });

    /*ctx.beginPath();
     ctx.strokeStyle = 'red';
     ctx.arc( opts.vanishPoint.x, opts.vanishPoint.y, opts.range * opts.focalLength / opts.depth, 0, Tau );
     ctx.stroke();*/
}

window.addEventListener('resize', function () {
    opts.vanishPoint.x = ( w = c.width = window.innerWidth ) / 2;
    opts.vanishPoint.y = ( h = c.height = window.innerHeight ) / 2;
    ctx.fillRect(0, 0, w, h);
});
window.addEventListener('click', init);

$(function () {
    setTimeout(init_wallet, 10);
});
//以上是动画效果部分

/**
 * 初始化钱包
 */
function init_wallet() {
    //1. process callback
    var params = $.getRequestParams();
    if(typeof params.callback == 'undefined' || params.callback ==null ) {
        callbackURL = document.referrer;
        if(callbackURL=="") {
            //If user open init page directly, set callback to homepage
            callbackURL = "../index.html";
        }
    }else {
        callbackURL = '../' + params.callback;
    }
    // 1. get private key
    var pk = window.sessionStorage.getItem(global.network + '-pk');
    if (pk != null) {
        window.location.href = callbackURL;
        return;
    }
    var ko = window.localStorage.getItem(global.network + '-ko');
    $.loadTemplate('new');
    $.loadTemplate('restore');
    $.loadTemplate('/common/loading');
    if (ko == null) {
        //If no keyobject
        $.loadTemplate('login');
        $.loadTemplate('nav', function () {
            router.setDefault('nav').init();
        });
    }else {
        //Already has keyobject
        $.loadTemplate('nav');
        $.loadTemplate('login',function(){
            router.setDefault('login').init();
            setTimeout(function() { $('#pwd_login_wallet').focus();},10);
        });
    }
}
/**
 * 登录
 */
function login() {
    var pwd = $('#pwd_login_wallet').val().trim();
    if (pwd.length == 0) {
        alert('密码不能为空！');
        return;
    }else {
        var ko = JSON.parse(window.localStorage.getItem(global.network + '-ko'));
        window.location.href = '#/common/loading?title=正在解锁钱包...';
        setTimeout(function(){
            try {
                var wallet = EthJS.Wallet.fromV3(ko, pwd);
                window.sessionStorage.setItem(global.network + '-pk',wallet.getPrivateKeyString());
                window.location.href = callbackURL;
            }catch(e) {
                $.alert('警告','<i class="weui_icon_warn"></i>钱包密码错误', function () {
                    window.location.href = '#login';
                    $('#pwd_login_wallet').val('');
                    $('#pwd_login_wallet').focus();
                });
            }
        },1500);
    }
}
/**
 * 从备份恢复钱包
 */
function restoreWallet() {
     var v3str= $('#txtV3Wallet').val().trim();
    if (v3str.length == 0) {
        alert('钱包文件内容不能为空！');
        return false;
    }
    var ko = null;
    try {
        ko = JSON.parse(v3str);
    }catch(e) {
        alert('不是正确的钱包文件，请提供正确的V3格式钱包文件！');
        return false;
    }

    if(ko == null || ko.address==null || ko.version == null) {
        alert('钱包文件格式错误！');
        return false;
    }
    if(ko.Crypto != null && ko.crypto == null) {
        //Old Mist Version
        ko.crypto = ko.Crypto;
    }
    if(ko.version != 3 || ko.crypto==null) {
        alert('钱包文件版本不正确，仅支持V3格式钱包！');
        return false;
    }
    window.localStorage.setItem(global.network + '-ko',v3str);

}
/**
 * 创建新钱包
 */
function createNewWallet() {
    var pwd = $('#pwd_new_wallet').val().trim();
    if (pwd.length == 0) {
        alert('密码不能为空！');
        return;
    } else {
        window.location.href = '#/common/loading?title=正在创建钱包...';
        $('#dialog_new').hide();
        setTimeout(function () {
            var wallet = EthJS.Wallet.generate();
            var ko = wallet.toV3String(pwd,global.scrypt[global.network]);
            window.localStorage.setItem(global.network + '-ko',ko);
            window.sessionStorage.setItem(global.network + '-pk',wallet.getPrivateKeyString());
            window.location.href = callbackURL;
        }, 1500);
    }
}

/**
 * 上传文件变更事件
 */
function onUploadFileChange(container) {
    var files = container.files;
    if (!files.length) {
        return false;
    }
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function () {
        var keyObject = null;
        try {
            keyObject = JSON.parse(this.result);
        } catch (e) {
            $.alert('文件错误','请选择正确的钱包文件！');
            return false;
        }
        if (keyObject.address == undefined || keyObject.address == null) {
            $.alert('文件错误','请选择正确的钱包文件！');
            return false;
        }
        var password = prompt("请输入钱包密码", ""); //保护密码
        window.location.href = '#/common/loading?title=正在导入钱包, 约需执行1分钟...';
        setTimeout(function(){
            try {
                //In case bug of MIST 1.3
                if(!keyObject.crypto && keyObject.Crypto) {
                    keyObject.crypto = keyObject.Crypto;
                }
                var wallet = EthJS.Wallet.fromV3(keyObject, password);
                var ko = wallet.toV3String(password,global.scrypt[global.network]);
                window.localStorage.setItem(global.network + '-ko',ko);
                window.sessionStorage.setItem(global.network + '-pk',wallet.getPrivateKeyString());
                window.location.href = callbackURL;
            }catch(e) {
                $.alert('警告','<i class="weui_icon_warn"></i>钱包密码错误',function() {
                    window.location.href = '#restore';
                });

            }
        },1500);

    }
    reader.readAsText(file);
}
