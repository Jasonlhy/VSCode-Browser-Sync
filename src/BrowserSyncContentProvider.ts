'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from "child_process";

export default class RefreshContentProvider implements vscode.TextDocumentContentProvider {

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        console.log('provideTextDocumentContent');

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