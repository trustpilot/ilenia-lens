import { ExtensionContext, window, OverviewRulerLane, DecorationOptions, Range, Disposable, workspace } from 'vscode';
import { types } from './extension';
import { getCurrentProject } from './files';

const noDecoration = window.createTextEditorDecorationType({});

const errorDecoration = window.createTextEditorDecorationType({
    overviewRulerColor: 'red',
    overviewRulerLane: OverviewRulerLane.Right,
    textDecoration: 'red wavy underline'
});

export function underline(context: ExtensionContext): Disposable[] {
	let timeout: NodeJS.Timer | undefined = undefined;
  let activeEditor = window.activeTextEditor;
  
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateUnderlines, 500);
	}

	if (window.activeTextEditor) {
		triggerUpdateDecorations();
	}

	const editorListener = window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	const documentListener = workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

  async function updateUnderlines () {
    if (!activeEditor) {
      return;
    }

    const { document } = activeEditor;
    if (!types.includes(document.languageId) || !(document.uri.scheme === "file")) {
      return;
    }

    const index = await context.workspaceState.get('index') as any;
    if (!index) {
        return undefined;
    }
    const project = await getCurrentProject(context, document);
    if (!project) {
        return undefined;
    }
    const { translations } = index[project];

    const text = document.getText();
    const ids = findIds(text);
    console.log(JSON.stringify(ids, null, 2));
    const errors: DecorationOptions[] = [];
    const normal: DecorationOptions[] = [];

    ids.forEach(({ id, start, end }) => {
      const range = new Range(document.positionAt(start), document.positionAt(end));
      if (translations[id]) {
        normal.push({ range });
      } else {
        errors.push({ range });
      }
    });

    activeEditor.setDecorations(errorDecoration, errors);
    activeEditor.setDecorations(noDecoration, normal);
  }

  updateUnderlines();

  return [editorListener, documentListener];
}

export interface MatchedId {
  id: string;
  start: number;
  end: number;
  exist: boolean;
}

export function findIds(text: string): MatchedId[] {
  const regexps = [
    RegExp('id=[\'\"`]([[\\w\\d\\. \\-\\[\\]]*?)[\'\"`]'),
  ];
  
  const ids = [];
  for (const reg of regexps) {
    let match = null;
    while (match = reg.exec(text)) {
      const property = match[0];
      let id = match[1];
      const start = match.index + property.indexOf(id);
      const end = start + id.length;

      if (id) {
        ids.push({ id, start, end, exist: false });
      }
    }
  }
  return ids;
}
