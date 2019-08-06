import { compose, isEmpty, not, propEq, prop, head } from 'ramda';

export const notIsEmpty = compose(not, isEmpty);

export const isOpen = propEq('status', 'open');

export const timestamp = (item: string) => new Date(item).getTime();

export const errorCode = compose(prop('validation'), head, prop('reasons'));
