import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Power,
  X,
  UserPlus,
  Search,
  Map,
  Warehouse,
  Sprout,
  KeyRound,
} from "lucide-react";

import "../styles/admin.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ROL_ADMINISTRADOR = "administrador";

const EMPTY_FORM = {
  usuario: "",
  password: "",
  nombre: "",
  cargo: "",
  rol: "mayordomo",
  zonaIds: [],
  haciendaIds: [],
  suerteIds: [],
};

const EMPTY_PASSWORD_FORM = {
  password: "",
  confirmPassword: "",
};

/* =========================================================
   VALIDAR ZONAS DISPONIBLES PARA ASIGNACIÓN
========================================================= */

function esZonaNoAsignable(zona) {
  const nombre = String(zona?.nombre || "")
    .trim()
    .toLowerCase();

  return (
    nombre === "ingenio completo" ||
    nombre === "zona central incauca"
  );
}

export default function Administracion() {
  const [users, setUsers] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [haciendas, setHaciendas] = useState([]);
  const [suertes, setSuertes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [search, setSearch] = useState("");
  const [searchHaciendas, setSearchHaciendas] = useState("");
  const [searchSuertes, setSearchSuertes] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordForm, setPasswordForm] =
    useState(EMPTY_PASSWORD_FORM);

  /* =========================================================
     CARGAR USUARIOS
  ========================================================= */

  async function loadUsers() {
    const response = await fetch(`${API_URL}/users`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("No fue posible cargar los usuarios.");
    }

    const data = await response.json();

    setUsers(Array.isArray(data) ? data : []);
  }

  /* =========================================================
     CARGAR ZONAS
  ========================================================= */

  async function loadZonas() {
    const response = await fetch(`${API_URL}/access/zonas`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("No fue posible cargar las zonas.");
    }

    const data = await response.json();

    const zonasNormalizadas = (Array.isArray(data) ? data : [])
      .filter((zona) => !esZonaNoAsignable(zona))
      .map((zona) => ({
        ...zona,
        nombre: String(zona.nombre || "").trim(),
        codigo: zona.codigo ?? zona.id,
      }));

    setZonas(zonasNormalizadas);
  }

  /* =========================================================
     CARGAR HACIENDAS
  ========================================================= */

  async function loadHaciendas(zonaIds) {
    if (!zonaIds.length) {
      setHaciendas([]);
      return [];
    }

    const query = zonaIds.join(",");

    const response = await fetch(
      `${API_URL}/access/haciendas?zonaIds=${encodeURIComponent(
        query
      )}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("No fue posible cargar las haciendas.");
    }

    const data = await response.json();

    const result = Array.isArray(data) ? data : [];

    setHaciendas(result);

    return result;
  }

  /* =========================================================
     CARGAR SUERTES
  ========================================================= */

  async function loadSuertes(haciendaIds) {
    if (!haciendaIds.length) {
      setSuertes([]);
      return [];
    }

    const query = haciendaIds.join(",");

    const response = await fetch(
      `${API_URL}/access/suertes?haciendaIds=${encodeURIComponent(
        query
      )}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("No fue posible cargar las suertes.");
    }

    const data = await response.json();

    const result = Array.isArray(data) ? data : [];

    setSuertes(result);

    return result;
  }

  /* =========================================================
     CARGA INICIAL
  ========================================================= */

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadUsers(),
          loadZonas(),
        ]);
      } catch (err) {
        console.error(err);

        setError(
          err.message || "Error cargando información."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* =========================================================
     ABRIR CREACIÓN
  ========================================================= */

  function openCreateForm() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      zonaIds: [],
      haciendaIds: [],
      suerteIds: [],
    });

    setHaciendas([]);
    setSuertes([]);

    setSearchHaciendas("");
    setSearchSuertes("");

    setError("");
    setShowForm(true);
  }

  /* =========================================================
     ABRIR EDICIÓN
  ========================================================= */

  async function openEditForm(user) {
    if (user.rol === ROL_ADMINISTRADOR) {
      setError(
        "La cuenta de administrador es una cuenta predeterminada y no puede editarse."
      );

      return;
    }

    const zonaIds =
      user.zonas?.map((item) => item.id) || [];

    const haciendaIds =
      user.haciendas?.map((item) => item.id) || [];

    const suerteIds =
      user.suertes?.map((item) => item.id) || [];

    setEditingId(user.id);

    setForm({
      usuario: user.usuario || "",
      password: "",
      nombre: user.nombre || "",
      cargo: user.cargo || "",
      rol: user.rol || "mayordomo",
      zonaIds,
      haciendaIds,
      suerteIds,
    });

    setSearchHaciendas("");
    setSearchSuertes("");
    setError("");
    setShowForm(true);

    try {
      if (
        user.rol === "mayordomo" ||
        user.rol === "director" ||
        user.rol === "supervisor"
      ) {
        await loadHaciendas(zonaIds);
      }

      if (user.rol === "mayordomo") {
        await loadSuertes(haciendaIds);
      } else {
        setSuertes([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cargar los accesos."
      );
    }
  }

  /* =========================================================
     CERRAR FORMULARIO
  ========================================================= */

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      zonaIds: [],
      haciendaIds: [],
      suerteIds: [],
    });

    setHaciendas([]);
    setSuertes([]);

    setSearchHaciendas("");
    setSearchSuertes("");

    setError("");
  }

  /* =========================================================
     CAMBIAR CAMPOS
  ========================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "rol") {
      if (value === ROL_ADMINISTRADOR) {
        setError(
          "El administrador es una cuenta predeterminada del sistema."
        );

        return;
      }

      setError("");

      if (value === "gerente") {
        setForm((current) => ({
          ...current,
          rol: value,
          zonaIds: [],
          haciendaIds: [],
          suerteIds: [],
        }));

        setHaciendas([]);
        setSuertes([]);

        setSearchHaciendas("");
        setSearchSuertes("");

        return;
      }

      if (
        value === "director" ||
        value === "supervisor"
      ) {
        setForm((current) => ({
          ...current,
          rol: value,
          haciendaIds: [],
          suerteIds: [],
        }));

        setHaciendas([]);
        setSuertes([]);

        setSearchHaciendas("");
        setSearchSuertes("");

        return;
      }

      setForm((current) => ({
        ...current,
        rol: value,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================================================
     SELECCIONAR ZONA
  ========================================================= */

  async function toggleZona(zonaId) {
    const zonaSeleccionada = zonas.find(
      (zona) => zona.id === zonaId
    );

    if (esZonaNoAsignable(zonaSeleccionada)) {
      return;
    }

    const current = form.zonaIds;

    const next = current.includes(zonaId)
      ? current.filter((id) => id !== zonaId)
      : [...current, zonaId];

    setForm((currentForm) => ({
      ...currentForm,
      zonaIds: next,
      haciendaIds: [],
      suerteIds: [],
    }));

    setHaciendas([]);
    setSuertes([]);

    setSearchHaciendas("");
    setSearchSuertes("");

    try {
      await loadHaciendas(next);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cargar las haciendas."
      );
    }
  }

  /* =========================================================
     SELECCIONAR HACIENDA
  ========================================================= */

  async function toggleHacienda(haciendaId) {
    const current = form.haciendaIds;

    const next = current.includes(haciendaId)
      ? current.filter((id) => id !== haciendaId)
      : [...current, haciendaId];

    setForm((currentForm) => ({
      ...currentForm,
      haciendaIds: next,
      suerteIds: [],
    }));

    setSuertes([]);
    setSearchSuertes("");

    try {
      await loadSuertes(next);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cargar las suertes."
      );
    }
  }

  /* =========================================================
     SELECCIONAR SUERTE
  ========================================================= */

  function toggleSuerte(suerteId) {
    setForm((current) => ({
      ...current,
      suerteIds: current.suerteIds.includes(suerteId)
        ? current.suerteIds.filter(
            (id) => id !== suerteId
          )
        : [...current.suerteIds, suerteId],
    }));
  }

  /* =========================================================
     GUARDAR USUARIO
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (editingId) {
      const usuarioActual = users.find(
        (user) => user.id === editingId
      );

      if (
        usuarioActual?.rol ===
        ROL_ADMINISTRADOR
      ) {
        setError(
          "La cuenta de administrador es una cuenta predeterminada y no puede editarse."
        );

        return;
      }
    }

    const usuario = form.usuario.trim();
    const nombre = form.nombre.trim();
    const cargo = form.cargo.trim();
    const password = form.password.trim();

    if (!usuario) {
      setError("El usuario es obligatorio.");
      return;
    }

    if (!nombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!cargo) {
      setError("El cargo es obligatorio.");
      return;
    }

    if (!form.rol) {
      setError("El rol es obligatorio.");
      return;
    }

    if (!editingId && !password) {
      setError("La contraseña es obligatoria.");
      return;
    }

    if (form.rol === ROL_ADMINISTRADOR) {
      setError(
        "El administrador es una cuenta predeterminada del sistema y no puede crearse desde Administración."
      );

      return;
    }

    /*
     * Seguridad adicional:
     * nunca permitir enviar una zona no asignable.
     */
    const zonasPermitidas = form.zonaIds.filter(
      (zonaId) => {
        const zona = zonas.find(
          (item) => item.id === zonaId
        );

        return !esZonaNoAsignable(zona);
      }
    );

    if (
      form.rol === "director" ||
      form.rol === "supervisor"
    ) {
      if (!zonasPermitidas.length) {
        setError("Selecciona al menos una zona.");
        return;
      }
    }

    if (form.rol === "mayordomo") {
      if (!zonasPermitidas.length) {
        setError("Selecciona al menos una zona.");
        return;
      }

      if (!form.haciendaIds.length) {
        setError(
          "Selecciona al menos una hacienda."
        );
        return;
      }

      if (!form.suerteIds.length) {
        setError(
          "Selecciona al menos una suerte."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        usuario,
        nombre,
        cargo,
        rol: form.rol,
        zonaIds: zonasPermitidas,
        haciendaIds: form.haciendaIds,
        suerteIds: form.suerteIds,
      };

      if (!editingId) {
        payload.password = password;
      }

      const response = await fetch(
        editingId
          ? `${API_URL}/users/${editingId}`
          : `${API_URL}/users`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ||
            "No fue posible guardar el usuario."
        );
      }

      await loadUsers();
      closeForm();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible guardar el usuario."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CAMBIAR ESTADO
  ========================================================= */

  async function toggleStatus(user) {
    if (user.rol === ROL_ADMINISTRADOR) {
      setError(
        "La cuenta de administrador es una cuenta predeterminada y no puede desactivarse."
      );

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/users/${user.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            activo: !user.activo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ||
            "No fue posible cambiar el estado."
        );
      }

      await loadUsers();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "No fue posible cambiar el estado."
      );
    }
  }

  /* =========================================================
     ABRIR CAMBIO CONTRASEÑA
  ========================================================= */

  function openPasswordModal(user) {
    if (user.rol === ROL_ADMINISTRADOR) {
      setError(
        "La contraseña del administrador predeterminado no puede cambiarse desde Administración."
      );

      return;
    }

    setPasswordUser(user);

    setPasswordForm({
      ...EMPTY_PASSWORD_FORM,
    });

    setPasswordError("");
    setShowPasswordModal(true);
  }

  /* =========================================================
     CERRAR CAMBIO CONTRASEÑA
  ========================================================= */

  function closePasswordModal() {
    if (changingPassword) {
      return;
    }

    setShowPasswordModal(false);
    setPasswordUser(null);

    setPasswordForm({
      ...EMPTY_PASSWORD_FORM,
    });

    setPasswordError("");
  }

  /* =========================================================
     CAMBIAR CAMPOS CONTRASEÑA
  ========================================================= */

  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================================================
     GUARDAR NUEVA CONTRASEÑA
  ========================================================= */

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    setPasswordError("");

    if (
      passwordUser?.rol ===
      ROL_ADMINISTRADOR
    ) {
      setPasswordError(
        "La contraseña del administrador predeterminado no puede cambiarse desde Administración."
      );

      return;
    }

    const password =
      passwordForm.password.trim();

    const confirmPassword =
      passwordForm.confirmPassword.trim();

    if (!password) {
      setPasswordError(
        "Ingresa una nueva contraseña."
      );
      return;
    }

    if (password.length < 6) {
      setPasswordError(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (!confirmPassword) {
      setPasswordError(
        "Confirma la nueva contraseña."
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    if (!passwordUser?.id) {
      setPasswordError(
        "No se encontró el usuario."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${API_URL}/users/${passwordUser.id}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensaje ||
            "No fue posible cambiar la contraseña."
        );
      }

      closePasswordModal();
    } catch (err) {
      console.error(err);

      setPasswordError(
        err.message ||
          "No fue posible cambiar la contraseña."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /* =========================================================
     FILTRAR USUARIOS
  ========================================================= */

  const filteredUsers = users.filter((user) => {
    const text =
      `${user.nombre || ""} ${
        user.usuario || ""
      } ${user.cargo || ""} ${
        user.rol || ""
      }`.toLowerCase();

    return text.includes(
      search.toLowerCase()
    );
  });

  /* =========================================================
     FILTRAR HACIENDAS
  ========================================================= */

  const filteredHaciendas = haciendas.filter(
    (hacienda) => {
      const text =
        `${hacienda.codigo || ""} ${
          hacienda.nombre || ""
        } ${hacienda.zona || ""}`.toLowerCase();

      return text.includes(
        searchHaciendas.toLowerCase()
      );
    }
  );

  /* =========================================================
     FILTRAR SUERTES
  ========================================================= */

  const filteredSuertes = suertes.filter(
    (suerte) => {
      const text =
        `${suerte.codigo || ""} ${
          suerte.hacienda || ""
        } ${
          suerte.hacienda_codigo || ""
        } ${
          suerte.zona || ""
        }`.toLowerCase();

      return text.includes(
        searchSuertes.toLowerCase()
      );
    }
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="administracion">

      {/* HEADER */}

      <div className="administracion-header">
        <div>
          <h1>Administración</h1>

          <p>
            Gestión de usuarios y accesos
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={openCreateForm}
        >
          <Plus size={18} />

          Nuevo usuario
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {/* BUSCADOR */}

      <div className="admin-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>
      </div>

      {/* TABLA */}

      <div className="users-table-container">
        {loading ? (
          <div className="admin-loading">
            Cargando usuarios...
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Rol</th>
                <th>Acceso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="admin-loading"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const esAdministrador =
                    user.rol ===
                    ROL_ADMINISTRADOR;

                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>
                          {user.usuario}
                        </strong>
                      </td>

                      <td>
                        {user.nombre}
                      </td>

                      <td>
                        {user.cargo}
                      </td>

                      <td>
                        {user.rol}
                      </td>

                      <td>
                        {user.rol ===
                          ROL_ADMINISTRADOR ||
                        user.rol ===
                          "gerente" ? (
                          <span>
                            Acceso global
                          </span>
                        ) : (
                          <div className="access-summary">
                            <span>
                              Zonas:{" "}
                              {user.zonas
                                ?.length || 0}
                            </span>

                            {user.rol ===
                              "mayordomo" && (
                              <>
                                <span>
                                  Haciendas:{" "}
                                  {user.haciendas
                                    ?.length ||
                                    0}
                                </span>

                                <span>
                                  Suertes:{" "}
                                  {user.suertes
                                    ?.length ||
                                    0}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            user.activo
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {user.activo
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        {esAdministrador ? (
                          <span
                            className="protected-actions"
                            title="Cuenta predeterminada protegida"
                          >
                            Protegida
                          </span>
                        ) : (
                          <div className="table-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  user
                                )
                              }
                              title="Editar"
                            >
                              <Pencil
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openPasswordModal(
                                  user
                                )
                              }
                              title="Cambiar contraseña"
                            >
                              <KeyRound
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(
                                  user
                                )
                              }
                              title={
                                user.activo
                                  ? "Desactivar"
                                  : "Activar"
                              }
                            >
                              <Power
                                size={17}
                              />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* =====================================================
          MODAL CREAR / EDITAR
      ===================================================== */}

      {showForm && (
        <div className="modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Editar usuario"
                    : "Nuevo usuario"}
                </h2>

                <p>
                  Configura el usuario y sus accesos.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="form-grid">

                <div className="form-group">
                  <label>
                    Usuario
                  </label>

                  <input
                    name="usuario"
                    value={form.usuario}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>

                {!editingId && (
                  <div className="form-group">
                    <label>
                      Contraseña
                    </label>

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      disabled={saving}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>
                    Nombre completo
                  </label>

                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Cargo
                  </label>

                  <input
                    name="cargo"
                    value={form.cargo}
                    onChange={handleChange}
                    disabled={saving}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Rol
                  </label>

                  <select
                    name="rol"
                    value={form.rol}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="mayordomo">
                      Mayordomo
                    </option>

                    <option value="supervisor">
                      Supervisor
                    </option>

                    <option value="director">
                      Director
                    </option>

                    <option value="gerente">
                      Gerente
                    </option>
                  </select>
                </div>

              </div>

              {/* =================================================
                  DIRECTOR / SUPERVISOR
              ================================================= */}

              {(form.rol === "director" ||
                form.rol === "supervisor") && (
                <section className="access-section">
                  <div className="access-title">
                    <Map size={19} />

                    <div>
                      <h3>Zonas</h3>

                      <p>
                        Selecciona las zonas a las que tendrá acceso.
                      </p>
                    </div>
                  </div>

                  <div className="options-grid">
                    {zonas
                      .filter(
                        (zona) =>
                          !esZonaNoAsignable(zona)
                      )
                      .map((zona) => {
                        const selected =
                          form.zonaIds.includes(
                            zona.id
                          );

                        return (
                          <button
                            type="button"
                            key={zona.id}
                            className={
                              selected
                                ? "access-option selected"
                                : "access-option"
                            }
                            onClick={() =>
                              toggleZona(
                                zona.id
                              )
                            }
                          >
                            <strong>
                              {zona.codigo ?? zona.id}
                            </strong>

                            <span>
                              {zona.nombre}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </section>
              )}

              {/* =================================================
                  MAYORDOMO
              ================================================= */}

              {form.rol === "mayordomo" && (
                <>
                  {/* ZONAS */}

                  <section className="access-section">
                    <div className="access-title">
                      <Map size={19} />

                      <div>
                        <h3>
                          1. Seleccionar zona
                        </h3>

                        <p>
                          Primero selecciona una o varias zonas.
                        </p>
                      </div>
                    </div>

                    <div className="options-grid">
                      {zonas
                        .filter(
                          (zona) =>
                            !esZonaNoAsignable(zona)
                        )
                        .map((zona) => {
                          const selected =
                            form.zonaIds.includes(
                              zona.id
                            );

                          return (
                            <button
                              type="button"
                              key={zona.id}
                              className={
                                selected
                                  ? "access-option selected"
                                  : "access-option"
                              }
                              onClick={() =>
                                toggleZona(
                                  zona.id
                                )
                              }
                            >
                              <strong>
                                {zona.codigo ?? zona.id}
                              </strong>

                              <span>
                                {zona.nombre}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </section>

                  {/* HACIENDAS */}

                  <section className="access-section">
                    <div className="access-title">
                      <Warehouse size={19} />

                      <div>
                        <h3>
                          2. Seleccionar haciendas
                        </h3>

                        <p>
                          Solo aparecen haciendas de las zonas seleccionadas.
                        </p>
                      </div>
                    </div>

                    {!form.zonaIds.length ? (
                      <div className="empty-access">
                        Selecciona primero una zona.
                      </div>
                    ) : (
                      <>
                        <div className="access-search">
                          <Search size={17} />

                          <input
                            type="text"
                            placeholder="Buscar por código o nombre de hacienda..."
                            value={searchHaciendas}
                            onChange={(event) =>
                              setSearchHaciendas(
                                event.target.value
                              )
                            }
                          />
                        </div>

                        {filteredHaciendas.length ===
                        0 ? (
                          <div className="empty-access">
                            {searchHaciendas
                              ? "No se encontraron haciendas con esa búsqueda."
                              : "No hay haciendas disponibles para las zonas seleccionadas."}
                          </div>
                        ) : (
                          <div className="options-grid">
                            {filteredHaciendas.map(
                              (hacienda) => {
                                const selected =
                                  form.haciendaIds.includes(
                                    hacienda.id
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      hacienda.id
                                    }
                                    className={
                                      selected
                                        ? "access-option selected"
                                        : "access-option"
                                    }
                                    onClick={() =>
                                      toggleHacienda(
                                        hacienda.id
                                      )
                                    }
                                  >
                                    <strong>
                                      {hacienda.codigo ??
                                        hacienda.id}
                                    </strong>

                                    <span>
                                      {hacienda.nombre}
                                    </span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </section>

                  {/* SUERTES */}

                  <section className="access-section">
                    <div className="access-title">
                      <Sprout size={19} />

                      <div>
                        <h3>
                          3. Seleccionar suertes
                        </h3>

                        <p>
                          Solo aparecen suertes de las haciendas seleccionadas.
                        </p>
                      </div>
                    </div>

                    {!form.haciendaIds.length ? (
                      <div className="empty-access">
                        Selecciona primero una o varias haciendas.
                      </div>
                    ) : (
                      <>
                        <div className="access-search">
                          <Search size={17} />

                          <input
                            type="text"
                            placeholder="Buscar por código o hacienda..."
                            value={searchSuertes}
                            onChange={(event) =>
                              setSearchSuertes(
                                event.target.value
                              )
                            }
                          />
                        </div>

                        {filteredSuertes.length ===
                        0 ? (
                          <div className="empty-access">
                            {searchSuertes
                              ? "No se encontraron suertes con esa búsqueda."
                              : "No hay suertes disponibles para las haciendas seleccionadas."}
                          </div>
                        ) : (
                          <div className="options-grid">
                            {filteredSuertes.map(
                              (suerte) => {
                                const selected =
                                  form.suerteIds.includes(
                                    suerte.id
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      suerte.id
                                    }
                                    className={
                                      selected
                                        ? "access-option selected"
                                        : "access-option"
                                    }
                                    onClick={() =>
                                      toggleSuerte(
                                        suerte.id
                                      )
                                    }
                                  >
                                    <strong>
                                      {suerte.codigo}
                                    </strong>

                                    <span>
                                      {suerte.hacienda}
                                    </span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                </>
              )}

              {/* =================================================
                  GERENTE
              ================================================= */}

              {form.rol === "gerente" && (
                <div className="global-access">
                  Este rol tendrá acceso global al sistema.
                </div>
              )}

              {/* ACCIONES */}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  <UserPlus size={18} />

                  {saving
                    ? "Guardando..."
                    : editingId
                    ? "Guardar cambios"
                    : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL CAMBIAR CONTRASEÑA
      ===================================================== */}

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="admin-modal password-modal">

            <div className="modal-header">
              <div>
                <h2>
                  Cambiar contraseña
                </h2>

                <p>
                  Actualiza la contraseña del usuario.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closePasswordModal
                }
                disabled={
                  changingPassword
                }
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={
                handlePasswordSubmit
              }
            >
              <div className="password-user-info">
                <KeyRound size={20} />

                <div>
                  <strong>
                    {passwordUser?.nombre}
                  </strong>

                  <span>
                    Usuario:{" "}
                    {passwordUser?.usuario}
                  </span>
                </div>
              </div>

              {passwordError && (
                <div className="admin-error">
                  {passwordError}
                </div>
              )}

              <div className="form-group">
                <label>
                  Nueva contraseña
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    passwordForm.password
                  }
                  onChange={
                    handlePasswordChange
                  }
                  disabled={
                    changingPassword
                  }
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Confirmar contraseña
                </label>

                <input
                  type="password"
                  name="confirmPassword"
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={
                    handlePasswordChange
                  }
                  disabled={
                    changingPassword
                  }
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={
                    closePasswordModal
                  }
                  disabled={
                    changingPassword
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    changingPassword
                  }
                >
                  <KeyRound size={18} />

                  {changingPassword
                    ? "Actualizando..."
                    : "Cambiar contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}