interface ILanguage {
  [prop: string]: string;
}

export interface IDictionaryLanguages {
  RU: ILanguage;
  EN: ILanguage;
}

export class DictionaryModel implements IDictionaryLanguages {
  RU = {};
  EN = {};

  constructor(cfg = {}) {
    Object.keys(cfg).forEach((prop) => {
      if (this.hasOwnProperty(prop)) {
        this[prop] = cfg[prop];
        this.checkDictionary(prop);
      }
    });
  }
  checkDictionary(prop) {
    const regular1 = /\W/;
    const regular2 = /[a-z]+/;
    // TODO убрана проверка по regular2, т.к. используются ключи типа 'DIAMETER, MM'
    Object.keys(this[prop]).forEach((elem) => {
      // if ((regular1.test(elem) || regular2.test(elem))) {
      if (regular1.test(elem)) {
        delete this[prop][elem];
      }
    });
  }
}
