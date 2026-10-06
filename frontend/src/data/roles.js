export const ROLES = {
  administrador: {
    id: "administrador",
    name: "Administrador",

    permissions: {
      dashboards: false,
      plans: false,
      admin: true,
    },

    description:
      "Administración de usuarios, permisos y configuración de AgroXpert.",
  },

  gerente: {
    id: "gerente",
    name: "Gerente",

    permissions: {
      dashboards: true,
      plans: false,
      admin: false,
    },

    description:
      "Visión general del ingenio e indicadores estratégicos.",
  },

  director: {
    id: "director",
    name: "Director",

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

    permissions: {
      dashboards: false,
      plans: true,
      admin: false,
    },

    description:
      "Consulta y seguimiento de las actividades correspondientes a la hacienda.",
  },
};

export const ROLE_LIST =
  Object.values(ROLES);