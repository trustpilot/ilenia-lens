import * as vscode from "vscode";
import { getCurrentProject, getScripts } from "./files";
import { CancellationToken, Location, Position, ReferenceContext, TextDocument } from "vscode";
import { reverseTraverse } from './flatten';

export async function findReferences(context: vscode.ExtensionContext, project: string) {
  const index = await context.workspaceState.get('index') as any;
  const scripts = await getScripts(project);
  console.debug(`script files: ${scripts.length}`);
  const projectIndex = index[project];

  Object.keys(projectIndex.translations).map((translationId: string) => {
    projectIndex.translations[translationId].refs = [];
  });
  const promises = scripts.map(async (uri: vscode.Uri) => {
    const scriptFile = (await vscode.workspace.openTextDocument(uri));
    const scriptText = scriptFile.getText();
    const promises = Object.keys(projectIndex.translations).map(async (translationId: string) => {
      const regex = new RegExp(`["|']${translationId}["|']`, 'g');
      let match;
      const locations = [];
      while ((match = regex.exec(scriptText)) !== null) {
        const position = scriptFile.positionAt(match.index);
        const endPosition = position.translate(0, translationId.length);
        locations.push(new Location(uri, new vscode.Range(position, endPosition)));
      }
      projectIndex.translations[translationId].refs = [...projectIndex.translations[translationId].refs, ...locations];
    });
    await Promise.all(promises);
  });
  await Promise.all(promises);
  await context.workspaceState.update('index', index);  
}

export class ReferenceProvider implements vscode.ReferenceProvider {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public async provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Promise<Location[]> {
    const project = await getCurrentProject(this.context, document);
    if (!project) { return []; }
    const translationId = ReferenceProvider.getFlattenedTranslationId(document, position);
    const index = this.context.workspaceState.get('index') as any;
    return [...index[project].translations[translationId].refs, new Location(document.uri, position)];
  }

  private static getFlattenedTranslationId(document: TextDocument, position: Position) {
    const range = document.getWordRangeAtPosition(position);
    const key = document.getText(range).replace(/"/g, "");
    const lookUpString = document.getText().slice(0, document.offsetAt(range!.end));
    return reverseTraverse(lookUpString, key);
  }
}
