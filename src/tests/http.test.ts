import { describe, expect, it } from "vitest"
import { sourceFailureMessage } from "@/lib/http"

describe("sourceFailureMessage", () => {
  it("removes upstream URLs from errors shown to readers", () => {
    expect(
      sourceFailureMessage(new Error("HTTP 502 for https://api.example.com/assets?page=2"), "failed"),
    ).toBe("HTTP 502 for")
  })

  it("uses the fallback when the message is only a URL", () => {
    expect(sourceFailureMessage(new Error("https://api.example.com/secret"), "failed")).toBe("failed")
  })

  it("hides framework render errors that omit the real cause", () => {
    const message =
      "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance."
    expect(sourceFailureMessage(new Error(message), "Comparison failed")).toBe("Comparison failed")
  })
})
