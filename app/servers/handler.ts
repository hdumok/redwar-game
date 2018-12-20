
import { pick } from 'lodash';
import { Application as PinusApplication } from 'pinus';
import * as util from 'util';
import { Config } from '../components/config';
import { Packet } from '../components/packet';
import { Push } from '../components/push';
import { Scene } from '../components/scene';

import Parameter = require('parameter');
import Sequelize = require('sequelize');

const validator = new Parameter();
interface Application extends PinusApplication {
  model?: Sequelize.Sequelize
}

export interface Response {
  code: number,
  message: string,
  data: object | any[]
}

export class Handler {
  public app: Application;
  public session: (token: string, key: string, value?: any) => any;
  public config: Config;
  public scene: Scene;
  public packet: Packet;
  public push: Push;
  public code = {
    success: {
      code: 200,
      message: '',
    },

    fail: {
      code: 400,
      message: '请求失败',
    },

    unlogin: {
      code: 401,
      message: '请重新登录',
    },

    invalid_param: {
      code: 422,
      message: '参数错误',
    },

    server_error: {
      code: 500,
      message: '服务器错误',
    }
  };

  constructor (app: Application) {
    this.app = app;
    this.scene = app.get('scene');
    this.session = app.get('session');
    this.config = app.get('config');
    this.packet = app.get('packet');
    this.push = app.get('push');
  }
  public success (data?, ...message): Response{

    if (data && data.code){
      return data as Response;
    }

    let status = this.code.success;
    if (typeof data === 'string') {
      message.unshift(data);
      data = null;
    }

    return {
      code: status.code,
      message: this.createMessage(status, message),
      data: data || {}
    };
  }

  public fail (code?: any, data?: any, ...message): Response {

    let status = this.code.fail;
    if (code && code.code) {
      status = code;
    }
    else {
      if (typeof data === 'string' || typeof data === 'number') {
        message.unshift(data);
      }
      data = code;
    }

    if (typeof data === 'string') {
      message.unshift(data);
      data = null;
    }

    return {
      code: status.code,
      message: this.createMessage(status, ...message),
      data: data || {}
    };
  }

  public validater (rules, data, filter?) {

    //对参数进行过滤处理
    if (filter) {
      data = pick(data, Object.keys(rules));
    }

    //默认值 default 的级别最高
    for (let key in rules) {
      if (rules.hasOwnProperty(key)) continue;

      let rule = rules[key];
      rule.required = rule.required === false ? false : true;

      if (!rule.hasOwnProperty('default')) continue;

      let has = data.hasOwnProperty(key);
      if (has && data[key] !== '') continue;
      if (!has && rule.required) continue;

      if (rule.default === '') {
        rule.allowEmpty = true;
      }

      if (rule.default === undefined) {
        delete data[key];
      } else {
        data[key] = rule.default;
      }
    }

    const errors = validator.validate(rules, data);
    if (errors) {
      let error = new Error('参数错误');
      Object.assign(error, {errors});
      throw error;
    }

    return data;
  }

  private createMessage (status?: any, ...message): string {
    if (message.length === 0) {
      message = status.message;
    } else {
      message.unshift(status.message);

      //存在多个message, 并且第一个message不是字符串模板，转换成默认模板
      if (!/%s|%d/.test(message[0])) {
        message[0] = '%s';
      }

      message = util.format.apply(null, message);
    }

    return (message as any).replace(/%s|%d/g, '').trim();
  }
}
