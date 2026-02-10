const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
 output: {
   path: path.join(__dirname, '/dist'),
   filename: 'index.bundle.js',
   clean: true
 },
 devtool: 'source-map',
 devServer: {
   port: 3000,
   static: {
     watch: true
   }
 },
 module: {
   rules: [
     {
       test: /\.(js|jsx)$/,
       exclude: /node_modules/,
       use: {
         loader: 'babel-loader'
       }
     },
     {
       test: /\.css$/,
       use: [MiniCssExtractPlugin.loader, 'css-loader']
     },
     {
       test: /\.(png|jpe?g|gif|svg)$/i,
       type: 'asset/resource'
     },
     {
       test: /\.(wav|mp3|ogg)$/i,
       type: 'asset/resource'
     }
   ]
 },
 plugins: [new HtmlWebpackPlugin({ template: './src/index.html' }), new MiniCssExtractPlugin()],
}
