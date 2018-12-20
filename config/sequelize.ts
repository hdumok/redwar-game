export = {
  development: {
    delegate: 'model',
    baseDir: 'model',
    dialect: 'postgres', // support: mysql, mariadb, postgres, mssql
    database: 'redwar',
    host: '127.0.0.1',
    port: 54321,
    username: 'redwar',
    password: '12345678',
    timezone: '+08:00', //东八时区
    dialectOptions: {
      decimalNumbers: true
    },
    benchmark: true,
    define: {
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
      hooks: {
      }
    }
  },
  production: {
    delegate: 'model',
    baseDir: 'model',
    dialect: 'postgres', // support: mysql, mariadb, postgres, mssql
    database: 'redwar',
    host: '127.0.0.1',
    port: 54321,
    username: 'redwar',
    password: '12345678',
    timezone: '+08:00', //东八时区
    dialectOptions: {
      decimalNumbers: true
    },
    benchmark: true,
    define: {
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
      hooks: {
      }
    }
  }
};
