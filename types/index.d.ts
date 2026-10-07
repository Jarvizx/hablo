declare module 'claude-code' {
  interface PluginState {
    'hablo': { speaking: string | null; lastReply: string }
  }
}
