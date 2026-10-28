AGX-29 ÔÇö HU-02: Definir las haciendas y zonas visibles por usuario

1. Informaci├│n general

Identificador: AGX-29.

Historia de usuario: HU-02 ÔÇö Definir las haciendas y zonas visibles por usuario.

Rol: Administrador.

Responsable: Juli├ín Pe├▒a ÔÇö Developer.

Estimaci├│n: 1 punto de historia.

Priorizaci├│n: Must (MoSCoW) / High (Jira).

Release: Release 1 ÔÇö Base anal├¡tica y planes de manejo por suerte (Objetivo 1).

Horizonte: 30/10/2026.

Estado de refinamiento: Refinada ÔÇö cumple DoR.

2. Objetivo

Permitir que el Administrador delimite las zonas y haciendas que puede consultar cada usuario, garantizando que la informaci├│n disponible corresponda a su ├ímbito de responsabilidad.

La soluci├│n contempla la gesti├│n de asignaciones, la consulta de los permisos almacenados en la base de datos y la aplicaci├│n de las restricciones correspondientes en el backend.

El control de acceso debe impedir que un usuario consulte informaci├│n de zonas o haciendas que no tiene asignadas, incluso cuando intente acceder a los recursos mediante solicitudes directas al backend.

3. Alcance de la implementaci├│n

La implementaci├│n comprende los componentes relacionados con la gesti├│n de las asignaciones de acceso:

Gesti├│n de las asignaciones de zonas y haciendas por usuario.

Consulta y persistencia de la informaci├│n de usuarios y sus asignaciones.

Implementaci├│n de controladores y rutas del backend relacionados con el acceso.

Migraci├│n y sincronizaci├│n de los datos necesarios para las asignaciones.

Incorporaci├│n de informaci├│n de usuarios Mayordomos mediante el archivo de datos asociado.

Aplicaci├│n del ├ímbito de acceso en las consultas que correspondan.

Conservaci├│n de las asignaciones existentes durante los cambios y procesos de sincronizaci├│n.

Archivos identificados en el cambio asociado

backend/src/controllers/accessController.js: contiene la l├│gica de los controladores relacionados con la consulta y gesti├│n del acceso de los usuarios.

backend/src/routes/access.js: define las rutas del backend para las operaciones relacionadas con el acceso.

backend/src/database/database.js: contiene la configuraci├│n y las funciones de acceso a la base de datos utilizadas por el backend.

backend/src/database/migrateAccess.js: contiene el proceso de migraci├│n relacionado con los datos de acceso.

backend/src/database/syncUsuarios.js: gestiona la sincronizaci├│n de los datos de usuarios.

data/usuarios_mayordomos.xlsx: archivo de datos de usuarios Mayordomos incorporado en el cambio asociado.

Referencia del cambio

Commit: 135307b ÔÇö feat: AGX-29 definir haciendas y zonas visibles por usuario.

Rama: AGX-29-HU-02-definir-haciendas-zonas-visibles-por-usuario.

Los archivos anteriores corresponden a los cambios registrados para esta historia. La inclusi├│n de estos archivos no demuestra por s├¡ sola que todos los criterios funcionales hayan sido validados.

4. Identidad visual

Esta historia no establece requisitos espec├¡ficos de identidad visual. Los cambios de interfaz relacionados con la gesti├│n de asignaciones deben conservar el sistema de dise├▒o y la identidad corporativa definidos para AgroXpert.

5. Criterios de aceptaci├│n y verificaci├│n

CA-01. Asignaci├│n del ├ímbito

El Administrador puede definir las zonas y haciendas autorizadas para cada usuario.

Estado: criterio definido; se requiere evidencia de una prueba funcional espec├¡fica de asignaci├│n y persistencia.

CA-02. Restricci├│n en el backend

Las consultas deben limitarse al ├ímbito autorizado del usuario, sin depender exclusivamente de filtros visuales del frontend.

Estado: pendiente de validaci├│n integral mediante solicitudes realizadas con usuarios que tengan diferentes asignaciones.

CA-03. Cobertura de m├│dulos

El filtrado debe aplicarse a dashboards, alertas, chatbot y reportes, seg├║n los datos y recursos utilizados por cada m├│dulo.

Estado: pendiente de comprobar la cobertura en cada m├│dulo.

CA-04. Auditor├¡a

