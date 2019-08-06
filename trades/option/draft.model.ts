import { from, Observable, of } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { propEq, reject } from 'ramda';

import {
  action, Effect, Message, MessageObservable,
  notifyPlugin, Reactive, Reducer, Select, toError,
} from '@vision/rx';

import { appDispatcher } from 'core/app.dispatcher';
import { WebSocketService } from 'core/websockets';

import { dealCreated } from '../../trading-panel/events';
import * as events from './events';

import { DealConfig, DraftDeal, OptionDeal } from './interface';

import { timestamp } from '../utils';

@Reactive({
  state: {
    draftDeals: [],
  },
  source: appDispatcher,
  plugins: [notifyPlugin({ type: events.draftStateUpdated })],
})
export class DraftModel {
  @Select()
  draftDeals$: Observable<OptionDeal[]>;

  constructor(
    private ws: WebSocketService,
  ) { }

  @Reducer({ type: events.draftCreatedSuccess, prop: 'draftDeals' })
  dealWasCreated(draftDeals, { payload }: Message<DealConfig>): DraftDeal[] {
    return draftDeals.concat({
      id: `${payload.asset}-${payload.expire_at},${payload.amount}`,
      amount: payload.amount,
      asset_id: payload.asset_id,
      asset_name: payload.asset_name,
      asset_ric: payload.asset,
      close_quote_created_at: new Date(payload.expire_at * 1000).toISOString(),
      open_quote_created_at: new Date(payload.created_at).toISOString(),
      close_rate: 0,
      deal_type: payload.deal_type,
      name: payload.asset_name,
      open_rate: 0,
      option_type: payload.option_type,
      payment: 0,
      payment_rate: 0,
      status: 'unconfirmed',
      ric: payload.asset,
      trend: payload.trend,
      win: 0,
    });
  }

  @Reducer({ type: events.dealOpened, prop: 'draftDeals' })
  createDealConfirmed(draftDeals, { payload }: Message<OptionDeal>): DraftDeal[] {
    return reject(
      propEq(
        'id',
        `${payload.ric}-${timestamp(payload.close_quote_created_at) / 1000},${payload.amount}`,
        ),
      draftDeals,
    );
  }

  @Effect()
  draftDealCreated(msg$: MessageObservable) {
    return msg$.ofType(dealCreated).toPayload().pipe(
      exhaustMap(payload =>
        from(this.ws.push({
          channelName: 'base',
          event: events.createDeal,
          params: payload,
        })).pipe(
          exhaustMap(() => of(action(events.draftCreatedSuccess, payload))),
          toError(events.draftCreatedFailure),
        ),
      ),
    );
  }

  dispatch(type, payload?): void {
    appDispatcher.dispatch(type, payload);
  }
}
