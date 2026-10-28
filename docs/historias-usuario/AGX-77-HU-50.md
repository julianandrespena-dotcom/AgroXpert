# AGX-77 ÔÇö HU-50: Definir el mapa del sitio, las taxonom├¡as y la navegaci├│n

## 1. Informaci├│n general

- **Clave Jira:** AGX-77.
- **Historia de usuario:** HU-50 ÔÇö Definir el mapa del sitio, las taxonom├¡as y la navegaci├│n.
- **Rol:** Developer.
- **Responsable:** Juli├ín Pe├▒a ÔÇö Developer.
- **Estimaci├│n:** 2 puntos de historia.
- **Prioridad:** Must ÔÇö High.
- **Release:** Release 1 ÔÇö Base anal├¡tica y planes de manejo por suerte (Objetivo 1).
- **Fecha objetivo:** 30/10/2026.
- **Refinamiento:** Refinada; cumple con la Definition of Ready.
- **Commit asociado:** `1201800`.
- **Mensaje del commit:** `AGX-77 Definir mapa del sitio y navegacion`.
- **Archivos modificados en el commit:** 5.

## 2. Objetivo

Se trabaj├│ en la organizaci├│n de la arquitectura de navegaci├│n de AgroXpert, definiendo una estructura com├║n para acceder a las secciones de la aplicaci├│n y diferenciando los componentes de navegaci├│n seg├║n el dispositivo.

La implementaci├│n permiti├│ centralizar las opciones de navegaci├│n y distribuir las responsabilidades entre los componentes de estructura general, barra lateral, barra superior y navegaci├│n m├│vil. Esta organizaci├│n proporciona una base para mantener una navegaci├│n coherente a medida que se incorporan las funcionalidades correspondientes a cada perfil.

La historia tambi├®n establece como objetivo organizar los siete m├│dulos principales, definir la taxonom├¡a y los metadatos de la informaci├│n y facilitar el acceso a las funciones cr├¡ticas en tres interacciones o menos.

## 3. Alcance de la implementaci├│n

El cambio asociado a AGX-77 se concentr├│ en la estructura de navegaci├│n del frontend y en la configuraci├│n de las opciones que se presentan al usuario.

La organizaci├│n contempla siete m├│dulos funcionales:

1. Acceso y perfil.
2. Inicio seg├║n rol.
3. Dashboard, con el an├ílisis espacial integrado en el Dashboard 2.
4. Chatbot.
5. Alertas.
6. Registros de ejecuci├│n.
7. Administraci├│n.

Como parte de la arquitectura definida, el geoportal no se considera un m├│dulo independiente: el an├ílisis espacial se integra en el Dashboard 2.

**Archivos identificados en el cambio asociado a esta historia:**

**1. `frontend/src/components/layout/AppShell.jsx`**

Se incorpor├│ la estructura general que organiza la interfaz una vez que el usuario accede a la aplicaci├│n. Este componente act├║a como contenedor de las principales ├íreas de navegaci├│n y contenido, manteniendo una distribuci├│n com├║n entre las distintas vistas.

Su funci├│n dentro de la arquitectura de navegaci├│n es proporcionar una estructura consistente para presentar las secciones de AgroXpert y permitir que los componentes de navegaci├│n se integren con el contenido principal.

**2. `frontend/src/components/layout/Sidebar.jsx`**

Se implement├│ el componente de navegaci├│n lateral utilizado para organizar el acceso a las secciones de la aplicaci├│n en la interfaz de escritorio.

Su funci├│n es presentar las opciones de navegaci├│n de forma estructurada, facilitar la identificaci├│n de los m├│dulos y permitir que el usuario encuentre las secciones disponibles sin tener que recorrer pantallas intermedias innecesarias.

**3. `frontend/src/components/layout/Topbar.jsx`**

Se incorpor├│ la barra superior de la interfaz, que complementa la navegaci├│n principal y re├║ne los elementos correspondientes a la zona superior de la aplicaci├│n.

Su funci├│n es mantener una estructura consistente en las vistas y ofrecer un espacio com├║n para los controles y elementos generales de la interfaz, diferenci├índolos de las opciones de navegaci├│n entre m├│dulos.

**4. `frontend/src/components/layout/MobileBottomNav.jsx`**

Se implement├│ la navegaci├│n inferior destinada a interfaces de menor tama├▒o, adaptando la presentaci├│n de las opciones para facilitar su acceso desde dispositivos m├│viles.

