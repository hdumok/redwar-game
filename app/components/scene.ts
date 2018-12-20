import { Redis } from 'ioredis';
import * as path from 'path';
import { Application, IComponent} from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', path.basename(__filename));

export default function (app: Application) {
  return new Scene(app);
}

export class Scene implements IComponent {

  public name = 'scene';

  public app: Application;
  constructor (app: Application) {
    this.app = app;
  }
  public start (cb: () => void){
    this.app.set(this.name, this);
    cb();
  }
  get store (){
    return this.app.get('store').cache as Redis;
  }
  public async getRoom (id): Promise<any> {
    let room = await this.store.get(`room:${id}`);
    try {
      return JSON.parse(room);
    } catch (e) {
      return room;
    }
  }

  public async setRoom (id, room): Promise<void> {
    await this.store.set(`room:${id}`, JSON.stringify(room)
    );
  }

  public async setCount (count): Promise<void> {
    await this.store.zadd('count', `${this.app.getServerId()}`, count);
  }
}
