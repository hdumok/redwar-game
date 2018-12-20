

import * as path from 'path';
import { Application, IComponent} from 'pinus';
import { getLogger } from 'pinus-logger';

const logger = getLogger('game', path.basename(__filename));

interface AwardConfig {
  spical: number,
  lei: number[],
}

export default function (app: Application) {
  return new Config(app);
}

export class Config implements IComponent {

  public name = 'config';
  public app: Application;
  private packet_duration = 60;
  private award_present: number[] = [0.08, 0.08, 0.08, 0.06, 0.03, 0.03, 0.03];
  private award_1030: AwardConfig = {
    spical: 1.11,
    lei: [0, 0, 0, 3.33, 6.66, 26.66, 66.66, 166.66]
  };
  private award_3060: AwardConfig = {
    spical: 6.66,
    lei: [0, 0, 0, 6.66, 18.88, 66.66, 166.66, 888]
  };
  constructor (app: Application) {
    this.app = app;
  }
  public start (cb: () => void){
    this.app.set(this.name, this);
    cb();
  }
  public async getPacketDuration () {
    let config = await this.getCacheConfig('packet_duration');
    if (config){
      this.packet_duration = config;
    }

    return this.packet_duration;
  }
  public async getAwardPresent () {
    let config = await this.getCacheConfig('award_present');
    if (config){
      this.award_present = config;
    }

    return this.award_present;
  }
  public async getAward1030 () {
    let config = await this.getCacheConfig('award_1030');
    if (config){
      this.award_1030 = config;
    }

    return this.award_1030;
  }
  public async getAward3060 () {
    let config = await this.getCacheConfig('award_1030');
    if (config){
      this.award_3060 = config;
    }

    return this.award_3060;
  }
  private async getCacheConfig (key) {
    let config = await this.app.get('model').Config.findOne({
        attributes: ['value'],
        where: {key},
        raw: true
    });

    return config && config.value;
  }
}
