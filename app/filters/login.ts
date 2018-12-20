
import * as path from 'path';
import { Application, FrontendOrBackendSession, HandlerCallback, IHandlerFilter, RouteRecord } from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', path.basename(__filename));

export class LoginFilter implements IHandlerFilter {

  public app: Application;
  constructor (app: Application) {
    this.app = app;
  }

  public before (routeRecord: RouteRecord, msg: any, session: FrontendOrBackendSession, next: HandlerCallback) {

    let token: string = msg.token || session.get('token');
    if (!token){
      next(new Error('缺少token'));
      return;
    }

    next(null);
  }

  public after (err: Error, routeRecord: RouteRecord, msg: any, session: FrontendOrBackendSession, resp: any, next: HandlerCallback){
    //在after里，无法修改response的内容
    return next(err);
  }
}

export default function (app: Application) {
  return new LoginFilter(app);
}
