export type Role = "owner" | "admin" | "manager" | "user" | (string & {});

export type User = {
  email: string;
  instance_id: string;
  name: string;
  role: Role;
};
