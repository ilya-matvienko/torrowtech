import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse,
} from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { appDispatcher } from 'core/app.dispatcher';
import { serverErrorOccurred } from '../events';

@Injectable()
export class ResponseInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          appDispatcher.dispatch(serverErrorOccurred, err);

          return throwError(err);
        }
      }),
    );
  }
}
