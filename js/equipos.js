const API = 'https://prestamos-xi.vercel.app/api/'

let todosLosEquipos = []
let categoriaActiva = null

// ─── ID de usuario temporal hasta implementar login ───────────────
// Cuando tengas login, reemplaza esto por: localStorage.getItem('id_usuario')
const ID_USUARIO = 1

// ─── COLORES POR ESTADO ───────────────────────────────────────────
function getBadgeColor(estado) {
    const colores = {
        disponible: '#22c55e',
        prestado: '#f59e0b',
        dañado: '#ef4444',
        mantenimiento: '#6366f1'
    }
    return colores[estado] || '#94a3b8'
}

function getBadgeIcon(estado) {
    const iconos = {
        disponible: 'fa-circle-check',
        prestado: 'fa-clock',
        dañado: 'fa-triangle-exclamation',
        mantenimiento: 'fa-wrench'
    }
    return iconos[estado] || 'fa-circle'
}

// ─── RENDERIZAR TARJETAS ──────────────────────────────────────────
function renderizarEquipos(equipos) {
    const contenedor = document.getElementById('contenedorEquipos')
    const subtitulo = document.getElementById('subtituloSeccion')

    subtitulo.textContent = `${equipos.length} equipo${equipos.length !== 1 ? 's' : ''} encontrado${equipos.length !== 1 ? 's' : ''}`

    if (equipos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-box-open"></i>
                <p>No hay equipos en esta categoría.</p>
            </div>`
        return
    }

    contenedor.innerHTML = equipos.map(equipo => `
        <div class="card-equipo">
            <div class="card-imagen-wrapper">
                <img src="${equipo.ruta_imagen || 'https://placehold.co/400x220?text=Sin+imagen'}"
                    alt="${equipo.nombre}"
                    onerror="this.src='https://placehold.co/400x220?text=Sin+imagen'">
                <span class="badge-estado" style="background:${getBadgeColor(equipo.estado)}">
                    <i class="fas ${getBadgeIcon(equipo.estado)}"></i> ${equipo.estado}
                </span>
            </div>
            <div class="card-body">
                <span class="card-categoria">
                    <i class="fas fa-tag"></i> ${equipo.categoria}
                </span>
                <h3 class="card-titulo">${equipo.nombre}</h3>
                <p class="card-descripcion">${equipo.descripcion || 'Sin descripción'}</p>
                <div class="card-footer">
                    ${equipo.estado === 'disponible'
                        ? `<button class="btn-solicitar" onclick="solicitarEquipo(${equipo.id_equipo}, '${equipo.nombre}', this)">
                                <i class="fas fa-hand-holding"></i> Solicitar
                           </button>`
                        : `<button class="btn-no-disponible" disabled>
                                <i class="fas fa-ban"></i> No disponible
                           </button>`
                    }
                </div>
            </div>
        </div>
    `).join('')
}

// ─── SOLICITAR EQUIPO ─────────────────────────────────────────────
async function solicitarEquipo(id_equipo, nombre, btn) {
    if (!confirm(`¿Deseas solicitar el equipo "${nombre}"?`)) return

    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...'

    try {
        const res = await fetch(`${API}/solicitudes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: ID_USUARIO, id_equipo })
        })

        const data = await res.json()

        if (res.ok) {
            btn.innerHTML = '<i class="fas fa-circle-check"></i> Solicitado'
            btn.style.background = '#22c55e'
            mostrarToast(`Solicitud enviada para "${nombre}"`, 'success')
        } else {
            btn.disabled = false
            btn.innerHTML = '<i class="fas fa-hand-holding"></i> Solicitar'
            mostrarToast(data.message, 'error')
        }
    } catch (error) {
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-hand-holding"></i> Solicitar'
        mostrarToast('Error al conectar con el servidor', 'error')
    }
}

// ─── TOAST DE NOTIFICACIÓN ────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div')
    toast.className = `toast toast-${tipo}`
    toast.textContent = mensaje
    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('toast-visible'), 10)
    setTimeout(() => {
        toast.classList.remove('toast-visible')
        setTimeout(() => toast.remove(), 400)
    }, 3500)
}

// ─── SELECCIONAR CATEGORÍA ────────────────────────────────────────
function seleccionarCategoria(idCategoria, elemento) {
    document.querySelectorAll('.categoria-item').forEach(el => el.classList.remove('activa'))
    elemento.classList.add('activa')

    categoriaActiva = idCategoria

    const titulo = document.getElementById('tituloSeccion')
    titulo.textContent = idCategoria
        ? elemento.querySelector('span:not(.badge-count)')?.textContent || 'Catálogo'
        : 'Catálogo de Equipos'

    const filtrados = idCategoria
        ? todosLosEquipos.filter(e => e.id_categoria === idCategoria)
        : todosLosEquipos

    renderizarEquipos(filtrados)
}

// ─── FILTRAR CATEGORÍAS EN SIDEBAR ───────────────────────────────
function filtrarCategorias() {
    const texto = document.getElementById('buscador').value.toLowerCase()
    document.querySelectorAll('.categoria-item[data-nombre]').forEach(el => {
        const nombre = el.dataset.nombre.toLowerCase()
        el.parentElement.style.display = nombre.includes(texto) ? '' : 'none'
    })
}

// ─── CARGAR CATEGORÍAS ────────────────────────────────────────────
async function cargarCategorias() {
    try {
        const res = await fetch(`${API}/categorias`);
        const categorias = await res.json();

        const lista = document.getElementById('listaCategorias');
        const loader = document.getElementById('cargandoCategorias');
        
        if (loader) loader.remove();
        if (!lista) return;

        // Limpiar lista antes de agregar (por si se llama varias veces)
        lista.innerHTML = '';

        categorias.forEach(cat => {
            // Filtrar para mostrar solo categorías que tienen equipos
            const count = todosLosEquipos.filter(e => e.id_categoria === cat.id_categoria).length;
            if (count === 0) return;

            const li = document.createElement('li');
            li.innerHTML = `
                <a class="categoria-item" data-nombre="${cat.nombre}"
                onclick="seleccionarCategoria(${cat.id_categoria}, this)">
                    <i class="fas fa-box"></i>
                    <span>${cat.nombre}</span>
                    <span class="badge-count">${count}</span>
                </a>`;
            lista.appendChild(li);
        });

        const badgeTodos = document.getElementById('badge-todos');
        if (badgeTodos) badgeTodos.textContent = todosLosEquipos.length;

    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// ─── CARGAR EQUIPOS ───────────────────────────────────────────────
async function cargarEquipos() {
    const contenedor = document.getElementById('contenedorEquipos');
    try {
        const res = await fetch(`${API}/equipos`);
        if (!res.ok) throw new Error('Error al obtener equipos');
        
        const data = await res.json();
        todosLosEquipos = data;

        // Renderizamos inicialmente
        renderizarEquipos(todosLosEquipos);
        
        // Cargamos categorías DESPUÉS de tener los equipos para los contadores
        await cargarCategorias();

    } catch (error) {
        console.error("Error detallado:", error);
        contenedor.innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-triangle-exclamation"></i>
                <p>Error al conectar con el servidor: ${error.message}</p>
                <button onclick="location.reload()" class="btn-solicitar" style="margin-top:10px">Reintentar</button>
            </div>`;
    }
}

cargarEquipos()