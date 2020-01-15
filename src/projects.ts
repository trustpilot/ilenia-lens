import { Uri } from "vscode";

export async function getProjects(workspace: any) {
    const packages = await workspace.findFiles('**/package.json', '**/node_modules/**');
    const results = {} as any;
	packages.map((p: Uri) => {
        const pathSplit = p.path.split('/');
        const key = pathSplit[pathSplit.length - 2];
		results[key] = p.path.replace('package.json', '');
    });
    return results;
}