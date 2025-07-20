#!/bin/bash

# Add missing dev dependencies
npm install -D prettier husky lint-staged

# Initialize husky
npx husky-init

# Create pre-commit hook
cat > .husky/pre-commit <<'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF

# Make pre-commit hook executable
chmod +x .husky/pre-commit

# Create lint-staged configuration
cat > .lintstagedrc.json <<'EOF'
{
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
EOF

# Create prettier configuration
cat > .prettierrc <<'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

echo "✅ Pre-commit setup complete!"
echo "🔧 Run 'git add .' and 'git commit' to test the hooks"