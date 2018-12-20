
'use strict';

import { pick } from 'lodash';
import * as path from 'path';
import { Application, IComponent } from 'pinus';
import { getLogger } from 'pinus-logger';
import { PacketAttributes } from '../model/packet';
import { RoomAttributes } from '../model/room';
import { UserAttributes } from '../model/user';

const logger = getLogger('game', path.basename(__filename));

export const enum EventRoute {
  OnPacket = 'OnPacket',
  OnPlayerEnter = 'OnPlayerEnter',
  OnPlayerLeave = 'OnPlayerLeave',
  OnPlayerOpen = 'OnPlayerOpen'
}

export class Push implements IComponent {

  public name = 'push';
  public app: Application;
  constructor (app: Application) {
    this.app = app;
  }
  public start (cb: () => void){
    this.app.set(this.name, this);
    cb();
  }
  get store (){
    return this.app.get('store').clients.cache;
  }

  public async pushEvent (route: EventRoute, room: RoomAttributes, player: UserAttributes, packet?: PacketAttributes) {

    let event: any = {};
    switch (route) {
      case EventRoute.OnPacket:
      event.packet = {
        ...pick(packet, 'id', 'status', 'base_award', 'lei', 'opened', 'created'),
        user: pick(player, 'id', 'name', 'headimgurl'),
      };
      break;
    case EventRoute.OnPlayerOpen:
      event.room = pick(room, 'id', 'name');
      event.player = pick(player, 'id', 'name', 'headimgurl');
      break;
    case EventRoute.OnPlayerEnter:
      event.room = pick(room, 'id', 'name');
      event.player = pick(player, 'id', 'name', 'headimgurl');
      break;
    case EventRoute.OnPlayerLeave:
      event.room = pick(room, 'id', 'name');
      event.player = pick(player, 'id', 'name', 'headimgurl');
      break;
    }

    await this.pushToRoom(route, room, event);
  }

    //推送给单个用户
  private async pushToOne (route, room, id, msg) {

    let channel = this.app.channelService.getChannel(room.id);
    if (!channel) return;

    logger.debug(`通知给单个玩家 `, route, room.name, id, msg);

    //  this.records[uid] = {sid: sid, uid: uid};
    let member = channel.getMember(id);
    if (!member) return;

    await this.app.channelService.pushMessageByUids(route, msg, [{uid: id, sid: member.sid}]);
  }

  //推给房间
  private async pushToRoom (route, room, msg) {
    let channel = this.app.channelService.getChannel(room.id);
    if (!channel) return;

    logger.debug(`通知给整个房间 `, route, room.name, msg);

    await channel.apushMessage(route, msg);
  }

  //全服广播
  private async pushToAll (route, msg) {
    logger.debug('广播 ', msg, route);
    await this.app.channelService.abroadcast('connector', route, msg);
  }
}

export default function (app: Application) {
  return new Push(app);
}


