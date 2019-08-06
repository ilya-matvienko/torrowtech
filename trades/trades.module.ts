import { NgModule, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { map, startWith } from 'rxjs/operators';

import { isEmpty } from 'ramda';

import { system, watch } from '@vision/rx';

import { CommonModule } from 'modules/common';
import { DashboardComponent, MenuItem, Breadcrumbs } from 'modules/layout';
import { CoreModule } from 'core/core.module';

import { WebSocketService } from 'core/websockets';

import { TradesController } from './trades.controller';
import { OptionController } from './option/option.controller';

import { OptionListComponent } from './option/list/list.component';
import { OptionDetailComponent } from './option/detail/detail.component';

import { TradesModel } from './trades.model';
import { OptionModel } from './option/option.model';
import { DraftModel } from './option/draft.model';

import { OptionService } from './option/option.service';
import { returnedToList, moreTradesRequested, tradesInited } from './events';

@NgModule({
  declarations: [
    TradesController,
    OptionController,

    OptionListComponent,
    OptionDetailComponent,
  ],
  entryComponents: [
    TradesController,
    OptionController,
  ],
  imports: [
    CommonModule,
    CoreModule,
  ],
  providers: [
    TradesModel,
    OptionModel,
    DraftModel,

    OptionService,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TradesModule {
  constructor(
    tradesModel: TradesModel,
    optionModel: OptionModel,
    draftModel: DraftModel,
    websocket: WebSocketService,
    translateService: TranslateService,
  ) {
    system.register(tradesModel);
    system.register(optionModel);
    system.register(draftModel);

    watch('app.dashboard').then((dashboard: DashboardComponent) => {
      const title = translateService.instant('trades.title');
      const titles$ = tradesModel.deal$.pipe(
        map(deal =>  isEmpty(deal) ? [title] : [title].concat(deal.name)),
        startWith([title]),
      );

      dashboard.addItem({
        menu: new MenuItem('history', title, tradesModel.count$),
        title: new Breadcrumbs(titles$, () => tradesModel.dispatch(returnedToList)),
        content: TradesController,
        infinityScroll: () => tradesModel.dispatch(moreTradesRequested),
      });
    });

    websocket.join('base', ['deal_created', 'close_deal_batch']);

    tradesModel.dispatch(tradesInited);
  }
}
