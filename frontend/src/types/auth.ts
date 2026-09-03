export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
};

export type AuthResponse = {
  message: string;
  user: User;
};
