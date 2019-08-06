import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse,
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LogoutInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse && event.body.data === 'logout') {
          location.reload();
          throw Error('user not authorized');
        }
      }),
    );
  }
}
