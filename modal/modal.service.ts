import {
  Injectable,
  ComponentFactoryResolver, ApplicationRef, ViewContainerRef, ComponentRef,
} from '@angular/core';

import { ModalController } from './modal.controller';

import { ModalConfig } from './modal.interface';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  instance: ModalController;
  componentRef: ComponentRef<ModalController>;

  private rootEl: ViewContainerRef;

  constructor(private cfr: ComponentFactoryResolver, private appRef: ApplicationRef) { }

  /**
   * @example
   * // Созднание модального окна
   * this.ModalService.open(
   *   title: I18n.t('path.from.yml'),
   *   size: 'md',
   *   content: SomeModalComponent || 'string',
   *   data: 'some data',
   * });
   * @return { Instance } возвращает экземпляр класса модального окна.
   */
  open(config: ModalConfig): ModalController {
    this.rootEl = this.appRef.components[0].instance.viewContainerRef;

    const componentFactory = this.cfr.resolveComponentFactory(ModalController);
    this.componentRef = this.rootEl.createComponent(componentFactory);
    this.componentRef.hostView.detach();
    this.instance = this.componentRef.instance as ModalController;

    this.instance.config = config;

    setTimeout(() => this.componentRef.hostView.reattach());

    this.instance.result
      .then(() => this.remove())
      .catch(() => this.remove());

    return this.instance;
  }

  /**
   * remove - удаляет из DOM экземпляр класса модального окна.
   */
  remove(): void {
    this.rootEl.clear();
    this.componentRef.destroy();
  }

  close() {
    this.instance.close();
  }

  dismiss() {
    this.instance.dismiss();
  }
}
