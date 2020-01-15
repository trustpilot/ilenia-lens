import { Uri, ExtensionContext, TextDocument } from "vscode";
import { workspace } from 'vscode';

export async function getProjects() {
    const packages = await workspace.findFiles('**/package.json', '**/{node_modules,dist,build}/**');
    const results = {} as any;
	packages.map((p: Uri) => {
        const pathSplit = p.path.split('/');
        const key = pathSplit[pathSplit.length - 2];
		results[key] = p.path.replace('package.json', '');
    });
    return results;
}

export async function getLocalizations(projects: any) {
    const results = {} as any;
    const filesPromises = Object.keys(projects).map(async (key) => {
        const wholePath = `{**/${key}/**,*}/localization/**/{strings,string}.json`;
        const files = await workspace.findFiles(wholePath, '**/{node_modules,dist,build}/**');
        if (files.length > 0) {
            results[key] = files;
        }
    });
    await Promise.all(filesPromises);
    return results;
}

export async function getProjectLocalizations(project: string) {
    console.log(project);
    const results = {} as any;
    const wholePath = `{**/${project}/**,*}/localization/**/{strings,string}.json`;
    const files = await workspace.findFiles(wholePath, '**/{node_modules,dist,build}/**');
    if (files.length > 0) {
        results[project] = files;
    }
    return results;
}

export async function getScripts(project: string) {
    console.log(project);
    const wholePath = `**/${project}/**/*.{js,jsx,ts,tsx}`;
    const files = await workspace.findFiles(wholePath, '**/{node_modules,dist,build}/**');
    if (files.length > 0) {
        return files;
    } else {
        const subPath = `**/*.{js,jsx,ts,tsx}`;
        return workspace.findFiles(subPath, '**/{node_modules,dist,build}/**');
    }
}

export async function getCurrentProject(context: ExtensionContext, doc: TextDocument): Promise<string | undefined> {
    const index = await context.workspaceState.get('index') as any;
    const found = Object.keys(index).find((project: string) => {
        return doc.uri.path.indexOf(project) !== -1;
    });
    console.log(`Project ${found}`);
    return found || undefined;
}
