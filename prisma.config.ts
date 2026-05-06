export default {
  earlyAccess: true,
  schema: {
    kind: "single",
    filePath: "prisma/schema.prisma",
  },
  migrate: {
    datasource: {
      url: "file:./dev.db",
    },
  },
};
