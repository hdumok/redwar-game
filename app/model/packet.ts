import { Application as PinusApplication } from 'pinus';
import { DATE, DECIMAL, INTEGER, JSONB, STRING } from 'sequelize';
import { RoomAttributes, RoomInstance } from './room';
import { UserAttributes, UserInstance } from './user';

import Sequelize = require('sequelize');

export enum PacketNumber {
  Back = 0,
  Min = 1,
  Max = 7
}

export enum PacketAward {
  Min = 10,
  Max = 1000
}

export enum PacketStatus {
  Normal = 0,
  Success = 1,
  Expired = 2
}

export interface PacketAttributes {
  id?: number;
  status?: PacketStatus;
  user_id?: number;
  room_id?: number;
  player_ids?: number[];
  packet_items?: any[];
  base_award?: number;
  award?: number;
  lei?: number;
  lei_count?: number,
  turns?: number;
  all_turns?: number;
  opened?: number;
  finished?: string | Date | null;
  updated?: string | Date | null;
  created?: string | Date | null;
  deleted?: string | Date | null;
  user?: UserAttributes;
  room?: RoomAttributes;
  players?: UserAttributes[];
}

export interface PacketInstance
  extends Sequelize.Instance<PacketAttributes>,
    PacketAttributes {
  id: number;
  status: PacketStatus;
  user_id: number;
  room_id: number;
  player_ids: number[];
  packet_items: any[];
  base_award: number;
  award: number;
  lei: number;
  lei_count: number,
  turns: number;
  all_turns: number;
  opened?: number;
  finished: string | Date | null;
  updated: string | Date | null;
  created: string | Date | null;
  deleted: string | Date | null;
  user: UserInstance;
  room: RoomInstance;
  players: UserInstance[];
}

interface PacketModel
  extends Sequelize.Model<PacketInstance, PacketAttributes> {
}

interface Application extends PinusApplication {
  model: Sequelize.Sequelize
}

export default (app: Application) => {
  const model = app.model.define<PacketInstance, PacketAttributes>(
    'packet',
    {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      status: { type: INTEGER, allowNull: false, defaultValue: 0 },
      user_id: { type: INTEGER, allowNull: true },
      room_id: { type: INTEGER, allowNull: true },
      player_ids: { type: JSONB, allowNull: false, defaultValue: [] },
      packet_items: { type: JSONB, allowNull: false, defaultValue: [] },
      base_award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      lei: { type: INTEGER, allowNull: false, defaultValue: 0 },
      lei_count: { type: INTEGER, allowNull: false, defaultValue: 0 },
      turns: { type: INTEGER, allowNull: false, defaultValue: 0 },
      all_turns: { type: INTEGER, allowNull: false, defaultValue: 0 },
      opened: { type: INTEGER, allowNull: false, defaultValue: 0 },
      finished: { type: DATE, allowNull: true },
      updated: { type: DATE, allowNull: true },
      created: { type: DATE, allowNull: true },
      deleted: { type: DATE, allowNull: true }
    },
    {
      tableName: 'packet'
    }
  ) as PacketModel;

  model.associate = () => {
    app.model.Packet.belongsTo(app.model.User, { constraints: false });
    app.model.Packet.belongsTo(app.model.Room, { constraints: false });
    app.model.Packet.belongsToMany(app.model.Room, {
      as: 'roomer',
      through: {
        model: app.model.Transaction,
        unique: false
      },
      foreignKey: 'packet_id',
      constraints: false
    });
    app.model.Packet.belongsToMany(app.model.User, {
      as: 'player',
      through: {
        model: app.model.Transaction,
        unique: false
      },
      foreignKey: 'packet_id',
      constraints: false
    });
  };

  // model.sync({
  //   force: app.config.env === 'unittest'
  // });

  return model;
};
