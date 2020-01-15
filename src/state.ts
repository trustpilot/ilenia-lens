import * as vscode from 'vscode';
import flatten from "./flatten";
let fs = require("fs");

export async function initIndex(context: vscode.ExtensionContext, projects: any) {
    const index = {} as any;
    Object.keys(projects).map((p) => {
        index[p] = { };
    });
    await context.workspaceState.update('index', index);
}

export async function buildIndex(context: vscode.ExtensionContext, localizationFiles: any) {
    const index = {} as any;
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
                        refs: {},
                    };
                }
            });
            index[project].locales[localizationCode] = uri;
        });
        await Promise.all(promises);
    });
    await Promise.all(promises);
    // Dump state
    fs.writeFileSync('/Users/vda/IdeaProjects/ilenia-lens/state.json', JSON.stringify(index, null, 2), 'utf8');
    await context.workspaceState.update('index', index);
}
