export function createBotLogger(botName: string) {
  const prefix = `[${botName}]`
  return {
    info(message: string) {
      console.log(`${prefix} ${message}`)
    },
    step(message: string) {
      console.log(`${prefix} → ${message}`)
    },
    warn(message: string) {
      console.warn(`${prefix} ⚠ ${message}`)
    },
  }
}
