import * as vscode from 'vscode';
import flatten from './flatten';

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
        if (this.index && document.languageId === 'json' && document.fileName.endsWith('strings.json')) {
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
                Object.keys(localizationStrings).map((key) => {
                    if (Object.keys(translations[key].refs).length === 0) {
                        const splits = key.split('.');
                        const split = splits[splits.length - 1];
                        const line = document.lineAt(document.positionAt(text.indexOf(split)).line);
                        const indexOf = line.text.lastIndexOf(split);
                        const position = new vscode.Position(line.lineNumber, indexOf);
                        const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                        if (range && !lensCache[split]) {
                            lensCache[split] = 1;
                            const command: vscode.Command = {
                                title: "Remove unused translation",
                                tooltip: "Tooltip provided by sample extension",
                                command: "ilenia-lens.codelensAction",
                                arguments: [range]
                            };
                            this.codeLenses.push(new vscode.CodeLens(range, command));
                        }
                    }
                });
                return this.codeLenses;
            }
        }

        return [];
    }
}
