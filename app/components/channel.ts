
import * as Promise from 'bluebird';
import { Redis } from 'ioredis';
import * as path from 'path';
import { Application, IComponent, IStore} from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', path.basename(__filename));

export class Scene implements IComponent, IStore {

  public name = 'channel';
  public app: Application;
  constructor (app: Application) {
    this.app = app;
    this.app.set('channelConfig', {
      prefix: this.name,
      store: this
    });
  }

  get store (){
    return this.app.get('store').channel as Redis;
  }

  public async add (key: string, value: string, done: (err?: Error) => void){
    logger.warn('add', key, value);
    await this.store.set(key, value);
    done();
  }

  public async remove (key: string, value: string, done: (err?: Error) => void){
    logger.warn('remove', key, value);
    await this.store.del(key);
    done();
  }

  public async load (key: string, done: (err?: Error , list ?: string[]) => void){
    let keys = await this.store.keys(key);
    let list = await Promise.map(keys, (k) => {
      return this.store.get(k);
    });
    logger.warn('load', key, keys, list);
    done(null, list);
  }

  public async removeAll (key: string, done: (err?: Error) => void){
    let keys = await this.store.keys(key);
    logger.warn('removeAll', key, keys);
    await Promise.map(keys, (k) => {
      return this.store.del(k);
    });
    done();
  }
}

export default function (app: Application) {
  return new Scene(app);
}
