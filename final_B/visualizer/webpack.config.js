const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

module.exports = {
    mode: 'production',
    // mode: 'development',

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            },
            {
                test: /\.ejs$/,
                use: 'ejs-compiled-loader'
            }
        ]
    },

    resolve: {
        extensions: [
            '.ts', '.js'
        ]
    },

    devServer: {
        contentBase: "dist",
        open: true
    },
    
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.ejs'
        }),
        new HtmlWebpackPlugin({
            template: './src/atcoder.ejs',
            filename: 'atcoder.html',
            inlineSource: '.js$'
        }),
        new HtmlWebpackInlineSourcePlugin()
    ]
};
