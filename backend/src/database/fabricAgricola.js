import "dotenv/config";
import sql from "mssql";
import { ClientSecretCredential } from "@azure/identity";

let poolPromise;

export async function getFabricAgricolaPool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      const {
        ENTRA_TENANT_ID,
        ENTRA_CLIENT_ID,
        ENTRA_CLIENT_SECRET,
        FABRIC_AGRICOLA_SERVER,
        FABRIC_AGRICOLA_DATABASE,
      } = process.env;

      if (
        !ENTRA_TENANT_ID ||
        !ENTRA_CLIENT_ID ||
        !ENTRA_CLIENT_SECRET ||
        !FABRIC_AGRICOLA_SERVER ||
        !FABRIC_AGRICOLA_DATABASE
      ) {
        throw new Error(
          "Falta configurar la conexión agrícola de Fabric en backend/.env."
        );
      }

      const credential = new ClientSecretCredential(
        ENTRA_TENANT_ID,
        ENTRA_CLIENT_ID,
        ENTRA_CLIENT_SECRET
      );

      const token = await credential.getToken(
        "https://database.windows.net/.default"
      );

      if (!token?.token) {
        throw new Error(
          "No se pudo obtener el token para Fabric agrícola."
        );
      }

      const pool = new sql.ConnectionPool({
        server: FABRIC_AGRICOLA_SERVER,
        port: 1433,
        database: FABRIC_AGRICOLA_DATABASE,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
        authentication: {
          type: "azure-active-directory-access-token",
          options: { token: token.token },
        },
      });

      return await pool.connect();
    })().catch((error) => {
        poolPromise = undefined;
        throw error;
    });
  }

  return poolPromise;
}