import * as vscode from 'vscode';
import { reverseTraverse } from './flatten';
import { getCurrentProject } from "./files";

export class IleniaDefinitionProvider implements vscode.DefinitionProvider {
    private readonly context: vscode.ExtensionContext;
    private readonly regex: RegExp;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.regex = /(.+)/g;
    }

    public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        const project = await getCurrentProject(this.context, document);

        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const leftTerms = linePrefix.split('"');
        const leftTerm = leftTerms[leftTerms.length-1];

        const lineSuffix = document.lineAt(position).text.substr(position.character);
        const rightTerms = lineSuffix.split('"');
        const rightTerm = rightTerms.length > 0 ? rightTerms[0] : '';
        
        const translationId = `${leftTerm}${rightTerm}`;

        const index = await this.context.workspaceState.get('index') as any;
        const locales = index[project].locales;
        const locale = Object.keys(locales).find((l) => l === 'en-US');

        try {
            if (locale) {            
                const stringsDoc = await vscode.workspace.openTextDocument(locales[locale]);
                const text = stringsDoc.getText();
                const splits = translationId.split('.');
                const split = splits[splits.length - 1];
                const regex = new RegExp(`["|']${split}["|']`, 'g');
                let match;
                const locations = [];                
                while ((match = regex.exec(text)) !== null) {
                    if (match) {                        
                        const line = stringsDoc.lineAt(stringsDoc.positionAt(match.index).line);
                        const indexOf = line.text.lastIndexOf(split);
                        const position = new vscode.Position(line.lineNumber, indexOf);
                        const range = stringsDoc.getWordRangeAtPosition(position, new RegExp(this.regex));
                        const lookUpString = text.slice(0, stringsDoc.offsetAt(range!.end));
                        const lookUpTranslationId = reverseTraverse(lookUpString, split);
                        if (translationId === lookUpTranslationId && range) {
                            locations.push(new vscode.Location(locales[locale], range));
                        }
                    }
                }
                return locations;
            }
        } catch(e) {
            console.log(e);
        }
        
        return [];
    }
}