import type { BaseEntity } from './common.types';

export interface Room extends BaseEntity {
  name: string;
  type: string;
  isHomeroom?: boolean;
} 