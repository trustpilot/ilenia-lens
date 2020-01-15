import * as vscode from 'vscode';
import { flatten } from "./flatten";

export async function initIndex(context: vscode.ExtensionContext, projects: any) {
    const index = {} as any;
    Object.keys(projects).map((p) => {
        index[p] = { };
    });
    await context.workspaceState.update('index', index);
}

export async function buildIndex(context: vscode.ExtensionContext, localizationFiles: any) {
    const index = context.workspaceState.get('index') as any;
    // Iterate over keys of { [projectId]: Uri[] }
    const promises = Object.keys(localizationFiles).map(async (project: string) => {
        index[project] = {
            translations: {},
            locales: {}
        };
        const uris = localizationFiles[project];
        const promises = uris.map(async (uri: vscode.Uri) => {
            const uriPathSplit = uri.path.split('/');
            const file = await vscode.workspace.fs.readFile(uri); // Returns file bytestream

            const localizationCode = uriPathSplit[uriPathSplit.length - 2]; // extract lang code from filepath
            try {
                const localizationStrings = flatten(JSON.parse(file.toString()));
                const localizationIds = Object.keys(localizationStrings);
                localizationIds.map((localizationId: string) => {
                    const translations = index[project].translations;
                    if (translations.hasOwnProperty(localizationId)) {
                        translations[localizationId].languages[localizationCode] = localizationStrings[localizationId];
                    } else {
                        translations[localizationId] = {
                            languages: {
                                [localizationCode]: localizationStrings[localizationId],
                            },
                            refs: [],
                        };
                    }
                });
            } catch (e) {
                return;
            }
            index[project].locales[localizationCode] = uri;
        });
        await Promise.all(promises);
    });
    await Promise.all(promises);
    await context.workspaceState.update('index', index);
}

export async function rebuildIndex(context: vscode.ExtensionContext, document: vscode.TextDocument, project: string) {
    const index = await context.workspaceState.get('index') as any;
    const uriPathSplit = document.uri.path.split('/');
    const localizationCode = uriPathSplit[uriPathSplit.length - 2]; // extract lang code from filepath
    const scriptText = document.getText();
    const localizationStrings = flatten(JSON.parse(scriptText));
    const localizationIds = Object.keys(localizationStrings);
    localizationIds.map((localizationId: string) => {
        const translations = index[project].translations;
        if (translations.hasOwnProperty(localizationId)) {
            translations[localizationId].languages[localizationCode] = localizationStrings[localizationId];
        } else {
            translations[localizationId] = {
                languages: {
                    [localizationCode]: localizationStrings[localizationId],
                },
                refs: [],
            };
        }
    });
    index[project].locales[localizationCode] = document.uri;
    await context.workspaceState.update('index', index);
}
