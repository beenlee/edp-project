/**
 * @file 项目管理模块
 * @author errorrik[errorrik@gmail.com]
 */


/**
 * 字符串驼峰化
 * 
 * @inner
 * @param {string} source 源字符串
 * @return {string} 
 */
function camelize( source ) {
    return source.replace( /-([a-z])/ig, function ( $0, alpha ) {
        return alpha.toUpperCase();
    } );
}

require( 'fs' ).readdirSync( __dirname + '/lib' ).forEach(
    function ( file ) {
        if ( /\.js$/.test( file ) ) {
            file = file.replace( /\.js$/, '' );
            exports[ camelize( file ) ] = require( './lib/' + file );
        }
    }
);

