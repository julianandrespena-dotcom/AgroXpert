AGX-31 ÔÇö HU-04: Ver una pantalla de inicio seg├║n mi rol

1. Informaci├│n general

Clave Jira: AGX-31.

Historia de usuario: HU-04 ÔÇö Ver una pantalla de inicio seg├║n mi rol.

Rol: Usuario del sistema.

Responsable: Juli├ín Pe├▒a ÔÇö Developer.

Estimaci├│n: 1 punto de historia.

Prioridad: Must / Highest.

Release: Release 1 ÔÇö Base anal├¡tica y planes de manejo por suerte (Objetivo 1).

Fecha objetivo: 30/10/2026.

Refinamiento: Refinada ÔÇö cumple DoR.

Tipo: Historia ancla del proyecto.

2. Objetivo

Presentar una pantalla de inicio adaptada al rol del usuario autenticado, de manera que pueda consultar la informaci├│n y las funcionalidades relevantes para su responsabilidad dentro de AgroXpert.

La interfaz utiliza la informaci├│n del perfil para personalizar los mensajes de bienvenida, el ├ímbito de operaci├│n, los indicadores y los accesos disponibles. Tambi├®n contempla una presentaci├│n espec├¡fica para Mayordomo, orientada al seguimiento de las actividades y novedades de su hacienda.

La historia establece como condiciones de aceptaci├│n la resoluci├│n del rol a partir de la autenticaci├│n, la disponibilidad de cinco variantes de inicio, la posibilidad de conmutar entre dos perfiles cuando el usuario est├® autorizado y un tiempo de presentaci├│n inferior a tres segundos.

3. Alcance de la implementaci├│n

La implementaci├│n comprende la pantalla principal de AgroXpert, la personalizaci├│n de su contenido seg├║n el perfil del usuario y su integraci├│n con la estructura general de la aplicaci├│n.

El componente Home.jsx concentra la presentaci├│n del inicio. A partir del rol recibido, selecciona una configuraci├│n con textos y etiquetas espec├¡ficas para Gerente, Director, Supervisor y Mayordomo. La interfaz muestra el nombre del usuario, el ├ímbito asignado y una descripci├│n orientada a su funci├│n.

La pantalla general incorpora tarjetas de indicadores operativos, accesos r├ípidos al chatbot y a las alertas, acceso a dashboards cuando los permisos lo permiten y un resumen del estado operativo.

Para Mayordomo, el c├│digo contempla una composici├│n diferenciada con ubicaci├│n, saludo, alerta destacada y agenda priorizada de actividades.

Archivos relacionados con la implementaci├│n

frontend/src/App.jsx: gestiona la composici├│n principal de la aplicaci├│n y la selecci├│n de la vista que se presenta seg├║n el estado de acceso y el rol del usuario.

frontend/src/pages/Home.jsx: implementa la pantalla de inicio personalizada por perfil. Define la configuraci├│n ROLE_HOME_CONFIG, presenta el saludo, el ├ímbito de operaci├│n y los indicadores; organiza los accesos r├ípidos y contiene una composici├│n especial para Mayordomo.

frontend/src/main.jsx: establece el punto de entrada de React y la configuraci├│n inicial necesaria para renderizar la aplicaci├│n.

frontend/src/context/AppContext.jsx: administra el estado compartido de la aplicaci├│n y los datos de sesi├│n y rol utilizados por los componentes.

frontend/src/components/layout/AppShell.jsx: define la estructura principal de la interfaz autenticada y organiza el contenido dentro del dise├▒o general.

frontend/src/components/layout/Topbar.jsx: implementa la barra superior y sus controles de interfaz.

frontend/src/components/layout/Sidebar.jsx: organiza la navegaci├│n lateral entre los m├│dulos disponibles.

frontend/src/components/layout/MobileBottomNav.jsx: proporciona una alternativa de navegaci├│n para dispositivos m├│viles.

frontend/src/data/navigation.js: centraliza la definici├│n de las opciones de navegaci├│n de la aplicaci├│n.

frontend/src/data/roles.js: contiene las definiciones o correspondencias de roles que utiliza la interfaz.

frontend/src/styles/admin.css: contiene estilos de la interfaz administrativa; su relaci├│n con esta historia debe entenderse en funci├│n de los estilos compartidos por el cambio correspondiente.

