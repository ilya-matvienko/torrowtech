import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { path } from 'ramda';

import { stripRight } from 'utils/string';

export type Query = (action?: string, config?: ApiConfig) => Observable<any>;

export type HttpMethod =
  'get' | 'post' | 'put' | 'delete' | 'patch' | 'jsonp' | 'options' | 'patch' | 'head' |
  'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'JSONP' | 'OPTIONS' | 'PATCH' | 'HEAD';

export interface ApiConfig {
  method?: string;
  params?: { [key: string]: any };
  body?: { [key: string]: any };
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
}

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) { }

  /**
   * Фабрика для создания функции, которая автоматически,
   * в качестве начала пути, будет использовать baseUrl
   * @example
   * this.query = this.api.query('/model');
   * this.query('/10'); // Отправит GET запрос по пути '/model/10'
   * @param baseUrl - базовый путь, обычно является названием модели
   * @param key - путь к данным из полученного объекта, которые необходимо вернуть
   * @returns Возвращает созданную функцию
   */
  query(baseUrl: string, k: string[] = ['data']): Query {
    return (action = '', { params = {}, method = 'GET', headers = {}, body = {} } = {}) => {
      const apiUrl = stripRight('/', [baseUrl, action].join('/'))
        .replace('/?', '?');

      return this.http.request(method, apiUrl, { headers, params, body }).pipe(
        map(res => path(k, res) || res),
      );
    };
  }
}
