FROM node:13.8

# puppeteer - https://github.com/puppeteer/puppeteer/blob/main/.ci/node10/Dockerfile.linux
RUN apt-get update && \
  apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
  libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
  libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget && \
  rm -rf /var/lib/apt/lists/*

COPY package.json .
COPY yarn.lock .
RUN yarn

RUN mkdir volume
VOLUME volume

COPY COMMANDS.md COMMANDS.md
COPY tsconfig.json tsconfig.json
COPY scripts scripts
COPY src src

ENV BOT_TOKEN ''
ENV CHAT_ID ''
ENV VISA_PASSWORD ''
ENV VISA_URL ''
ENV VISA_USER ''
ENV NODE_ENV production

CMD ["yarn", "start"]
