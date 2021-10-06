yarn install
yarn add bangumi-data@latest
node spider.js
cd data
git config --local user.email "soekibun+bot@gmail.com"
git config --local user.name "ekibot"
time=$(date "+%Y%m%d%H%M%S")
git add . -v
git commit -m "Update at $time"
git push
curl https://purge.jsdelivr.net/gh/ekibot/bangumi-onair/calendar.json
