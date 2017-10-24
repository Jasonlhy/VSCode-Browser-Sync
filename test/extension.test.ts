//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';
import * as path from 'path';

// Defines a Mocha test suite to group tests of similar kind together
// Implementation of path depends on the system,
// Unix test will be failed on Windows, Windows test will be failed at Unix
suite("Extension Tests", () => {

    // Defines a Mocha unit test
    test("No config", () => {
        const rootPath = "/";
        let config = {
            files: "*/html"
        };

        myExtension.adjustConfigWithSetting(rootPath, config, undefined, undefined);
        assert.equal(config["files"], "*/html");
    });

    test("Setting override config file (Unix absolute Path)", () => {
        const rootPath = "/";
        let config = {
            files: "*/html"
        };

        let bsConfig = {
            files: "/Users/jason/Desktop"
        }

        myExtension.adjustConfigWithSetting(rootPath, config, bsConfig, undefined);
        assert.equal(config["files"], "/Users/jason/Desktop");
    });

    test("Setting override config file (Window absolute Path)", () => {
        const rootPath = "C:\\Users\\Jason\\Desktop";
        let config = {
            files: "*/html"
        };

        let bsConfig = {
            files: "C:\\Users\\Jason\\Desktop\\Project\\*.html"
        }

        myExtension.adjustConfigWithSetting(rootPath, config, bsConfig, undefined);
        assert.equal(config["files"], "C:\\Users\\Jason\\Desktop\\Project\\*.html");
    });

    test("Setting override config file (Unix relative Path)", () => {
        const rootPath = "/Users/jason/Desktop";
        let config = {
            files: "*/html"
        };

        let bsConfig = {
            files: "www/*.html"
        }

        myExtension.adjustConfigWithSetting(rootPath, config, bsConfig, true);
        assert.equal(config["files"], "/Users/jason/Desktop/www/*.html");
    });

    test("Setting override config files (Unix relative Path)", () => {
        const rootPath = "/Users/jason/Desktop";
        let config = {
            files: ["*/html", "*.css"]
        };

        let bsConfig = {
            files: ["www/*.html", "www/*.css", "/Users/jason/*.js"]
        }

        myExtension.adjustConfigWithSetting(rootPath, config, bsConfig, true);
        assert.deepEqual(config["files"], ["/Users/jason/Desktop/www/*.html",
            "/Users/jason/Desktop/www/*.css",
            "/Users/jason/*.js"]);
    });
    
    test("Setting override config files (Window relative Path)", () => {
        const rootPath = "C:\\Users\\Jason\\Desktop";
        let config = {
            files: ["*/html", "*.css"]
        };

        let bsConfig = {
            files: ["www/*.html", 
                    "www/*.css", 
                    "C:\\Users\\Jason\\Desktop\\*.js"]
        }

        var expected = ["C:\\Users\\Jason\\Desktop\\www\\*.html",
            "C:\\Users\\Jason\\Desktop\\www\\*.css",
            "C:\\Users\\Jason\\Desktop\\*.js"];

        myExtension.adjustConfigWithSetting(rootPath, config, bsConfig, true);
        assert.deepEqual(config["files"], expected);
    });
});