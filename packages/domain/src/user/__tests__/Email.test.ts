import { Email } from '../Email';
import { InvalidEmailError } from '../errors';

describe('Email', () => {
  it('creates an email from a plausible address', () => {
    const email = Email.create('alex@voyagin.app');
    expect(email.toString()).toBe('alex@voyagin.app');
  });

  it('rejects an address without an @', () => {
    expect(() => Email.create('alex-voyagin.app')).toThrow(InvalidEmailError);
  });

  it('rejects an address without a domain', () => {
    expect(() => Email.create('alex@')).toThrow(InvalidEmailError);
  });

  it('rejects an address without a local part', () => {
    expect(() => Email.create('@voyagin.app')).toThrow(InvalidEmailError);
  });

  it('rejects an address containing whitespace', () => {
    expect(() => Email.create('alex @voyagin.app')).toThrow(InvalidEmailError);
  });

  it('considers two emails equal when their underlying value matches', () => {
    const a = Email.create('alex@voyagin.app');
    const b = Email.create('alex@voyagin.app');
    expect(a.equals(b)).toBe(true);
  });

  it('considers two emails different when their underlying value differs', () => {
    const a = Email.create('alex@voyagin.app');
    const b = Email.create('sam@voyagin.app');
    expect(a.equals(b)).toBe(false);
  });
});
