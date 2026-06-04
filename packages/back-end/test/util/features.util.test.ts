import { applyEnvironmentInheritance, applyNamespaceToPayload } from "../../src/util/features";
import { FeatureDefinitionRule } from "shared/types/sdk";
import { NamespaceValue } from "shared/util";

describe("feature utils", () => {
  describe("applyEnvironmentInheritance", () => {
    it("inherits the values of parent environments", () => {
      const envRecord = {
        parent: "value",
      };
      const result = applyEnvironmentInheritance(
        [
          { id: "parent", description: "" },
          { id: "child", parent: "parent", description: "" },
        ],
        envRecord,
      );
      expect(result).toEqual({
        parent: "value",
        child: "value",
      });
    });

    it("handles recursive inheritance", () => {
      const envRecord = {
        grandparent: "value",
      };
      const result = applyEnvironmentInheritance(
        [
          { id: "grandparent", description: "" },
          { id: "parent", description: "", parent: "grandparent" },
          { id: "child", parent: "parent", description: "" },
        ],
        envRecord,
      );
      expect(result).toEqual({
        grandparent: "value",
        parent: "value",
        child: "value",
      });
    });

    it("does not mutate the argument", () => {
      const envRecord = {
        parent: "value",
        child: undefined,
      };
      applyEnvironmentInheritance(
        [
          { id: "parent", description: "" },
          { id: "child", parent: "parent", description: "" },
        ],
        envRecord,
      );
      expect(envRecord.child).toBeUndefined();
    });

    it("copies values rather than references", () => {
      const envRecord = {
        parent: ["nested object"],
      };
      const result = applyEnvironmentInheritance(
        [
          { id: "parent", description: "" },
          { id: "child", parent: "parent", description: "" },
        ],
        envRecord,
      );
      result.child.push("new entry");
      expect(result).toEqual({
        parent: ["nested object"],
        child: ["nested object", "new entry"],
      });
    });

    it("handles undefined environmentRecord with parent environments", () => {
      const result = applyEnvironmentInheritance(
        [
          { id: "parent", description: "" },
          { id: "child", parent: "parent", description: "" },
        ],
        undefined as unknown as Record<string, unknown>,
      );
      expect(result).toEqual({});
    });

    it("handles empty environmentRecord with parent environments", () => {
      const result = applyEnvironmentInheritance(
        [
          { id: "dev", description: "" },
          { id: "staging", parent: "dev", description: "" },
          { id: "production", parent: "staging", description: "" },
        ],
        {},
      );
      expect(result).toEqual({});
    });

    // `applyEnvironmentInheritance` is now called only on `FeatureEnvironment`
    // records containing non-rule fields (enabled, prerequisites). These tests
    // pin the two live call sites so a future refactor can't quietly regress.
    describe("FeatureEnvironment shape (enabled + prerequisites)", () => {
      it("inherits enabled flag from parent env", () => {
        const envRecord = {
          production: { enabled: true },
        };
        const result = applyEnvironmentInheritance(
          [
            { id: "production", description: "" },
            { id: "staging", parent: "production", description: "" },
          ],
          envRecord,
        );
        expect(result).toEqual({
          production: { enabled: true },
          staging: { enabled: true },
        });
      });

      it("inherits prerequisites array from parent env (deep-cloned)", () => {
        const envRecord = {
          production: {
            enabled: true,
            prerequisites: [{ id: "flag_parent", condition: '{"value":true}' }],
          },
        };
        const result = applyEnvironmentInheritance(
          [
            { id: "production", description: "" },
            { id: "staging", parent: "production", description: "" },
          ],
          envRecord,
        );
        expect(result.staging).toEqual({
          enabled: true,
          prerequisites: [{ id: "flag_parent", condition: '{"value":true}' }],
        });
        // Deep clone: mutating the child's prereqs must not leak to parent.
        result.staging.prerequisites![0].condition = "MUTATED";
        expect(result.production.prerequisites![0].condition).toBe(
          '{"value":true}',
        );
      });

      it("does NOT overwrite a child env that is already explicitly configured", () => {
        const envRecord = {
          production: { enabled: true },
          staging: { enabled: false },
        };
        const result = applyEnvironmentInheritance(
          [
            { id: "production", description: "" },
            { id: "staging", parent: "production", description: "" },
          ],
          envRecord,
        );
        expect(result.staging).toEqual({ enabled: false });
      });

      it("handles a 3-deep chain (prod -> staging -> dev), inheriting through both levels", () => {
        const envRecord = {
          production: {
            enabled: true,
            prerequisites: [{ id: "p1", condition: "{}" }],
          },
        };
        const result = applyEnvironmentInheritance(
          [
            { id: "production", description: "" },
            { id: "staging", parent: "production", description: "" },
            { id: "dev", parent: "staging", description: "" },
          ],
          envRecord,
        );
        expect(result.staging).toEqual(envRecord.production);
        expect(result.dev).toEqual(envRecord.production);
      });

      it("never synthesizes a 'rules' key on inherited envs", () => {
        // `applyEnvironmentInheritance` operates on already-scrubbed v2
        // env records. Even if a pathological parent carried a `rules`
        // key, the child should only inherit what the parent has (deep
        // clone), and downstream `scrubEnvRules` strips rules keys
        // regardless. Assert no synthesis happens in this pure helper.
        const envRecord: Record<string, { enabled: boolean }> = {
          production: { enabled: true },
        };
        const result = applyEnvironmentInheritance(
          [
            { id: "production", description: "" },
            { id: "staging", parent: "production", description: "" },
          ],
          envRecord,
        );
        expect(result.staging).not.toHaveProperty("rules");
      });
    });

    describe("malformed parent chains", () => {
      it("breaks out of a 2-cycle (A.parent=B, B.parent=A) with no defined ancestor", () => {
        // Both ends of the cycle are missing from the record. Without cycle
        // detection this would loop forever; the fix bails out as if no
        // parent were set.
        const envRecord: Record<string, { enabled: boolean }> = {};
        const result = applyEnvironmentInheritance(
          [
            { id: "a", parent: "b", description: "" },
            { id: "b", parent: "a", description: "" },
          ],
          envRecord,
        );
        expect(result).toEqual({});
      });

      it("breaks out of a self-loop (A.parent=A) with no defined ancestor", () => {
        const result = applyEnvironmentInheritance(
          [{ id: "a", parent: "a", description: "" }],
          {},
        );
        expect(result).toEqual({});
      });

      it("breaks out of a 3-cycle (A->B->C->A) with no defined ancestor", () => {
        const result = applyEnvironmentInheritance(
          [
            { id: "a", parent: "b", description: "" },
            { id: "b", parent: "c", description: "" },
            { id: "c", parent: "a", description: "" },
          ],
          {},
        );
        expect(result).toEqual({});
      });

      it("still inherits when a defined env appears anywhere in the cycle", () => {
        // a -> b -> c -> a, but `c` is defined. From `a`, the walk goes
        // b -> c (defined, stop) and `a` inherits c's value. From `b`,
        // the walk goes c (defined, stop) and `b` inherits c's value.
        const envRecord = {
          c: { enabled: true },
        };
        const result = applyEnvironmentInheritance(
          [
            { id: "a", parent: "b", description: "" },
            { id: "b", parent: "c", description: "" },
            { id: "c", parent: "a", description: "" },
          ],
          envRecord,
        );
        expect(result).toEqual({
          a: { enabled: true },
          b: { enabled: true },
          c: { enabled: true },
        });
      });

      it("non-existent parent id silently no-ops (no inheritance)", () => {
        const result = applyEnvironmentInheritance(
          [
            { id: "production", description: "" },
            { id: "staging", parent: "deleted-env-id", description: "" },
          ],
          { production: { enabled: true } },
        );
        expect(result).toEqual({ production: { enabled: true } });
      });

      it("walk to a non-existent ancestor through a defined intermediate stops at the intermediate", () => {
        // staging.parent = production (defined). production.parent =
        // deleted-env (missing). staging should inherit from production,
        // not chase further.
        const result = applyEnvironmentInheritance(
          [
            { id: "production", parent: "deleted-env", description: "" },
            { id: "staging", parent: "production", description: "" },
          ],
          { production: { enabled: true } },
        );
        expect(result.staging).toEqual({ enabled: true });
      });
    });
  });

  describe("applyNamespaceToPayload", () => {
    it("generates correct filters when nsDefinition format is multiRange", () => {
      const rule: FeatureDefinitionRule = {};
      const namespace: NamespaceValue = {
        enabled: true,
        name: "test-namespace",
        ranges: [[0, 0.5]],
        format: "multiRange",
      };
      const namespacesMap = new Map([
        [
          "test-namespace",
          {
            hashAttribute: "customId",
            seed: "customSeed",
            format: "multiRange" as const,
          },
        ],
      ]);

      applyNamespaceToPayload(rule, namespace, namespacesMap);

      expect(rule.filters).toEqual([
        {
          attribute: "customId",
          seed: "customSeed",
          hashVersion: 2,
          ranges: [[0, 0.5]],
        },
      ]);
      expect(rule.namespace).toBeUndefined();
    });

    it("falls back to isMultiRangeNamespaceFormat when nsDefinition is missing", () => {
      const rule: FeatureDefinitionRule = { hashAttribute: "ruleAttr" };
      const namespace: NamespaceValue = {
        enabled: true,
        name: "test-namespace",
        ranges: [[0.5, 1]],
        format: "multiRange",
        hashVersion: 1,
      };

      applyNamespaceToPayload(rule, namespace);

      expect(rule.filters).toEqual([
        {
          attribute: "ruleAttr",
          seed: "test-namespace",
          hashVersion: 1,
          ranges: [[0.5, 1]],
        },
      ]);
      expect(rule.namespace).toBeUndefined();
    });

    it("sets legacy tuple on rule.namespace when format is legacy", () => {
      const rule: FeatureDefinitionRule = {};
      const namespace: NamespaceValue = {
        enabled: true,
        name: "legacy-ns",
        range: [0.1, 0.3],
        format: "legacy",
      };
      const namespacesMap = new Map([
        [
          "legacy-ns",
          {
            format: "legacy" as const,
          },
        ],
      ]);

      applyNamespaceToPayload(rule, namespace, namespacesMap);

      expect(rule.namespace).toEqual(["legacy-ns", 0.1, 0.3]);
      expect(rule.filters).toBeUndefined();
    });

    it("handles defensive numeric conversion for anomalous string range formats", () => {
      const rule: FeatureDefinitionRule = {};
      // Simulating the anomalous format that might come from legacy DB records
      const namespace = {
        enabled: true,
        name: "anomalous-ns",
        range: ["0.2", "0.5"] as any,
      } as unknown as NamespaceValue;

      applyNamespaceToPayload(rule, namespace);

      // Since it's legacy, it should set rule.namespace with converted numbers
      expect(rule.namespace).toEqual(["anomalous-ns", 0.2, 0.5]);
      expect(rule.filters).toBeUndefined();
    });

    it("handles defensive numeric conversion for anomalous string range formats in multiRange", () => {
      const rule: FeatureDefinitionRule = {};
      // Simulating the anomalous format that might come from legacy DB records
      const namespace = {
        enabled: true,
        name: "anomalous-multi-ns",
        ranges: [["0.2", "0.5"] as any],
        format: "multiRange",
      } as unknown as NamespaceValue;

      applyNamespaceToPayload(rule, namespace);

      expect(rule.filters).toEqual([
        {
          attribute: "id",
          seed: "anomalous-multi-ns",
          hashVersion: 2,
          ranges: [[0.2, 0.5]],
        },
      ]);
      expect(rule.namespace).toBeUndefined();
    });
  });
});
