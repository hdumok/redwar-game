export = {
  development: {
    gate: [
      {
        id: 'gate-server',
        host: '127.0.0.1',
        port: 15100,
        clientHost: '127.0.0.1',
        clientPort: 5100,
        frontend: true
      }
    ],
    connector: [
      {
        id: 'connector-server-1',
        host: '127.0.0.1',
        port: 15200,
        clientHost: '127.0.0.1',
        clientPort: 5200,
        frontend: true
      }
    ],
    scene: [
      {
        id: 'scene-server-1',
        host: '127.0.0.1',
        port: 15300
      }
    ]
  },
  production: {}
};