Este componente permite organizar las opciones de navegaci├│n en un patr├│n compacto, distinto de la barra lateral de escritorio. Su separaci├│n facilita ajustar la experiencia para pantallas peque├▒as sin depender exclusivamente del patr├│n de navegaci├│n de escritorio.

**5. `frontend/src/data/navigation.js`**

Se centraliz├│ la definici├│n de los elementos de navegaci├│n en un archivo de configuraci├│n. Esto permite mantener las opciones organizadas en un ├║nico lugar y facilita su utilizaci├│n por los componentes responsables de presentar la navegaci├│n.

Su funci├│n es evitar que cada componente tenga que definir por separado los elementos de navegaci├│n y favorecer la consistencia entre las distintas ├íreas de la interfaz.

En conjunto, los cinco archivos establecen una separaci├│n entre la estructura general de la aplicaci├│n, los componentes de navegaci├│n para distintos espacios de pantalla y la configuraci├│n de las opciones disponibles.

La taxonom├¡a, los metadatos por entidad, los flujos documentados por perfil y la especificaci├│n de b├║squeda por texto y voz forman parte del alcance funcional de la historia. El commit identificado acredita los cambios de navegaci├│n anteriores, pero no permite atribuir por s├¡ solo la publicaci├│n de todos esos entregables documentales.

## 4. Identidad visual y presentaci├│n de la navegaci├│n

La navegaci├│n se organiza de acuerdo con la estructura visual general de AgroXpert, diferenciando la presentaci├│n de las opciones seg├║n el espacio disponible en cada dispositivo.

En escritorio, la barra lateral ofrece una ubicaci├│n persistente para las secciones principales. En pantallas peque├▒as, la navegaci├│n inferior permite acceder a las opciones mediante un patr├│n m├ís compacto.

La barra superior complementa ambos patrones y mantiene una zona com├║n para los elementos generales de la interfaz.

Esta separaci├│n permite que la navegaci├│n se adapte al dispositivo sin convertir la aplicaci├│n en dos productos independientes. La estructura tambi├®n facilita mantener consistentes los nombres y la organizaci├│n de las opciones en los diferentes componentes.

## 5. Criterios de aceptaci├│n y verificaci├│n

| Criterio | Funci├│n y resultado contemplado |
|---|---|
| **CA-01. Navegaci├│n eficiente** | La organizaci├│n de las opciones busca que cada perfil acceda a la informaci├│n cr├¡tica en tres interacciones o menos. |
| **CA-02. Mapa del sitio** | Se establece una arquitectura de siete m├│dulos, sin un geoportal independiente. |
| **CA-03. Taxonom├¡a y metadatos** | Se define como parte del alcance la organizaci├│n de la taxonom├¡a principal y los metadatos de cada entidad. |
| **CA-04. Flujos por perfil** | Se contempla la definici├│n de recorridos adecuados para los distintos perfiles de usuario. |
| **CA-05. B├║squeda por texto y voz** | Se incluye la especificaci├│n de mecanismos de b├║squeda para facilitar la localizaci├│n de informaci├│n. |

Los componentes de navegaci├│n y el archivo centralizado de opciones respaldan la implementaci├│n de la estructura de navegaci├│n. La confirmaci├│n de los criterios relacionados con tiempos de acceso, taxonom├¡as, metadatos y b├║squeda requiere, adem├ís, las evidencias funcionales o documentales correspondientes.

## 6. Plan de pruebas

Las verificaciones asociadas a la historia se organizaron en los siguientes escenarios:

**Prueba 1 ÔÇö Recorrido de navegaci├│n por perfil**

- Se recorren las opciones disponibles para cada perfil.
- Se verifica la facilidad para localizar la informaci├│n cr├¡tica.
- Se contrasta el recorrido con el objetivo de tres interacciones o menos.

**Prueba 2 ÔÇö Organizaci├│n de los m├│dulos**

- Se revisa la configuraci├│n de las opciones de navegaci├│n.
- Se comprueba la correspondencia entre las secciones definidas y los siete m├│dulos de la arquitectura.

**Prueba 3 ÔÇö Distribuci├│n de la navegaci├│n por dispositivo**

- Se revisa la estructura de la navegaci├│n lateral en escritorio.
- Se inspecciona la presentaci├│n de la navegaci├│n inferior en dispositivos peque├▒os.
- Se verifica la integraci├│n de ambos patrones con la estructura general de la aplicaci├│n.

**Prueba 4 ÔÇö Exclusi├│n del geoportal independiente**

