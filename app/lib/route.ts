import { Application, Session } from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', __filename);

export function scene (session: Session, msg: any, app: Application, cb: (err: Error, serverId?: string) => void) {

  let list = app.getServersByType('scene');

  if (list.length === 0) {
    cb(new Error('scene server list is empty'));
  }

  let hash: any = session;
  if (typeof session === 'object') {
    if (session.get('room_id')) {
      hash = session.get('room_id');
    } else {
      logger.error('路由缺少room_id', JSON.stringify(msg), session.settings);

      //反正只有一台机子
      hash = 0;
    }
  }
  let id = list[hash % list.length].id;
  cb(null, id);
}
