# redwar-pinus

基于 [Pinus](https://github.com/node-pinus/pinus).

> NOTE: Pinus是 网易分布式游戏服务器 Pomelo 非官方的的 Typescript 版本, 结构没变, 不过可以用高版本node和新语法特性和TS特性。

## 动态部署
```
 pinus list -u admin -p redwar2018
 pinus stop -u admin -p redwar2018
 pinus start -e production -D
 pinus list -u admin -p redwar2018
 pinus add -u admin -p redwar2018 -h 127.0.0.1 -P 3005 host=127.0.0.1 port=15100 clientPort=5100 frontend=true serverType=gate id=gate-server-1
 pinus add -u admin -p redwar2018 -h 127.0.0.1 -P 3005 host=127.0.0.1 port=15200 clientPort=5200 frontend=true serverType=connector id=connector-server-1
# - pinus add -u admin -p redwar2018 -h 127.0.0.1 -P 3005 host=127.0.0.1 port=15201 clientPort=5201 frontend=true serverType=connector id=connector-server-2
 pinus add -u admin -p redwar2018 -h 127.0.0.1 -P 3005 host=127.0.0.1 port=15300 serverType=scene id=scene-server-1
# - pinus add -u admin -p redwar2018 -h 127.0.0.1 -P 3005 host=127.0.0.1 port=15301 serverType=scene id=scene-server-2
 pinus list -u admin -p redwar2018
```
## TODO
* route压缩
* protobuf
* 负载均衡