Los archivos anteriores est├ín relacionados con la implementaci├│n descrita. La existencia de los componentes no demuestra por s├¡ sola que todas las variantes de inicio, los permisos o los requisitos de rendimiento hayan sido validados.

Funcionamiento de la pantalla Home

Configuraci├│n seg├║n el rol: ROLE_HOME_CONFIG define encabezados, t├¡tulos, descripciones y etiquetas para Gerente, Director, Supervisor y Mayordomo.

Identificaci├│n y ├ímbito del usuario: se presenta el nombre del usuario autenticado y el ├ímbito de operaci├│n asociado a su perfil, con un texto alternativo cuando no existe un ├ímbito disponible.

Indicadores operativos: se muestran tarjetas para actividades programadas, actividades completadas, pendientes y alertas. Los valores ilustrativos presentes en el c├│digo no deben interpretarse como datos reales del backend sin verificar su origen.

Accesos r├ípidos: el usuario puede dirigirse al chatbot y a las alertas. El acceso a dashboards depende de los permisos y las condiciones definidas en la aplicaci├│n.

Resumen del estado operativo: se presenta informaci├│n visual sobre el estado de la operaci├│n, las actividades pendientes y las alertas.

Presentaci├│n especial para Mayordomo: existe una secci├│n diferenciada con ubicaci├│n de la hacienda, saludo personalizado, alerta importante y agenda de actividades.

El c├│digo compartido identifica cuatro configuraciones de rol: gerente, director, supervisor y mayordomo. La existencia de una composici├│n especial para Mayordomo no demuestra por s├¡ sola que exista un quinto perfil independiente.

Por tanto, el criterio de cinco variantes debe contrastarse con la definici├│n completa de perfiles del proyecto antes de afirmar que se encuentra cumplido.

4. Identidad visual

La pantalla de inicio utiliza como referencia la identidad visual de AgroXpert:

Azul institucional: #0D26A4.

Amarillo: #FDC300.

Verde: #009633.

Tipograf├¡a de t├¡tulos: Bricolage Grotesque.

Tipograf├¡a de interfaz: Public Sans.

La organizaci├│n mediante tarjetas, indicadores, etiquetas de estado, iconos y accesos r├ípidos busca mantener una presentaci├│n coherente con el resto de la aplicaci├│n. La variante de Mayordomo incorpora una organizaci├│n orientada al seguimiento de la operaci├│n diaria.

La definici├│n de la identidad visual no constituye por s├¡ misma evidencia de validaci├│n de accesibilidad, contraste o adaptaci├│n a todos los tama├▒os de pantalla.

5. Criterios de aceptaci├│n y verificaci├│n

CA-01. Inicio por rol

Un usuario autenticado con perfil de Mayordomo accede a la pantalla correspondiente a su funci├│n.

Estado: existe evidencia automatizada relacionada con la navegaci├│n y los permisos del perfil Mayordomo en AppShell. La prueba no demuestra por s├¡ sola el flujo completo desde la autenticaci├│n real hasta la pantalla Home.

CA-02. Cinco variantes de inicio

Est├ín disponibles las cinco variantes de inicio definidas para los perfiles del sistema.

Estado: pendiente de confirmar la quinta variante. El c├│digo revisado identifica cuatro configuraciones de rol; se debe verificar la definici├│n de perfiles del proyecto antes de modificar el criterio o marcarlo como aprobado.

CA-03. Resoluci├│n del rol

La interfaz utiliza el rol resuelto durante la autenticaci├│n y no una selecci├│n manual que permita eludir los permisos.

Estado: existen pruebas automatizadas de navegaci├│n con roles simulados. La resoluci├│n del rol desde la autenticaci├│n real y su correspondencia con el backend requieren validaci├│n adicional.

CA-04. Doble perfil

Un usuario autorizado para dos perfiles puede cambiar entre ellos sin cerrar la sesi├│n.

Estado: pendiente de prueba espec├¡fica. No se dispone de evidencia de que la conmutaci├│n entre perfiles est├® implementada y validada de extremo a extremo.

CA-05. Rendimiento

La pantalla inicial se presenta en menos de tres segundos.

Estado: pendiente de medici├│n con un procedimiento y un entorno de prueba definidos.

6. Plan de pruebas

ID

Caso de prueba

Resultado esperado

