import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { equals, groupWith } from 'ramda';

import { DateTime } from 'luxon';

import { OptionModel } from './option.model';

import { dealAssetSelected, detailClosed, detailSelected } from './events';

import { OptionDeal } from './interface';

import { notIsEmpty } from '../utils';

@Component({
  templateUrl: './option.tpl.pug',
  styleUrls: ['./option.scss'],
})
export class OptionController implements OnInit {
  deals$: Observable<any>;
  hasDeal$: Observable<boolean>;

  constructor(
    public optionModel: OptionModel,
    private translateService: TranslateService,
  ) { }

  ngOnInit() {
    const openDeals$ = this.optionModel.openDeals$;

    const closedDeals$ = this.optionModel.closedDeals$.pipe(map(groupWith(
      (a: { close_quote_created_at: string; }, b: { close_quote_created_at: string; }) => equals(
        this.getDayWithMonth(a.close_quote_created_at),
        this.getDayWithMonth(b.close_quote_created_at),
      )),
    ));

    this.deals$ = combineLatest([openDeals$, closedDeals$]).pipe(
      map(([open, close]) => notIsEmpty(open) ? [open, ...close] : [...close]),
    );

    this.hasDeal$ = this.optionModel.selectDeal$.pipe(map(notIsEmpty), distinctUntilChanged());
  }

  getDayWithMonth(iso: string) {
    const supportedLocale = DateTime.fromISO(iso)
      .setLocale(this.translateService.currentLang).resolvedLocaleOpts().locale;

    return DateTime.fromISO(iso)
      .setLocale(supportedLocale === this.translateService.currentLang ? supportedLocale : 'en')
      .toFormat('dd LLL');
  }

  isToday(iso: string) {
    const nowISO = DateTime.fromMillis(Date.now())
      .setLocale(this.translateService.currentLang)
      .toISO();

    return this.getDayWithMonth(iso) === this.getDayWithMonth(nowISO);
  }

  onSelect(deal: OptionDeal) {
    this.optionModel.dispatch(detailSelected, deal);
  }

  onSelectAsset(asset: string) {
    this.optionModel.dispatch(dealAssetSelected, { ric: asset });
  }

  onCloseDetail() {
    this.optionModel.dispatch(detailClosed);
  }
}
