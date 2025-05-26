import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'termName' })
export class TermNamePipe implements PipeTransform {
  transform(termAndNum: ['M'|'Y'|'P', number|undefined]): string {
    const [term, num] = termAndNum;
    if (term === 'P') {
      return '永久';
    }
    if (term === 'Y') {
      return `${num}年`;
    }
    if (term === 'M') {
      return `${num}个月`;
    }
    return '';
  }
}
