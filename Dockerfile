FROM node:7.0

RUN npm install -g gulp

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/

# Install app dependencies
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 8000
CMD ["gulp"]
