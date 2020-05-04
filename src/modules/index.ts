import { DynamicModule } from '@nestjs/common';
import loader from '../shared/utils/loader';

export function loadModules(pathDir: string = __dirname): DynamicModule[] {
  return loader(pathDir, 'module');
}

