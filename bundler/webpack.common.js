const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

// https://github.com/wallstreetcn/webpack-and-spa-guide
module.exports = {
    /*
    entry: path.resolve(__dirname, '../src/script.js'),
    */
    entry: {   // 多页面配置
        script: "./src/script.js", 
        more:'./src/view/more/index.js' 
      },
    output:
    {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../docs') //dist   __dirname 代表的是根目录
    },
    devtool: 'source-map',
    plugins:
    [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, '../static') }
            ]
        }),
        /*
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            minify: true
        }),
        */
        new HtmlWebpackPlugin({ // 多模板
            template: './src/index.html', // 指定模板
            filename: 'index.html', // 指定输出的文件名
            minify: true,
            chunks: ['script'] // 指定页面引入的js
          }),
        new HtmlWebpackPlugin({ // 多模板
            template: './src/view/more/index.html', // 指定模板
            filename: 'more.html', // 指定输出的文件名
            minify: true,
            chunks: ['more'] // 指定页面引入的js
          }),
        new MiniCSSExtractPlugin({
            filename: '[contenthash].css',
            chunkFilename: '[contenthash].css'
          })
    ],
    module:
    {
        rules:
        [
            // HTML
            {
                test: /\.(html)$/,
                use: ['html-loader']
            },

            // JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:
                [
                    'babel-loader'
                ]
            },

            // CSS
            {
                test: /\.css$/,
                use:
                [
                    MiniCSSExtractPlugin.loader,
                    'css-loader'
                ]
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {                          
                            outputPath: 'assets/images/'
                        }
                    }
                ]
            },

            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            outputPath: 'assets/fonts/'
                        }
                    }
                ]
            },

            // Shaders
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: [
                    'raw-loader',
                    'glslify-loader'
                ]
            }
        ]
    }
}
