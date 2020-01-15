import * as vscode from 'vscode';

export async function initIndex(context: vscode.ExtensionContext, projects: any) {
    const index = {} as any;
    Object.keys(projects).map((p) => {
        index[p] = { };
    });
    await context.workspaceState.update('index', index);
}