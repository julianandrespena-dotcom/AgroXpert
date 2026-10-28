import "dotenv/config";
import sql from "mssql";
import { ClientSecretCredential } from "@azure/identity";

let poolPromise;

export async function getFabricPool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      const {
        ENTRA_TENANT_ID,
        ENTRA_CLIENT_ID,
        ENTRA_CLIENT_SECRET,
      } = process.env;

      if (!ENTRA_TENANT_ID || !ENTRA_CLIENT_ID || !ENTRA_CLIENT_SECRET) {
        throw new Error(
          "Falta configurar ENTRA_TENANT_ID, ENTRA_CLIENT_ID o ENTRA_CLIENT_SECRET."
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
        throw new Error("No se pudo obtener el token para Fabric.");
      }

      const pool = new sql.ConnectionPool({
        server:
          process.env.FABRIC_SERVER ||
          "qkf65wtcjomuhghszd6aa7a4um-2rurzwq7klpexgu67aeyc26jcy.database.fabric.microsoft.com",
        port: 1433,
        database:
          process.env.FABRIC_DATABASE ||
          "AgroXpert_Usuarios-5af5b2c9-6a95-4385-869e-9c6691e4d399",
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