Los cambios de ├ímbito deben registrar el valor anterior y el nuevo, de acuerdo con el mecanismo de auditor├¡a definido para la aplicaci├│n.

Estado: pendiente de verificar el registro y la consulta de los cambios.

CA-05. Validaci├│n geogr├ífica

Debe comprobarse el comportamiento con las zonas geogr├íficas activas de la aplicaci├│n y sus haciendas asociadas.

Estado: pendiente de evidencia espec├¡fica de validaci├│n.

Regla principal de autorizaci├│n: un Director con una sola zona asignada solo debe obtener informaci├│n de las haciendas pertenecientes a esa zona. No debe recibir datos de otras zonas mediante consultas directas ni a trav├®s de los m├│dulos que consumen esa informaci├│n.

6. Plan de pruebas

ID

Caso de prueba

Resultado esperado

Estado

AGX-29-HU-02-CP-01

Ingresar con un usuario de un perfil habilitado y comprobar que puede acceder a la aplicaci├│n.

El usuario autenticado puede ingresar de acuerdo con sus permisos.

Se han realizado pruebas funcionales locales con usuarios de distintos perfiles; no equivale a validar todas las asignaciones.

AGX-29-HU-02-CP-02

Asignar zonas y haciendas a un usuario desde las funciones administrativas disponibles.

Las asignaciones se guardan y se pueden consultar posteriormente.

Pendiente de evidencia espec├¡fica.

AGX-29-HU-02-CP-03

Consultar informaci├│n con un Director que tenga una sola zona asignada.

Solo se devuelve informaci├│n correspondiente a esa zona y sus haciendas.

Pendiente de validaci├│n de aislamiento.

AGX-29-HU-02-CP-04

Intentar consultar directamente informaci├│n de una zona no asignada.

El backend deniega o excluye los datos no autorizados.

Pendiente de validaci├│n.

AGX-29-HU-02-CP-05

Consultar dashboards con usuarios de diferentes ├ímbitos.

Los datos presentados respetan las asignaciones del usuario.

Pendiente de validaci├│n espec├¡fica.

AGX-29-HU-02-CP-06

Consultar alertas con usuarios de diferentes ├ímbitos.

Solo se muestran las alertas correspondientes al ├ímbito autorizado.

Pendiente de validaci├│n espec├¡fica.

AGX-29-HU-02-CP-07

Consultar informaci├│n mediante el chatbot.

Las respuestas no incluyen informaci├│n fuera del ├ímbito autorizado.

Pendiente de validaci├│n espec├¡fica.

AGX-29-HU-02-CP-08

Consultar reportes con usuarios de diferentes ├ímbitos.

Los reportes respetan las asignaciones correspondientes.

Pendiente de validaci├│n espec├¡fica.

AGX-29-HU-02-CP-09

Modificar el ├ímbito de un usuario.

Se registra el cambio de acuerdo con el mecanismo de auditor├¡a implementado.

Pendiente de validaci├│n.

AGX-29-HU-02-CP-10

Comprobar la persistencia de las asignaciones despu├®s de un reinicio o nueva sesi├│n.

Las asignaciones contin├║an vigentes y se aplican correctamente.

Pendiente de evidencia espec├¡fica.

AGX-29-HU-02-CP-11

Verificar las asignaciones de los usuarios Mayordomos importados.

Las relaciones de zona, hacienda y suerte corresponden a los datos definidos para cada usuario.

Pendiente de evidencia de validaci├│n integral.

AGX-29-HU-02-CP-12

Ejecutar una regresi├│n despu├®s de cambios en las asignaciones o en su sincronizaci├│n.

Los usuarios existentes conservan sus asignaciones v├ílidas y las restricciones siguen funcionando.

Pendiente de resultados documentados.

Las pruebas funcionales de ingreso con distintos perfiles permiten comprobar que los usuarios pueden acceder a la aplicaci├│n, pero no demuestran por s├¡ solas que el ├ímbito geogr├ífico est├® correctamente restringido.

La prueba automatizada del backend intentada durante el desarrollo no finaliz├│ satisfactoriamente: se obtuvo una respuesta 403 donde se esperaba 200, en un contexto en el que la configuraci├│n de usuarios de prueba no estaba disponible para el proceso de ejecuci├│n. Por este motivo, ese intento no debe registrarse como una prueba aprobada ni como evidencia concluyente de un defecto funcional sin reproducirlo con la configuraci├│n correcta.

