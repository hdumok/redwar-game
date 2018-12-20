import { Promise } from 'bluebird';
import { existsSync, mkdirSync} from 'fs';
import { getLogger } from 'pinus-logger';

// 支持注解
import 'reflect-metadata';

import Pinus = require('pinus');
import Sequelize = require('sequelize');

let logger = getLogger('game', __filename);

const FILEPATH = (Pinus as any).FILEPATH;
FILEPATH.CONFIG_DIR = '/config';
FILEPATH.CRON = '/config/crons';
FILEPATH.LOG = '/config/log4js';
FILEPATH.MASTER = '/config/master';
FILEPATH.SERVER = '/config/servers';
FILEPATH.MASTER_HA = '/config/masterha';
FILEPATH.SERVER_PROTOS = '/config/serverProtos';
FILEPATH.CLIENT_PROTOS = '/config/clientProtos';

const DEFAULT_ADMIN_PATH = (Pinus as any).DEFAULT_ADMIN_PATH;
DEFAULT_ADMIN_PATH.ADMIN_USER = '/config/adminUser';
DEFAULT_ADMIN_PATH.ADMIN_FILENAME = 'adminUser';

/**
 *  替换全局Promise
 *  自动解析sourcemap
 *  捕获全局错误
 */
export function preload () {
  // 使用bluebird输出完整的promise调用链
  global.Promise = Promise;

  (Sequelize as any).postgres.DECIMAL.parse = (value) => {
    return parseFloat(Number(value).toFixed(2));
  };

  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  // 开启长堆栈
  Promise.config({
    // Enable warnings
    warnings: true,
    // Enable long stack traces
    longStackTraces: true,
    // Enable cancellation
    cancellation: true,
    // Enable monitoring
    monitoring: true
  });

  if (!existsSync(__dirname + '/logs')) {
    mkdirSync(__dirname + '/logs');
  }

  // 自动解析ts的sourcemap
  require('source-map-support').install({
    handleUncaughtExceptions: false
  });

  // 捕获普通异常
  process.on('uncaughtException', (err) => {
    logger.error('Caught exception: ' + err.stack);
  });

  // 捕获async异常
  process.on('unhandledRejection', (reason, p) => {
    logger.error('Caught Unhandled Rejection at:' + p + 'reason:' + reason.stack);
  });
}
