const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
	    {
		    ignores: [
			                "**/src-tauri/**",
			                "**/target/**",
			                "**/dist/**",
			                "**/node_modules/**"
			            ],
		        },
	    {
		            files: ['**/*.ts', '**/*.tsx'],
		            languageOptions: {
				                ecmaVersion: 'latest',
				                sourceType: 'module',
				                parser: typescriptParser,
				                globals: {
							                window: 'readonly',
							                document: 'readonly',
							                __TAURI__: 'readonly',
							                console: 'readonly'
							            },
				            },
		            plugins: {
				                react,
				                'react-hooks': reactHooks,
				                '@typescript-eslint': typescriptEslint,
				            },
		            rules: {
				                ...typescriptEslint.configs.recommended.rules,
				                ...react.configs.recommended.rules,
				                ...reactHooks.configs.recommended.rules,
				                'react/react-in-jsx-scope': 'off',
				                '@typescript-eslint/no-unused-vars': 'warn',
				                'react/prop-types': 'off',
				                '@typescript-eslint/no-explicit-any': 'warn',
				                'no-debugger': 'warn'
				            },
		            settings: {
				                react: {
							                version: 'detect',
							            },
				            },
		        },
];
