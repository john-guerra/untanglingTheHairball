module.exports = {
    "env": {
        "browser": true,
        "es6": false
    },

    "extends": "eslint:recommended",
    "parserOptions": {
        //"ecmaFeatures": {
            //"experimentalObjectRestSpread": true,
            //"jsx": true
        //},
        //"sourceType": "module"
    },
    // "plugins": [
    //     "react"
    // ],
    "rules": {
        "indent": [
            "error",
            2
        ],
        "no-console":"off",
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
