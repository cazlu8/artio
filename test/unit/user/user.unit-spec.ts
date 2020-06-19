import { UserController } from '../../../src/modules/user/user.controller';
import { UserService } from '../../../src/modules/user/user.service';
import { UserRepository } from '../../../src/modules/user/user.repository';
import { User } from '../../../src/modules/user/user.entity';

describe('CatsController', () => {
  let userController: UserController;
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userService = new UserService(userRepository);
    userController = new UserController(userService);
  });

  describe('users/:guid', () => {
    it('should return a user', async () => {
      const result: Partial<User> = {
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
        .mockImplementation(() => Promise.resolve(result));

      expect(
        await userController.findOne('df671c88-64be-4fb6-baa9-5251482615c2'),
      ).toBe(result);
    });
  });
});
