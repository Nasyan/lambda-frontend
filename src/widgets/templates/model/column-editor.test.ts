import { describe, expect, it } from "vitest";

import { createDefaultCascadingTreeConfig } from "@/src/entities/template/model/field-registry";
import type { TemplateEditorColumn } from "./column-editor";
import {
  buildColumnMeta,
  buildEditorColumns,
  createEditorColumn,
} from "./column-editor";

const makeColumn = (
  overrides: Partial<TemplateEditorColumn>,
): TemplateEditorColumn => ({
  ...createEditorColumn("field_name"),
  ...overrides,
});

describe("column-editor", () => {
  it("serializes select options as a backend-safe unique string list", () => {
    const result = buildColumnMeta(
      makeColumn({
        type: "select",
        options: ["New", "Paid", "New", " "],
        uiWidget: "",
      }),
    );

    expect(result).toEqual({
      ok: true,
      meta: {
        type: "select",
        required: false,
        unique: false,
        options: ["New", "Paid"],
      },
    });
  });

  it("rejects relation_list columns without target_template_uuid", () => {
    const result = buildColumnMeta(
      makeColumn({
        type: "relation_list",
        targetTemplateUuid: "",
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("serializes formula columns using ast, not a text expression key", () => {
    const result = buildColumnMeta(
      makeColumn({
        type: "formula",
        astText: JSON.stringify({ type: "literal", value: 10 }),
      }),
    );

    expect(result).toEqual({
      ok: true,
      meta: {
        type: "formula",
        required: false,
        unique: false,
        ast: { type: "literal", value: 10 },
      },
    });
  });

  it("serializes cascading_tree tree_config", () => {
    const treeConfig = createDefaultCascadingTreeConfig();
    const result = buildColumnMeta(
      makeColumn({
        type: "cascading_tree",
        treeConfig,
      }),
    );

    expect(result).toEqual({
      ok: true,
      meta: {
        type: "cascading_tree",
        required: false,
        unique: false,
        tree_config: treeConfig,
      },
    });
  });

  it("hydrates existing backend metadata into editor state", () => {
    const columns = buildEditorColumns({
      qr_code: {
        type: "string",
        required: true,
        unique: true,
        ui_widget: "qr",
        description: "Scan code",
      },
    });

    expect(columns[0]).toMatchObject({
      dbName: "qr_code",
      type: "string",
      required: true,
      unique: true,
      uiWidget: "qr",
      description: "Scan code",
    });
  });

  it("does not serialize an incompatible stale ui_widget", () => {
    const result = buildColumnMeta(
      makeColumn({
        type: "number",
        uiWidget: "color_picker",
      }),
    );

    expect(result).toEqual({
      ok: true,
      meta: {
        type: "number",
        required: false,
        unique: false,
      },
    });
  });
});
