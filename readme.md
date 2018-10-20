danmu-client
==========
## 配置说明
根目录``config.js``下有配置，以下是说明

    socket: {
        url: "弹幕服务器开启的IP与端口（如使用反代，需要确认反代支持WebSocket连接）",
        password: "弹幕服务器连接密码",
        room: "选择连接弹幕服务器的某间房间",
        heartbeat: 心跳包发送间隔
    },
    display: {
        comment: {
            animationStyle: "默认弹幕样式（支持scroll、reversescroll、staticdown、staticup）",
            fontStyle: "默认字体样式",
            fontColor: "默认颜色",
            lifeTime: 每条弹幕的基本存活时间,
            height: 每条弹幕占据高度
        }, 
        image: 图片弹幕开关
    }, 
    image: {
        regex: 图片判断正则，勿动
        whitelist: [
            "图片弹幕允许加载的网络图片白名单。", 
            "不支持通配符，必须一条一条手动添加。", 
            "请确认图片可以正常被打开。"
        ], 
        preload: 网络图片是否预读缓存
    }

## 图片弹幕
打开图片弹幕开关后，弹幕内含相关内容的将被解析为图片。图片必须可以正常打开，调用代码如：``[IMG WIDTH=24]danmu-24.png[/IMG]``。格式：``[IMG WIDTH=图片宽度]图片地址（支持HTTP）[/IMG]``

为了保证安全与稳定，图片弹幕有防火墙机制。只有在弹幕程序目录及子目录下存在的图片才可被加载。引用网络图片，必须手动修改``config.js``添加白名单规则。如果被过滤，则程序不会有任何提示，该弹幕也不会被显示。

## 自定义弹幕
需要在服务器打开相应开关后，才允许使用自定义弹幕功能。自定义弹幕必须返回一个函数（或类），继承自``lib/danmu/sprite.js``中的``Sprite``，并需要实现``updateLifeTime``方法和``draw``方法，有``alive``属性。__为确保效率，自定义弹幕未加入错误捕捉。一旦函数出错，则弹幕系统停止接受新弹幕。__
示例代码如下（生成一个颜色随机、在屏幕上晃来晃去的玩意）：

### 最新版示例代码 
```javascript
return (() => {
    'use strict';
    const Sprite = require('./lib/danmu/sprite');
    let canvasWidth = 0;
    let canvasHeight = 0;
    class Comment extends Sprite {
        constructor(param) {
            super(param.id, param.x, param.y, param.width, param.height, param.speed, param.lifeTime);
            this.text = param.text || ""; //文字内容
            this.lifeTime = param.lifeTime || config.display.comment.lifeTime;
            this.font = param.font || config.display.comment.fontStyle;
        }
        draw(canvasContext) {
            if (canvasWidth === 0) canvasWidth = canvasContext.canvas.width;
            if (canvasHeight === 0) canvasHeight = canvasContext.canvas.height;
            canvasContext.fillStyle = `rgb(${parseInt(Math.random() * 255)}, ${parseInt(Math.random() * 255)}, ${parseInt(Math.random() * 255)})`;
            canvasContext.font = this.font;
            canvasContext.fillText(this.text, parseInt(Math.random() * canvasWidth), parseInt(Math.random() * canvasHeight));
        }
        updateLifeTime() {
            this.lifeTime--; //每刷新一帧，存活时间-1
            this.alive = (this.lifeTime >= 0);
        };
    }
    return Comment;
})();

```
