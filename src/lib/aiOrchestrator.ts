export type OrchestratorResult = {
  role: string;
  success: boolean;
  result?: string;
  error?: string;
};

export type AIClient = {
  generate: (opts: { projectId: string; role: string; directorInputs?: any }) => Promise<string>;
};

/**
 * Run a simple deterministic orchestrator. If an `aiClient` is provided it will be used; otherwise
 * deterministic mock results are returned so tests are stable and offline.
 */
export async function runOrchestrator(
  projectId: string,
  roles: string[],
  directorInputs?: any,
  aiClient?: AIClient
): Promise<OrchestratorResult[]> {
  const promises = roles.map(async (role) => {
    try {
      if (aiClient && typeof aiClient.generate === 'function') {
        const r = await aiClient.generate({ projectId, role, directorInputs });
        return { role, success: true, result: r } as OrchestratorResult;
      }

      // deterministic fallback
      const coreTheme = directorInputs?.core_theme || 'no-theme';
      const result = `Mock idea for ${role} (${projectId}) with theme ${coreTheme}`;
      return { role, success: true, result } as OrchestratorResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { role, success: false, error: message } as OrchestratorResult;
    }
  });

  return Promise.all(promises);
}
