#!/bin/sh
cat ~/Desktop/logs.csv\
| grep "^\"" \
| cut -d , -f 1 \
| sort \
| uniq -u \
| sed -e 's/\"//g' > ./data/utterances.txt
