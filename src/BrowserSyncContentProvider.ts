'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from "child_process";

export default class RefreshContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private _waiting: boolean = false;
    private i = 1;

    get onDidChange(): vscode.Event<vscode.Uri> {
		return this._onDidChange.event;
	}

	public update(uri: vscode.Uri) {
		if (!this._waiting) {
			this._waiting = true;
			setTimeout(() => {
				this._waiting = false;
				this._onDidChange.fire(uri);
			}, 300);
		}
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        // https://github.com/Microsoft/vscode/blob/master/extensions/markdown/src/extension.ts
        // https://github.com/Microsoft/vscode/blob/master/extensions/markdown/src/previewContentProvider.ts
        // https://github.com/Microsoft/vscode-mssql/issues/669
        console.log('provideTextDocumentContent');
        // // In VSCode 1.9.0, it does a string comparison and only refreshes the page if the content is different
        this.i++;

        let src = null;
        if (uri.fragment === "server"){
            let fileName = path.basename(uri.fsPath);
            src = `http://localhost:${uri.query}/${fileName}`
        } else {
            src = `http://localhost:${uri.query}`
        }

        return `
            <html>
                <head>
                    ${this.i}
                    <style>
                         body, html, div {
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                            height: 100%;
                            background-color: #fff;
                        }
                    </style>
                </head>
                <body>
                    <div>
                        <iframe src="${src}" width="100%" height="100%" seamless frameborder=0></iframe>
                    </div>
                </body>
            </html>
        `;
    }
}