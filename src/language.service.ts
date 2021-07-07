import { Injectable, OnDestroy } from '@angular/core';
import { NgRedux, ObservableStore } from '@angular-redux/store';
// import {languageReducer} from '../../stores/language/language.store';
// import {CHANGE} from '../../stores/language/language.actions';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject, timer } from 'rxjs';
import { DictionaryModel, IDictionaryLanguages } from './dictionary.model';
import { HttpClient } from '@angular/common/http';
import { environment } from "./environments/environment";


interface DictionaryLanguages {
  RU: any;
  EN: any;
}

@Injectable()
export class LanguageService implements OnDestroy {
  destroy$ = new Subject();
  private changer$ = new Subject();
  getWords: DictionaryLanguages = {
    RU: [],
    EN: [],
  };

  // languageStore: ObservableStore<any> = this.ngRedux.configureSubStore(
  //   ['language', 'words', 'getWords'],
  //   languageReducer
  // );
  langArr = localStorage.getItem('language')
    ? JSON.parse(localStorage.getItem('language'), (key, value) => {
      if (key === 'dictionary') {
        return new DictionaryModel(value);
      }
      return value;
    })
    : null;
  dictionary: IDictionaryLanguages = this.langArr ? this.langArr.dictionary : new DictionaryModel();
  translatePounds: number[] = sessionStorage.getItem('translatePounds')
    ? JSON.parse(sessionStorage.getItem('translatePounds'))
    : [];

  language = this.langArr ? this.langArr.language : 'RU';
  public word = new Proxy(this.dictionary, {
    get: (target, name: string) => {
      target = this.dictionary[this.language];
      if (target[name] === undefined || target[name] === name) {
        if (!this.getWords[this.language].includes(name)) {
          this.getWords[this.language].push(name);
          this.getWordsRequest();
        }
        return name;
      } else {
        return target[name];
      }
    },
    set: (target, name, value) => {
      if (!(name in target)) {
      }
      target[name] = value;
      return true;
    },
  });
  change$ = new Subject();

  changeLanguage$ = new Subject();

  constructor(public ngRedux: NgRedux<any>, private http: HttpClient) {
  }

  /**
   * Получение ключей, значения которых содержат word
   * @param word
   */

  getDictionaryKeys(word: string) {
    return Object.keys(this.dictionary[this.language]).filter((el) =>
      this.dictionary[this.language][el].toLowerCase().includes(word.toLowerCase())
    );
  }

  getWordsRequest() {
    this.destroy$.next();
    timer(500)
      .pipe(takeUntil(this.destroy$))
      .subscribe((e) => {
        this.initLanguage();
      });
  }

  initLanguage(type?, language$?: string) {
    if (this.getWords[this.language].length === 0 && !language$ && type !== 'change') {
      return;
    }
    if (language$ && this.getWords[language$].length === 0) {
      return;
    }
    // if (type === 'change') {
    //   this.languageStore.dispatch({ type: CHANGE });
    // }
    if (type === 'change' && this.getWords[this.language].length === 0) {
      this.rerender([], type);
    } else {
      const jsonTranslate = JSON.stringify(this.getWords);
      const translatePound: number = this.string2Bin(jsonTranslate);

      if (this.translatePounds.includes(translatePound)) {
        this.getWords = {
          RU: [],
          EN: [],
        };
        return null;
      }

      this.translatePounds.push(translatePound);

      sessionStorage.setItem('translatePounds', JSON.stringify(this.translatePounds));
      const dataSend = new FormData();
      dataSend.append('language', this.language);
      dataSend.append('words', jsonTranslate);
      this.getWordsLang(dataSend).subscribe((data) => {
        this.rerender(data, type);
      });
    }
  }

  rerender(data: any, type?: string): void {
    for (const i in data) {
      if (data[i]) {
        this.dictionary[i] = {...this.dictionary[i], ...data[i]};
      }
    }
    this.getWords = {
      RU: [],
      EN: [],
    };
    localStorage.setItem(
      'language',
      JSON.stringify({
        dictionary: this.dictionary,
        language: this.language,
      })
    );
    // if (type !== 'check') {
    //   this.languageStore.dispatch({ type: CHANGE });
    // }
    this.change$.next();
  }

  changeLanguage(lang) {
    console.log(lang);
    this.changer$.next();
    const oldLang = this.language;
    if (lang === this.language) {
      return;
    }
    this.language = lang;
    if (localStorage.getItem('language')) {
      const el = JSON.parse(localStorage.getItem('language'));
      el.language = this.language;
      localStorage.setItem('language', JSON.stringify(el));
      this.dictionary = JSON.parse(localStorage.getItem('language')).dictionary;
    }
    for (const word in this.dictionary[oldLang]) {
      if (!this.dictionary[this.language].hasOwnProperty(word)) {
        this.getWords[this.language].push(word);
      }
    }
    this.http
      .put(environment.newApi + '/user/changeLocale', {code: lang})
      .pipe(takeUntil(this.changer$))
      .subscribe((r) => {
        this.changeLanguage$.next();
        this.initLanguage('change');
      });
  }

  string2Bin(str: string): number {
    let result = 0;
    for (let i = 0; i < str.length; i++) {
      result += str.charCodeAt(i) * i;
    }
    return result;
  }

  checkWords() {
    this.initLanguage('check');
  }

  locale(key: string, languages: string[], separator = '/'): string {
    let res = '';
    for (const i in languages) {
      if (i !== '0') {
        res += ` ${separator} `;
      }
      languages[i] = languages[i].toUpperCase();
      if (!this.dictionary[languages[i]][key]) {
        if (!~this.getWords[languages[i]].indexOf(key)) {
          this.getWords[languages[i]].push(key);
          this.getWordsRequest();
          res += key;
        }
      } else {
        res += this.dictionary[languages[i]][key];
      }
    }
    return res;
  }

  localeChange() {
    this.initLanguage('check', 'EN');
  }

  refreshDictionary() {
    localStorage.removeItem('language');
    this.dictionary = {
      RU: {},
      EN: {},
    };
  }

  getWordsLang(cfg): Observable<any> {
    return this.http.post(environment.apiUrl + 'get=Words', cfg);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.changer$.next();
    this.changer$.complete();
    this.destroy$.complete();
  }
}