7. Evidencias

Las evidencias relacionadas con la implementaci├│n incluyen:

Commit 135307b y rama AGX-29-HU-02-definir-haciendas-zonas-visibles-por-usuario.

Archivos del backend relacionados con los controladores, las rutas, la base de datos, la migraci├│n y la sincronizaci├│n de usuarios.

Archivo data/usuarios_mayordomos.xlsx, relacionado con los datos de usuarios Mayordomos.

Pruebas funcionales locales de ingreso con usuarios de distintos perfiles, seg├║n las comprobaciones realizadas durante el desarrollo.

Para completar la validaci├│n se requiere conservar evidencia adicional de:

Asignaci├│n y persistencia de zonas y haciendas.

Restricci├│n de consultas en el backend.

Aislamiento de informaci├│n entre usuarios con diferentes ├ímbitos.

Cobertura de dashboards, alertas, chatbot y reportes.

Registro de auditor├¡a y conservaci├│n de las asignaciones.

Pruebas de regresi├│n despu├®s de cambios o sincronizaciones.

El commit identifica un cambio de c├│digo, pero no demuestra por s├¡ solo que todos los criterios de aceptaci├│n est├®n cumplidos.

8. Definition of Done

El Administrador puede definir y guardar las asignaciones de zonas y haciendas.

Las asignaciones se recuperan correctamente desde la base de datos.

El backend restringe las consultas seg├║n el ├ímbito autorizado.

Se ha comprobado que un usuario no obtiene informaci├│n de zonas no asignadas.

El filtrado se ha validado en dashboards, alertas, chatbot y reportes, seg├║n corresponda.

Se ha comprobado el registro de los cambios de ├ímbito.

Se han validado las asignaciones de usuarios Mayordomos y sus relaciones correspondientes.

Se han ejecutado satisfactoriamente las pruebas de regresi├│n aplicables.

El c├│digo est├í integrado mediante el Pull Request correspondiente y se ha completado la revisi├│n.

La documentaci├│n est├í actualizada en Confluence.

El incremento se ha desplegado en el ambiente objetivo del release.

Se ha realizado una validaci├│n con un usuario referente del perfil correspondiente.

Las casillas permanecen sin marcar porque no se dispone de evidencia suficiente para confirmar la finalizaci├│n de todos los requisitos.

9. Historial de validaci├│n

Validaci├│n

Estado seg├║n la informaci├│n disponible

Identificaci├│n del cambio

Commit 135307b registrado en la rama asociada.

Archivos de implementaci├│n

Identificados mediante el cambio registrado.

Ingreso local con usuarios de distintos perfiles

Pruebas funcionales realizadas; su alcance no demuestra el aislamiento geogr├ífico.

Asignaci├│n de zonas y haciendas

Criterio definido; sin resultado espec├¡fico aportado.

Persistencia de las asignaciones

Sin evidencia espec├¡fica aportada.

Filtrado de consultas en el backend

Pendiente de validaci├│n integral.

Aislamiento de informaci├│n entre zonas

Sin resultado documentado de una prueba espec├¡fica.

Cobertura de dashboards, alertas, chatbot y reportes

Sin evidencia de validaci├│n integral.

Registro de auditor├¡a

Sin evidencia de prueba aportada.

Asignaciones de usuarios Mayordomos

Datos de importaci├│n identificados; falta evidencia de validaci├│n funcional integral.

Prueba automatizada del backend

El intento reportado no aprob├│; se obtuvo 403 en lugar de 200 bajo una configuraci├│n de pruebas que deb├¡a revisarse.

Pull Request y revisi├│n

No se incluye una referencia verificable al Pull Request.

Validaci├│n integral y despliegue

Sin evidencia suficiente aportada.

Conclusi├│n: AGX-29 incorpora cambios relacionados con la gesti├│n del acceso, las rutas y controladores del backend, la base de datos, la sincronizaci├│n de usuarios y los datos de Mayordomos. El commit permite identificar la implementaci├│n asociada. La validaci├│n del filtrado por ├ímbito, el aislamiento entre zonas, la auditor├¡a y la cobertura de los m├│dulos requiere resultados de pruebas espec├¡ficos antes de declarar la historia terminada.
