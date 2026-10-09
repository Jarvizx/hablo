declare module 'claude-code' {
  interface PluginState {
    hablo: { speaking: string | null; frame: number; lastReply: string }
  }
}
