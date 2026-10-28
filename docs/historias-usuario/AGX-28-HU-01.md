AGX-28 ÔÇö HU-01: Ingresar al sistema con cuenta corporativa o con usuario propio

1. Informaci├│n general

Identificador: AGX-28.

Historia de usuario: HU-01 ÔÇö Ingresar al sistema con cuenta corporativa o con usuario propio.

Rol: Usuario del sistema.

Responsable: Juli├ín Pe├▒a ÔÇö Developer.

Estimaci├│n: 2 puntos de historia.

Priorizaci├│n: Must (MoSCoW) / Highest (Jira).

Release: Release 1 ÔÇö Base anal├¡tica y planes de manejo por suerte (Objetivo 1).

Horizonte: 30/10/2026.

Estado de refinamiento: Refinada ÔÇö cumple DoR.

2. Objetivo

Implementar un mecanismo de autenticaci├│n h├¡brida que permita a los usuarios de AgroXpert ingresar mediante su cuenta corporativa de Incauca, utilizando Microsoft Entra ID, o mediante las credenciales propias asignadas por AgroXpert.

La soluci├│n contempla la autenticaci├│n de los usuarios, la validaci├│n de su autorizaci├│n, la resoluci├│n de su rol y ├ímbito de acceso a partir de la informaci├│n almacenada en SQL Database de Microsoft Fabric y la gesti├│n de la sesi├│n de la aplicaci├│n.

La integraci├│n debe permitir que los usuarios corporativos autorizados accedan seg├║n su perfil, mientras que los usuarios que utilizan credenciales propias puedan continuar ingresando mediante su usuario y contrase├▒a.

3. Alcance de la implementaci├│n

La historia comprende los siguientes componentes funcionales y t├®cnicos:

Autenticaci├│n corporativa: integraci├│n del frontend con Microsoft Entra ID mediante Microsoft Authentication Library (MSAL).

Autenticaci├│n propia: validaci├│n de usuario y contrase├▒a en el backend.

Validaci├│n de usuarios: comprobaci├│n de que la cuenta est├® registrada y activa en AgroXpert.

Autorizaci├│n: resoluci├│n del rol y del ├ímbito de acceso del usuario mediante los registros correspondientes en Fabric.

Gesti├│n de sesiones: creaci├│n, validaci├│n y finalizaci├│n de la sesi├│n de la aplicaci├│n mediante el backend.

Manejo de errores: presentaci├│n de mensajes ante credenciales incorrectas, cuentas no autorizadas o problemas de autenticaci├│n.

Seguridad de contrase├▒as: almacenamiento y verificaci├│n de contrase├▒as propias mediante mecanismos de hash.

Interfaz de inicio de sesi├│n: incorporaci├│n de una opci├│n de acceso corporativo con Microsoft, conservando la alternativa de ingreso con usuario y contrase├▒a.

Separaci├│n de credenciales: diferenciaci├│n entre la identidad corporativa utilizada para iniciar sesi├│n y las credenciales de aplicaci├│n empleadas por el backend para conectarse a Fabric.

Archivos relacionados con la implementaci├│n

Frontend

frontend/src/components/Login.jsx: presenta las opciones de autenticaci├│n corporativa y mediante credenciales propias, incluido el estado de carga del inicio de sesi├│n con Microsoft.

frontend/src/main.jsx: inicializa la aplicaci├│n y configura el proveedor de autenticaci├│n de MSAL.

frontend/src/auth/: contiene los archivos de configuraci├│n de MSAL utilizados por la integraci├│n corporativa.

frontend/.env: contiene la configuraci├│n del cliente de autenticaci├│n y la URL de la API.

Backend

backend/src/routes/auth.js: contiene las rutas relacionadas con la autenticaci├│n propia y la gesti├│n del acceso.

backend/src/middleware/authMiddleware.js: valida la sesi├│n de la aplicaci├│n para proteger las rutas que requieren autenticaci├│n.

backend/src/database/fabric.js: configura la conexi├│n del backend con SQL Database de Microsoft Fabric mediante credenciales de aplicaci├│n.

