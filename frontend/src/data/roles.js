export const ROLES = {
  gerente: {
    id: "gerente",
    name: "Gerente",
    initials: "CC",
    fullName: "Carlos Córdoba",
    username: "gerente",
    password: "1234",
    position: "Gerencia de Campo · Ingenio",
    scope: "Ingenio completo",

    permissions: {
      dashboards: true,
      plans: false,
      admin: true,
    },

    description:
      "Visión general del ingenio, indicadores estratégicos y administración.",
  },

  director: {
    id: "director",
    name: "Director",
    initials: "JM",
    fullName: "Jaime Marín",
    username: "director",
    password: "1234",
    position: "Dirección · Zona Central",
    scope: "Zona Central Incauca",

    permissions: {
      dashboards: true,
      plans: true,
      admin: false,
    },

    description:
      "Supervisión de la operación y seguimiento de indicadores de la zona.",
  },

  supervisor: {
    id: "supervisor",
    name: "Supervisor",
    initials: "HZ",
    fullName: "Héctor Zambrano",
    username: "supervisor",
    password: "1234",
    position: "Supervisión · Zona Central",
    scope: "Zona Central Incauca",

    permissions: {
      dashboards: true,
      plans: true,
      admin: false,
    },

    description:
      "Seguimiento operativo, planes de trabajo y desempeño de la zona.",
  },

  mayordomo: {
    id: "mayordomo",
    name: "Mayordomo",
    initials: "CM",
    fullName: "Carlos Maya",
    username: "mayordomo",
    password: "1234",
    position: "Mayordomía · Hda. San Fernando N.",
    scope: "Hda. San Fernando Norte",

    permissions: {
      dashboards: false,
      plans: true,
      admin: false,
    },

    description:
      "Consulta y seguimiento de las actividades correspondientes a la hacienda.",
  },
};

export const ROLE_LIST = Object.values(ROLES);