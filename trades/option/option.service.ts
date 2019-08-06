import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService, Query } from 'core/api';

import { LoadedDeals } from './interface';
import { Account } from 'shared/account';

import { getTournamentId, getType } from 'utils/deals';

@Injectable()
export class OptionService {
  private query: Query;

  constructor(private api: ApiService) {
    this.query = this.api.query('/binomo/private/v2/deals/option');
  }

  load(account: Account): Observable<LoadedDeals> {
    return this.query('', {
      params: {
        type: getType(account),
        tournament_id: getTournamentId(account.tournamentId),
      },
    });
  }

  loadMore(account: Account, batchKey: string): Observable<LoadedDeals> {
    return this.query('', {
      params: {
        type: getType(account),
        batch_key: batchKey,
        tournament_id: getTournamentId(account.tournamentId),
      },
    });
  }
}