Estado

AGX-31-HU-04-CP-01

Ingresar al AppShell con el perfil de administrador.

La pantalla inicial de administraci├│n se presenta de acuerdo con las reglas de navegaci├│n implementadas.

Aprobado mediante prueba automatizada con rol simulado.

AGX-31-HU-04-CP-02

Ingresar al AppShell con el perfil de gerente.

El gerente puede acceder a dashboards y tiene restringidos los planes y la administraci├│n.

Aprobado mediante prueba automatizada con rol simulado.

AGX-31-HU-04-CP-03

Ingresar al AppShell con el perfil de Mayordomo.

El Mayordomo puede acceder a los planes y tiene restringidos los dashboards y la administraci├│n.

Aprobado mediante prueba automatizada con rol simulado.

AGX-31-HU-04-CP-04

Iniciar sesi├│n con usuarios de cada perfil habilitado y abrir Home.

Cada usuario visualiza la pantalla y el contenido que corresponden a su perfil.

Pendiente de validaci├│n funcional integral.

AGX-31-HU-04-CP-05

Revisar el saludo, nombre y ├ímbito mostrado en Home.

La pantalla presenta la informaci├│n del usuario y contempla alternativas cuando faltan datos.

Pendiente de prueba espec├¡fica.

AGX-31-HU-04-CP-06

Verificar los accesos r├ípidos de Home.

El chatbot y las alertas permiten navegar a sus m├│dulos; los dashboards respetan los permisos del perfil.

Pendiente de validaci├│n integral de la pantalla Home.

AGX-31-HU-04-CP-07

Acceder con un usuario autorizado para dos perfiles.

El usuario puede cambiar entre los perfiles autorizados sin cerrar la sesi├│n.

Pendiente.

AGX-31-HU-04-CP-08

Intentar acceder a un perfil o funcionalidad no autorizados.

La aplicaci├│n impide el acceso a las funcionalidades restringidas.

La navegaci├│n de tres perfiles tiene cobertura automatizada parcial; la validaci├│n completa del control de acceso y del backend est├í pendiente.

AGX-31-HU-04-CP-09

Verificar los indicadores de la pantalla.

Se confirma si los valores corresponden a datos reales o son ilustrativos, evitando presentar cifras est├íticas como datos reales.

Pendiente.

AGX-31-HU-04-CP-10

Medir el tiempo de presentaci├│n inicial.

La pantalla se presenta en menos de tres segundos.

Pendiente de medici├│n.

AGX-31-HU-04-CP-11

Revisar la presentaci├│n en escritorio y dispositivos m├│viles.

La pantalla y los elementos de navegaci├│n se presentan adecuadamente en los tama├▒os de pantalla soportados.

Pendiente de validaci├│n espec├¡fica.

AGX-31-HU-04-CP-12

Verificar que el rol utilizado por Home provenga de la sesi├│n real.

El contenido corresponde al rol autenticado y no a un valor simulado o elegido por el usuario sin autorizaci├│n.

Pendiente de prueba de extremo a extremo.

Resultado global de las pruebas automatizadas del frontend

La suite completa del frontend se ejecut├│ con el siguiente resultado:

src/tests/AGX-31-HU-04-AppShell.test.jsx: 3 pruebas aprobadas.

src/components/ui/__tests__/Button.test.jsx: 2 pruebas aprobadas.

Total: 2 archivos de prueba y 5 pruebas aprobadas.

Build del frontend: completado satisfactoriamente; se mostr├│ una advertencia sobre el tama├▒o del paquete JavaScript superior a 500 kB.

Los tres casos de AppShell utilizan roles simulados y componentes auxiliares simulados. Por ello, sus resultados validan comportamientos espec├¡ficos de navegaci├│n del componente, pero no prueban el inicio de sesi├│n real, la resoluci├│n de roles desde Fabric, el funcionamiento de la pantalla Home con datos reales ni la protecci├│n del backend.

7. Evidencias

Las evidencias disponibles incluyen:

C├│digo de frontend/src/App.jsx relacionado con la composici├│n principal y la selecci├│n de la vista.

C├│digo de frontend/src/pages/Home.jsx, relacionado con el contenido personalizado por perfil.

Pruebas automatizadas de AppShell con tres casos aprobados.

Resultado de la suite completa del frontend: 5 pruebas aprobadas en 2 archivos.

