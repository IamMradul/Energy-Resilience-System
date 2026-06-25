const GEMINI_FREE_LIMITS = {
  requestsPerMinute: 15,
  tokensPerDay: 1_000_000
}

let callsThisMinute = 0
let minuteStart = Date.now()
let tokensToday = 0

export function canCallGemini(): boolean {
  const now = Date.now()
  if (now - minuteStart > 60_000) {
    callsThisMinute = 0
    minuteStart = now
  }
  return callsThisMinute < GEMINI_FREE_LIMITS.requestsPerMinute
}

export function recordGeminiCall(tokensUsed: number) {
  callsThisMinute++
  tokensToday += tokensUsed
  console.log(`Gemini usage: ${callsThisMinute}/min | ${tokensToday.toLocaleString()}/${GEMINI_FREE_LIMITS.tokensPerDay} tokens today`)
}

export function getUsageStats() {
  return {
    callsThisMinute,
    tokensToday,
    remainingTokensToday: GEMINI_FREE_LIMITS.tokensPerDay - tokensToday,
    withinLimits: tokensToday < GEMINI_FREE_LIMITS.tokensPerDay
  }
}
