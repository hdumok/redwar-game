
import * as Redis from 'ioredis';
import * as path from 'path';
import { Application, IComponent } from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', path.basename(__filename));

export class Store implements IComponent {
  public name = 'store';
  public app: Application;
  public config: any;
  private client: any = {};
  constructor (app: Application) {
    this.app = app;
    this.config = require(app.getBase() + '/config/redis')[app.settings.env];
    if (this.config.host && this.config.port){
      this.client = this.createClient(this.config);
    }
    else {
      for (let key in this.config){
        if (this.config.hasOwnProperty(key)) {
          this.client[key] = this.createClient(this.config[key]);
        }
      }
    }
  }
  get session (){
    return this.client.session || this.client as Redis.Redis;
  }
  get cache (){
    return this.client.cache || this.client as Redis.Redis;
  }
  get channel (){
    return this.client.cache || this.client as Redis.Redis;
  }

  public start (cb: () => void){
    this.app.set(this.name, this);
    cb();
  }

  private createClient (config) {
    logger.info('connecting redis://:%s@%s:%s/%s', config.password, config.host, config.port, config.db);
    let client = new Redis(config);
    client.on('connect', () => {
      logger.info('connect success on redis://:%s@%s:%s/%s', config.password, config.host, config.port, config.db);
    });
    client.on('error', (error) => {
      logger.error('redis error:', error);
    });
    return client;
  }
}

export default function (app: Application) {
  return new Store(app);
}
