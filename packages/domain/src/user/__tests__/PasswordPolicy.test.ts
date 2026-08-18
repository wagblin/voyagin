import { PasswordPolicy } from '../PasswordPolicy';
import { WeakPasswordError } from '../errors';

describe('PasswordPolicy', () => {
  it('accepts a password of at least 8 characters', () => {
    expect(() => PasswordPolicy.validate('s3cret123')).not.toThrow();
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(() => PasswordPolicy.validate('short1')).toThrow(WeakPasswordError);
  });

  it('accepts a password of exactly 8 characters', () => {
    expect(() => PasswordPolicy.validate('12345678')).not.toThrow();
  });
});
