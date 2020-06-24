import { UserService } from '../../../src/modules/user/user.service';
import { UserRepository } from '../../../src/modules/user/user.repository';
import { User } from '../../../src/modules/user/user.entity';

describe('UserController', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userService = new UserService(userRepository);
  });

  describe('users', () => {
    it('should return created user', async () => {
      const createUserResult = {
        guid: 'df671c88-64be-4fb6-baa9-5251482615c2',
        email: 'teste@tester.com',
      };
      jest
        .spyOn(userService, 'create')
        .mockImplementation(() => Promise.resolve(createUserResult));
    });
  });

  describe('users/create-avatar', () => {
    it('should return a image url', async () => {
      const imageResult = {
        url:
          'https://artio-user-avatar.s3-us-west-1.amazonaws.com/83563347-1761-456e-a9ea-e090f02ebc87',
      };
      jest
        .spyOn(userService, 'createAvatar')
        .mockImplementation(() => Promise.resolve(imageResult));
    });
  });

  // needs a refactor error on types
  // describe('/:id', () => {
  //   it('should return a updated user', async () => {
  //     const updateUserResult: UpdateResult = undefined;
  //     jest
  //       .spyOn(userService, 'updateUserInfo')
  //       .mockImplementation(() => Promise.resolve(updateUserResult));
  //   });
  // });

  describe('users/:guid', () => {
    it('should return a user finded by guid', async () => {
      const userResult: Partial<User> = {
        id: 1,
        firstName: 'Teste',
        lastName: 'Teste',
        email: 'teste@tester.com',
        avatarImgUrl:
          'https://img.ibxk.com.br/2019/07/26/26000403908396.jpg?w=328',
        bio: 'a neat bio',
        phoneNumber: '+5512991650936',
        gender: 1,
        company: 'testecompany',
        currentPosition: 'testPosition',
        twitterUrl: null,
        instagramUrl: null,
        linkedinUrl: null,
        facebookUrl: null,
        isNew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(userService, 'findOne')
        .mockImplementation(() => Promise.resolve(userResult));
    });
  });

  describe('/checkUserExists', () => {
    it('should return a boolean indicating if a user already exists', async () => {
      const checkResult = true;
      jest
        .spyOn(userService, 'exists')
        .mockImplementation(() => Promise.resolve(checkResult));
    });
  });
});
