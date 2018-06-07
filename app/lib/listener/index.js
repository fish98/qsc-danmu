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

let id = 10000;

const init = () => {
    const ws = new WebSocket(`ws://10.100.71.126:4020`);
    ws.on('open', () => {
        ws.send(JSON.stringify({
            data: `Connection established`,
        }));
        console.log(`Connection established`);
    });
    ws.on('message', (data) => {
        // console.log(data);
        const tmp = JSON.parse(data);
        const tmp1 = JSON.parse(tmp.content);
        const text = tmp1.text;
        const mode = tmp1.mode;
        console.log(mode);
        if (mode === 'text') {
            id++;
            console.log(232);
            coordinator.emit('gotDanmu', [{
                // text: `[IMG WIDTH=200]http://mmbiz.qpic.cn/mmbiz_jpg/aMqINY8icLWIhyH7EyeYypxncIjnXemaCNCxlMWyg36UecbArpFZmQpEDdtFPicSia529MRQpDg21xb4ia3xQtmOOQ/0[/IMG]测试[IMG WIDTH=24]danmu-24.png[/IMG]Hello World[IMG WIDTH=24]danmu-24.png[/IMG]`,
                text: text,
                color: 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ')',
                lifeTime: 1000,
                textStyle: 'normal ' + 4 + 'em 微软雅黑',
                height: 10 * 10,
                id: id
            }]);
        } else if (mode === 'image') {
            id++;
            console.log(111);
            coordinator.emit('gotDanmu', [{
                text: `[IMG WIDTH=200]${text}[/IMG]`,
                color: 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ')',
                lifeTime: 1000,
                textStyle: 'normal' + 24 + 'em 微软雅黑',
                height: 20 * 10,
                id: id
            }]);
        }
    })
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
