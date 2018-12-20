import { Application as PinusApplication } from 'pinus';
import { DATE, DECIMAL, INTEGER, STRING } from 'sequelize';

import Sequelize = require('sequelize');

export enum RoomStatus {
  Normal = 0,
  Top = 1,
  Hide = 2
}

export interface RoomAttributes {
  id?: number;
  status?: RoomStatus,
  name?: string;
  headimgurl?: string;
  award?: number;
  updated?: string | Date | null;
  created?: string | Date | null;
  deleted?: string | Date | null;
}

export interface RoomInstance extends Sequelize.Instance<RoomAttributes>, RoomAttributes{
  id: number;
  status: RoomStatus,
  name: string;
  headimgurl: string;
  award: number;
  updated: string | Date | null;
  created: string | Date | null;
  deleted: string | Date | null;
}

interface RoomModel extends Sequelize.Model<RoomInstance, RoomAttributes>{
}

interface Application extends PinusApplication {
  model: Sequelize.Sequelize
}

export default (app: Application) => {

  const model = app.model.define(
    'room',
    {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      status: { type: INTEGER, allowNull: false, defaultValue: 0 },
      name: { type: STRING(255), allowNull: false, defaultValue: '' },
      headimgurl: { type: STRING(255), allowNull: false, defaultValue: '' },
      award: { type: DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      updated: { type: DATE, allowNull: true },
      created: { type: DATE, allowNull: true },
      deleted: { type: DATE, allowNull: true }
    },
    {
      tableName: 'room'
    }
  ) as RoomModel;

  // model.sync({
  //   force: app.config.env === 'unittest'
  // });

  return model;
};
