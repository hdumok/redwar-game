/// <reference path="./global.d.ts" />

import * as path from 'path';
import { pinus} from 'pinus';
import { getLogger } from 'pinus-logger';
import channel from './app/components/channel';
import config from './app/components/config';
import model from './app/components/model';
import packet from './app/components/packet';
import push from './app/components/push';
import scene from './app/components/scene';
import session from './app/components/session';
import store from './app/components/store';
import login from './app/filters/login';
import valudate from './app/filters/valudate';
import onlineUser from './app/modules/onlineUser';

import { preload } from './preload';

const logger = getLogger('game', path.basename(__filename));

preload();

let app = pinus.createApp();
app.set('name', 'redwar');
app.enable('systemMonitor');
app.registerAdmin(onlineUser(app));

app.configure('production|development', () => {

  app.set('proxyConfig', {
    bufferMsg: true,
    timeout: 10 * 1000
  });

  app.set('remoteConfig', {
    bufferMsg: true,
    timeout: 10 * 1000,
  });

  app.load(store);
  app.load(model);
  app.load(config);
  app.load(session);

  //app.enable('rpcDebugLog');
  //rpc超时报错没法捕捉，客户端不得不处理 {code:500}的问题
  app.filter(valudate(app));
});

app.configure('production|development', 'gate', () => {
  app.set('connectorConfig', {
    connector: pinus.connectors.hybridconnector,
    heartbeat: 3,
    timeout: 30,
    // useDict: true,
    // useProtobuf: true
  });
});

app.configure('production|development', 'connector', () => {
  app.filter(login(app));
  app.set('connectorConfig', {
    connector: pinus.connectors.hybridconnector,
    heartbeat: 3,
    timeout: 30,
    // useDict: true,
    // useProtobuf: true
  });
});

app.configure('production|development', 'scene', () => {
  //开序列化，同一个玩家多个请求会排队，最后容易rpc超时，底层直接报错，单个玩家体验不好
  //不开序列化 玩家请求可以并发，体验更好，因为没有排队，所以并发会最大程度的使用服务器性能，可能会挂掉服务器，影响其他玩家
  app.filter(new pinus.filters.serial(3000, {
    code: 400,
    message: '您的操作过于频繁, 请稍后再试',
    data: {}
  }));
  app.filter(new pinus.filters.timeout(3000, 1000));

  app.load(push);
  app.load(scene);
  app.load(packet);
  app.load(channel);
});

app.start();
