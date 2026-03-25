const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = [
    {
        ignores: [
            "build/**",
            "dist/**",
            "node_modules/**",
            "eslint.config.js",
            ".eslintrc.js",
        ],
    },
    ...compat.config(require("./.eslintrc.js")),
];
