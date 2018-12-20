import { Redis } from 'ioredis';
import * as path from 'path';
import { Application, IComponent} from 'pinus';
import { getLogger } from 'pinus-logger';
import { Decimal, parseObj, stringifyObj} from '../lib/util';
import { TransactionValue } from '../model/transaction';

const logger = getLogger('game', path.basename(__filename));

interface PacketItem {
  turns: number,
  award: number
}
export default function (app: Application) {
  return new Packet(app);
}

export class Packet implements IComponent {

  public name = 'packet';
  public app: Application;
  constructor (app: Application) {
    this.app = app;
  }
  get store (){
    return this.app.get('store').cache as Redis;
  }
  public start (cb: () => void){
    this.app.set(this.name, this);
    cb();
  }
  // 分配七个包
  public createPackets (award: number, lei: number, num: number = 7): PacketItem[] {

    let array: number[] = [];
    let sum: number = 0;

    for (let i = 0; i < num; i++) {
      let n = Math.random();
      sum = sum + n;
      array.push(n);
    }

    array[num - 1] = award;

    for (let i = 0; i < num - 1; i++) {
      array[i] = Decimal(award * array[i] / sum);

      //首包不能为0
      if (i === 0) {
        if (this.checkPacket(array[i], lei) === TransactionValue.Lei) {
          array[i] = array[i] + 0.01;
        }
      }

      array[num - 1] = Decimal(array[num - 1] - array[i]);
    }

    return array.map((award, index) => ({
      turns: index + 1,
      award: award
    }));
  }

  public async setPackets (id, packet_items: PacketItem[]): Promise<void> {
    await this.store.del(`packet:${id}`);
    await this.store.lpush(
      `packet:${id}`,
      ...packet_items.map((item) => stringifyObj(item))
    );
  }

  public async getPacket (id): Promise<PacketItem | null> {
    let packet_item = await this.store.rpop(`packet:${id}`);
    if (packet_item) {
      return parseObj(packet_item);
    }
  }

  public async setPacket (id, packet_item: PacketItem): Promise<void> {
    if (!packet_item) return;
    await this.store.lpush(
      `packet:${id}`,
      stringifyObj(packet_item)
    );
  }

  public checkPacket (award: number, lei: number): TransactionValue {

    let value = TransactionValue.Normal;

    let array = Decimal(award).toFixed(2).replace('.', '').split('');

    //中雷
    if (String(lei) === array[array.length - 1]) {
      value = TransactionValue.Lei;
    }
    //0.01
    else if (array.join('') === '001') {
      value = TransactionValue.Min;
    }
    //顺子
    else if ('0123456789'.indexOf(array.join('')) !== -1 || '9876543210'.indexOf(array.join('')) !== -1) {
      value = TransactionValue.ShunZi;
    }
    //豹子
    else if (Array.from(new Set(array)).length === 1) {
      value = TransactionValue.BaoZi;
    }

    logger.info(`check award: ${award} lei:${lei} value: ${value}`);

    return value;
  }
}
