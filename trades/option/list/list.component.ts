import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';

import { equals, path } from 'ramda';

import { Asset } from '../../../assets/interfaces';
import { OptionDeal } from '../interface';

import { isOpen } from '../../utils';
import { profit } from 'utils/deals';

@Component({
  selector: 'option-list',
  templateUrl: './list.tpl.pug',
  styleUrls: ['./list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionListComponent {
  @Input() deal: OptionDeal;
  @Input() assets: Asset[];
  @Input() quote: any;

  @Output('select') selected = new EventEmitter<any>();

  quoteCache: any = {};

  getProfit(quote, deal) {
    if (!isOpen(deal) || !quote) return;

    this.quoteCache = equals(deal.ric, quote.ric) ? quote : this.quoteCache;
    return profit(this.quoteCache.rate, deal);
  }

  select(deal) {
    this.selected.emit({ ...deal, iconUrl: this.getIcon(deal) });
  }

  dealIsOpen(deal) {
    return isOpen(deal);
  }

  getIcon(deal) {
    return path(
      ['icon', 'url'],
      this.assets.find(asset => asset.ric === deal.ric),
    );
  }
}
