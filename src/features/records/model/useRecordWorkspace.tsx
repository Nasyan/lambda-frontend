"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { JsonObject } from "@/src/entities/template/model/types";

/**
 * Стор рабочего пространства записей. Реализован на React Context + useReducer,
 * без сторонних библиотек состояния. Каждая вкладка — отдельный черновик записи
 * (`RecordDraft`). Вкладки могут принадлежать разным шаблонам одновременно.
 *
 * Расширяемость: `RecordDraft` намеренно содержит дискриминируемый `kind`,
 * чтобы в будущем добавить другие типы вкладок (table/workflow) без слома API.
 */

export type RecordDraftStatus =
  | "editing"
  | "saving"
  | "created"
  | "error";

export interface RecordDraft {
  /** Уникальный id вкладки (crypto.randomUUID). */
  id: string;
  /** Тип вкладки. Сейчас всегда "record"; задел под table/workflow. */
  kind: "record";
  templateUuid: string;
  templateName: string;
  formData: JsonObject;
  status: RecordDraftStatus;
  error?: string;
  dirty: boolean;
}

export interface RecordWorkspaceState {
  tabs: RecordDraft[];
  activeTabId: string | null;
}

type RecordWorkspaceAction =
  | { type: "open_tab"; templateUuid: string; templateName: string; id: string }
  | { type: "duplicate_tab"; sourceId: string; id: string }
  | { type: "close_tab"; id: string }
  | { type: "set_active_tab"; id: string }
  | { type: "update_tab_data"; id: string; formData: JsonObject }
  | {
      type: "set_tab_status";
      id: string;
      status: RecordDraftStatus;
      error?: string;
    }
  | { type: "reset_created_tabs" }
  | { type: "hydrate"; state: RecordWorkspaceState };

const STORAGE_VERSION = 1;
const STORAGE_KEY = `lambda:record-workspace:v${STORAGE_VERSION}`;

const createDraft = (
  id: string,
  templateUuid: string,
  templateName: string,
  formData: JsonObject = {},
): RecordDraft => ({
  id,
  kind: "record",
  templateUuid,
  templateName,
  formData,
  status: "editing",
  dirty: false,
});

const pickNextActiveId = (
  tabs: RecordDraft[],
  closedId: string,
  currentActiveId: string | null,
): string | null => {
  if (currentActiveId !== closedId) return currentActiveId;
  if (tabs.length === 0) return null;
  return tabs[tabs.length - 1].id;
};

const reducer = (
  state: RecordWorkspaceState,
  action: RecordWorkspaceAction,
): RecordWorkspaceState => {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "open_tab": {
      const tab = createDraft(
        action.id,
        action.templateUuid,
        action.templateName,
      );
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }

    case "duplicate_tab": {
      const source = state.tabs.find((tab) => tab.id === action.sourceId);
      if (!source) return state;
      const tab = createDraft(
        action.id,
        source.templateUuid,
        source.templateName,
        { ...source.formData },
      );
      tab.dirty = source.dirty;
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }

    case "close_tab": {
      const tabs = state.tabs.filter((tab) => tab.id !== action.id);
      return {
        tabs,
        activeTabId: pickNextActiveId(tabs, action.id, state.activeTabId),
      };
    }

    case "set_active_tab": {
      if (!state.tabs.some((tab) => tab.id === action.id)) return state;
      return { ...state, activeTabId: action.id };
    }

    case "update_tab_data":
      return {
        ...state,
        tabs: state.tabs.map((tab) =>
          tab.id === action.id
            ? {
                ...tab,
                formData: action.formData,
                dirty: true,
                // Возврат в редактирование, если правят запись после ошибки.
                status: tab.status === "error" ? "editing" : tab.status,
                error: tab.status === "error" ? undefined : tab.error,
              }
            : tab,
        ),
      };

    case "set_tab_status":
      return {
        ...state,
        tabs: state.tabs.map((tab) =>
          tab.id === action.id
            ? { ...tab, status: action.status, error: action.error }
            : tab,
        ),
      };

    case "reset_created_tabs":
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.status !== "created"),
      };

    default:
      return action satisfies never;
  }
};

const initialState: RecordWorkspaceState = {
  tabs: [],
  activeTabId: null,
};

