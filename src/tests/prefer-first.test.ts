import { describe, expect, it } from "vitest"
import { preferFirstSuccess } from "@/lib/prefer-first"

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  let reject: (error: Error) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("preferFirstSuccess", () => {
  it("returns the preferred attempt without waiting for a later success", async () => {
    const second = deferred<string>()
    const result = preferFirstSuccess([
      { label: "first", run: async () => "a" },
      { label: "second", run: () => second.promise },
    ])
    await expect(result).resolves.toBe("a")
    second.resolve("b")
  })

  it("waits for a higher-priority failure before accepting a backup", async () => {
    const first = deferred<string>()
    const result = preferFirstSuccess([
      { label: "first", run: () => first.promise },
      { label: "second", run: async () => "b" },
    ])
    let settled = false
    void result.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)
    first.reject(new Error("nope"))
    await expect(result).resolves.toBe("b")
  })

  it("joins every failure", async () => {
    await expect(
      preferFirstSuccess([
        { label: "first", run: async () => Promise.reject(new Error("one")) },
        { label: "second", run: async () => Promise.reject(new Error("two")) },
      ]),
    ).rejects.toThrow("first: one; second: two")
  })
})
