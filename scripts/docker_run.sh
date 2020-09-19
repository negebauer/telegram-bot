#!/bin/sh

docker run --rm -ti \
  -e BOT_TOKEN=$BOT_TOKEN \
  -e CHAT_ID=$CHAT_ID \
  -e VISA_PASSWORD=$VISA_PASSWORD \
  -e VISA_URL=$VISA_URL \
  -e VISA_USER=$VISA_USER \
  -v $(pwd)/volume:/volume \
  negebauer/telegram-bot
