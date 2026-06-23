import { describe, expect, it } from "vitest";

import type { ColumnMetaResponse } from "@/src/entities/template/model/types";
import {
  buildColumnMeta,
  createDraftFromMeta,
  createEmptyColumnDraft,
} from "@/src/features/templates/model/column-draft";

describe("column draft metadata", () => {
  it("preserves trigger metadata passthrough when editing a field", () => {
    const meta: ColumnMetaResponse = {
      type: "string",
      required: true,
      default: "",
      triggers: [
        {
          trigger_id: "trigger-1",
          trigger_type: "notification",
          event: "record_created",
          target_field: null,
          custom: { nested: true },
        },
      ],
    };

    const draft = createDraftFromMeta("name", meta);
    const result = buildColumnMeta(draft);

    expect(result).toMatchObject({
      type: "string",
      required: true,
      default: "",
      triggers: meta.triggers,
    });
  });

  it("builds select options from rows and rejects empty or duplicate rows", () => {
    const draft = {
      ...createEmptyColumnDraft(),
      columnName: "status",
      type: "select" as const,
      selectOptions: [" New ", "Won"],
      defaultEnabled: true,
      selectDefault: "New",
    };

    expect(buildColumnMeta(draft)).toMatchObject({
      type: "select",
      options: ["New", "Won"],
      default: "New",
    });

    expect(() =>
      buildColumnMeta({ ...draft, selectOptions: ["New", "New"] }),
    ).toThrow(/duplicated/);
    expect(() => buildColumnMeta({ ...draft, selectOptions: ["New", ""] })).toThrow(
      /cannot be empty/,
    );
  });

  it("keeps formula AST behavior isolated as JSON object payload", () => {
    const ast = { type: "field", value: "amount" };
    const draft = {
      ...createEmptyColumnDraft(),
      columnName: "computed",
      type: "formula" as const,
      astJson: JSON.stringify(ast),
    };

    expect(buildColumnMeta(draft)).toMatchObject({
      type: "formula",
      ast,
    });

    expect(() => buildColumnMeta({ ...draft, astJson: "" })).toThrow(
      /requires an AST/,
    );
  });

  it("requires relation_list target template metadata", () => {
    const draft = {
      ...createEmptyColumnDraft(),
      columnName: "products",
      type: "relation_list" as const,
      relationTargetTemplateUuid: "template-products",
    };

    expect(buildColumnMeta(draft)).toMatchObject({
      type: "relation_list",
      target_template_uuid: "template-products",
    });

    expect(() =>
      buildColumnMeta({ ...draft, relationTargetTemplateUuid: " " }),
    ).toThrow(/target_template_uuid/);
  });

  it("requires cascading_tree tree_config JSON object", () => {
    const treeConfig = {
      floor_name: "Type",
      type: "fixed",
      options: { Ring: null },
    };
    const draft = {
      ...createEmptyColumnDraft(),
      columnName: "attributes",
      type: "cascading_tree" as const,
      treeConfigJson: JSON.stringify(treeConfig),
    };

    expect(buildColumnMeta(draft)).toMatchObject({
      type: "cascading_tree",
      tree_config: treeConfig,
    });

    expect(() => buildColumnMeta({ ...draft, treeConfigJson: "[]" })).toThrow(
      /tree_config/,
    );
  });
});

