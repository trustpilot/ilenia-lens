import * as vscode from 'vscode';
import { flatten, reverseTraverse } from './flatten';

export class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private index: { [key: string]: any } | undefined = {};
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(_index: {} | undefined) {
        this.index = _index;
        this.regex = /(.+)/g;

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (this.index && document.languageId === 'json') {
            const project = Object.keys(this.index).find((project: string) => {
                return document.uri.path.indexOf(project) !== -1;
            });
            if (!project) return [];
            this.codeLenses = [];
            const text = document.getText();
            if (text.length > 0) {
                const localizationStrings = flatten(JSON.parse(text));
                const translations = this.index[project].translations;

                const lensCache = {} as any;
                Object.keys(localizationStrings).map((translationId) => {
                    if (translations[translationId] && translations[translationId].refs.length === 0) {
                        const splits = translationId.split('.');
                        const split = splits[splits.length - 1];
                        const regex = new RegExp(`["|']${split}["|']`, 'g');
                        const match = regex.exec(text);
                        if (match) {
                            const line = document.lineAt(document.positionAt(match.index).line);
                            const indexOf = line.text.lastIndexOf(split);
                            const position = new vscode.Position(line.lineNumber, indexOf);
                            const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                            const lookUpString = text.slice(0, document.offsetAt(range!.end));
                            const lookUpTranslationId = reverseTraverse(lookUpString, split);
                            if (translationId === lookUpTranslationId && range && !lensCache[split]) {
                                lensCache[split] = 1;
                                const command: vscode.Command = {
                                    title: "Remove unused translation",
                                    command: "ilenia-lens.codelensAction",
                                    arguments: [range],
                                };
                                this.codeLenses.push(new vscode.CodeLens(range, command));
                            }
                        }
                    }
                });
                return this.codeLenses;
            }
        }

        return [];
    }
}
