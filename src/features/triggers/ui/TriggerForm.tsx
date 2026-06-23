import type { FormEvent } from "react";

import type { NotificationTemplate } from "@/src/entities/notification-template/model/types";
import { ACTION_NAMES, EVENT_TYPES, TRIGGER_TYPES } from "@/src/entities/trigger/model/types";
import type {
  ActionName,
  EventType,
  TriggerType,
} from "@/src/entities/trigger/model/types";
import type { TemplateResponse } from "@/src/entities/template/model/types";
import {
  isDmlActionName,
  isDmlInsertActionName,
  isDmlUpdateActionName,
  isDmlUpsertActionName,
  isNotificationActionName,
  isTelegramActionName,
  type TriggerFormDraft,
} from "@/src/features/triggers/model/trigger-form-state";
import { TriggerAstFields } from "@/src/features/triggers/ui/TriggerAstFields";

interface TriggerFormProps {
  mode: "create" | "edit";
  draft: TriggerFormDraft;
  templates: TemplateResponse[];
  notificationTemplates: NotificationTemplate[];
  saving: boolean;
  onChange: (draft: TriggerFormDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
}

const templateLabel = (template: TemplateResponse): string =>
  `${template.name} (${template.id})`;

export function TriggerForm({
  mode,
  draft,
  templates,
  notificationTemplates,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: TriggerFormProps) {
  const targetTemplate = templates.find(
    (template) => template.id === draft.targetTemplateUuid,
  );
  const targetFieldOptions = Object.keys(targetTemplate?.schema ?? {});
  const targetFieldListId = `trigger-target-fields-${mode}`;

  const updateDraft = <Key extends keyof TriggerFormDraft>(
    key: Key,
    value: TriggerFormDraft[Key],
  ) => {
    onChange({ ...draft, [key]: value });
  };

  const renderActionParams = () => {
    const actionName = draft.actionName;
    if (!actionName) {
      return null;
    }

    if (actionName === "test_action") {
      return (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            required_text
            <input
              type="text"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.testRequiredText}
              onChange={(event) =>
                updateDraft("testRequiredText", event.target.value)
              }
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            send_attempts
            <input
              type="number"
              min={1}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.testSendAttempts}
              onChange={(event) =>
                updateDraft("testSendAttempts", event.target.value)
              }
              required
            />
          </label>
        </div>
      );
    }

    if (isNotificationActionName(actionName)) {
      return (
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          notification_template_uuid
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.notificationTemplateUuid}
            onChange={(event) =>
              updateDraft("notificationTemplateUuid", event.target.value)
            }
            required
          >
            <option value="">Выберите шаблон уведомления...</option>
            {notificationTemplates.map((template) => (
              <option key={template.uuid} value={template.uuid}>
                {template.name} ({template.uuid})
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (isTelegramActionName(actionName)) {
      return (
        <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)]">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            target_phone_column
            <input
              type="text"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.targetPhoneColumn}
              onChange={(event) =>
                updateDraft("targetPhoneColumn", event.target.value)
              }
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            message_template
            <input
              type="text"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.messageTemplate}
              onChange={(event) =>
                updateDraft("messageTemplate", event.target.value)
              }
              required
            />
          </label>
        </div>
      );
    }

    if (isDmlInsertActionName(actionName)) {
      return (
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          Mongo payload
          <textarea
            rows={4}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.mongoPayloadJson}
            onChange={(event) => updateDraft("mongoPayloadJson", event.target.value)}
          />
        </label>
      );
    }

    if (isDmlUpdateActionName(actionName)) {
      return (
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Mongo filter
            <textarea
              rows={4}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.mongoFilterJson}
              onChange={(event) =>
                updateDraft("mongoFilterJson", event.target.value)
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Mongo update_op
            <textarea
              rows={4}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.mongoUpdateOpJson}
              onChange={(event) =>
                updateDraft("mongoUpdateOpJson", event.target.value)
              }
            />
          </label>
        </div>
      );
    }

    if (isDmlUpsertActionName(actionName)) {
      return (
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            search_fields
            <input
              type="text"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.mongoSearchFields}
              onChange={(event) =>
                updateDraft("mongoSearchFields", event.target.value)
              }
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Mongo payload
            <textarea
              rows={4}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.mongoPayloadJson}
              onChange={(event) =>
                updateDraft("mongoPayloadJson", event.target.value)
              }
            />
          </label>
        </div>
      );
    }

    return (
      <label className="grid gap-1 text-sm font-medium text-gray-700">
        action_params
        <textarea
          rows={4}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs font-normal text-gray-950 outline-none focus:border-indigo-500"
          value={draft.genericActionParamsJson}
          onChange={(event) =>
            updateDraft("genericActionParamsJson", event.target.value)
          }
        />
      </label>
    );
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          Name
          <input
            type="text"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            required
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            trigger_type
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.triggerType}
              onChange={(event) =>
                updateDraft("triggerType", event.target.value as TriggerType)
              }
            >
              {TRIGGER_TYPES.map((triggerType) => (
                <option key={triggerType} value={triggerType}>
                  {triggerType}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            event_type
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.eventType}
              onChange={(event) =>
                updateDraft("eventType", event.target.value as EventType | "")
              }
              required={draft.triggerType === "AUTOMATION"}
            >
              <option value="">Без события</option>
              {EVENT_TYPES.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {eventType}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            cron_expression
            <input
              type="text"
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
              value={draft.cronExpression}
              onChange={(event) =>
                updateDraft("cronExpression", event.target.value)
              }
              required={draft.eventType === "CRON" || draft.eventType === "ON_TIME"}
            />
          </label>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          source_template_uuid
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.sourceTemplateUuid}
            onChange={(event) =>
              updateDraft("sourceTemplateUuid", event.target.value)
            }
            required
          >
            <option value="">Выберите таблицу...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {templateLabel(template)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          target_template_uuid
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.targetTemplateUuid}
            onChange={(event) =>
              updateDraft("targetTemplateUuid", event.target.value)
            }
            required
          >
            <option value="">Выберите таблицу...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {templateLabel(template)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-gray-700">
        target_field
        <input
          type="text"
          list={targetFieldListId}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
          value={draft.targetField}
          onChange={(event) => updateDraft("targetField", event.target.value)}
        />
        <datalist id={targetFieldListId}>
          {targetFieldOptions.map((fieldName) => (
            <option key={fieldName} value={fieldName} />
          ))}
        </datalist>
      </label>

      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-medium text-gray-700">
          action_name
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal text-gray-950 outline-none focus:border-indigo-500"
            value={draft.actionName}
            onChange={(event) =>
              updateDraft("actionName", event.target.value as ActionName | "")
            }
            required={draft.triggerType === "AUTOMATION"}
          >
            <option value="">Без action</option>
            {ACTION_NAMES.map((actionName) => (
              <option key={actionName} value={actionName}>
                {actionName}
              </option>
            ))}
          </select>
        </label>
        {renderActionParams()}
      </div>

      <TriggerAstFields
        draft={draft}
        actionMappingRequired={Boolean(
          draft.actionName && isDmlActionName(draft.actionName),
        )}
        onChange={onChange}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={saving}
        >
          {mode === "create" ? "Создать" : "Сохранить"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onCancel}
            disabled={saving}
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
