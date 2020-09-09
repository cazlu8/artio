import * as Factory from 'factory.ts';
import CreateRoleDTO from '../../../src/modules/role/dto/role.create.dto';

const createRoleDtoFactory = Factory.Sync.makeFactory<CreateRoleDTO>({
  name: Factory.each(i => i + 1),
});

const createRoleErrorDtoFactory = Factory.Sync.makeFactory({
  name: '',
});

const saveRoles = (mount = 2) => createRoleDtoFactory.buildList(mount);
const saveRole = (properties = {}) => createRoleDtoFactory.build(properties);
const saveRoleError = createRoleErrorDtoFactory.build();

export { saveRole, saveRoles, saveRoleError };
