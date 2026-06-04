import {
  applyEnvironmentInheritance,
  applyNamespaceToPayload,
} from "../../src/util/features";

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
    describe("multiRange format with explicit nsDefinition format", () => {
      it("generates filters array with attribute, seed, hashVersion, and ranges when nsDefinition format is multiRange", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "ns-multi",
          ranges: [[0, 0.3], [0.5, 0.8]] as [number, number][],
          hashVersion: 2,
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          [
            "ns-multi",
            {
              hashAttribute: "org_hash_attr",
              seed: "custom-seed",
              format: "multiRange" as const,
            },
          ],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.filters).toBeDefined();
        expect(Array.isArray(rule.filters)).toBe(true);
        expect(rule.filters).toHaveLength(1);
        expect(rule.filters[0]).toEqual({
          attribute: "org_hash_attr",
          seed: "custom-seed",
          hashVersion: 2,
          ranges: [[0, 0.3], [0.5, 0.8]],
        });
        expect(rule.namespace).toBeUndefined();
      });

      it("uses namespace.name as seed when nsDefinition has no seed", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "my-namespace",
          ranges: [[0.1, 0.5]] as [number, number][],
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          ["my-namespace", { format: "multiRange" as const }],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.filters[0].seed).toBe("my-namespace");
      });

      it("uses rule.hashAttribute as fallback when nsDefinition has no hashAttribute", () => {
        const rule: Record<string, unknown> = { hashAttribute: "rule_attr" };
        const namespace = {
          enabled: true,
          name: "ns-no-hash",
          ranges: [[0, 1]] as [number, number][],
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          ["ns-no-hash", { format: "multiRange" as const }],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.filters[0].attribute).toBe("rule_attr");
      });

      it("defaults hashAttribute to 'id' when neither nsDefinition nor rule provides one", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "ns-default",
          ranges: [[0, 0.5]] as [number, number][],
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          ["ns-default", { format: "multiRange" as const }],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.filters[0].attribute).toBe("id");
      });

      it("defaults hashVersion to 2 when namespace has no hashVersion", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "ns-no-ver",
          ranges: [[0, 1]] as [number, number][],
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          ["ns-no-ver", { format: "multiRange" as const }],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.filters[0].hashVersion).toBe(2);
      });

      it("preserves existing filters and appends new one", () => {
        const rule: Record<string, unknown> = {
          filters: [{ attribute: "existing", seed: "old", hashVersion: 1, ranges: [[0, 1]] }],
        };
        const namespace = {
          enabled: true,
          name: "ns-append",
          ranges: [[0.2, 0.6]] as [number, number][],
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          ["ns-append", { format: "multiRange" as const }],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.filters).toHaveLength(2);
        expect(rule.filters[0].attribute).toBe("existing");
        expect(rule.filters[1].attribute).toBe("id");
      });

      it("uses hashVersion from namespace when present", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "ns-hv",
          ranges: [[0, 1]] as [number, number][],
          hashVersion: 3,
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          ["ns-hv", { format: "multiRange" as const }],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.filters[0].hashVersion).toBe(3);
      });
    });

    describe("multiRange format fallback via isMultiRangeNamespaceFormat", () => {
      it("detects multiRange structurally when nsDefinition is missing", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "ns-structural",
          ranges: [[0.1, 0.4], [0.6, 0.9]] as [number, number][],
          hashAttribute: "device_id",
          hashVersion: 2,
          format: "multiRange" as const,
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.filters).toBeDefined();
        expect(rule.filters).toHaveLength(1);
        expect(rule.filters[0]).toEqual({
          attribute: "device_id",
          seed: "ns-structural",
          hashVersion: 2,
          ranges: [[0.1, 0.4], [0.6, 0.9]],
        });
        expect(rule.namespace).toBeUndefined();
      });

      it("uses namespace hashAttribute when nsDefinition is absent", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "ns-no-def",
          ranges: [[0, 0.5]] as [number, number][],
          hashAttribute: "explicit_hash_attr",
          format: "multiRange" as const,
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.filters[0].attribute).toBe("explicit_hash_attr");
      });

      it("falls back to rule.hashAttribute when namespace has no hashAttribute and no nsDefinition", () => {
        const rule: Record<string, unknown> = { hashAttribute: "fallback_attr" };
        const namespace = {
          enabled: true,
          name: "ns-no-hash-attr",
          ranges: [[0, 1]] as [number, number][],
          format: "multiRange" as const,
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.filters[0].attribute).toBe("fallback_attr");
      });
    });

    describe("legacy format", () => {
      it("sets traditional [name, start, end] tuple on rule.namespace", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "legacy-ns",
          range: [0.2, 0.7] as [number, number],
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.namespace).toEqual(["legacy-ns", 0.2, 0.7]);
        expect(rule.filters).toBeUndefined();
      });

      it("uses nsDefinition format=legacy to force legacy path even with ranges field", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "forced-legacy",
          ranges: [[0.1, 0.5]] as [number, number][],
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          [
            "forced-legacy",
            {
              format: "legacy" as const,
            },
          ],
        ]);

        applyNamespaceToPayload(
          rule as never,
          namespace as never,
          namespacesMap as never,
        );

        expect(rule.namespace).toEqual(["forced-legacy", 0.1, 0.5]);
        expect(rule.filters).toBeUndefined();
      });

      it("handles legacy namespace with empty range", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "empty-range-ns",
          range: [0, 0] as [number, number],
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.namespace).toEqual(["empty-range-ns", 0, 0]);
      });

      it("handles legacy namespace with no range field", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "no-range-ns",
        } as Record<string, unknown>;

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.namespace).toEqual(["no-range-ns", 0, 0]);
      });
    });

    describe("defensive number conversion for string range values", () => {
      it("converts string range values like '0.5' to numbers", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "string-range-ns",
          range: ["0.1", "0.5"] as unknown as [number, number],
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.namespace).toEqual(["string-range-ns", 0.1, 0.5]);
      });

      it("converts string range values in multiRange format", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "string-multi-ns",
          ranges: [["0", "0.3"], ["0.5", "0.8"]] as unknown as [number, number][],
          hashAttribute: "id",
          format: "multiRange" as const,
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.filters[0].ranges).toEqual([
          [0, 0.3],
          [0.5, 0.8],
        ]);
      });

      it("falls back to 0 for non-numeric string values", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "bad-string-ns",
          range: ["abc", "xyz"] as unknown as [number, number],
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.namespace).toEqual(["bad-string-ns", 0, 0]);
      });

      it("handles mixed valid and invalid string values", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "mixed-ns",
          range: ["0.3", "invalid"] as unknown as [number, number],
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.namespace).toEqual(["mixed-ns", 0.3, 0]);
      });

      it("handles string numbers in multiRange ranges array", () => {
        const rule: Record<string, unknown> = {};
        const namespace = {
          enabled: true,
          name: "mixed-multi-ns",
          ranges: [
            ["0.2", "0.4"],
            ["bad", "0.9"],
          ] as unknown as [number, number][],
          hashAttribute: "id",
          format: "multiRange" as const,
        };

        applyNamespaceToPayload(rule as never, namespace as never);

        expect(rule.filters[0].ranges).toEqual([
          [0.2, 0.4],
          [0, 0.9],
        ]);
      });
    });
  });
});
