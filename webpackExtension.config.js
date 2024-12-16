const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { version } = require('./package.json');

module.exports = (_env, argv) => {
    const isDevelopment = argv.mode === "development";
    // const browsers = ["chrome", "edge", "firefox"];
    const browsers = ["chrome", "firefox"];
    return browsers.map((browser) => ({
        mode: isDevelopment ? "development" : "production",
        // devtool: isDevelopment ? "source-map" : false,
        // Inline-source-map is only for testing, revert this change later
        devtool: "inline-source-map",
        entry: {
            action: "./src/action.ts",
            background: "./src/background.ts",
            settings: "./src/settings.ts", // Needed to access IndexedDB's UI in devtools
            "scripts/worldMain": "./src/scripts/worldMain.ts",
            "scripts/worldIsolated": "./src/scripts/worldIsolated.ts",
            ...(isDevelopment
                ? {
                      "playwright/harness/testBrowserContexts": "./playwright/harness/testBrowserContexts.ts",
                      "playwright/harness/testWorkbench": "./playwright/harness/testWorkbench.ts",
                  }
                : {}),

        },
        output: {
            path: path.resolve(__dirname, "webext", browser),
            filename: "[name].js",
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
                },
                // {
                //     test: /\.css$/i,
                //     type: "asset/source",
                // },
                // {
                //     test: /\.html$/i,
                //     type: "asset/source",
                // },
            ],
        },
        resolve: {
            extensions: [".ts", ".js"],
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    { from: "src/_locales", to: "_locales" },
                    { from: "src/icons", to: "icons" },
                    // { from: "src/images", to: "images" },
                    {
                        from: `src/manifests/manifest.${browser}.json`,
                        to: "manifest.json",
                        transform: {
                            transformer(content) {
                                // Replace placeholders with the version string
                                return content.toString().replace(/{{VERSION}}/g, version);
                            },
                        },
                    },
                    { from: "src/*.html", to: "[name][ext]" },
                    { from: "src/*.css", to: "[name][ext]" },
                ],
            }),
            new webpack.ProvidePlugin({
                log: ["/src/logging", "Logger", "log"],
                LogLevels: ["/src/logging", "Logger"],
            }),
        ],
        optimization: {
            minimize: !isDevelopment,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: true,
                            drop_debugger: true,
                        },
                        mangle: false,
                    },
                    extractComments: false,
                }),
            ],
        },
        cache: {
            type: "filesystem", // Enables caching in 'memory' or 'filesystem'
        },
    }));
};
