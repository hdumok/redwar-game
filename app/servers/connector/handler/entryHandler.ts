
import * as path from 'path';
import { Application, FrontendSession } from 'pinus';
import { getLogger } from 'pinus-logger';
import { Handler, Response } from '../../handler';

const logger = getLogger('game', path.basename(__filename));

export default function (app: Application) {
  return new EntryHandler(app);
}

export class EntryHandler extends Handler {

  constructor (app){
    super(app);

    // setInterval(async () => {
    //   await this.scene.setCount(this.connection.)
    // }, 1000);
  }
  public async connectServer (msg: any, session: FrontendSession): Promise<Response>{

    let rule = {
      token: { type: 'string'}
    };

    const { token } = this.validater(rule, msg);
    const { app } = this;

    //TODO  token 存在校验
    let user = await this.session(token, 'user');
    if (!user) {
      return this.fail(this.code.unlogin);
    }

    logger.debug(`${user.name} 登录还没进入房间`, user);

    await app.sessionService.akick(user.uid, '您的账户在另一端登录');

    await session.abind(user.id);
    session.set('token', token);
    await session.apushAll();

    session.on('closed', this.leaveRoom.bind(this, null, session));

    return this.success(user);
  }

  public async enterRoom (msg: any, session: FrontendSession): Promise<Response> {

    let rule = {
      room_id: { type: 'number'}
    };

    const { room_id } = this.validater(rule, msg);
    const { app } = this;
    const token = session.get('token');

    let user = await this.session(token, 'user');
    if (!user) {
      return this.fail(this.code.unlogin);
    }

    logger.debug(`${user.name} 进入房间`, room_id);

    session.set('room_id', room_id);
    await session.apushAll(); //其实内部没有异步

    try {
      let result = await app.rpc.scene.sceneRemote.enterRoom.route(session)(room_id, user, app.getServerId());
      return this.success(result);
    }
    catch (err){
      logger.warn('app.rpc.scene.sceneRemote.enterRoom', err);
      return this.fail(err);
    }
  }
  public async leaveRoom (msg: any, session: FrontendSession) {

    const { app } = this;
    const token = session.get('token');

    let user = await this.session(token, 'user');
    if (!user) {
      return this.fail('用户未登录');
    }

    let room_id = session.get('room_id');
    if (!room_id) {
      return this.fail('用户未进入房间');
    }

    logger.debug(`${user.name} user.connector.leave 退出房间`, user);

    try {
      await app.rpc.scene.sceneRemote.leaveRoom.route(session)(room_id, user, app.getServerId());
      return this.success('退出房间成功');
    }
    catch (err){
      logger.warn('app.rpc.scene.sceneRemote.leave', err);
      return this.fail(err);
    }
  }
}
