import * as vscode from "vscode";
import { getCurrentProject, getScripts } from "./files";
import { CancellationToken, Location, Position, ReferenceContext, TextDocument } from "vscode";
import { reverseTraverse } from './flatten';
// let fs = require("fs");

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
  // fs.writeFileSync('/Users/pov/git/hackathon/ilenia-lens/state.json', JSON.stringify(index, null, 2), 'utf8');
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
    const range = document.getWordRangeAtPosition(position);
    const key = document.getText(range).replace(/"/g, "");
    const lookUpString = document.getText().slice(0, document.offsetAt(range!.end));
    return reverseTraverse(lookUpString, key);
  }
}
