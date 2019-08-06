import { Observable, pipe } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  withLatestFrom,
  filter as rxFilter,
  exhaustMap,
  shareReplay,
  switchMap,
  pluck,
} from 'rxjs/operators';

import {
  filter, sort, descend, compose, and, not, equals, propEq, prop,
} from 'ramda';

import {
  Effect, notifyPlugin, ofType, Reactive, Reducer, Select, toError, toMessage,
} from '@vision/rx';

import { appDispatcher } from 'core/app.dispatcher';
import { isNotEmpty } from 'utils';
import { Account } from 'shared/account';

import { OptionService } from './option.service';

import * as events from './events';
import { moreTradesRequested, returnedToList, tradesInited } from '../events';

import {
  accountStateUpdated, accountTypeChanged, accountTypeSelected,
} from 'shared/account/events';
import { quoteStateUpdated } from '../../quote/events';
import { assetStateUpdated } from '../../assets/events';

import { OptionDeal } from './interface';
import { Asset } from '../../assets/interfaces';

import { isOpen, timestamp } from '../utils';
import { uniqById } from 'utils/deals';

@Reactive({
  state: {
    list: [],
    lastClosedDeals: [],
    selectDeal: {},
    batchKey: '',
    account: {},
    quote: {},
    assets: [],
    currAsset: {},
  },
  source: appDispatcher,
  plugins: [notifyPlugin({ type: events.optionStateUpdated })],
})
export class OptionModel {
  @Select({ pipe: distinctUntilChanged() })
  selectDeal$: Observable<OptionDeal>;

  @Select({
    selector: 'list',
    pipe: pipe(
      distinctUntilChanged(),
      map(compose(
        sort(descend(prop('id'))),
        filter(isOpen)),
      ),
    ),
  })
  openDeals$: Observable<OptionDeal[]>;

  @Select({
    selector: 'list',
    pipe: pipe(
      distinctUntilChanged(),
      map(compose(
        sort(descend(prop('id'))),
        filter(compose(not, isOpen))),
      ),
    ),
  })
  closedDeals$: Observable<OptionDeal[]>;

  @Select({ pipe: pipe(distinctUntilChanged(), shareReplay(1)) })
  lastClosedDeals$: Observable<OptionDeal[]>;

  @Select()
  quote$: Observable<any>;

  @Select()
  assets$: Observable<Asset[]>;

  @Select()
  currAsset$: Observable<Asset>;

  constructor(private service: OptionService) { }

  @Reducer({ type: events.listLoadedSuccess })
  listLoaded(state, { payload }) {
    return {
      ...state,
      list: payload.binary_option_deals,
      batchKey: payload.batch_key,
    };
  }

  @Reducer({ type: events.moreLoadedSuccess })
  moreLoaded(state, { payload }) {
    return {
      ...state,
      list: uniqById(state.list.concat(payload.binary_option_deals)),
      batchKey: payload.batch_key || '',
    };
  }

  @Reducer({ type: events.dealOpened, prop: 'list' })
  dealCreated(list, { payload }) {
    return uniqById(list.concat(payload));
  }

  @Reducer({ type: events.dealBatchClosed })
  dealClosed(state, { payload }) {
    const cmpRic = propEq('ric', payload.ric);
    const cmpTime = item => equals(
      timestamp(item.close_quote_created_at),
      timestamp(payload.finished_at),
    );

    const lastClosedDeals = state.list.filter(and(cmpRic, cmpTime)).map(item => {
      const positive = item.trend === 'call'
        ? payload.end_rate >= item.open_rate
        : payload.end_rate <= item.open_rate;

      const tie = payload.end_rate === item.open_rate;
      const wonStatus = tie ? 'tie' : 'won';
      const payment = tie ? item.amount : item.payment;

      return {
        ...item,
        close_rate: payload.end_rate,
        status: positive ? wonStatus : 'lost',
        win: positive ? payment : 0,
      };
    });

    const list = state.list.map(
      item => lastClosedDeals.find(propEq('id', item.id)) || item,
    );

    return {
      ...state,
      list,
      lastClosedDeals,
    };
  }

  @Reducer({ type: events.detailSelected, prop: 'selectDeal' })
  detailSelected(_, { payload }) {
    return payload;
  }

  @Reducer({ type: accountStateUpdated, prop: 'account' })
  currentAccountUpdate(_, { payload }) {
    return payload.accounts.find(propEq('type', payload.type));
  }

  @Reducer({ type: quoteStateUpdated, prop: 'quote' })
  quoteUpdate(_, { payload }) {
    return payload.quote;
  }

  @Reducer({ type: assetStateUpdated })
  assetUpdate(state, { payload }) {
    return {
      ...state,
      assets: payload.items,
      currAsset: payload.opened[payload.cursor],
    };
  }

  @Reducer({ type: returnedToList, prop: 'selectDeal' })
  @Reducer({ type: events.detailClosed, prop: 'selectDeal' })
  resetSelectedDeal() {
    return {};
  }

  @Effect()
  listInited(events$, state$) {
    return events$.ofType(tradesInited, accountTypeSelected, accountTypeChanged).pipe(
      withLatestFrom(state$.pipe(pluck('account'), rxFilter(isNotEmpty)), (_, state) => state),
      switchMap((account: Account) => this.service.load(account).pipe(
        toMessage(events.listLoadedSuccess),
        toError(events.listLoadedFailure),
      )),
    );
  }

  @Effect()
  loadMore(events$, state$) {
    return events$.pipe(
      ofType(moreTradesRequested),
      withLatestFrom(state$, (_, state) => state),
      distinctUntilChanged((a, b) => equals(b, a)),
      rxFilter(({ batchKey }) => Boolean(batchKey)),
      exhaustMap(({ account, batchKey }) =>
        this.service.loadMore(account, batchKey).pipe(
          toMessage(events.moreLoadedSuccess),
          toError(events.moreLoadedFailure),
        ),
      ),
    );
  }

  dispatch(type, payload?): void {
    appDispatcher.dispatch(type, payload);
  }
}