backend/.env: contiene la configuraci├│n de conexi├│n y autenticaci├│n del backend.

Los archivos anteriores est├ín relacionados con la implementaci├│n conocida. Su existencia no demuestra por s├¡ sola que todos los flujos de autenticaci├│n est├®n completos ni que los controles de seguridad se hayan validado integralmente.

Nota de seguridad: los archivos de entorno pueden estar excluidos del repositorio por contener informaci├│n sensible. No deben publicarse contrase├▒as, secretos de aplicaci├│n, tokens ni otros valores confidenciales.

4. Identidad visual

La pantalla de inicio de sesi├│n conserva como referencia la identidad corporativa de AgroXpert:

Azul corporativo: #0D26A4.

Amarillo corporativo: #FDC300.

Verde corporativo: #009633.

Tipograf├¡a de encabezados: Bricolage Grotesque.

Tipograf├¡a general: Public Sans.

La interfaz presenta las dos alternativas de acceso: ingresar con una cuenta corporativa de Microsoft o utilizar las credenciales propias de AgroXpert. La incorporaci├│n del acceso corporativo debe conservar la estructura visual de la pantalla existente.

5. Criterios de aceptaci├│n y verificaci├│n

CA-01. Inicio de sesi├│n corporativo

Un usuario corporativo registrado y activo puede autenticarse mediante Microsoft Entra ID y acceder a AgroXpert con el rol y el ├ímbito de acceso correspondientes.

Estado: pendiente de validaci├│n de extremo a extremo, debido al error de configuraci├│n de la URI de redirecci├│n identificado durante las pruebas.

CA-02. Inicio de sesi├│n con credenciales propias

Un usuario registrado y activo puede ingresar mediante su usuario y contrase├▒a v├ílidos.

Estado: existen pruebas automatizadas del backend de autenticaci├│n propia reportadas como aprobadas. Esto no sustituye la validaci├│n funcional completa del flujo desde la interfaz.

CA-03. Validaci├│n de cuentas

Una cuenta corporativa v├ílida en Entra ID, pero no registrada o inactiva en AgroXpert, debe recibir acceso denegado.

Estado: criterio definido; falta aportar evidencia espec├¡fica de una prueba satisfactoria.

CA-04. Validaci├│n del token corporativo

El backend debe validar el token corporativo antes de aceptar la autenticaci├│n, incluyendo su firma, emisor, audiencia y vigencia.

Estado: pendiente de demostrar mediante inspecci├│n de la implementaci├│n y pruebas espec├¡ficas del backend.

CA-05. Seguridad de contrase├▒as propias

Las contrase├▒as propias deben almacenarse mediante hash con sal y verificarse de forma segura en el backend.

Estado: existen pruebas reportadas del flujo de autenticaci├│n propia. La verificaci├│n integral de este criterio requiere confirmar tambi├®n la implementaci├│n de almacenamiento y validaci├│n de contrase├▒as.

CA-06. Manejo de intentos fallidos

Las credenciales incorrectas deben producir un mensaje claro sin revelar si fall├│ el usuario o la contrase├▒a. El bloqueo temporal por intentos consecutivos debe verificarse si forma parte de la implementaci├│n entregada.

Estado: el manejo de credenciales incorrectas est├í contemplado en las pruebas de autenticaci├│n propia. No hay evidencia suficiente para confirmar un mecanismo de bloqueo temporal.

CA-07. Gesti├│n de sesiones

La sesi├│n de la aplicaci├│n debe validarse en las solicitudes protegidas y respetar la vigencia configurada.

Estado: existen componentes de sesi├│n en el backend y pruebas reportadas de autenticaci├│n. La expiraci├│n y la vigencia deben verificarse de forma espec├¡fica.

CA-08. Auditor├¡a

Los intentos de autenticaci├│n deben registrarse de acuerdo con los mecanismos de auditor├¡a implementados.

Estado: pendiente de verificar y documentar la existencia y el funcionamiento del mecanismo de auditor├¡a.

6. Plan de pruebas

ID

Caso de prueba

Resultado esperado

Estado

