import * as Factory from 'factory.ts';
import CreateRoleDTO from '../../../src/modules/role/dto/role.create.dto';

const createRoleDtoFactory = Factory.Sync.makeFactory<CreateRoleDTO>({
  name: 1,
});

const createRoleErrorDtoFactory = Factory.Sync.makeFactory({
  name: '',
});

const saveRole = createRoleDtoFactory.build();
const saveRoleError = createRoleErrorDtoFactory.build();

export { saveRole, saveRoleError };
