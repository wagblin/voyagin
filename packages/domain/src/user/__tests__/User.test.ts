import { User } from '../User';
import { Email } from '../Email';
import { InvalidUserNameError } from '../errors';

describe('User', () => {
  const baseProps = {
    email: Email.create('alex@voyagin.app'),
    name: 'Alex',
    hashedPassword: 'hashed:s3cret123',
  };

  describe('create', () => {
    it('creates a user with a generated id', () => {
      const user = User.create(baseProps);
      expect(user.id.toString()).not.toHaveLength(0);
      expect(user.getName()).toBe('Alex');
      expect(user.getEmail().equals(baseProps.email)).toBe(true);
      expect(user.getHashedPassword()).toBe('hashed:s3cret123');
    });

    it('assigns a different id to every new user', () => {
      const a = User.create(baseProps);
      const b = User.create(baseProps);
      expect(a.id.equals(b.id)).toBe(false);
    });

    it('rejects an empty name', () => {
      expect(() => User.create({ ...baseProps, name: '   ' })).toThrow(InvalidUserNameError);
    });

    it('trims surrounding whitespace from the name', () => {
      const user = User.create({ ...baseProps, name: '  Alex  ' });
      expect(user.getName()).toBe('Alex');
    });
  });

  describe('reconstitute', () => {
    it('rebuilds a user from previously persisted data without re-validating invariants', () => {
      const user = User.reconstitute({
        id: 'user-123',
        email: baseProps.email,
        name: 'Alex',
        hashedPassword: 'hashed:s3cret123',
      });

      expect(user.id.toString()).toBe('user-123');
      expect(user.getName()).toBe('Alex');
      expect(user.getEmail().equals(baseProps.email)).toBe(true);
      expect(user.getHashedPassword()).toBe('hashed:s3cret123');
    });
  });

  describe('rename', () => {
    it('changes the user name', () => {
      const user = User.create(baseProps);
      user.rename('Alexandra');
      expect(user.getName()).toBe('Alexandra');
    });

    it('rejects renaming to an empty name', () => {
      const user = User.create(baseProps);
      expect(() => user.rename('   ')).toThrow(InvalidUserNameError);
    });
  });

  describe('changeEmail', () => {
    it('changes the user email', () => {
      const user = User.create(baseProps);
      const newEmail = Email.create('alexandra@voyagin.app');
      user.changeEmail(newEmail);
      expect(user.getEmail().equals(newEmail)).toBe(true);
    });
  });
});
