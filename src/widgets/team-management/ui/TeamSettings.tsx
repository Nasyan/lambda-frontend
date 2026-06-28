import { useState } from "react";
import { TeamMember } from "@/src/entities/user/model/types";

interface Props {
  team: TeamMember[];
  isCreator: boolean;
  onInvite?: (email: string) => Promise<void>;
  onPromote?: (uuid: string) => Promise<void>;
  onDemote?: (uuid: string) => Promise<void>;
  onUpdatePermissions?: (uuid: string, tools: string[]) => Promise<void>;
  onDeactivate?: (uuid: string) => Promise<void>;
}

export const TeamSettings = ({
  team,
  isCreator,
  onInvite,
  onPromote,
  onDemote,
  onUpdatePermissions,
  onDeactivate,
}: Props) => {
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim() && onInvite) {
      onInvite(inviteEmail.trim());
      setInviteEmail("");
    }
  };

  const promptToolsUpdate = (member: TeamMember) => {
    if (!onUpdatePermissions) return;
    const currentTools = member.allowed_tools?.join(", ") || "";
    const input = window.prompt(
      "Введите инструменты через запятую (например: crm, analytics, chat) или 'all' для полного доступа:",
      currentTools,
    );

    if (input !== null) {
      const parsedTools = input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      onUpdatePermissions(member.uuid, parsedTools);
    }
  };

  return (
    <div className="space-y-6">
      {/* Секция инвайта */}
      {isCreator && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пригласить нового сотрудника
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
          <button
            onClick={handleInviteSubmit}
            disabled={!inviteEmail}
            className="px-4 py-2 bg-gray-900 text-white font-medium rounded-md shadow-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            Отправить инвайт
          </button>
        </div>
      )}

      {/* Таблица команды */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-6">Имя / Email</th>
              <th className="py-3 px-6">Роль</th>
              {isCreator && <th className="py-3 px-6">Права (Инструменты)</th>}
              {isCreator && <th className="py-3 px-6 text-right">Действия</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {team.map((member) => (
              <tr
                key={member.uuid}
                className={`hover:bg-gray-50 transition-colors ${member.is_current_user ? "bg-gray-50/50" : ""}`}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    {/* Метка "Вы" для текущего пользователя */}
                    {member.is_current_user && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                        Вы
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500">{member.email}</p>
                </td>

                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === "CREATOR"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {member.role}
                  </span>
                </td>

                {isCreator && (
                  <td className="py-4 px-6">
                    <div className="flex gap-1 flex-wrap">
                      {member.allowed_tools?.length ? (
                        member.allowed_tools.map((tool) => (
                          <span
                            key={tool}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md border border-green-200"
                          >
                            {tool}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          Все инструменты (all)
                        </span>
                      )}
                    </div>
                  </td>
                )}

                {isCreator && (
                  <td className="py-4 px-6 text-right space-x-2">
                    {member.is_current_user ? (
                      /* Если это я сам — выводим серую заглушку вместо деструктивных кнопок */
                      <span className="text-xs text-gray-400 italic">
                        Управление недоступно
                      </span>
                    ) : (
                      /* Кнопки управления для других пользователей */
                      <>
                        {member.role === "USER" ? (
                          <button
                            onClick={() => onPromote?.(member.uuid)}
                            className="text-purple-600 hover:text-purple-900 text-xs font-medium"
                          >
                            Сделать Creator
                          </button>
                        ) : (
                          <button
                            onClick={() => onDemote?.(member.uuid)}
                            className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                          >
                            Сделать User
                          </button>
                        )}

                        <span className="text-gray-300">|</span>

                        <button
                          onClick={() => promptToolsUpdate(member)}
                          disabled={member.role === "CREATOR"}
                          className={`text-xs font-medium ${member.role === "CREATOR" ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-gray-900"}`}
                        >
                          Права
                        </button>

                        <span className="text-gray-300">|</span>

                        <button
                          onClick={() => onDeactivate?.(member.uuid)}
                          className="text-red-600 hover:text-red-900 text-xs font-medium"
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {team.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  В вашей команде пока никого нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
