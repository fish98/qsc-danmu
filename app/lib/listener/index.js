/* global config */
'use strict'
const packageJson = require('../../package.json')
const player = require('../danmu/index')
const Socket = require('socket.io-client')
const WebSocket = require('ws');
const coordinator = require('electron').remote.getGlobal('coordinator')

let io
let serverRandomNumber = null
module.exports = {
  init: function () {
    // io = Socket(config.socket.url)
    // io.heartbeatTimeout = config.socket.heartbeat
    // realInit(config)
    init();
  }
}

let id = 1;
let ws;
const init = () => {
    ws = new WebSocket(`wss://live.zjuqsc.com/ws/`);
    // ws = new WebSocket(`ws://localhost:2333`);
    ws.on('open', () => {
        ws.send(JSON.stringify({
            data: `Connection established`,
        }));
        console.log(`Connection established`);
    });
    ws.on('message', (data) => {
        // console.log(data);
      const prased = JSON.parse(data);
      const { type, text, mode } = prased;
      console.log(prased);
        if (mode === 'text') {
            id++;
            coordinator.emit('gotDanmu', [{
                // text: `[IMG WIDTH=200]http://mmbiz.qpic.cn/mmbiz_jpg/aMqINY8icLWIhyH7EyeYypxncIjnXemaCNCxlMWyg36UecbArpFZmQpEDdtFPicSia529MRQpDg21xb4ia3xQtmOOQ/0[/IMG]测试[IMG WIDTH=24]danmu-24.png[/IMG]Hello World[IMG WIDTH=24]danmu-24.png[/IMG]`,
                text: text,
                color: 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ')',
                lifeTime: parseInt(Math.random() * 200) + 1000,
                textStyle: 'normal ' + (parseInt(Math.random() * 4)+4) + 'em 微软雅黑',
                height: 10 * 10,
                id: id
            }]);
        } else if (mode === 'image') {
            id++;
            let image = new Image()
            image.src = text;
            image.onload = () => {
                let width = image.width
                let height = image.height
                const radio = height / width;
                coordinator.emit('gotDanmu', [{
                    text: `[IMG WIDTH=${parseInt(230/radio)}]${text}[/IMG]`,
                    color: 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ')',
                    lifeTime: parseInt(Math.random()*200)+4800,
                    textStyle: 'normal bold ' + 26 + 'em 微软雅黑',
                    height: 230,
                    id: id
                }]);
            }
        }
    });
    ws.on('error', (err) => {
      console.log(err);
      id++;
      coordinator.emit('gotDanmu', [{
        text: `Oops! 出错啦~ ${err}`,
        color: 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')',
        lifeTime: 1000,
        textStyle: 'normal ' + (parseInt(Math.random() * 4) + 4) + 'em 微软雅黑',
        height: 10 * 10,
        id: id
      }]);
    })
    ws.on('close', () => {
      console.log('disconnected and trying to reconnect in 0.5s');
      id++;
      coordinator.emit('gotDanmu', [{
        text: `Oops! 正在重连~`,
        color: 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')',
        lifeTime: 1000,
        textStyle: 'normal ' + (parseInt(Math.random() * 4) + 4) + 'em 微软雅黑',
        height: 10 * 10,
        id: id
      }]);
      setTimeout(() => {
          init();
      }, 500);
    });
}

function realInit () {
  let initCount = 0
  io.on('init', () => {
    initCount++
    io.emit('password', {
      password: config.socket.password,
      room: config.socket.room,
      info: {
        version: packageJson.version
      }
    })
    if (initCount > 1) {
      window.console.log('连接密码错误')
    }
  })
  io.on('connected', data => {
    initCount = 0
    window.console.log('已连接上弹幕服务器（' + data.version + '）')
    if (serverRandomNumber !== data.randomNumber) {
      if (serverRandomNumber !== null) {
        window.console.log('服务器似乎已重启，将清空弹幕池。')
        // 如果断线（服务器重启？）了，必须清理原有弹幕，否则会导致ID池不匹配
      }
      player.stop()
      player.clear()
      player.start()
      serverRandomNumber = data.randomNumber
    }
  })
  io.on('disconnect', () => {
    window.console.warn('与服务器的连接中断')
  })
  io.on('danmu', data => {
    window.console.log('得到' + data.data.length + '条弹幕')
    coordinator.emit('gotDanmu', data.data)
  })
  io.on('delete', data => {
    window.console.log('删除' + data.ids.length + '条弹幕')
    coordinator.emit('deleteDanmu', data)
  })
};
