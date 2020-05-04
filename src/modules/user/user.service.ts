import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { User } from './user.entity';
import { LoggerService } from '../../shared/services/logger.service';
import { CreateUserDto } from './dto/user.create.dto';
import { UpdateUserDto } from './dto/user.update.dto';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly loggerService: LoggerService,
  ) {}

  findOne(guid: string): Promise<User | void> {
    return this.repository.findOneOrFail({ guid }).catch(error => {
      if (error.name === 'EntityNotFound')
        throw new UnprocessableEntityException();
      throw new InternalServerErrorException(error);
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.repository.update(id, updateUserDto);
  }

  getUserGuid(id) {
    return this.repository.findOne({ select: ['guid'], where: { id } });
  }

  exists(key: string, value: any): Promise<number> {
    return this.repository.count({ [key]: value });
  }

  create(createUserDto: CreateUserDto): Promise<void | ObjectLiteral> {
    this.loggerService.log('saving the user');
    return this.repository
      .save(createUserDto)
      .catch(err => validateEntityUserException.check(err));
  }
}
