
import { PinusWSClient, PinusWSClientEvent } from './robot/index';
const enum Route {
  getServer = 'gate.gateHandler.getServer',
  connectServer = 'connector.entryHandler.connectServer',
  enterRoom = 'connector.entryHandler.enterRoom',
  leaveRoom = 'connector.entryHandler.leaveRoom',
  sendPacket = 'scene.sceneHandler.sendPacket',
  openPacket = 'scene.sceneHandler.openPacket',
}

const enum EventType {

  OnPacket = 'OnPacket',
  OnPlayerEnter = 'OnPlayerEnter',
  OnPlayerLeave = 'OnPlayerLeave',
  OnPlayerOpen = 'OnPlayerOpen'
}

const packets = {};

export class Robot {
  public server: any = {};

  public DEBUG = true;
  public token: string;
  public room_id: number = 1;
  public client: PinusWSClient;
  constructor (host: string, port: number, token: string) {
    this.token = token;
    this.server.host = host;
    this.server.port = port;
    this.client = new PinusWSClient();
    this.client.on(PinusWSClientEvent.EVENT_IO_ERROR, (event) => {
      // 错误处理
      console.error('error', event);
    });
    this.client.on(PinusWSClientEvent.EVENT_CLOSE, (event) => {
      // 关闭处理
      console.error('close', this.server);
    });
    this.client.on(PinusWSClientEvent.EVENT_HEART_BEAT_TIMEOUT, (event) => {
      // 心跳timeout
      console.error('heartbeat timeout', event);
    });
    this.client.on(PinusWSClientEvent.EVENT_KICK, (event) => {
      // 踢出
      console.error('kick', event);
    });
  }

  public getServer (): void {
    this.client.init(this.server, () => {
      this.client.request(Route.getServer, { token: this.token }, (result) => {
          console.log(this.token, ' getServer返回', JSON.stringify(result));
          this.server = result.data;
          this.client.disconnect();
          this.connectServer();
        }
      );
    });
  }

  public connectServer () {
    this.client.init(this.server, () => {
      this.client.request(Route.connectServer, {token: this.token}, (result) => {
        this.enterRoom();
      });
    });

    this.client.on(EventType.OnPacket, async (event) => {
      try {
        await this.openPacket(parseInt(event.packet.id));
      }
      catch (e){
        if (e !== '红包已抢完' && e !== '您已经抢过该红包') {
          console.error(e);
        }
      }
    });
  }

  public enterRoom () {
    this.client.request(Route.enterRoom, {room_id: this.room_id}, (result) => {
      // 消息回调
      console.log(this.token, ' enterRoom 返回', JSON.stringify(result));
      if (result.data.id) {
        this.packetInterval();
      }
    });
  }

  public sendPacket () {
    this.client.request(Route.sendPacket, {award: 100, lei: Date.now() % 10}, (result) => {
      // 消息回调
      console.log(this.token, ' sendPacket 返回', JSON.stringify(result));
      if (result.code !== 200){
        return;
      }

      //sendPacket 返回 {"code":200,"message":"","data":{"award":4606.78,"turns":3,"value":"中雷","packet_award":12.66,"cost_award":-137.34}}
      packets[result.data.packet.id] = result.data.packet;
    });
  }

  public async openPacket (id) {
    await new Promise((resolve, reject) => {
      this.client.request(Route.openPacket, {id}, (result) => {
        // 消息回调
        if (result.code !== 200){
          reject(result.message);
        }

        console.log(this.token, ' openPacket 返回', JSON.stringify(result));
        resolve(result);
      });
    });
  }

  public packetInterval () {
    setInterval(this.sendPacket.bind(this), 1000);
  }
}

let tokens = [
  '1544523092196-CrUu7Hd7fNW_dGPJwbymqAUlyg9OvLhH',
  '1544523092852-Vzs2Xd0R9_brCJ_U3cknLyALx80Eny_r',
  // '1544523093274-QrP3rT-Shm28fb1Cx18PIWjPiYxtBpta',
  // '1544523093618-MOQrszrEF4gvQP8DdfzfKpdikQm9C0uE',
  // '1544523093848-J38HagER8MG5rn85AP_G5E9McK_AYEin',
  // '1544523094024-par5XmJgHPqhjZH3v2GCuBGqefULTY20',
  // '1544523094302-h3X3qu09LF0WGGZZua64VMkNTR-D9nR0',
  // '1544523097973-NjqZtdtg546UpgwDIVbEnNERJo2W9MFG'
];

for (let token of tokens){
  (new Robot('127.0.0.1', 5100, token)).getServer();
}

