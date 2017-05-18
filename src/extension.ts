'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';
import * as browserSync from 'browser-sync'
import * as portfinder from 'portfinder'

import BrowserSyncContentProvider from './BrowserSyncContentProvider';
const SCHEME_NAME: string = 'JasonBrowserSync';
let runningBS = [];

function getBrowserSyncUri(uri: vscode.Uri, port: number) {
    if (uri.scheme === SCHEME_NAME) {
        return uri;
    }

    return uri.with({
        scheme: SCHEME_NAME,
        path: uri.fsPath,
        query: port.toString()
    });
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "vscode-browser-sync" is now active!');

    const contentProvider = new BrowserSyncContentProvider();
    vscode.workspace.registerTextDocumentContentProvider(SCHEME_NAME, contentProvider);

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.browserSyncServerAtPanel', startServer));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.browserSyncProxyAtPanel', startProxy));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.exitAll', exitAll));
}

function openSidePanel(port: number) {
    const editor = vscode.window.activeTextEditor;
    const doc = editor.document;
    let uri = getBrowserSyncUri(doc.uri, port);

    vscode.commands
        .executeCommand('vscode.previewHtml', uri, vscode.ViewColumn.Two)
        .then(s => console.log('done'), vscode.window.showErrorMessage);
}

function startServer() {
    let doc = vscode.window.activeTextEditor.document;
    // let cwd = vscode.workspace.rootPath || path.dirname(doc.uri.fsPath);
    let cwd = path.dirname(doc.uri.fsPath);
    let files = ["*.html"];
    files = files.map(p => path.join(cwd, p))

    // It must use absolute path
    // Canont use relatie path to the cwd such as ["./*.html"]
    // It autodetect the free port for you
    let bs = browserSync.create();
    bs.init(
        {
            open: false,
            files: files,
            server: {
                baseDir: cwd,
                directory: true
            }
        },
        function () {
            // I find this method under the debugger not inside the documentation
            let port: number = bs.getOption("port");
            console.log("Estbalished server with port: " + port);

            openSidePanel(port);
            runningBS.push(bs);
        }
    );
}

async function startProxy() {
    let inputURL = await vscode.window.showInputBox({
        placeHolder: "e.g. http://localhost:3000/Home",
        prompt: "Please enter the URL you want to reflect the change of this file",
    });

    console.log('inputURL: ' + inputURL);

    let doc = vscode.window.activeTextEditor.document;
    // let cwd = vscode.workspace.rootPath || path.dirname(doc.uri.fsPath);
    let cwd = path.dirname(doc.uri.fsPath);
    let files = ["*.cshtml"];
    files = files.map(p => path.join(cwd, p))

    // It must use absolute path
    // Canont use relatie path to the cwd such as ["./*.html"]
    // It autodetect the free port for you
    let bs = browserSync.create();
    bs.init(
        {
            open: false,
            proxy: inputURL,
            files: files,
        },
        function () {
            // I find this method under the debugger not inside the documentation
            let port: number = bs.getOption("port");
            console.log("estbalished proxy with port: " + port);

            runningBS.push(bs);
        }
    );
}

function exitAll() {
    runningBS.forEach((bs) =>
        setTimeout(() => {
            let port: number = bs.getOption("port");
            bs.exit();
            console.log("Browser Sync server/proxy with port: " + port + " is closed");
        }, 3000)
    )
}

// this method is called when your extension is deactivated
export function deactivate() {
    exitAll();
}