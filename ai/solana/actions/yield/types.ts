export type GlobalYieldsSchemaType = typeof import('./input-schema').GlobalYieldsInputSchema;

export type GlobalYieldsArgumentsType = import('zod').z.infer<GlobalYieldsSchemaType>;

export type {
  GlobalYieldsResultBodyType,
  GlobalYieldsResultType,
  GlobalYieldsPoolData,
} from './schema';
