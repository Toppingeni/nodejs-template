# NodeJS API

A REST API for comparing invoice data between Oracle and other systems using both native OracleDB and Sequelize ORM.

## Features

-   Dual database access (OracleDB + Sequelize)
-   TNS configuration support
-   Structured error handling
-   TypeScript support
-   ESLint for code quality

## Prerequisites

-   Node.js 18+
-   Oracle Client libraries
-   Oracle Database access
-   TNS configuration file

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-repo.git
cd your-repo
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# install igs-vault
npm i @ingeni/igs-vault -g

# login to igs-vault
igs-vault setup-script http://192.168.55.25:8200 username password

# load global env
# 1. load app env
igs-vault write stag/data/xxxx .env;
# 2. load app env
## MAC
igs-vault append global/data/dev/mac .env;
## LINUX
igs-vault append global/data/dev/linux .env
## Windows
igs-vault append global/data/dev/windows .env

```

## Running the API

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```
