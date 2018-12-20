export = {
  development: {
    session: {
      port: 6379,
      host: '127.0.0.1',
      password: '123456',
      db: 0
    },
    cache: {
      port: 6379,
      host: '127.0.0.1',
      password: '123456',
      db: 1
    },
  },
  production: {
    session: {
      port: 6379,
      host: '127.0.0.1',
      password: '123456',
      db: 0
    },
    cache: {
      port: 6379,
      host: '127.0.0.1',
      password: '123456',
      db: 1
    },
  }
};
