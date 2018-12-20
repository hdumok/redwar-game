
import { Application as PinusApplication } from 'pinus';
import { DATE, INTEGER } from 'sequelize';

import Sequelize = require('sequelize');

export interface RelationAttributes {
  id?: number,
  user_id?: number,
  parent1_id?: number,
  parent2_id?: number,
  parent3_id?: number,
  parent4_id?: number,
  parent5_id?: number,
  parent6_id?: number,
  parent7_id?: number
  updated?: string | Date | null;
  created?: string | Date | null;
  deleted?: string | Date | null;
}

export interface RelationInstance extends Sequelize.Instance<RelationAttributes>, RelationAttributes{
  id: number,
  user_id: number,
  parent1_id: number,
  parent2_id: number,
  parent3_id: number,
  parent4_id: number,
  parent5_id: number,
  parent6_id: number,
  parent7_id: number
  updated: string | Date | null;
  created: string | Date | null;
  deleted: string | Date | null;
}

interface RelationModel extends Sequelize.Model<RelationInstance, RelationAttributes>{
}

interface Application extends PinusApplication {
  model: Sequelize.Sequelize
}

export default (app: Application) => {

  const model = app.model.define(
    'relation',
    {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {type: INTEGER},
      parent1_id: { type: INTEGER, allowNull: true },
      parent2_id: { type: INTEGER, allowNull: true },
      parent3_id: { type: INTEGER, allowNull: true },
      parent4_id: { type: INTEGER, allowNull: true },
      parent5_id: { type: INTEGER, allowNull: true },
      parent6_id: { type: INTEGER, allowNull: true },
      parent7_id: { type: INTEGER, allowNull: true },
      updated: { type: DATE, allowNull: true },
      created: { type: DATE, allowNull: true },
      deleted: { type: DATE, allowNull: true }
    },
    {
      tableName: 'relation'
    }
  ) as RelationModel;

  model.associate = () => {
    app.model.Relation.belongsTo(app.model.User, { constraints: false });
  };

  // model.sync({
  //   force: app.config.env === 'unittest'
  // });

  return model;
};
