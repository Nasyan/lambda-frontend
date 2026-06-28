import { describe, expect, it } from "vitest";

import {
  FIELD_DEFINITIONS,
  UI_WIDGET_DEFINITIONS,
  formatFieldValueForSubmit,
  getFieldValueSubmitError,
  getAllowedWidgetsForType,
  isCascadingTreeSelectionComplete,
  isEmptyFieldValue,
  resolveFieldInputRenderer,
  sanitizeRelationListValue,
} from "./field-registry";
import type { CascadingTreeConfig, ColumnMetaResponse, JsonValue } from "./types";

describe("field-registry", () => {
  it("enumerates every backend field type", () => {
    expect(Object.keys(FIELD_DEFINITIONS).sort()).toEqual([
      "boolean",
      "cascading_tree",
      "checkbox",
      "datetime",
      "formula",
      "image",
      "number",
      "phone",
      "relation_list",
      "select",
      "string",
      "url",
    ]);
  });

  it("resolves ui_widget renderers before base field renderers", () => {
    const meta: ColumnMetaResponse = {
      type: "string",
      ui_widget: "color_picker",
    };

    expect(resolveFieldInputRenderer(meta)).toBe("color_picker");
    expect(getAllowedWidgetsForType("phone")).toEqual(["phone_mask"]);
  });

  it("enumerates every backend ui_widget and limits them by compatible type", () => {
    expect(UI_WIDGET_DEFINITIONS.map((definition) => definition.value)).toEqual([
      "qr",
      "camera_capture",
      "file_upload",
      "geo_point",
      "phone_mask",
      "color_picker",
    ]);

    expect(getAllowedWidgetsForType("number")).toEqual([]);
    expect(getAllowedWidgetsForType("image")).toEqual([
      "camera_capture",
      "file_upload",
    ]);
  });

  it("falls back to the base renderer for incompatible backend widget metadata", () => {
    const meta: ColumnMetaResponse = {
      type: "number",
      ui_widget: "color_picker",
    };

    expect(resolveFieldInputRenderer(meta)).toBe("number");
  });

  it("formats primitive values for backend validation", () => {
    expect(
      formatFieldValueForSubmit({ type: "number" }, "42.5"),
    ).toBe(42.5);
    expect(
      formatFieldValueForSubmit({ type: "checkbox" }, false),
    ).toBe(false);
    expect(isEmptyFieldValue({ type: "checkbox" }, false)).toBe(false);
  });

  it("sanitizes relation lists while preserving metadata", () => {
    const value: JsonValue = [
      { target_uuid: "target-1", qty: 2 },
      { target_uuid: "", qty: 10 },
      "not-an-object",
    ];

    expect(sanitizeRelationListValue(value)).toEqual([
      { target_uuid: "target-1", qty: 2 },
    ]);
  });

  it("validates complete cascading tree selections before submit", () => {
    const treeConfig: CascadingTreeConfig = {
      floor_name: "Type",
      type: "fixed",
      options: {
        Brooch: {
          floor_name: "Material",
          type: "adaptive",
          options: {
            Wood: null,
          },
        },
      },
    };

    expect(
      isCascadingTreeSelectionComplete(treeConfig, {
        Type: "Brooch",
        Material: "Wood",
      }),
    ).toBe(true);
    expect(
      isCascadingTreeSelectionComplete(treeConfig, { Type: "Brooch" }),
    ).toBe(false);
  });

  it("returns submit errors for values the backend would reject", () => {
    expect(
      getFieldValueSubmitError("amount", { type: "number" }, "abc"),
    ).toContain("числом");
    expect(
      getFieldValueSubmitError(
        "items",
        { type: "relation_list" },
        [{ target_uuid: "target-1" }, { target_uuid: "" }],
      ),
    ).toContain("выберите запись");
  });
});
