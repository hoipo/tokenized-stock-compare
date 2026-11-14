interface Attempt<T> {
  label: string
  run: () => Promise<T>
}

/**
 * Start every attempt, but resolve with the highest-priority success whose
 * earlier attempts have already failed. A slower backup cannot overtake a
 * still-running preferred attempt.
 */
export function preferFirstSuccess<T>(attempts: Attempt<T>[]): Promise<T> {
  if (attempts.length === 0) return Promise.reject(new Error("no attempts"))

  return new Promise((resolve, reject) => {
    let settledCount = 0
    let finished = false
    const states = attempts.map(() => ({
      status: "pending" as "pending" | "ok" | "err",
      value: undefined as T | undefined,
      error: "request failed",
    }))

    function finish() {
      if (finished) return
      const winnerIndex = states.findIndex((state, index) => {
        if (state.status !== "ok") return false
        return states.slice(0, index).every((higher) => higher.status === "err")
      })
      if (winnerIndex >= 0) {
        finished = true
        resolve(states[winnerIndex].value as T)
        return
      }
      if (settledCount !== states.length) return
      finished = true
      const message = states
        .map((state, index) => `${attempts[index].label}: ${state.error}`)
        .join("; ")
      reject(new Error(message))
    }

    attempts.forEach((attempt, index) => {
      let task: Promise<T>
      try {
        task = attempt.run()
      } catch (error) {
        task = Promise.reject(error)
      }
      void task.then(
        (value) => {
          states[index] = { status: "ok", value, error: "" }
          settledCount += 1
          finish()
        },
        (error: unknown) => {
          states[index] = {
            status: "err",
            value: undefined,
            error: error instanceof Error ? error.message : "request failed",
          }
          settledCount += 1
          finish()
        },
      )
    })
  })
}
