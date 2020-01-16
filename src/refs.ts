import * as vscode from "vscode";

export async function findReferences(context: vscode.ExtensionContext, doc: vscode.TextDocument) {
  const index = context.workspaceState.get('index') as any;
  const promises = Object.keys(index).map(async (project: string) => {
    if (doc.uri.path.indexOf(project) > 1) {
      // const scripts = findScripts
      const projectIndex = index[project];
      const promises = Object.keys(projectIndex.translations).map(async (translationId: string) => {
        const result = await vscode.commands.executeCommand<(vscode.SymbolInformation | vscode.DocumentSymbol)[]>('vscode.executeWorkspaceSymbolProvider', translationId);
        if (result && result.length > 0) {
          console.log(result);
        } else {
          console.log(translationId);
        }
      });
      await Promise.all(promises);
    }
  });
  await Promise.all(promises);
}
