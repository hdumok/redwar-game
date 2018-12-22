import * as path from 'path';
import { Application, FrontendSession } from 'pinus';
import { getLogger } from 'pinus-logger';
import { Handler, Response } from '../../handler';

const logger = getLogger('game', path.basename(__filename));

export class GateHandler extends Handler{
  public async getServer (msg: any, session: FrontendSession): Promise<Response> {

    // gate 负载均衡的凭证
    let rule = {
      token: { type: 'string'}
    };
    const { token } = this.validater(rule, msg);
    let user = await this.session(token, 'user');
    if (!user) {
      return this.fail(this.code.unlogin);
    }

    // get all connectors
    let connectors = this.app.getServersByType('connector');
    console.log(connectors);
    if (!connectors || connectors.length === 0) {
      return this.fail('确少connectors服务器');
    }

    // TODO 负载均衡算法 select connector
    let connector = connectors[0];

    return this.success({
      host: connector.host,
      port: connector.clientPort
    });
  }
}

export default function (app: Application) {
  return new GateHandler(app);
}
