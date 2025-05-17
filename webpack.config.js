const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const { version } = require("./package.json");

module.exports = (_env, argv) => {
    const isDevelopment = argv.mode === "development";

    const entries = {
        communicator: "./src/index.ts",
    };

    return Object.keys(entries).map((entry) => ({
        mode: isDevelopment ? "development" : "production",
        devtool: "source-map",
        entry: {
            [entry]: entries[entry],
        },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, "dist"),
            library: "[name]", // jquery($), lodash(_), etc.
            libraryTarget: "umd",
            umdNamedDefine: true,
            globalObject: "this",
        },        
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                configFile: isDevelopment ? "tsconfig.dev.json" : "tsconfig.prod.json",
                            },
                        },
                    ],
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
            new webpack.DefinePlugin({
                "process.env.VERSION": JSON.stringify(version),
            }),
            new webpack.ProvidePlugin({
                log: ["/src/logging", "Logger", "log"],
                LogLevels: ["/src/logging", "Logger"],
            }),
        ],
        optimization: {
            // Configure optimization depending on the entry and mode (dev vs prod).
            // Don't include source maps in distributed packages.
            // https://stackoverflow.com/questions/41040266/remove-console-logs-with-webpack-uglify
            minimize: !isDevelopment,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: true,
                            drop_debugger: true,
                        },
                        format: {
                            comments: false,
                        },
                        mangle: false,
                    },
                    extractComments: false,
                }),
            ],
        },
    }));
};
