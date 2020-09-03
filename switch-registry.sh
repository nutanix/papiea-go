registry=$1

case $registry in
"nutanix")
  npm config set registry https://nutanix.jfrog.io/nutanix/api/npm/npm-virtual/
  yarn config set registry https://nutanix.jfrog.io/nutanix/api/npm/npm-virtual/
  echo 'Registry set to https://nutanix.jfrog.io/nutanix/api/npm/npm-virtual/'
  ;;
"default")
  npm config set registry https://registry.npmjs.org/
  yarn config set registry https://registry.npmjs.org/
  echo 'Registry set to https://registry.npmjs.org/'
  ;;
esac
