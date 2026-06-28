// src/widgets/profile-management/ui/ProfileSettings.tsx
import { UserProfile } from "@/src/entities/user/model/types";

interface Props {
  profile: UserProfile;
}

export const ProfileSettings = ({ profile }: Props) => (
  <div className="space-y-4">
    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
      Информация о профиле
    </h3>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-gray-500">Имя</p>
        <p className="font-medium text-gray-900">{profile.name}</p>
      </div>
      <div>
        <p className="text-gray-500">Email</p>
        <p className="font-medium text-gray-900">{profile.email}</p>
      </div>
      <div>
        <p className="text-gray-500">Роль</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
          {profile.role}
        </span>
      </div>
      <div>
        <p className="text-gray-500">ID Инстанса</p>
        <p className="font-mono text-xs text-gray-600 mt-1">
          {profile.instance_id}
        </p>
      </div>
    </div>
  </div>
);
