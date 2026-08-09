export type LoginCredentials = {
  savanhiId: string;
  password: string;
};

export type LoginValidationErrors = Partial<Record<keyof LoginCredentials, string>>;
