import { Injectable } from '@angular/core';
import { Socket } from 'phoenix';

import { interval } from 'rxjs';
import { startWith, takeWhile } from 'rxjs/operators';

import { camelCase } from 'change-case';
import { forEach, equals, union } from 'ramda';

import { config } from 'core/config/config';
import { appDispatcher } from 'core/app.dispatcher';
import { getCookie } from 'utils/cookies';

import { WebSocket } from './socket.proxy';
import { WsConfig, PushConfig } from './socket.interface';
import { PING_INTERVAL, socketConnected } from 'core/websockets/const';

type Channels = Map<string, { channel: Socket['channel'], events: string[] }>;

@Injectable()
export class WebSocketService {
  private channels: Channels = new Map();
  private status: string = 'offline';
  private socket: Socket;
  private reconnectAttempt: number = 0;

  /**
   * connect - создание подключения к сокетам. При успехе срабатывает хук onOpen
   *           и начинают прослушиваться каналы, если есть. При неудаче - onError,
   *           во время него происходит реконнект с заданным в конфиге интервалом
   *           и количеством раз. По окончании количества попыток происходит дисконнект.
   *
   * @params { () => any } failure? - колбэк, будет вызван в случае превышения количества
   *  попыток реконекта.
   */
  connect(wsConfig: WsConfig, failure?: () => any): void {
    if (!config.authorized) return;

    this.socket = new WebSocket(wsConfig.url, {
      reconnectAfterMs: () => wsConfig.interval,
      heartbeatIntervalMs: 60000,
      encode: (payload, callback) => callback(JSON.stringify(payload)),
      decode: (payload, callback) => callback(JSON.parse(payload)),
      params: {
        authtoken : getCookie('authtoken'),
        device    : 'web',
        device_id : config.deviceId,
        v : 2,
      },
    });

    this.socket.connect();

    this.socket.onOpen(() => {
      this.status = 'online';

      this.channelListening();
      appDispatcher.dispatch(socketConnected);
      interval(PING_INTERVAL).pipe(startWith(0), takeWhile(() => equals('online', this.status)))
        .subscribe(() => this.channelPing());
    });

    this.socket.onError(() => {
      this.status = 'offline';

      if (wsConfig.count > this.reconnectAttempt) {
        ++this.reconnectAttempt;
        return;
      }

      this.reconnectAttempt = 0;
      this.socket.disconnect();
      if (failure) failure();
    });
  }

  /**
   * join - публичный метод для добавления каналов и их событий для прослушивания.
   *
   * @params { string } channelName - имя канала.
   * @params { string[] } events - массив событий.
   *
   * @example
   * this.ws.join('base', ['create_deal', 'change_balance']);
   */
  join(channelName: string, events: string[]): void {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName).channel;
      const oldEvents = this.channels.get(channelName).events;

      this.channels.set(channelName, { channel, events: union(events, oldEvents) });
    } else {
      events.push('ping');
      this.channels.set(channelName, { channel: null, events });
    }

    if (this.status === 'online') {
      this.channelJoin(channelName);
      this.channelOn(channelName);
    }
  }

  /**
   * push - метод для пуша события в канал.
   *
   * @params { PushConfig } config - параметры необходимые для пуша, должен содержать имя канала,
   *  событие и необходимые параметры {@link PushConfig}.
   * @return { Promise }
   */
  push(config: PushConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.channels.has(config.channelName)) {
        const channel = this.channels.get(config.channelName).channel;

        channel.push(config.event, config.params)
          .receive('ok', response => resolve(response))
          .receive('error', error => reject(error));
      }
    });
  }

  /**
   * leaveAll - позволяет отписаться от всех каналов.
   *              Для повторной подписки нужно вызвать метод join.
   */
  leaveAll(): void {
    this.leave(...Array.from(this.channels.keys()));
  }

  /**
   * leave - позволяет отписаться от одного или нескольких каналов.
   *
   * @param  { string[] } channelNames - имя канала(ов).
   */
  leave(...channelNames: string[]): void {
    forEach(
      (name: string) => {
        const connection = this.channels.get(name);

        if (connection) connection.channel.leave().receive('ok', () => this.channels.delete(name));
      },
      channelNames,
    );
  }

  /**
   * channelListening - собираем все добавленные каналы и
   *                            вешаем на них прослушивателя и обработчик.
   */
  private channelListening(): void {
    forEach((channel: string) => {
      this.channelJoin(channel);
      this.channelOn(channel);
    }, Array.from(this.channels.keys()));
  }

  /**
   * channelJoin - находим существующий канал. Если его нет,
   *                       то добавляем в мапу channels и вызываем его метод join.
   *
   * @param  { string } channelName - имя канала.
   */
  private channelJoin(channelName: string): void {
    const connection = this.channels.get(channelName);

    if (!connection.channel) {
      const channel = this.socket.channel(channelName);

      this.channels.set(channelName, { channel, events: connection.events });

      channel.join()
        .receive('ok', () => this.status = 'online')
        .receive('error', () => this.status = 'offline')
        /* tslint:disable-next-line */
        .receive('timeout', () => console.log('Networking issue. Still waiting...'));
    }
  }

  /**
   * channelOn - начинаем слушать сообщения от каналов и диспатчим их.
   *
   * @param  { string } channelName - имя канала
   *
   * События диспатчатся по имени эвента сокетов с префиксом в виде имени канала,
   * но в camelCase. То есть, если мы вызываем this.ws.join('base', ['change_balance']),
   * то в моделе фичи нужно слушать диспатч по событию base:changeBalance.
   * @example
   * @Effect()
   * someHandler(events$) {
   *   return events$.pipe(
   *     ofType('base:changeBalance'),
   *   ...
   * )}
   */
  private channelOn(channelName: string): void {
    const connection = this.channels.get(channelName);

    forEach(
      (event: string) => {
        connection.channel.on(event, payload =>
          appDispatcher.dispatch(`${camelCase(channelName)}:${camelCase(event)}`, payload),
        );
      },
      connection.events,
    );
  }

  private channelPing(): void {
    forEach((val: any) => {
      val.channel.push('ping');
    }, Array.from(this.channels.values()));
  }
}
