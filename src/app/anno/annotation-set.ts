import {AnnotationGroup} from '../models/annotation-group';
import {Annotation} from '../models/annotation';


export class AnnotationSet {

  readonly groups: AnnotationGroup[];

  readonly annotationsMap: Map<string, Annotation> = new Map();

  readonly wordMeaningAnnotation;


  constructor(groups: AnnotationGroup[]) {
    this.groups = groups.map(og => {
      let ag = new AnnotationGroup();
      Object.assign(ag, og);
      return ag;
    });

    for (let group of groups) {
      group.annotations = group.annotations.map(oa => {
        let ann = new Annotation();
        Object.assign(ann, oa);
        return ann;
      });

      for (let ann of group.annotations) {
        ann.group = group;
        if (ann.dataName && ann.dataValue) {
          let annKey = `${ann.dataName}.${ann.dataValue}`;
          this.annotationsMap.set(annKey, ann);
        }
      }
    }

    let wma = new Annotation();
    wma.name = '查词';
    wma.nameEn = 'LookupDict';
    let groupWm = new AnnotationGroup();
    groupWm.dataName = 'mid';
    wma.group = groupWm;
    this.wordMeaningAnnotation = wma;
  }


  /*  findAnnotation(dataName: string, dataValue: string): Annotation {
      let annKey = `${dataName}.${dataValue}`;
      return this.annotationsMap.get(annKey);
    }*/

  annotationOutput(dataName: string, dataValue: string) {
    if (dataName === 'phra' && /^g\d$/.test(dataValue)) {
      return '词组';
    }
    // if (dataName === 'clau') {
    //   if (dataValue === 'cc' || dataValue === 'cr') {
    //     return null;
    //   }
    // }
    let annKey = `${dataName}.${dataValue}`;
    let ann = this.annotationsMap.get(annKey);
    if (!ann) {
      return null;
    }
    return ann.name;
  }
}


export class HighlightGroups {

  private static group(attr, values) {
    return values.map(v => `[data-${attr}=${v}]`).join(', ');
  }

  static groupSelectors: string[] = [
    '[data-phra=g1]',
    '[data-phra=g2]',
    '[data-phra=g3]',
    HighlightGroups.group('clau', ['cc', 'cr']),
    HighlightGroups.group('memb', ['ms', 'mp', 'mo'])
  ];

  static highlightAnnotationSelectors = HighlightGroups.groupSelectors.join(', ');

  static matchGroup(element): string {
    for (let selector of HighlightGroups.groupSelectors) {
      if (element.matches(selector)) {
        return selector;
      }
    }
    return null;
  }

}
