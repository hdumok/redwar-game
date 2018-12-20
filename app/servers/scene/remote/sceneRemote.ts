
import * as _ from 'lodash';
import * as path from 'path';
import { Application, FrontendSession, RemoterClass } from 'pinus';
import { getLogger } from 'pinus-logger';
import { Remote, Response} from '../../remote';

const logger = getLogger('game', path.basename(__filename));

export default function (app: Application): SceneRemote {
  return new SceneRemote(app);
}

// UserRpc的命名空间自动合并
declare global {
  interface UserRpc {
    scene: {
      // 一次性定义一个类自动合并到UserRpc中
      sceneRemote: RemoterClass<FrontendSession, SceneRemote>;
    };
  }
}

export class SceneRemote extends Remote {
  public async enterRoom (room_id, user, server_id): Promise<Response> {

    const { app } = this;

    logger.debug(user.name + ' 进入游戏 ' + room_id);

    let room = await this.scene.getRoom(room_id);
    if (!room) {
      room = await app.model.Room.findByPk(room_id);
      if (!room) {
        return this.fail('房间不存在');
      }

      logger.debug('房间不存在，正常生成scene: ', room);
      await this.scene.setRoom(room_id, room);
    }

    //加入该房间通道
    let channel = app.channelService.getChannel(room_id, true);
    let exist = channel.getMember(user.id);
    if (!exist) {
      channel.add(user.id, server_id);
      //通知房间
      channel.pushMessage('OnPlayerEnter', user);
    }

    return this.success(room);
  }

  public async leaveRoom (room_id, user, server_id): Promise<Response> {

    const { app } = this;

    logger.debug(user.name + ' 离开游戏 ' + room_id);

    let room = await this.scene.getRoom(room_id);
    if (!room) {
      room = await app.model.Room.findByPk(room_id);
      if (!room) {
        return this.fail('房间不存在');
      }

      logger.warn('房间不存在，正常生成scene: ', room);
      await this.scene.setRoom(room_id, room);
    }

    //加入该房间通道
    let channel = app.channelService.getChannel(room_id, true);
    let exist = channel.getMember(user.id);
    if (!exist) {
      channel.leave(user.id, server_id);
      //通知房间
      channel.pushMessage('OnPlayerLeave', user);
    }

    return this.success();
  }
}
