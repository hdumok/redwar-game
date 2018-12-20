export = {
  appenders: {
    // tslint:disable:no-invalid-template-strings
    'console': {
      type: 'console'
    },
    'con-log': {
      type: 'file',
      filename: '${opts:base}/logs/${opts:serverId}.log',
      pattern: 'connector',
      maxLogSize: 1048576,
      layout: {
          type: 'basic'
      },
      backups: 5
    },
    'rpc-log': {
        type: 'file',
        filename: '${opts:base}/logs/${opts:serverId}.log',
        maxLogSize: 1048576,
        layout: {
            type: 'basic'
        },
        backups: 5
    },
    'forward-log': {
        type: 'file',
        filename: '${opts:base}/logs/${opts:serverId}.log',
        maxLogSize: 1048576,
        layout: {
            type: 'basic'
        },
        backups: 5
    },
    'rpc-debug': {
        type: 'file',
        filename: '${opts:base}/logs/${opts:serverId}.log',
        maxLogSize: 1048576,
        layout: {
            type: 'basic'
        },
        backups: 5
    },
    'crash-log': {
        type: 'file',
        filename: '${opts:base}/logs/${opts:serverId}.log',
        maxLogSize: 1048576,
        layout: {
            type: 'basic'
        },
        backups: 5
    },
    'admin-log': {
        type: 'file',
        filename: '${opts:base}/logs/${opts:serverId}.log',
        maxLogSize: 1048576,
        layout: {
            type: 'basic'
        },
        backups: 5
    },
    'pinus': {
      type: 'file',
      filename: '${opts:base}/logs/${opts:serverId}.log',
      maxLogSize: 1048576,
      layout: {
        type: 'basic'
      },
      backups: 5
    },
    'pinus-admin': {
      type: 'file',
      filename: '${opts:base}/logs/${opts:serverId}.log',
      maxLogSize: 1048576,
      layout: {
        type: 'basic'
      },
      backups: 5
    },
    'pinus-rpc': {
      type: 'file',
      filename: '${opts:base}/logs/${opts:serverId}.log',
      maxLogSize: 1048576,
      layout: {
        type: 'basic'
      },
      backups: 5
    },
    'pinus-sequelize': {
      type: 'file',
      filename: '${opts:base}/logs/${opts:serverId}.log',
      maxLogSize: 1048576,
      layout: {
        type: 'basic'
      },
      backups: 5
    }
  },

  categories: {
    default: {
      appenders: [
        'console',
        'con-log',
        'rpc-log',
        'forward-log',
        'rpc-debug',
        'crash-log',
        'admin-log',
        'pinus',
        'pinus-admin',
        'pinus-rpc',
        'pinus-sequelize',
      ],
      level: 'debug'
    }
  },

  prefix: '${opts:serverId} ',
  // tslint:onable:no-invalid-template-strings
  replaceConsole: false,
  lineDebug: false,
  errorStack: true
};
