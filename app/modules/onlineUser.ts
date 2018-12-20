
import { Application, IModule, ModuleType } from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', __filename);

export default function (app) {
  return new Module(app);
}

export class Module implements IModule {
  public moduleId = 'onlineUser';
  public type = ModuleType.pull;
  public interval = 5;
  public app: Application;
  constructor (app) {
    this.app = app;
  }

  public masterHandler (agent, msg) {
    if (!msg) {
      // pull interval callback
      let list = agent.typeMap.connector;
      if (!list || list.length === 0) {
        return;
      }
      agent.notifyByType('connector', this.moduleId);
      return;
    }

    let data = agent.get(this.moduleId);
    if (!data) {
      data = {};
    }
    data[msg.serverId] = msg;
    agent.set(this.moduleId, data);
  }

  public monitorHandler (agent) {
    let connectionService = this.app.components.__connection__;
    if (!connectionService) {
      logger.error('not support connection: %j', agent.id);
      return;
    }
    agent.notify(this.moduleId, connectionService.getStatisticsInfo());
  }

  public clientHandler (agent, msg, cb) {
    cb(null, agent.get(this.moduleId));
  }
}
