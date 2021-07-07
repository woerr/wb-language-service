import {TestBed} from '@angular/core/testing';
import {DictionaryModel, IDictionaryLanguages} from './dictionary.model';
import {LanguageService} from './language.service';
import {NgRedux} from '@angular-redux/store';
import {HttpClientModule} from '@angular/common/http';

describe('LanguageService', () => {
  const dictionaryEntry: IDictionaryLanguages = {
    EN: {
      TEST_VAL: 'one two three',
      TEST_VAL2: 'two three four',
      TestValue: 'three',
      тест_TEsT: 'four',
    },
    RU: {
      TEST_VAL: 'один два три',
      TEST_VAL2: 'два три четыре',
      TestValue: 'три',
      тест: 'четыре',
    },
  };
  const dictionaryRight: IDictionaryLanguages = {
    EN: {
      TEST_VAL: 'one two three',
      TEST_VAL2: 'two three four',
    },
    RU: {
      TEST_VAL: 'один два три',
      TEST_VAL2: 'два три четыре',
    },
  };
  const obj = {
    dictionary: dictionaryEntry,
    language: 'RU',
  };
  localStorage.setItem('language', JSON.stringify(obj));

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        LanguageService,
        { provide: NgRedux, useValue: jasmine.createSpyObj('NgRedux', ['configureSubStore']) },
      ],
    })
  );

  it('Получение массива с данными по переводам', () => {
    const service: LanguageService = TestBed.get(LanguageService);
    expect(service.langArr).toEqual({
      dictionary: new DictionaryModel(dictionaryEntry),
      language: 'RU',
    });
  });

  // TODO убрана проверка по regular2, т.к. используются ключи типа 'DIAMETER, MM'
  xit('Фильтрация словаря при создании модели', () => {
    expect(new DictionaryModel(dictionaryEntry)).toEqual(new DictionaryModel(dictionaryRight));
  });
  it('Получение ключей, по подстроке значений', () => {
    const service: LanguageService = TestBed.get(LanguageService);
    service.dictionary = dictionaryRight;
    service.language = 'RU';
    expect(service.getDictionaryKeys('два')).toEqual(['TEST_VAL', 'TEST_VAL2']);
    expect(service.getDictionaryKeys('один')).toEqual(['TEST_VAL']);
    service.language = 'EN';
    expect(service.getDictionaryKeys('two')).toEqual(['TEST_VAL', 'TEST_VAL2']);
    expect(service.getDictionaryKeys('one')).toEqual(['TEST_VAL']);
  });
});
