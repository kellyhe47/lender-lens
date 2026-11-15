import { describe, expect, it } from 'vitest';
import { caretAfterFormatting, formatAmountText } from '../src/amountInput';

describe('formatAmountText', () => {
  it('adds thousands separators', () => {
    expect(formatAmountText('500')).toBe('500');
    expect(formatAmountText('12000')).toBe('12,000');
    expect(formatAmountText('1234567')).toBe('1,234,567');
  });

  it('regroups text whose commas are in the wrong place', () => {
    // What the field holds after typing three more zeros onto "10,000".
    expect(formatAmountText('10,000000')).toBe('10,000,000');
    expect(formatAmountText('1,2,0,0,0')).toBe('12,000');
  });

  it('keeps the decimal point and what follows, including a point just typed', () => {
    expect(formatAmountText('12000.5')).toBe('12,000.5');
    expect(formatAmountText('12000.50')).toBe('12,000.50');
    expect(formatAmountText('12000.')).toBe('12,000.');
    expect(formatAmountText('.5')).toBe('.5');
  });

  it('keeps at most two digits after the decimal point', () => {
    expect(formatAmountText('100.999')).toBe('100.99');
    expect(formatAmountText('10000000.59912000')).toBe('10,000,000.59');
  });

  it('drops everything that is not a digit or the first decimal point', () => {
    expect(formatAmountText('$12,000')).toBe('12,000');
    expect(formatAmountText('12 000')).toBe('12,000');
    expect(formatAmountText('abc')).toBe('');
    expect(formatAmountText('-5')).toBe('5');
    expect(formatAmountText('1.2.3')).toBe('1.23');
  });

  it('drops leading zeros and does not round very long numbers', () => {
    expect(formatAmountText('012000')).toBe('12,000');
    expect(formatAmountText('0')).toBe('0');
    expect(formatAmountText('12345678901234567890')).toBe('12,345,678,901,234,567,890');
  });

  it('returns empty text for empty input', () => {
    expect(formatAmountText('')).toBe('');
  });
});

describe('caretAfterFormatting', () => {
  it('stays at the end when typing at the end', () => {
    // "1,000" + "0" typed at the end -> "10,000"
    expect(caretAfterFormatting('1,0000', '10,000')).toBe(6);
  });

  it('stays after the digit just typed in the middle', () => {
    // "1|,000" with "2" typed -> "12|,000"
    expect(caretAfterFormatting('12', '12,000')).toBe(2);
    // "12,0|00" with "5" typed -> "120,5|00"
    expect(caretAfterFormatting('12,05', '120,500')).toBe(5);
  });

  it('stays after the same digit when a comma disappears', () => {
    // "1,234|" with Backspace -> "123|"
    expect(caretAfterFormatting('1,23', '123')).toBe(3);
    // "1,2|34" with Backspace -> "1|34"
    expect(caretAfterFormatting('1,', '134')).toBe(1);
  });

  it('steps over a comma that Backspace tried to delete', () => {
    // "12,|000" with Backspace removes the comma; formatting puts it back -> "12|,000"
    expect(caretAfterFormatting('12', '12,000')).toBe(2);
  });

  it('counts the decimal point like a digit', () => {
    // "12000.5|" -> "12,000.5|"
    expect(caretAfterFormatting('12000.5', '12,000.5')).toBe(8);
    expect(caretAfterFormatting('12000.', '12,000.50')).toBe(7);
  });

  it('is at the start when nothing was typed before the caret', () => {
    expect(caretAfterFormatting('', '12,000')).toBe(0);
  });
});