Resultado de compilaci├│n del frontend: build satisfactorio con una advertencia sobre el tama├▒o del paquete JavaScript.

Para completar la validaci├│n de la historia se requiere evidencia adicional de:

La pantalla Home para cada variante de perfil definida.

La correspondencia entre el rol real de autenticaci├│n y el contenido presentado.

La conmutaci├│n entre perfiles autorizados, si aplica.

Los permisos aplicados a los accesos r├ípidos.

El origen de los indicadores operativos.

El tiempo de presentaci├│n inicial inferior a tres segundos.

La adaptaci├│n a los tama├▒os de pantalla soportados.

La referencia al Pull Request y los resultados de revisi├│n.

8. Definition of Done

La pantalla de inicio del perfil Mayordomo se presenta en menos de tres segundos.

Las cinco variantes de inicio definidas para el proyecto est├ín implementadas y verificadas.

Se ha confirmado la lista de perfiles que deben tener una variante de inicio.

El rol utilizado por la interfaz corresponde al resuelto durante la autenticaci├│n.

La conmutaci├│n entre perfiles funciona para los usuarios autorizados, si corresponde al alcance definitivo.

Los accesos r├ípidos respetan los permisos asignados.

Se ha verificado el origen de los indicadores y se han diferenciado los datos reales de los valores ilustrativos.

Se ha medido y documentado el tiempo de presentaci├│n inicial.

Se han validado los tama├▒os de pantalla soportados.

Se han ejecutado y aprobado las pruebas aplicables.

El c├│digo est├í integrado mediante el Pull Request correspondiente y se ha completado la revisi├│n requerida.

La documentaci├│n est├í actualizada en Confluence.

El incremento se ha desplegado y validado en el ambiente objetivo, cuando corresponde al flujo de entrega.

Las casillas permanecen sin marcar porque las pruebas disponibles cubren solo una parte de los requisitos de la historia.

9. Historial de validaci├│n

Elemento

Estado seg├║n la informaci├│n disponible

frontend/src/App.jsx

Identificado como el archivo asociado a la selecci├│n de la vista principal seg├║n el estado y el rol.

frontend/src/pages/Home.jsx

C├│digo identificado con configuraci├│n por rol, indicadores, accesos r├ípidos y composici├│n especial para Mayordomo.

Componentes de contexto y navegaci├│n

Identificados como componentes relacionados con la sesi├│n, la estructura autenticada y la navegaci├│n.

Prueba CP-01

Aprobada: administrador inicia en administraci├│n, con rol simulado.

Prueba CP-02

Aprobada: gerente puede acceder a dashboards y tiene restringidos planes y administraci├│n, con rol simulado.

Prueba CP-03

Aprobada: Mayordomo puede acceder a planes y tiene restringidos dashboards y administraci├│n, con rol simulado.

Suite completa del frontend

5 pruebas aprobadas en 2 archivos.

Build del frontend

Completado satisfactoriamente; con advertencia de tama├▒o del paquete JavaScript.

Variantes de inicio

Se identifican cuatro configuraciones de rol en el c├│digo revisado; no se ha confirmado la quinta variante requerida.

Resoluci├│n del rol desde la autenticaci├│n real

Requisito definido; sin prueba de extremo a extremo aportada.

Conmutaci├│n entre perfiles

Sin evidencia de una prueba satisfactoria.

Indicadores operativos

Falta verificar si los valores mostrados proceden de datos reales o son ilustrativos.

Tiempo inferior a tres segundos

No se aport├│ una medici├│n verificable.

Adaptaci├│n a escritorio y m├│viles

Sin evidencia espec├¡fica de validaci├│n.

Pull Request, revisi├│n y despliegue

Sin referencias ni resultados verificables aportados.

Conclusi├│n: AGX-31 aborda la presentaci├│n de una pantalla de inicio adaptada al perfil del usuario. Se identificaron los componentes de la pantalla principal y se aprobaron tres pruebas automatizadas de navegaci├│n y permisos dentro de AppShell, adem├ís de las dos pruebas de componentes UI. Para confirmar el cumplimiento integral de la historia todav├¡a se requiere validar las variantes de inicio, el origen del rol, los permisos en el flujo real, la conmutaci├│n entre perfiles, los indicadores y el rendimiento.

