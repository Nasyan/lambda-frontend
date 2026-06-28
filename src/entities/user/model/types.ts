export type UserRole = "USER" | "CREATOR" | "ADMIN";

export interface UiKitItem {
  uuid: string;
  type: string;
  subtype: string;
  position: { x: number; y: number };
}

export interface UserProfile {
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
  instance_id: string;
  permissions: {
    allowed_tools: string[];
  };
  // Добавляем структуру настроек, соответствующую бэкенду
  settings: {
    god_mode: boolean;
    language: string;
    ui_kits?: {
      favorites: UiKitItem[];
    };
  };
}

export interface TeamMember {
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
  allowed_tools?: string[];
  is_current_user?: boolean; // <-- Добавляем этот флаг
}

export interface SettingsContextResponse {
  profile: UserProfile;
  team: TeamMember[];
  // С верхнего уровня ui_kits убираем, так как они лежат в profile.settings
}
