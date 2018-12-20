'use strict';

import { pick } from 'lodash';
import * as path from 'path';
import { Application, BackendSession } from 'pinus';
import { getLogger } from 'pinus-logger';
import { EventRoute } from '../../../components/push';
import { Decimal, parseObj, stringifyObj} from '../../../lib/util';
import { PacketAward, PacketNumber, PacketStatus} from '../../../model/packet';
import { TransactionType, TransactionValue } from '../../../model/transaction';
import { Handler, Response} from '../../handler';

const logger = getLogger('game', path.basename(__filename));

export class SceneHandler extends Handler{

  /**
   * @api scene.user.sendPacket 玩家发送红包
   * @apiGroup Player
   * @apiName scene.user.sendPacket
   *
   * @apiParam {Number} award 红包价值
   * @apiParam {Number} lei 红包雷点
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "code": 200,
   *   "message": '',
   *   "data": {
   *     //玩家发完红包后的余额
   *     "award": 900,
   *      //玩家发出去的红包，跟在 红包列表中 的红包模型一模一样, 跟在红包事件里的红包对象也一样
   *     "packet": {
   *       "id": 5,
   *       "status": 0,
   *       "base_award": 50,
   *       "lei": 5,
   *       "opened": 0,
   *       "created": "2018-09-19 03:41:34",
   *       "user": {
   *         "id": 3,
   *         "name": "昵称",
   *         "headimgurl": ""
   *       }
   *     }
   *   }
   * }
   * @apiErrorExample Error-Response:
   * {
   *   "code": 500,
   *   "message": ""
   * }
   */
  public async sendPacket (msg: any, session: BackendSession): Promise<Response> {

    let rule = {
      award: { type: 'number', min: PacketAward.Min, max: PacketAward.Max},
      lei: { type: 'number', min: 0, max: 9 }
    };

    const { app } = this;
    const { award, lei } = this.validater(rule, msg);

    const token = session.get('token');
    const room_id = session.get('room_id');
    let room = await app.model.Room.findByPk(room_id);
    if (!room) {
      return this.fail('房间不存在');
    }

    let user = await this.session(token, 'user');
    if (!user) {
      return this.fail(this.code.unlogin);
    }
    user = await app.model.User.findByPk(user.id);
    if (user.award < award) {
      return this.fail('您的余额不足, 请先去充值!');
    }

    // 红包过期时间
    let packet_duration = await this.config.getPacketDuration();
    // 红包信息
    let packet = app.model.Packet.build({
      status: PacketStatus.Normal,
      room_id: room.id,
      user_id: user.id, //发包的人
      base_award: award,
      award: award,
      lei: lei,
      turns: 0,
      all_turns: 7
    });
    packet.created = new Date();
    packet.finished = new Date(Date.now() + packet_duration * 1000);

    //红包队列
    packet.packet_items = await this.packet.createPackets(award, lei);

    logger.info('红包信息', packet.get({plain: true}));

    // 发包记录
    let transaction = app.model.Transaction.build({
      type: TransactionType.Fa,
      user_id: user.id,
      room_id: room_id,
      base_award: award,
      cost_award: -award,
      remark: `用户 ${user.name} 在 ${room.name} 发包 ${award} 雷点 ${lei}`
    });

    logger.info('发包记录', transaction.get({plain: true}));

    try {
      await app.model.transaction(async (t) => {
        //红包保存
        await packet.save({ transaction: t });

        //用户当前红包更新
        await user.reload({ transaction: t });
        user.award = Decimal(user.award - packet.base_award);
        await user.save({ transaction: t });

        //发包记录
        transaction.packet_id = packet.id;
        transaction.award = user.award;
        await transaction.save({ transaction: t });

        //TODO 出错也会回滚
        await this.packet.setPackets(packet.id, packet.packet_items);
      });
    } catch (e) {
      logger.error('发送红包失败', e);
      return this.fail('发送失败, 请稍后再试');
    }

    this.push.pushEvent(EventRoute.OnPacket, room, user, packet);

    this.session(token, 'user', user);

    // //发首包给房主
    // if (app.get('env') === 'unittest'){
    //   await this.packetToRoom(packet.id);
    // }
    // else {
    //   process.nextTick(this.packetToRoom.bind(this, packet.id));
    // }

    // //包超时结算
    // setTimeout(
    //   this.packetExpired.bind(this, packet.id),
    //   new Date(packet.finished).getTime() - Date.now() + 3000
    // );

    return this.success({
      award: user.award,
      //和红包列表保持一致
      packet: {
        ...pick(packet, 'id', 'status', 'base_award', 'lei', 'opened', 'created'),
        user: pick(user, 'id', 'name', 'headimgurl'),
      }
    });
  }
  /**
   * @api scene.user.openPacket 玩家打开红包
   * @apiGroup Player
   * @apiName scene.user.openPacket
   *
   * @apiParam  {Number} packet_id 红包ID
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "code": 200,
   *   "message": '',
   *   "data": {
   *       award: 1040.48,
   *       turns: 2,
   *       value: '顺子',
   *       packet_award: 5.7,
   *       cost_award: 5.7
   *    }
   * }
   * @apiErrorExample Error-Response:
   * {
   *   "code": 500,
   *   "message": ""
   * }
   */
  public async openPacket (msg: any, session: BackendSession): Promise<Response> {

    let rule = {
      id: { type: 'number' }
    };

    const { app } = this;
    const { id } = this.validater(rule, msg);

    const token = session.get('token');
    const room_id = session.get('room_id');
    let room = await app.model.Room.findByPk(room_id);
    if (!room) {
      return this.fail('房间不存在');
    }

    let user = await this.session(token, 'user');
    if (!user) {
      return this.fail(this.code.unlogin);
    }
    user = await app.model.User.findByPk(user.id);
    if (!user) {
      return this.fail(this.code.unlogin);
    }

    try {
      //红包
      let packet = await app.model.Packet.findByPk(id, {
        include: [
          {
            model: app.model.User,
            as: 'user',
            attributes: ['id', 'name', 'award']
          },
          {
            model: app.model.Room,
            as: 'room',
            attributes: ['id', 'name', 'award']
          }
        ]
      });

      if (!packet) {
        return this.fail('红包不存在');
      }
      // 红包的情况
      if (packet.status === PacketStatus.Success || packet.award === 0) {
        return this.fail('红包已抢完');
      }
      if (
        packet.status === PacketStatus.Expired ||
        new Date(packet.finished as string).getTime() < Date.now()
      ) {
        return this.fail('红包已过期');
      }

          //我的余额情况
      if (user.award < packet.base_award * 1.5) {
        return this.fail('您的余额不足, 请先去充值!');
      }

      // TODO 待修改到模型里
      //是否抢过红包
      let open = await app.model.Transaction.findOne({
        where: {
          type: TransactionType.Qiang,
          packet_id: packet.id,
          user_id: user.id
        }
      });
      if (open) {
        return this.fail('您已经抢过该红包');
      }

      // TODO 待封装
      let packet_item = await this.packet.getPacket(packet.id);
      logger.warn('取出红包', packet_item);
      if (!packet_item) {
        return this.fail('红包已抢完');
      }
      packet_item = parseObj(packet_item);

      //如果已经抽到最后一个红包 ，修改大红包状态为抽完
      if (packet_item.turns === PacketNumber.Max) {
        packet.status = PacketStatus.Success;
      }

      let transaction = app.model.Transaction.build({
        type: TransactionType.Qiang,
        room_id: packet.room_id,
        packet_id: packet.id,
        user_id: user.id,
        turns: packet_item.turns,
        //TODO 看下是否能删除
        base_award: packet.base_award
      });

      //判断我抢到的包的情况
      transaction.value = await this.packet.checkPacket(
        packet_item.award,
        packet.lei
      );
      transaction.spical_award = 0;
      transaction.lei_award = 0;

      switch (transaction.value) {
        case TransactionValue.Min:
        case TransactionValue.BaoZi:
        case TransactionValue.ShunZi:
          //抢包者特殊牌，给发包者的奖励
          if (packet.base_award >= 10 && packet.base_award <= 30) {
            //TODO 转化到配置service里
            let award_1030 = await this.config.getAward1030();
            transaction.spical_award = award_1030.spical;
          } else if (packet.base_award > 30) {
            let award_3060 = await this.config.getAward3060();
            transaction.spical_award = award_3060.spical;
          }
          transaction.remark = `用户 ${user.name} 特殊牌 ${
            transaction.value
          } 奖励 ${transaction.spical_award}`;
          break;
        case TransactionValue.Lei:
          if (packet.user_id !== transaction.user_id) {
            //抢包者中雷，赔付的值
            transaction.lei_award = -Decimal(1.5 * packet.base_award);
            transaction.remark = `用户 ${user.name} 中雷 ${packet.lei} 赔付 ${
              transaction.lei_award
            }`;
          } else {
            transaction.remark = `发包者 ${user.name} 抢自己红包中雷 ${
              packet.lei
            } 不用赔付`;
          }
          break;
        default:
          transaction.remark = `用户 ${user.name} 抢到红包 ${
            transaction.packet_award
          }`;
      }
      transaction.packet_award = packet_item.award;
      transaction.cost_award = Decimal(packet_item.award + transaction.spical_award + transaction.lei_award);

      try {
        await app.model.transaction(async (t) => {
          //重载房间的信息
          await packet.room.reload({ transaction: t });
          //重载发包者的信息
          await packet.user.reload({ transaction: t });
          //玩家特殊牌,友房主奖励发包者
          if (transaction.spical_award) {
            //实际上 spical_award 是正的
            packet.room.award = Decimal(packet.room.award - Math.abs(transaction.spical_award));
            packet.user.award = Decimal(packet.user.award + Math.abs(transaction.spical_award));
          }
          //玩家中雷,直接赔钱, 给发包者
          if (transaction.lei_award) {
            //实际上 lei_award 是负的
            packet.user.award = Decimal(packet.user.award + Math.abs(transaction.lei_award));
          }

          //如果是自己抢了自己的红包
          if (user.id === packet.user.id){
            //await user.reload({ transaction: t });
            user.award = Decimal(user.award + transaction.cost_award);
            transaction.award = user.award;
            await user.save({ transaction: t });
          }
          else {
            packet.user.award = Decimal(packet.user.award + transaction.cost_award);
            transaction.award = packet.user.award;
          }

          transaction.room_award = packet.room.award;

          //房主的交易和红包更新
          await packet.room.save({ transaction: t });
          await packet.user.save({ transaction: t });
          await transaction.save({ transaction: t });

          packet.turns = transaction.turns;
          packet.award = Decimal(packet.award - transaction.packet_award);

          //记录抽红包的人
          packet.player_ids.push(user.id);
          await packet.save({ transaction: t });
        });
      } catch (e) {
        if (e.message && e.message.indexOf('ER_DUP_ENTRY') === 0) {
          return this.fail('请不要重复点击');
        }
        logger.error('打开红包出错', e);
        logger.warn('回滚红包', packet_item);
        await this.packet.setPacket(packet.id, packet_item);
        return this.fail('红包已抢完');
      }

      if (packet.status === PacketStatus.Success) {
        process.nextTick(this.packetMutliLei.bind(this, packet.id));
      }

      await this.session(token, 'user', user);

      this.push.pushEvent(EventRoute.OnPlayerOpen, room, user, packet);

      let result = {
        award: user.award,
        turns: packet_item.turns,
        value: transaction.value,
        packet_award: packet_item.award,
        cost_award: transaction.cost_award,
      };

      return this.success(result);
    } catch (e) {
      logger.error('打开红包出错: \n', e);
      return this.fail('操作失败, 请稍后再试');
    }
  }

