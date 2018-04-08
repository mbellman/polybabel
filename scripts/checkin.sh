yarn
yarn build

read -p "Commit message: " message;

git add .
git commit -m "$message"
git push
