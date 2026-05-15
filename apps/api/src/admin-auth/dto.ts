export type AdminLoginRequest = {
  email: string;
  password: string;
};

export type AdminLoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export type AdminRefreshRequest = {
  refreshToken: string;
};

