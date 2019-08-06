import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { equals } from 'ramda';

import { OptionDeal } from '../interface';
import { isOpen } from '../../utils';
import { Asset } from '../../../assets/interfaces';

import { profit } from 'utils/deals';

@Component({
  selector: 'option-detail',
  templateUrl: './detail.tpl.pug',
  styleUrls: ['./detail.scss'],
})
export class OptionDetailComponent implements OnDestroy {
  @Input() deal: OptionDeal;
  @Input() asset: Asset;
  @Input() quote: any;

  @Output() selectAsset = new EventEmitter<OptionDeal['ric']>();
  @Output('detailClosed') close = new EventEmitter<any>();

  quoteCache: any = {};

  constructor(private translate: TranslateService) { }

  assetSelected(deal: OptionDeal) {
    this.selectAsset.emit(deal.ric);
  }

  ngOnDestroy() {
    this.close.emit();
  }

  getProfit(quote, deal) {
    if (!isOpen(deal)) return;

    this.quoteCache = equals(deal.ric, quote.ric) ? quote : this.quoteCache;
    return profit(this.quoteCache.rate, deal);
  }

  isOpenDeal(deal: OptionDeal) {
    return isOpen(deal);
  }

  getTimeframe(type: string) {
    return `${ type === 'turbo' ? '1 - 5' : '15 - 60' } ${this.translate.instant('trades.min')}`;
  }
}
