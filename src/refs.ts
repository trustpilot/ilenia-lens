import * as vscode from "vscode";
import {getCurrentProject, getScripts} from "./files";
import {CancellationToken, Location, Position, ReferenceContext, TextDocument} from "vscode";

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
      const regex = new RegExp(`["|']${translationId}["|']`, 'g');
      let match;
      const locations = [];
      while ((match = regex.exec(scriptText)) !== null) {
        const position = scriptFile.positionAt(match.index);
        const endPosition = position.translate(0, translationId.length);
        locations.push(new Location(uri, new vscode.Range(position, endPosition)));
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

export class ReferenceProvider implements vscode.ReferenceProvider {
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public async provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Promise<Location[]> {
    const project = await getCurrentProject(this.context, document);
    const translationId = ReferenceProvider.getFlattenedTranslationId(document, position);
    const index = await this.context.workspaceState.get('index') as any;
    return index[project].translations[translationId].refs;
  }

  private static getFlattenedTranslationId(document: TextDocument, position: Position) {
    const translationIdPath = [] as string[];
    const range = document.getWordRangeAtPosition(position);
    const key = document.getText(range).replace(/"/g, "");
    translationIdPath.push(key);
    const lookUpString = document.getText().slice(0, document.offsetAt(range!.end));
    let bracketIndex = 0;
    for (let i = lookUpString.length - 1; i >= 0; i--) {
      if (lookUpString[i] === '{') {
        if (bracketIndex === 0) {
          const slice = lookUpString.slice(0, i);
          const matches = slice.match(/"(.*?)"/g);
          if (!matches) {
            break;
          }
          const parentKey = matches[matches.length - 1].replace(/"/g, "");
          translationIdPath.push(parentKey);
        } else {
          bracketIndex -= 1;
        }
      }
      if (lookUpString[i] === '}') {
        bracketIndex += 1;
      }
    }
    return translationIdPath.reverse().join('.');
  }
}