const isRecordDraft = (value: unknown): value is RecordDraft => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RecordDraft>;
  return (
    typeof candidate.id === "string" &&
    candidate.kind === "record" &&
    typeof candidate.templateUuid === "string" &&
    typeof candidate.templateName === "string" &&
    typeof candidate.formData === "object" &&
    candidate.formData !== null &&
    (candidate.status === "editing" ||
      candidate.status === "saving" ||
      candidate.status === "created" ||
      candidate.status === "error") &&
    typeof candidate.dirty === "boolean"
  );
};

const parsePersistedState = (raw: string): RecordWorkspaceState | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Partial<RecordWorkspaceState>;
    if (!Array.isArray(candidate.tabs)) return null;
    if (!candidate.tabs.every(isRecordDraft)) return null;

    const tabs = candidate.tabs;
    // "saving" не персистится корректно (запрос мог не завершиться) — чиним.
    const normalizedTabs = tabs.map((tab) =>
      tab.status === "saving"
        ? { ...tab, status: "editing" as const, error: undefined }
        : tab,
    );

    const activeTabId =
      typeof candidate.activeTabId === "string" &&
      normalizedTabs.some((tab) => tab.id === candidate.activeTabId)
        ? candidate.activeTabId
        : (normalizedTabs[0]?.id ?? null);

    return { tabs: normalizedTabs, activeTabId };
  } catch {
    return null;
  }
};

export interface RecordWorkspaceContextValue extends RecordWorkspaceState {
  openTab: (templateUuid: string, templateName: string) => string;
  duplicateTab: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabData: (id: string, formData: JsonObject) => void;
  setTabStatus: (
    id: string,
    status: RecordDraftStatus,
    error?: string,
  ) => void;
  resetCreatedTabs: () => void;
}

const RecordWorkspaceContext =
  createContext<RecordWorkspaceContextValue | null>(null);

export function RecordWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Гидрация из sessionStorage — только на клиенте (защита от SSR).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const persisted = parsePersistedState(raw);
    if (persisted) {
      dispatch({ type: "hydrate", state: persisted });
    }
  }, []);

  // Персист в sessionStorage при каждом изменении.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Квота/недоступность storage — не критично для работы вкладок.
    }
  }, [state]);

  const openTab = useCallback(
    (templateUuid: string, templateName: string): string => {
      const id = crypto.randomUUID();
      dispatch({ type: "open_tab", templateUuid, templateName, id });
      return id;
    },
    [],
  );

  const duplicateTab = useCallback((id: string) => {
    dispatch({ type: "duplicate_tab", sourceId: id, id: crypto.randomUUID() });
  }, []);

  const closeTab = useCallback((id: string) => {
    dispatch({ type: "close_tab", id });
  }, []);

  const setActiveTab = useCallback((id: string) => {
    dispatch({ type: "set_active_tab", id });
  }, []);

  const updateTabData = useCallback((id: string, formData: JsonObject) => {
    dispatch({ type: "update_tab_data", id, formData });
  }, []);

  const setTabStatus = useCallback(
    (id: string, status: RecordDraftStatus, error?: string) => {
      dispatch({ type: "set_tab_status", id, status, error });
    },
    [],
  );

  const resetCreatedTabs = useCallback(() => {
    dispatch({ type: "reset_created_tabs" });
  }, []);

  const value = useMemo<RecordWorkspaceContextValue>(
    () => ({
      ...state,
      openTab,
      duplicateTab,
      closeTab,
      setActiveTab,
      updateTabData,
      setTabStatus,
      resetCreatedTabs,
    }),
    [
      state,
      openTab,
      duplicateTab,
      closeTab,
      setActiveTab,
      updateTabData,
      setTabStatus,
      resetCreatedTabs,
    ],
  );

  return (
    <RecordWorkspaceContext.Provider value={value}>
      {children}
    </RecordWorkspaceContext.Provider>
  );
}

export function useRecordWorkspace(): RecordWorkspaceContextValue {
  const context = useContext(RecordWorkspaceContext);
  if (!context) {
    throw new Error(
      "useRecordWorkspace must be used within a RecordWorkspaceProvider",
    );
  }
  return context;
}
