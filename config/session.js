require("dotenv").config();
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const prisma = require("../lib/prisma");

module.exports = session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  secret: process.env.PASSPORT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(prisma, {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
});