AGX-28-HU-01-CP-01

Iniciar sesi├│n con credenciales propias v├ílidas.

El usuario autenticado obtiene acceso a la aplicaci├│n.

Aprobado seg├║n las pruebas automatizadas reportadas.

AGX-28-HU-01-CP-02

Iniciar sesi├│n con contrase├▒a incorrecta.

El acceso se rechaza y se muestra un mensaje de error.

Aprobado seg├║n las pruebas automatizadas reportadas.

AGX-28-HU-01-CP-03

Intentar iniciar sesi├│n con un usuario inexistente.

El acceso se rechaza sin revelar informaci├│n sensible.

Aprobado seg├║n las pruebas automatizadas reportadas.

AGX-28-HU-01-CP-04

Verificar la creaci├│n y conservaci├│n de la sesi├│n tras el ingreso.

La sesi├│n permite realizar solicitudes protegidas autorizadas.

Aprobado seg├║n las pruebas automatizadas reportadas, dentro del alcance efectivamente probado.

AGX-28-HU-01-CP-05

Cerrar sesi├│n.

La sesi├│n queda invalidada y no permite continuar usando el acceso anterior.

Aprobado seg├║n las pruebas automatizadas reportadas.

AGX-28-HU-01-CP-06

Consultar una ruta protegida sin sesi├│n v├ílida.

El backend rechaza la solicitud.

Aprobado seg├║n las pruebas automatizadas reportadas, dentro del alcance efectivamente probado.

AGX-28-HU-01-CP-07

Comprobar el manejo de cuentas de prueba deshabilitadas, cuando aplique.

La cuenta deshabilitada no obtiene acceso.

Aprobado seg├║n las pruebas reportadas para este caso.

AGX-28-HU-01-CP-08

Verificar el manejo de la cookie de sesi├│n.

La cookie y la sesi├│n se gestionan seg├║n la configuraci├│n implementada.

Aprobado seg├║n las pruebas automatizadas reportadas.

AGX-28-HU-01-CP-09

Intentar autenticar una cuenta de prueba deshabilitada.

El backend deniega el acceso.

Aprobado seg├║n las pruebas automatizadas reportadas.

AGX-28-HU-01-CP-10

Ingresar el nombre de usuario con diferencias de may├║sculas o espacios.

El backend normaliza el usuario de acuerdo con las reglas implementadas.

Aprobado seg├║n las pruebas automatizadas reportadas.

AGX-28-HU-01-CP-11

Iniciar sesi├│n con una cuenta corporativa registrada y activa.

Microsoft Entra autentica al usuario y AgroXpert crea una sesi├│n con su rol y ├ímbito correctos.

Pendiente.

AGX-28-HU-01-CP-12

Iniciar sesi├│n con una cuenta corporativa no registrada o inactiva en AgroXpert.

El acceso es denegado por el backend.

Pendiente.

AGX-28-HU-01-CP-13

Presentar un token con firma, emisor, audiencia o vigencia incorrectos.

El backend rechaza el token.

Pendiente.

AGX-28-HU-01-CP-14

Verificar el bloqueo temporal despu├®s de intentos consecutivos fallidos.

Se aplica el bloqueo si forma parte del alcance implementado.

Pendiente de confirmar si est├í implementado.

AGX-28-HU-01-CP-15

Verificar la expiraci├│n de la sesi├│n.

Una sesi├│n vencida deja de autorizar solicitudes protegidas.

Pendiente de prueba espec├¡fica.

AGX-28-HU-01-CP-16

Verificar los registros de autenticaciones exitosas y fallidas.

Los eventos se registran seg├║n el mecanismo de auditor├¡a disponible.

Pendiente.

AGX-28-HU-01-CP-17

Comprobar el rol y el ├ímbito asignados a un usuario corporativo.

La sesi├│n refleja los registros de autorizaci├│n correspondientes en Fabric.

Pendiente de validaci├│n integral.

Los estados de las pruebas automatizadas propias deben conservarse vinculados a sus resultados reales de ejecuci├│n. La aprobaci├│n de estos casos no significa que se haya completado el inicio de sesi├│n corporativo ni que se hayan verificado todos los criterios de seguridad.

