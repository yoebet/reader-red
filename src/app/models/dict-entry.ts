import { Model } from './model';

export class DictEntry extends Model {
  word: string;
  simple: SimpleMeaning[];
  // complete: [
  //   {
  //     pos: 'n.',
  //     items: [
  //       { id: 1, exp: '' },
  //       { id: 2, exp: '' }
  //       ]
  //   },
  //   {
  //     pos: 'v.',
  //     items: [
  //       { id: 3, exp: '' },
  //       { id: 4, exp: '' }
  //       ]
  //   }
  //   ]
  complete?: PosMeanings[] = [];
  categories: any = {};
  phonetics?: any;
  baseForm?: string;
  forms?: any;


  static POS = [
    { abbr: 'n.', name: 'n. 名词' },
    { abbr: 'v.', name: 'v. 动词' },
    { abbr: 'vt.', name: 'vt. 及物' },
    { abbr: 'vi.', name: 'vi. 不及物' },
    { abbr: 'adj.', name: 'adj. 形容词' },
    { abbr: 'adv.', name: 'adv. 副词' },
    { abbr: 'prep.', name: 'prep. 介词' },
    { abbr: 'pron.', name: 'pron. 代词' },
    { abbr: 'conj.', name: 'conj. 连词' },
    { abbr: 'int.', name: 'int. 感叹词' },
    { abbr: 'other', name: 'Other' },
  ];

}

export class SimpleMeaning {
  pos: string;
  exp: string;
}

export class PosMeanings {
  //Part Of Speech
  pos: string;
  items: MeaningItem[] = [];
}

export class MeaningItem {
  id: number;
  tags: string[];
  exp: string;
}


export const PosTags = {
  common: [
    { value: 'idiom', label: '习语' },
    { value: 'colloquial', label: '口语' },
    { value: 'figurative', label: '比喻' },
    { value: 'slang', label: '俚语' },
    { value: 'euphemism', label: '委婉' }
  ],
  'n.': [
    { value: 'individual', label: '个体' },
    { value: 'collective', label: '集体' },
    { value: 'material', label: '物质' },
    { value: 'abstract', label: '抽象' },
    { value: 'countable', label: '可数' },
    { value: 'uncountable', label: '不可数' },
    { value: 'singular', label: '单数' },
    { value: 'plural', label: '复数' },
    { value: 'gerund', label: '动名词' },
    { value: 'proper', label: '专有' }
  ],
  'v.': [
    { value: 'transitive', label: 'vt.' },
    { value: 'intransitive', label: 'vi.' },
    { value: 'ergative', label: 'vi.&vt.' },
    { value: 'link', label: '系动词' },
    { value: 'modal', label: '情态' },
    { value: 'ditransitive', label: '双宾' },
    { value: 'irregular', label: '不规则' },
    { value: 'instantaneous', label: '短暂' }
  ]
};

export const TagLabelMap = {};

for (let pos in PosTags) {
  if (!PosTags.hasOwnProperty(pos)) {
    continue;
  }
  let tags = PosTags[pos];
  if (tags) {
    for (let tag of tags) {
      TagLabelMap[tag.value] = tag.label;
    }
  }
}
