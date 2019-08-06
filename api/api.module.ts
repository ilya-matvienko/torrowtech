import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { ApiService } from './api.service';
import { RequestInterceptor, LogoutInterceptor, ResponseInterceptor } from './interceptors';

@NgModule({
  providers: [
    ApiService,
    { provide: HTTP_INTERCEPTORS, useClass: RequestInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LogoutInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ResponseInterceptor, multi: true },
  ],
})
export class ApiModule { }