7. Evidencias

Las evidencias relacionadas con la implementaci├│n y las pruebas comprenden:

Cambios en los componentes de inicio de sesi├│n del frontend.

Integraci├│n de MSAL en la inicializaci├│n de la aplicaci├│n.

Configuraci├│n del backend para conectarse a Fabric mediante credenciales de aplicaci├│n.

C├│digo de las rutas de autenticaci├│n y del middleware de sesi├│n.

Resultados de las pruebas automatizadas de autenticaci├│n propia reportadas como aprobadas.

Resultados pendientes de pruebas de autorizaci├│n corporativa, token, ├ímbito de acceso, expiraci├│n y auditor├¡a.

Observaci├│n de configuraci├│n de Entra ID: durante la integraci├│n se identific├│ el error AADSTS500113: No reply address is registered for the application para la URI de redirecci├│n http://localhost:5173. Es necesario registrar la URI correspondiente en la configuraci├│n de la aplicaci├│n de Entra ID. Mientras no se complete esta configuraci├│n y se valide el flujo, no puede confirmarse la autenticaci├│n corporativa de extremo a extremo.

8. Definition of Done

Los criterios de aceptaci├│n est├ín verificados mediante pruebas y evidencias.

El c├│digo est├í integrado mediante el Pull Request correspondiente y la revisi├│n se ha completado.

Las pruebas aplicables se han ejecutado satisfactoriamente.

La autenticaci├│n corporativa funciona de extremo a extremo.

La autenticaci├│n propia funciona desde la interfaz hasta el backend.

Los usuarios no registrados o inactivos reciben acceso denegado.

Se ha verificado la validaci├│n de tokens corporativos en el backend.

Se han comprobado la vigencia de las sesiones y los controles de seguridad aplicables.

La documentaci├│n est├í actualizada en Confluence.

El incremento se ha desplegado en el ambiente objetivo del release.

Se ha realizado una validaci├│n con un usuario referente de los perfiles correspondientes.

Las casillas permanecen sin marcar porque la informaci├│n disponible no permite confirmar que todos los requisitos est├®n completos.

9. Historial de validaci├│n

Validaci├│n

Estado seg├║n la informaci├│n disponible

Interfaz con las dos opciones de autenticaci├│n

Implementaci├│n trabajada en el frontend.

Integraci├│n del frontend con MSAL

Implementaci├│n trabajada; validaci├│n integral pendiente.

Conexi├│n del backend con Fabric mediante credenciales de aplicaci├│n

Conexi├│n t├®cnica probada previamente.

Pruebas automatizadas de autenticaci├│n propia

Aprobadas seg├║n los resultados reportados.

Inicio de sesi├│n corporativo de extremo a extremo

Pendiente de resolver y validar la URI de redirecci├│n en Entra ID.

Validaci├│n de usuarios corporativos registrados y activos

Sin evidencia espec├¡fica aportada.

Validaci├│n del token corporativo en el backend

Sin evidencia espec├¡fica aportada.

Resoluci├│n del rol y ├ímbito desde Fabric

Sin evidencia de prueba de extremo a extremo.

Bloqueo temporal de cuentas propias

Sin evidencia de validaci├│n.

Vigencia y expiraci├│n de la sesi├│n

Sin evidencia de prueba espec├¡fica.

Auditor├¡a de accesos

Sin evidencia de validaci├│n.

Pull Request, revisi├│n y despliegue

Sin evidencia suficiente aportada.

Conclusi├│n: AGX-28 contempla el acceso a AgroXpert mediante una cuenta corporativa de Microsoft y mediante credenciales propias. Se trabaj├│ en la interfaz, la integraci├│n con MSAL y la conexi├│n del backend con Fabric; adem├ís, existen pruebas automatizadas de autenticaci├│n propia reportadas como aprobadas. Sin embargo, el error de URI de redirecci├│n impide confirmar el flujo corporativo completo y los dem├ís criterios requieren evidencias espec├¡ficas antes de declarar la historia terminada.
