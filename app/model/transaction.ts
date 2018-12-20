import { Application as PinusApplication } from 'pinus';
import { DATE, DECIMAL, INTEGER, STRING } from 'sequelize';
import { PacketAttributes, PacketInstance } from './packet';
import { RoomAttributes, RoomInstance } from './room';
import { UserAttributes, UserInstance } from './user';

import Sequelize = require('sequelize');
export enum TransactionValue {
  Normal = '',
  Lei = '中雷',
  BaoZi = '豹子',
  ShunZi = '顺子',
  Min = '最小'
}

export enum TransactionType {
  Unknow = 0,
  Fa = 1,
  Qiang = 2,
  Back = 3,
  Lei = 4,
  Present = 5,
  Recharge = 6,
  Withdraw = 7,
  RoomPresent = 8,
  RoomAward = 9
}

const TransactionName = [
  '未知',
  '发红包',
  '抢红包',
  '回收包',
  '多雷奖励',
  '下级分红',
  '用户充值',
  '用户提现',
  '房间分红',
  '房间充值',
];

export interface TransactionAttributes {
  id?: number;
  type?: TransactionType;
  name?: string;
  user_id?: number;
  room_id?: number;
  packet_id?: number;
  withdraw_id?: number;
  recharge_id?: number;
  base_award?: number;
  packet_award?: number;
  spical_award?: number;
  lei_award?: number;
  cost_award?: number;
  room_award?: number;
  award?: number;
  value?: TransactionValue;
  turns?: number;
  remark?: string;
  updated?: string | Date | null;
  created?: string | Date | null;
  deleted?: string | Date | null;
  user?: UserAttributes,
  room?: RoomAttributes,
  packet?: PacketAttributes
}

export interface TransactionInstance
  extends Sequelize.Instance<TransactionAttributes>,
    TransactionAttributes {
  id: number;
  type: TransactionType;
  name?: string;
  user_id: number;
  room_id: number;
  packet_id: number;
  withdraw_id: number;
  recharge_id: number;
  base_award: number;
  packet_award: number;
  spical_award: number;
  lei_award: number;
  cost_award: number;
  room_award: number;
  award: number;
  value: TransactionValue;
  turns: number;
  remark: string;
  updated: string | Date | null;
  created: string | Date | null;
  deleted: string | Date | null;
  user?: UserInstance,
  room?: RoomInstance,
  packet?: PacketInstance,
}

interface TransactionModel
  extends Sequelize.Model<TransactionInstance, TransactionAttributes> {
}

interface Application extends PinusApplication {
  model: Sequelize.Sequelize
}

export default (app: Application) => {
  const model = app.model.define(
    'transaction',
    {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: INTEGER, allowNull: false, defaultValue: TransactionType.Unknow},
      name: { type: STRING(128), allowNull: false, defaultValue: TransactionName[0]},
      user_id: { type: INTEGER, allowNull: true },
      room_id: { type: INTEGER, allowNull: true },
      packet_id: { type: INTEGER, allowNull: true },
      withdraw_id: { type: INTEGER, allowNull: true },
      recharge_id: { type: INTEGER, allowNull: true },
      base_award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

      //三种红包值的和的叠加，就是 cost_award
      packet_award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      spical_award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      lei_award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

      cost_award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      room_award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      value: {
        type: STRING(128),
        allowNull: false,
        defaultValue: TransactionValue.Normal
      },
      turns: { type: INTEGER, allowNull: false, defaultValue: 0 },
      remark: { type: STRING(128), allowNull: false, defaultValue: '' },
      updated: { type: DATE, allowNull: true },
      created: { type: DATE, allowNull: true },
      deleted: { type: DATE, allowNull: true }
    },
    {
      tableName: 'transaction',
      hooks: {
        beforeCreate (item){
          if (item && item.type) {
            item.name = TransactionName[item.type];
          }
        }
      }
    }
  ) as TransactionModel;


  model.associate = () => {
    app.model.Transaction.belongsTo(app.model.User, { constraints: false });
    app.model.Transaction.belongsTo(app.model.Room, { constraints: false });
    app.model.Transaction.belongsTo(app.model.Packet, { constraints: false });
  };

  // model.sync({
  //   force: app.config.env === 'unittest'
  // });

  return model;
};