  private async packetMutliLei (packet_id) {
    //多雷奖励
    const { app } = this;

    let packet = await app.model.Packet.findByPk(packet_id, {
      include: [
        {
          model: app.model.User,
          as: 'user',
          attributes: ['id', 'name', 'award']
        },
        {
          model: app.model.Room,
          as: 'room',
          attributes: ['id', 'name', 'award']
        }
      ]
    });

    if (!packet) {
      logger.error('packetMutliLei 红包不存在', packet_id);
      return;
    }

    packet.lei_count = await app.model.Transaction.count({
      where: {
        type: TransactionType.Qiang,
        packet_id: packet.id,
        value: TransactionValue.Lei
      }
    });

    let cost_award = 0;
    if (packet.base_award >= 10 && packet.base_award <= 30) {
      let award_1030 = await this.config.getAward1030();
      cost_award = award_1030.lei[packet.lei_count];
    } else if (packet.base_award > 30) {
      let award_3060 = await this.config.getAward3060();
      cost_award = award_3060.lei[packet.lei_count];
    }
    //雷奖励
    if (!cost_award) return;

    let transaction = app.model.Transaction.build({
        type: TransactionType.Lei,
        user_id: packet.user_id,
        room_id: packet.room_id,
        packet_id: packet.id,
        base_award: packet.base_award,
        cost_award: cost_award,
        remark: `发包者 ${packet.user.name} 的红包中${
          packet.lei_count
        }雷, 多雷奖励 ${cost_award}`
    });

    await app.model.transaction(async (t) => {
        await packet.room.reload({ transaction: t });
        await packet.user.reload({ transaction: t });

        packet.user.award = Decimal(packet.user.award + cost_award);
        packet.room.award = Decimal(packet.room.award - cost_award);

        transaction.room_award = packet.room.award;
        transaction.award = packet.user.award;

        await packet.update({ transaction: t});
        await transaction.save({ transaction: t});
        await packet.user.save({ transaction: t});
        await packet.room.save({ transaction: t});
    });
  }
  private async packetToRoom (packet_id) {
    const { app } = this;

    let packet = await app.model.Packet.findByPk(packet_id, {
      include: [
        {
          model: app.model.User,
          as: 'user',
          attributes: ['id', 'name', 'award']
        },
        {
          model: app.model.Room,
          as: 'room',
          attributes: ['id', 'name', 'award']
        }
      ]
    });

    if (!packet) {
      logger.error('packetToRoom 红包不存在', packet_id);
      return;
    }

    let packet_item = await this.packet.getPacket(packet_id);
    if (!packet_item) return;

    logger.info(`${packet.room.name} 取出首包: `, packet_item);

    try {
      //房主抢首包交易
      let transaction = app.model.Transaction.build({
        type: TransactionType.Qiang,
        turns: packet_item.turns,
        user_id: 0, //房主不是用户
        room_id: packet.room_id,
        packet_id: packet.id,
        base_award: packet.base_award,
        packet_award: packet_item.award,
        cost_award: packet_item.award
      });

      transaction.value = await this.packet.checkPacket(
        transaction.packet_award,
        packet.lei
      );

      //房主没有特殊牌奖励，也不应该有雷赔付
      transaction.remark = `房主 ${packet.room.name} 首包 ${
        transaction.packet_award
      }`;

      await app.model.transaction(async (t) => {
        if (!packet) return;

        //房主的交易和红包更新
        await packet.room.reload({ transaction: t });
        packet.room.award = Decimal(packet.room.award + transaction.cost_award);
        await packet.room.save({ transaction: t });

        //红包本身的更新
        packet.award = Decimal(packet.award - transaction.packet_award);
        await packet.save({ transaction: t });

        //发包交易的更新
        transaction.room_award = packet.room.award;
        await transaction.save({ transaction: t });
      });
    } catch (e) {
      await this.packet.setPacket(packet.id, packet_item);
      logger.error('分配房主首包出错', e, packet_item);
    }

    // TODO 可能失败，需要定时任务兜底
    //用房主的首包分红
    if (app.get('env') === 'unittest'){
      await this.packetPresent(packet.id);
    }
    else {
      process.nextTick(this.packetPresent.bind(this, packet.id));
    }
  }

