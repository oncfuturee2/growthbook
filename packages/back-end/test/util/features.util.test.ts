import { applyEnvironmentInheritance, applyNamespaceToPayload } from "../../src/util/features";

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
    describe("multiRange format", () => {
      it("正确生成包含 attribute, seed, hashVersion 和 ranges 的 filters 数组", () => {
        const rule = {};
        const namespace = {
          enabled: true,
          name: "test-namespace",
          ranges: [[0, 0.5]],
          format: "multiRange",
        };
        const namespacesMap = new Map([
          ["test-namespace", {
            hashAttribute: "custom-id",
            seed: "custom-seed",
            format: "multiRange" as const
          }]
        ]);

        applyNamespaceToPayload(rule as any, namespace as any, namespacesMap);

        expect(rule).toEqual({
          filters: [{
            attribute: "custom-id",
            seed: "custom-seed",
            hashVersion: 2,
            ranges: [[0, 0.5]]
          }]
        });
      });

      it("当缺失 namespace definition 时，正确回退并利用 isMultiRangeNamespaceFormat 判断结构", () => {
        const rule = { hashAttribute: "rule-hash-id" };
        const namespace = {
          enabled: true,
          name: "test-namespace",
          ranges: [[0, 0.3], [0.6, 0.8]],
          hashVersion: 3,
          format: "multiRange",
        };

        applyNamespaceToPayload(rule as any, namespace as any);

        expect(rule).toEqual({
          hashAttribute: "rule-hash-id",
          filters: [{
            attribute: "rule-hash-id",
            seed: "test-namespace",
            hashVersion: 3,
            ranges: [[0, 0.3], [0.6, 0.8]]
          }]
        });
      });

      it("保留 rule 上已有的 filters", () => {
        const rule = {
          filters: [{
            attribute: "existing",
            seed: "existing",
            hashVersion: 1,
            ranges: [[0, 1]]
          }]
        };
        const namespace = {
          enabled: true,
          name: "test-namespace",
          ranges: [[0, 0.5]],
          format: "multiRange",
        };

        applyNamespaceToPayload(rule as any, namespace as any);

        expect(rule).toEqual({
          filters: [
            {
              attribute: "existing",
              seed: "existing",
              hashVersion: 1,
              ranges: [[0, 1]]
            },
            {
              attribute: "id",
              seed: "test-namespace",
              hashVersion: 2,
              ranges: [[0, 0.5]]
            }
          ]
        });
      });
    });

    describe("legacy format", () => {
      it("在 rule 对象上正确设置传统的 [name, start, end] 元组", () => {
        const rule = {};
        const namespace = {
          enabled: true,
          name: "legacy-namespace",
          range: [0.2, 0.7],
          format: "legacy" as const,
        };

        applyNamespaceToPayload(rule as any, namespace as any);

        expect(rule).toEqual({
          namespace: ["legacy-namespace", 0.2, 0.7]
        });
      });

      it("当 namespace definition 明确格式为 legacy 时，使用传统格式", () => {
        const rule = {};
        const namespace = {
          enabled: true,
          name: "test-namespace",
          ranges: [[0.3, 0.6]], // 尽管这里用的是 ranges，但定义里强制 legacy
          format: "multiRange" as const,
        };
        const namespacesMap = new Map([
          ["test-namespace", { format: "legacy" as const }]
        ]);

        applyNamespaceToPayload(rule as any, namespace as any, namespacesMap);

        expect(rule).toEqual({
          namespace: ["test-namespace", 0.3, 0.6]
        });
      });
    });

    describe("防御性处理字符串范围值", () => {
      it("对异常字符串格式（如 '0.5'）的 range 范围进行防御性数字转换", () => {
        const rule = {};
        const namespace = {
          enabled: true,
          name: "string-range-namespace",
          // @ts-ignore 故意模拟字符串格式的范围
          range: ["0.3", "0.7"],
        };

        applyNamespaceToPayload(rule as any, namespace as any);

        expect(rule).toEqual({
          namespace: ["string-range-namespace", 0.3, 0.7]
        });
      });

      it("对 multiRange 格式中的字符串范围值进行防御性转换", () => {
        const rule = {};
        const namespace = {
          enabled: true,
          name: "string-ranges-namespace",
          // @ts-ignore 故意模拟字符串格式的范围
          ranges: [["0.1", "0.4"], ["0.6", "0.9"]],
          format: "multiRange",
        };

        applyNamespaceToPayload(rule as any, namespace as any);

        expect(rule).toEqual({
          filters: [{
            attribute: "id",
            seed: "string-ranges-namespace",
            hashVersion: 2,
            ranges: [[0.1, 0.4], [0.6, 0.9]]
          }]
        });
      });

      it("对无效值（如 NaN）进行防御性处理，默认到 0", () => {
        const rule = {};
        const namespace = {
          enabled: true,
          name: "invalid-range-namespace",
          // @ts-ignore 故意模拟无效的范围值
          range: ["invalid", null],
        };

        applyNamespaceToPayload(rule as any, namespace as any);

        expect(rule).toEqual({
          namespace: ["invalid-range-namespace", 0, 0]
        });
      });
    });
  });
});