- Se revisa la organizaci├│n funcional del Dashboard y del an├ílisis espacial.
- Se verifica que la arquitectura definida contemple el an├ílisis espacial dentro del Dashboard 2 y no como un m├│dulo independiente.

**Prueba 5 ÔÇö Taxonom├¡a y metadatos**

- Se revisa la documentaci├│n de la taxonom├¡a principal.
- Se comprueba que los metadatos requeridos est├®n definidos para las entidades contempladas en la historia.

**Prueba 6 ÔÇö B├║squeda por texto y voz**

- Se revisa la especificaci├│n de los mecanismos de b├║squeda.
- Se verifica que la documentaci├│n describa ambos m├®todos de b├║squeda y su funci├│n en el acceso a la informaci├│n.

Estos escenarios corresponden a las verificaciones de la historia. El registro del commit acredita el cambio de c├│digo en los componentes de navegaci├│n, pero no incluye resultados individuales que permitan marcar todas las pruebas como aprobadas.

## 7. Evidencias

Las evidencias de implementaci├│n identificadas son:

- **Commit:** `1201800`.
- **Mensaje:** `AGX-77 Definir mapa del sitio y navegacion`.
- **Archivos modificados:**
  - `frontend/src/components/layout/AppShell.jsx`
  - `frontend/src/components/layout/Sidebar.jsx`
  - `frontend/src/components/layout/Topbar.jsx`
  - `frontend/src/components/layout/MobileBottomNav.jsx`
  - `frontend/src/data/navigation.js`

Estos archivos permiten identificar el cambio de c├│digo asociado con la organizaci├│n de la navegaci├│n.

Como evidencias complementarias de la historia se consideran el mapa del sitio, la documentaci├│n de taxonom├¡as y metadatos, los flujos por perfil, la especificaci├│n de b├║squeda y los resultados de las pruebas de navegaci├│n. No se aportaron enlaces espec├¡ficos a estos documentos ni resultados de pruebas que permitan confirmar su publicaci├│n o aprobaci├│n.

## 8. Definition of Done

La Definition of Done definida para AGX-77 contempla los siguientes resultados:

- Criterio de acceso a informaci├│n cr├¡tica en tres interacciones o menos verificado.
- Mapa del sitio organizado en siete m├│dulos, sin un geoportal independiente.
- Taxonom├¡a y metadatos documentados.
- Flujos de navegaci├│n por perfil documentados.
- B├║squeda por texto y voz especificadas.
- C├│digo integrado mediante Pull Request con revisi├│n propia aprobada.
- Pruebas aplicables aprobadas.
- Documentaci├│n actualizada en Confluence.
- Incremento desplegado en el ambiente objetivo del release.
- Validaci├│n con al menos un usuario referente del perfil correspondiente.

El commit `1201800` constituye evidencia del cambio de c├│digo relacionado con la navegaci├│n. No se debe confundir esa evidencia con la confirmaci├│n de todos los requisitos de cierre: la informaci├│n proporcionada no incluye resultados suficientes para certificar el cumplimiento integral de la Definition of Done.

## 9. Historial de validaci├│n

- **Implementaci├│n de navegaci├│n:** se registr├│ el commit `1201800`, con el mensaje `AGX-77 Definir mapa del sitio y navegacion`.
- **Archivos modificados:** se identificaron cinco archivos relacionados con la estructura de la aplicaci├│n, la navegaci├│n lateral, la barra superior, la navegaci├│n para pantallas peque├▒as y la configuraci├│n de opciones.
- **Arquitectura funcional:** la historia define siete m├│dulos y excluye el geoportal como secci├│n independiente, integrando el an├ílisis espacial en el Dashboard 2.
- **Navegaci├│n por dispositivo:** el cambio de c├│digo contempla componentes diferenciados para escritorio y pantallas peque├▒as.
- **Navegaci├│n por perfil:** la historia establece recorridos adaptados a cada perfil y el objetivo de acceso a informaci├│n cr├¡tica en tres interacciones o menos.
- **Taxonom├¡a, metadatos y b├║squeda:** forman parte del alcance definido; no se aportaron enlaces a la documentaci├│n que permitan confirmar su publicaci├│n.
- **Pruebas funcionales y validaci├│n con usuarios:** no se proporcionaron resultados de ejecuci├│n ni evidencias de validaci├│n con un usuario referente.
- **Estado de cierre:** el commit acredita la implementaci├│n de navegaci├│n registrada, pero no permite determinar por s├¡ solo si todos los requisitos de cierre de
