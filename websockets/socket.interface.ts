export interface WsConfig {
  url: string;
  interval: number;
  count: number;
}

export interface PushConfig {
  channelName: string;
  event: string;
  params: any;
}
