export interface ModalConfig {
  title?: string;
  content?: string | (new (...args: any[]) => any);
  size?: string;
  data?: any;
  closeBackdrop?: boolean;
  isVisibleCloseBtn?: boolean;
}

export interface Modal {
  data?: any;
}
