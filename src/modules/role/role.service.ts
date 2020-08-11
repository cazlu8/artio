import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { Role } from './role.entity';
import { RoleRepository } from './role.repository';
import CreateRoleDTO from './dto/role.create.dto';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import { LoggerService } from '../../shared/services/logger.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly repository: RoleRepository,
    private readonly loggerService: LoggerService,
  ) {}

  create(createRoleDTO: CreateRoleDTO): Promise<void | ObjectLiteral> {
    return this.repository
      .save(createRoleDTO)
      .then(role => this.loggerService.info(`Role ${role.name} Created`))
      .catch(err => validateEntityUserException.check(err));
  }

  getRole(id: number): Promise<Partial<Role> | void> {
    return this.repository.findOneOrFail({ id }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
      throw new InternalServerErrorException(error);
    });
  }

  getRoles(): Promise<Partial<Role[]> | void> {
    return this.repository.find().catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
      throw new InternalServerErrorException(error);
    });
  }
}
