
import { Redis } from 'ioredis';
import * as path from 'path';
import { Application, IComponent} from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', path.basename(__filename));

export class Session implements IComponent {

  public name = 'session';
  public app: Application;
  constructor (app: Application) {
    this.app = app;
  }
  public start (cb: () => void){
    this.app.set(this.name, this.handle.bind(this));
    cb();
  }
  get store (){
    return this.app.get('store').session as Redis;
  }

  public async handle (token: string, key: string, value?: any): Promise <any> {

    let data: any = await this.getSession(token);
    if (value === undefined){
      return data && data[key] ;
    }

    data.value = value;

    await this.setSession(token, data);
  }

  private async getSession (token) {
    let content = await this.store.get(token);
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }

  private async setSession (token, content = {}) {
      await this.store.set(token, JSON.stringify(content));
  }
}

export default function (app: Application) {
  return new Session(app);
}
