import { applyEnvironmentInheritance, applyNamespaceToPayload } from "../../src/util/features";
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
    const makeRule = (overrides: Record<string, unknown> = {}) =>
      ({
        id: "rule-1",
        type: "experiment",
        trackingKey: "test-exp",
        hashAttribute: "user_id",
        hashVersion: 2,
        coverage: 1,
        values: [{ value: "a", weight: 0.5 }],
        condition: "{}",
        enabled: true,
        ...overrides,
      } as never);

    const makeNamespacesMap = (
      entries: Record<
        string,
        { hashAttribute?: string; seed?: string; format?: "legacy" | "multiRange" }
      >,
    ) =>
      new Map(Object.entries(entries)) as Map<
        string,
        { hashAttribute?: string; seed?: string; format?: "legacy" | "multiRange" }
      >;

    // -----------------------------------------------------------------------
    // MultiRange — nsDefinition explicitly says format === "multiRange"
    // -----------------------------------------------------------------------

    describe("multiRange with explicit nsDefinition.format === 'multiRange'", () => {
      it("generates a filters entry with attribute, seed, hashVersion, and ranges", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-multi",
          ranges: [
            [0, 0.3],
            [0.7, 1],
          ],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-multi": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.namespace).toBeUndefined();
        expect(rule.filters).toHaveLength(1);
        expect(rule.filters![0]).toEqual({
          attribute: "user_id",
          seed: "ns-multi",
          hashVersion: 2,
          ranges: [
            [0, 0.3],
            [0.7, 1],
          ],
        });
      });

      it("uses nsDefinition.hashAttribute when provided", () => {
        const rule = makeRule({ hashAttribute: "user_id" });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-custom-attr",
          ranges: [[0, 0.5]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-custom-attr": {
            format: "multiRange",
            hashAttribute: "company_id",
          },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].attribute).toBe("company_id");
      });

      it("uses nsDefinition.seed when provided", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-seeded",
          ranges: [[0, 1]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-seeded": { format: "multiRange", seed: "custom-seed-v2" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].seed).toBe("custom-seed-v2");
      });

      it("uses namespace.hashVersion when present on the namespace object", () => {
        const rule = makeRule({ hashVersion: 2 });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-hv3",
          ranges: [[0, 0.6]],
          format: "multiRange",
          hashVersion: 3,
        };
        const namespacesMap = makeNamespacesMap({
          "ns-hv3": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].hashVersion).toBe(3);
      });

      it("defaults hashVersion to 2 when not present on the namespace", () => {
        const rule = makeRule({ hashVersion: undefined });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-default-hv",
          ranges: [[0, 1]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-default-hv": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].hashVersion).toBe(2);
      });

      it("appends to an existing filters array rather than replacing it", () => {
        const rule = makeRule({
          filters: [
            {
              attribute: "existing",
              seed: "existing-seed",
              hashVersion: 2,
              ranges: [[0, 0.2]],
            },
          ],
        });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-append",
          ranges: [[0.3, 0.7]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-append": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters).toHaveLength(2);
        expect(rule.filters![0].attribute).toBe("existing");
        expect(rule.filters![1].attribute).toBe("user_id");
      });

      it("does not mutate rule.hashAttribute", () => {
        const rule = makeRule({ hashAttribute: "original_attr" });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-no-mutate",
          ranges: [[0, 0.5]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-no-mutate": { format: "multiRange", hashAttribute: "ns_attr" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.hashAttribute).toBe("original_attr");
      });
    });

    // -----------------------------------------------------------------------
    // MultiRange — detected via isMultiRangeNamespaceFormat (no nsDefinition)
    // -----------------------------------------------------------------------

    describe("multiRange detected structurally (no nsDefinition in map)", () => {
      it("detects multiRange via the ranges property when namespacesMap is undefined", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-no-def",
          ranges: [
            [0, 0.4],
            [0.6, 1],
          ],
          format: "multiRange",
        };

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.filters).toHaveLength(1);
        expect(rule.filters![0]).toEqual({
          attribute: "user_id",
          seed: "ns-no-def",
          hashVersion: 2,
          ranges: [
            [0, 0.4],
            [0.6, 1],
          ],
        });
      });

      it("detects multiRange when namespace name is not found in namespacesMap", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-missing-from-map",
          ranges: [[0, 0.3]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "some-other-ns": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters).toHaveLength(1);
        expect(rule.filters![0].attribute).toBe("user_id");
        expect(rule.filters![0].seed).toBe("ns-missing-from-map");
      });

      it("falls back to rule.hashAttribute when nsDefinition is absent", () => {
        const rule = makeRule({ hashAttribute: "rule_attr" });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-fallback-attr",
          ranges: [[0, 0.5]],
          format: "multiRange",
        };

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.filters![0].attribute).toBe("rule_attr");
      });
    });

    // -----------------------------------------------------------------------
    // Legacy format
    // -----------------------------------------------------------------------

    describe("legacy format", () => {
      it("sets rule.namespace as [name, start, end] tuple when nsDefinition explicitly says legacy", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-legacy",
          range: [0, 0.5],
        };
        const namespacesMap = makeNamespacesMap({
          "ns-legacy": { format: "legacy" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters).toBeUndefined();
        expect(rule.namespace).toEqual(["ns-legacy", 0, 0.5]);
      });

      it("sets rule.namespace as [name, start, end] when namespace has range but no ranges (structural fallback)", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-legacy-structural",
          range: [0.2, 0.8],
        };

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.filters).toBeUndefined();
        expect(rule.namespace).toEqual(["ns-legacy-structural", 0.2, 0.8]);
      });

      it("preserves any pre-existing filters when using legacy format", () => {
        const rule = makeRule({
          filters: [
            { attribute: "other", seed: "s", hashVersion: 2, ranges: [[0, 1]] },
          ],
        });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-legacy-with-filters",
          range: [0, 0.5],
        };
        const namespacesMap = makeNamespacesMap({
          "ns-legacy-with-filters": { format: "legacy" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters).toHaveLength(1);
        expect(rule.namespace).toEqual(["ns-legacy-with-filters", 0, 0.5]);
      });
    });

    // -----------------------------------------------------------------------
    // Format detection priority: nsDefinition.format > structural check
    // -----------------------------------------------------------------------

    describe("format detection priority", () => {
      it("trusts nsDefinition.format even when namespace shape is ambiguous", () => {
        const rule = makeRule();
        const namespace = {
          enabled: true,
          name: "ns-ambiguous",
          range: [0, 0.5],
          ranges: [
            [0, 0.5],
            [0.8, 1],
          ],
        } as NamespaceValue;
        const namespacesMap = makeNamespacesMap({
          "ns-ambiguous": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters).toHaveLength(1);
        expect(rule.namespace).toBeUndefined();
      });
    });

    // -----------------------------------------------------------------------
    // Defensive number conversion for legacy string values in ranges
    // -----------------------------------------------------------------------

    describe("defensive number conversion in ranges", () => {
      it("converts string range values like '0.5' to numbers", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-string-range",
          range: ["0.3" as unknown as number, "0.7" as unknown as number],
        };

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.namespace).toEqual(["ns-string-range", 0.3, 0.7]);
      });

      it("converts string ranges in multiRange format", () => {
        const rule = makeRule();
        const namespace = {
          enabled: true,
          name: "ns-multi-str",
          ranges: [
            ["0" as unknown as number, "0.25" as unknown as number],
            ["0.75" as unknown as number, "1" as unknown as number],
          ],
          format: "multiRange" as const,
        } as NamespaceValue;
        const namespacesMap = makeNamespacesMap({
          "ns-multi-str": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].ranges).toEqual([
          [0, 0.25],
          [0.75, 1],
        ]);
      });

      it("converts invalid/non-numeric strings to 0 defensively", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-bad-str",
          range: [
            "not-a-number" as unknown as number,
            "also-bad" as unknown as number,
          ],
        };

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.namespace).toEqual(["ns-bad-str", 0, 0]);
      });

      it("handles undefined range values by defaulting to 0", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-undefined-range",
          range: [
            undefined as unknown as number,
            undefined as unknown as number,
          ],
        };

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.namespace).toEqual(["ns-undefined-range", 0, 0]);
      });

      it("handles mixed valid and invalid range values", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-mixed",
          range: [0.5, "invalid" as unknown as number],
        };

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.namespace).toEqual(["ns-mixed", 0.5, 0]);
      });
    });

    // -----------------------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------------------

    describe("edge cases", () => {
      it("handles empty ranges array in multiRange format gracefully", () => {
        const rule = makeRule();
        const namespace = {
          enabled: true,
          name: "ns-empty-ranges",
          ranges: [],
          format: "multiRange" as const,
        } as NamespaceValue;
        const namespacesMap = makeNamespacesMap({
          "ns-empty-ranges": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].ranges).toEqual([]);
      });

      it("handles legacy namespace with empty range by using [0, 0]", () => {
        const rule = makeRule();
        const namespace = {
          enabled: true,
          name: "ns-no-range",
        } as NamespaceValue;

        applyNamespaceToPayload(rule, namespace, undefined);

        expect(rule.namespace).toEqual(["ns-no-range", 0, 0]);
      });

      it("initializes filters array on rule when it was undefined", () => {
        const rule = makeRule();
        expect(rule.filters).toBeUndefined();

        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-init-filters",
          ranges: [[0, 1]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-init-filters": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(Array.isArray(rule.filters)).toBe(true);
        expect(rule.filters).toHaveLength(1);
      });

      it("does not set rule.namespace in multiRange mode", () => {
        const rule = makeRule({ namespace: ["old", 0, 0.3] });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-no-legacy-set",
          ranges: [[0, 0.5]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-no-legacy-set": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.namespace).toEqual(["old", 0, 0.3]);
      });

      it("does not create filters in legacy mode", () => {
        const rule = makeRule();
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-legacy-no-filters",
          range: [0.1, 0.9],
        };
        const namespacesMap = makeNamespacesMap({
          "ns-legacy-no-filters": { format: "legacy" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters).toBeUndefined();
        expect(rule.namespace).toEqual(["ns-legacy-no-filters", 0.1, 0.9]);
      });

      it("uses namespace.hashAttribute for filter when provided on the namespace object (multiRange)", () => {
        const rule = makeRule({ hashAttribute: "user_id" });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-hash-attr",
          ranges: [[0, 0.5]],
          format: "multiRange",
          hashAttribute: "device_id",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-hash-attr": { format: "multiRange" },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].attribute).toBe("device_id");
      });

      it("uses hashAttribute from nsDefinition when namespace object lacks it", () => {
        const rule = makeRule({ hashAttribute: "user_id" });
        const namespace: NamespaceValue = {
          enabled: true,
          name: "ns-no-hash-attr",
          ranges: [[0, 0.5]],
          format: "multiRange",
        };
        const namespacesMap = makeNamespacesMap({
          "ns-no-hash-attr": {
            format: "multiRange",
            hashAttribute: "org_attr",
          },
        });

        applyNamespaceToPayload(rule, namespace, namespacesMap);

        expect(rule.filters![0].attribute).toBe("org_attr");
      });
    });
  });
});
