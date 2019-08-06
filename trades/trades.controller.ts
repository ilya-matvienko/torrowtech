import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TradesModel } from './trades.model';

import { TOOLS } from './const';

@Component({
  templateUrl: './trades.tpl.pug',
})
export class TradesController implements OnInit {
  controller$: Observable<(new (...args) => any)>;

  constructor(private tradesModel: TradesModel) { }

  ngOnInit() {
    this.controller$ = this.tradesModel.tool$.pipe(
      map(tool => TOOLS[tool]),
    );
  }
}
