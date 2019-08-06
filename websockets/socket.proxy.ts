import { Socket } from 'phoenix';

export class WebSocket extends Socket {
  constructor(url, config) {
    super(url, config);
  }

  endPointURL() {
    return (super.endPointURL() as string).replace('websocket', '');
  }
}
