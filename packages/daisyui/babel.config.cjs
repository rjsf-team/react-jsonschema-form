module.exports = {
    extends: '../../babel.config.json',
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
    ],
    plugins: [
        // Any additional plugins
    ],
}; 
