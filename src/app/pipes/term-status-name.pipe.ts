import { Pipe, PipeTransform } from '@angular/core';
import { VipTerm } from '../models/vip';

@Pipe({ name: 'termStatusName' })
export class TermStatusNamePipe implements PipeTransform {
  transform(status: VipTerm['status']): string {
    if (status === 'N') {
      return '未使用';
    }
    if (status === 'C') {
      return `在用`;
    }
    if (status === 'E') {
      return `过期`;
    }
    return '';
  }
}
