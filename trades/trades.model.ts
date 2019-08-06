import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { Reactive, Reducer, Select } from '@vision/rx';

import { appDispatcher } from 'core/app.dispatcher';

import { optionStateUpdated } from './option/events';

import { OptionDeal } from './option/interface';

import { isOpen } from './utils';

@Reactive({
  state: {
    tool: 'option',
    deal: {},
    count: 0,
  },
  source: appDispatcher,
})
export class TradesModel {
  @Select()
  tool$: Observable<string>;

  @Select({ pipe: distinctUntilChanged() })
  deal$: Observable<OptionDeal>;

  @Select({ pipe: distinctUntilChanged() })
  count$: Observable<number>;

  @Reducer({ type: optionStateUpdated })
  updateDealName(state, { payload }) {
    return {
      ...state,
      deal: payload.selectDeal,
      count: payload.list.filter(isOpen).length,
    };
  }

  dispatch(type, payload?) {
    appDispatcher.dispatch(type, payload);
  }
}
