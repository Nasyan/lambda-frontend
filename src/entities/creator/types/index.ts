// Creator entity — matches backend CreatorResponse (admin_api list/get/deactivate).
// Shape mirrors UserRead/UsersList in users/schemas.py; align if CreatorResponse diverges.
export type Creator = {
  uuid: string;
  email: string;
  name: string | null;
  active: boolean;
};
