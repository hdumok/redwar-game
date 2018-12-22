
import * as path from 'path';
import {
  Application,
  FrontendOrBackendSession,
  HandlerCallback,
  IHandlerFilter,
  RESERVED,
  RouteRecord
} from 'pinus';

import { getLogger } from 'pinus-logger';

const logger = getLogger('game', path.basename(__filename));

export class ValudateFilter implements IHandlerFilter {
  public app: Application;
  constructor (app: Application) {
    this.app = app;
    this.app.set(RESERVED.ERROR_HANDLER, this.handler.bind(this));
    this.app.set(RESERVED.GLOBAL_ERROR_HANDLER, this.handler.bind(this));
  }

  public before (routeRecord: RouteRecord, msg: any, session: FrontendOrBackendSession, next: HandlerCallback){
    logger.info(`${routeRecord.route} uid:${session.uid} sid:${session.id} request:`, msg);
    next(null);
  }

  public after (err: Error, routeRecord: RouteRecord, msg: any, session: FrontendOrBackendSession, resp: any, next: HandlerCallback){
    //在after里，无法修改response的内容
    // {
    //   code: 500,
    //   message: 'msg timeout:6 uid:6',
    //   data:
    // }
    logger.info(`${routeRecord.route} uid:${session.uid} sid:${session.id} response1:`, resp, err);
    return next(null);
  }

  private handler (err: any, msg, resp, session, next){
      switch (err.message){
        case '参数错误':
          resp = {
            code: 422,
            message: this.app.get(RESERVED.ENV) !== 'production' ? err.errors[0].field + ': ' + err.errors[0].code + ', ' + err.errors[0].message : err.message,
            data: this.app.get(RESERVED.ENV) !== 'production' ? err.errors : ''
          };
          break;
        case '缺少token':
          resp = {
            code: 401,
            message: err.message,
            data: null,
          };
          break;
        default:
          resp = {
            code: resp && resp.code || 500,
            message: resp && resp.message || err.message,
            data: resp && resp.data || this.app.get(RESERVED.ENV) !== 'production' ? err.stack : null,
          };
      }

      logger.info(`uid:${session.uid} sid:${session.id} status:${resp.code} response2:`, resp);
      next(null, resp);
  }
}

export default function (app: Application) {
  return new ValudateFilter(app);
}
