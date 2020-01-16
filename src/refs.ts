import * as vscode from "vscode";
import {getCurrentProject, getScripts} from "./files";

export async function findReferences(context: vscode.ExtensionContext, doc: vscode.TextDocument) {
  const index = context.workspaceState.get('index') as any;
  const project = await getCurrentProject(context, doc);
  if (!project) { return; }
  // Text search in all project files (too slow)
  // Will need to do something about it in the future!
  const scripts = await getScripts(project);
  const projectIndex = index[project];
  const promises = scripts.map(async (uri: vscode.Uri) => {
    const scriptFile = (await vscode.workspace.openTextDocument(uri));
    const scriptText = scriptFile.getText();
    const promises = Object.keys(projectIndex.translations).map(async (translationId: string) => {
      const regex = new RegExp(translationId, 'g');
      let match;
      const locations = [];
      while ((match = regex.exec(scriptText)) !== null) {
        const position = scriptFile.positionAt(match.index);
        const endPosition = position.translate(0, translationId.length);
        locations.push(new vscode.Location(uri, new vscode.Range(position, endPosition)));
      }
      if (locations.length > 0) {
        projectIndex.translations[translationId].refs = locations;
      }
    });
    await Promise.all(promises);
  });
  await Promise.all(promises);
  await context.workspaceState.update('index', index);
}
