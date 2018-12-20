
declare module 'parameter'

import User from '../../../app/model/user';
import Room from '../../../app/model/room';
import Packet from '../../../app/model/packet';
import Relation from '../../../app/model/relation';
import Transaction from '../../../app/model/transaction';

declare module 'sequelize' {
  interface Sequelize {
    User: ReturnType<typeof User>;
    Room: ReturnType<typeof Room>;
    Packet: ReturnType<typeof Packet>;
    Relation: ReturnType<typeof Relation>;
    Transaction: ReturnType<typeof Transaction>;
  }
}

