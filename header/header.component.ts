import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { fire, State, StreamProp, StateProp } from '@vision/rx';
import { equals, complement } from 'ramda';
import { headerInited, HeaderSlot } from '../const';

@Component({
  selector: 'app-header',
  templateUrl: './header.tpl.pug',
  styleUrls: ['./header.style.scss'],
})
export class HeaderComponent implements OnInit {
  state: State<{ slots: any }> = new State({
    slots: {},
  });

  @StateProp() slots: any;
  @StreamProp() slots$: Observable<any>;

  ngOnInit(): void {
    fire(headerInited, this);
  }

  addComponent(slot: HeaderSlot, component: any) {
    this.state.patch({
      slots: {
        ...this.state.get('slots'),
        ...{
          [slot]: this.getItem(slot, component),
        },
      },
    });
  }

  removeComponent(slot: HeaderSlot, component: any) {
    this.state.patch({
      slots: {
        ...this.state.get('slots'),
        ...{
          [slot]: this.removeItem(slot, component),
        },
      },
    });
  }

  resetSlot(slot: HeaderSlot) {
    this.state.patch({
      slots: {
        ...this.state.get('slots'),
        ...{
          [slot]: [],
        },
      },
    });
  }

  reset() {
    this.state.reset();
  }

  private getItem(slot: HeaderSlot, component: any) {
    const slots = this.state.get('slots');
    return slots[slot] ? slots[slot].concat(component) : [component];
  }

  private removeItem(slot: HeaderSlot, component: any) {
    const slots = this.state.get('slots');
    return slots[slot] ? slots[slot].filter(complement(equals(component))) : slots[slot];
  }
}
