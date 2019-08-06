import {
  Component,
  ViewChild, ElementRef, ViewContainerRef,
  ComponentFactoryResolver, ChangeDetectorRef,
} from '@angular/core';

import { Subject, Observable } from 'rxjs';
import { isNil } from 'ramda';

import { State, StateProp, StreamProp } from '@vision/rx';

import { ModalConfig, Modal } from './modal.interface';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.tpl.pug',
})
export class ModalController {
  state: State<{ opened: boolean }> = new State({ opened: false });

  @StateProp() opened: boolean;
  @StreamProp() opened$: Observable<boolean>;

  @ViewChild('modal', { read: ElementRef, static: true }) modal: ElementRef;
  @ViewChild('contentRef', { read: ViewContainerRef, static: true }) contentRef: ViewContainerRef;

  content: ModalConfig['content'] = '';
  title: ModalConfig['title'] = '';
  size: ModalConfig['size'] = 'xlg';
  isVisibleCloseBtn: ModalConfig['isVisibleCloseBtn'] = true;
  closeBackdrop: ModalConfig['closeBackdrop'] = true;

  result: Promise<any>;
  config: ModalConfig;

  // protected close: string;

  private event: Subject<any> = new Subject();

  constructor(private cfr: ComponentFactoryResolver, private changeDetection: ChangeDetectorRef) {
    this.result = this.event.toPromise();
  }

  initModal(): void {
    const { content, title, size, /*closeBackdrop,*/ isVisibleCloseBtn } = this.config;

    this.content = content;
    this.title = title;
    this.size = size;

    // if (closeBackdrop || isNil(closeBackdrop)) this.close = 'dismiss';

    if (!isNil(isVisibleCloseBtn)) this.isVisibleCloseBtn = isVisibleCloseBtn;

    if (typeof this.content !== 'string')
      this.createComponent();

    this.modal.nativeElement.open();
    this.opened = true;
    this.changeDetection.detectChanges();
  }

  onClosed(): void {
    this.opened = false;
    this.event.next('closed');
    this.event.complete();
  }

  onDismissed(): void {
    this.opened = false;
    this.event.error('dismissed');
  }

  backdropClose() {
    if (this.closeBackdrop) return;
    this.onDismissed();
  }

  close() {
    this.modal.nativeElement.close();
  }

  dismiss() {
    this.modal.nativeElement.dismiss();
  }

  private createComponent(): void {
    // @ts-ignore
    const componentFactory = this.cfr.resolveComponentFactory(this.content);
    const compRef = this.contentRef.createComponent(componentFactory);

    const instance = compRef.instance as Modal;
    const data = this.config.data;
    this.content = '';

    if (data !== undefined) instance.data = data;

    compRef.changeDetectorRef.detectChanges();
  }
}
