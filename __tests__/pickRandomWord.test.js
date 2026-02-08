const { pickRandomWord, WORD_BANK } = require('../script');

describe('pickRandomWord', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns first word when Math.random() returns 0', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(pickRandomWord()).toBe(WORD_BANK[0]);
  });

  test('returns last word when Math.random() is just below 1', () => {
    // return value that makes floor(random*len) be len-1
    const len = WORD_BANK.length;
    const mockVal = (len - 0.0001) / len; // slightly less than 1
    jest.spyOn(Math, 'random').mockReturnValue(mockVal);
    expect(pickRandomWord()).toBe(WORD_BANK[len - 1]);
  });

  test('distribution: every index possible given specific random values', () => {
    const len = WORD_BANK.length;
    for (let i = 0; i < len; i++) {
      const val = (i + 0.5) / len; // picks index i
      jest.spyOn(Math, 'random').mockReturnValue(val);
      expect(pickRandomWord()).toBe(WORD_BANK[i]);
      jest.restoreAllMocks();
    }
  });
});
