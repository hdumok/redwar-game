
'use strict';

import { Application, IComponent } from 'pinus';
import { configure } from 'pinus-sequelize';

export class Model implements IComponent {

  public name = 'model';
  public app: Application;
  constructor (app: Application) {
    this.app = app;
  }

  public start (cb: () => void){
    configure(this.app);
    cb();
  }
}

export default function (app: Application) {
  return new Model(app);
}
