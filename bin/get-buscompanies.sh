#!/bin/sh
curl "$CLICKBUS_API_URL/buscompanies?page=1" > ./data/buscompanies1.json
curl "$CLICKBUS_API_URL/buscompanies?page=2" > ./data/buscompanies2.json
curl "$CLICKBUS_API_URL/buscompanies?page=3" > ./data/buscompanies3.json
jq .busCompanies[].name ./data/buscompanies1.json ./data/buscompanies2.json ./data/buscompanies3.json \
| sed -e "s/\"$/\",/" > ./data/buscompanies.txt
