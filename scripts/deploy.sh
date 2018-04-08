yarn checkin

read -p "Version bump (major | minor | patch): " bump

case $bump in
  "major" | "minor" | "patch")
    npm version $bump -m "Deploying %s"
    npm publish
    git push
    git push origin --tags
    ;;
  *)
    echo "Invalid version bump!"
    ;;
esac
