import CreateBaseException from '../base/create.base.exception';

export class CreateValidationUserException extends CreateBaseException {
  private metadata: { UQ_user_email: string; UQ_user_guid: string };

  constructor() {
    super();
    this.metadata = {
      UQ_user_guid: 'the given user id already exists',
      UQ_user_email: 'the given user email already exists',
    };
  }

  check(error: any) {
    return super.verify(error, this.metadata[error.constraint]);
  }
}

export default new CreateValidationUserException();