  private async packetPresent (packet_id){

    const { app } = this;

    let packet = await app.model.Packet.findByPk(packet_id, {
      include: [
        {
          model: app.model.User,
          as: 'user',
          attributes: ['id', 'name', 'award']
        },
        {
          model: app.model.Room,
          as: 'room',
          attributes: ['id', 'name', 'award']
        }
      ]
    });

    if (!packet) {
      logger.error('packetPresent 红包不存在', packet_id);
      return;
    }

    let room_packet = await app.model.Transaction.findOne({
      where: {
        type: TransactionType.Qiang,
        packet_id: packet_id,
        user_id: 0
      }
    });
    if (!room_packet) {
      logger.error(`房间 ${packet.room.name} 房主没抢包`, packet_id);
      return;
    }

     //给发包者的上级 分红
    let parents: any = [];
    let relation = await app.model.Relation.findOne({
       where: { user_id: packet.user_id }
     });
    logger.info(`给发包者 ${packet.user.name} 的上级关系`, relation.get({plain: true}));
    if (!relation) return;

    let transaction = app.model.Transaction.build({
      type: TransactionType.RoomPresent,
      user_id: 0, //房主不是用户
      room_id: packet.room_id,
      packet_id: packet.id,
      base_award: packet.base_award,
      packet_award: room_packet.packet_award,
      cost_award: 0
    });

    parents = [
        relation.parent1_id,
        relation.parent2_id,
        relation.parent3_id,
        relation.parent4_id,
        relation.parent5_id,
        relation.parent6_id,
        relation.parent7_id
    ];

    parents = parents.filter((id) => id);
    if (parents.length === 0){
      logger.info('该发包者没有上级', parents);
      return;
    }

    //分红配置
    let award_present = await this.config.getAwardPresent();
    for (let i = 0, len = parents.length; i < len; i++) {
      let parent_id = parents[i];
      let parent_transaction = app.model.Transaction.build({
        type: TransactionType.Present,
        user_id: parent_id,
        room_id: packet.room_id,
        packet_id: packet.id,
        base_award: packet.base_award,
        cost_award: Decimal(award_present[i] * room_packet.packet_award)
      });
      parent_transaction.remark = `${packet.user.name} 发包, 给第 ${i + 1} 级 分红 ${parent_transaction.cost_award}`;
      logger.info(parent_transaction.remark);
      parents[i] = parent_transaction;
    }

    try {
      await app.model.transaction(async (t) => {

        for (let parent_transaction of parents){
          let user = await app.model.User.findByPk(parent_transaction.user_id, {
            transaction: t
          });
          if (!user) continue;

          user.award = Decimal(user.award + parent_transaction.cost_award);
          await user.save({ transaction: t });

          parent_transaction.award = user.award;
          await parent_transaction.save({ transaction: t });

          transaction.cost_award = Decimal(transaction.cost_award - parent_transaction.cost_award);
        }

        transaction.remark = `房主抢包 ${transaction.packet_award}, 分红给发包者上级共 ${Math.abs(transaction.cost_award)}`;
        logger.info(transaction.remark);
        await transaction.save({ transaction: t });
      });
    } catch (e) {
      logger.error('分红出错', e, packet);
    }
  }
  private async packetExpired (packet_id) {
    const { app } = this;
    let packet = await app.model.Packet.findByPk(packet_id, {
      include: [
        {
          model: app.model.User,
          as: 'user',
          attributes: ['id', 'name', 'award']
        },
        {
          model: app.model.Room,
          as: 'room',
          attributes: ['id', 'name', 'award']
        }
      ]
    });

    if (!packet) {
      return;
    }

    if (packet.status !== PacketStatus.Normal) {
      return;
    }

    //包还没抢完
    packet.status = PacketStatus.Expired;

    //剩余包收回
    let transaction = app.model.Transaction.build({
      type: TransactionType.Back,
      user_id: packet.user_id,
      room_id: packet.room_id,
      packet_id: packet.id,
      base_award: packet.base_award,
      //自己把剩下红包余额收回
      cost_award: packet.award,
      remark: `红包超时未领完, ID:${packet.id} 的红包内剩余${packet.all_turns -
        packet.turns}个红包共 ${packet.award} 退回发包者 ${packet.user.name}`
    });

    try {
      await app.model.transaction(async (t) => {
        if (!packet) return;
        //红包状态
        await packet.save({ transaction: t });

        //用户余额
        await packet.user.reload({ transaction: t });
        packet.user.award = Decimal(packet.user.award + packet.award);
        await packet.user.save({ transaction: t });

        //发包后, 备份用户的 红包值
        transaction.award = packet.user.award;
        await transaction.save({ transaction: t });
      });
    } catch (e) {
      logger.error(e);
    }
  }
}

export default function (app: Application) {
  return new SceneHandler(app);
}
