import { Injectable, LOCALE_ID, Inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { Observable } from 'rxjs';

import { config } from 'core/config';
import { getCookie } from 'utils/index';
import { isProd } from 'shared/const';

@Injectable()
export class RequestInterceptor implements HttpInterceptor {
  constructor(@Inject(LOCALE_ID) public locale: string) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const update: any = {};

    if (/\/binomo\//.test(req.url)) {
      const authtoken = getCookie('authtoken');

      update.withCredentials = true;

      update.headers = req.headers.append('Device-Id', getCookie('device_id'))
        .append('Device-Type', config.deviceType || 'web')
        .append(
          'Cache-Control', 'no-cache, no-store, must-revalidate',
        );

      if (authtoken) update.headers = update.headers.append('Authorization-Token', authtoken);

      update.params = req.params
        .append('locale', this.locale);

      update.url = isProd ? `${config.apiUrl}${req.url}` : req.url;
    }

    return next.handle(req.clone(update));
  }
}
