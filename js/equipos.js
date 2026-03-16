const API = 'http://localhost:3000/api'

let todosLosEquipos  = []
let equiposFiltrados = []
let categoriaActiva  = null
let paginaActual     = 1
const POR_PAGINA     = 10

// ─── SESIÓN ───────────────────────────────────────────────────────
const token      = localStorage.getItem('token')
const haySession = !!token

if (haySession) {
    const banner = document.getElementById('bannerGuest')
    if (banner) banner.style.display = 'none'

    const btnSesion = document.getElementById('btnSesion')
    if (btnSesion) {
        const nombre = localStorage.getItem('nombre') || 'Mi Perfil'
        btnSesion.innerHTML = `<i class="fas fa-user-circle"></i> ${nombre}`
        btnSesion.href = 'perfil.html'
    }
}

// ─── COLORES POR ESTADO ───────────────────────────────────────────
function getBadgeColor(estado) {
    const colores = {
        disponible:    '#22c55e',
        prestado:      '#f59e0b',
        dañado:        '#ef4444',
        mantenimiento: '#6366f1'
    }
    return colores[estado] || '#94a3b8'
}

// ─── BOTÓN SOLICITAR ──────────────────────────────────────────────
async function solicitarEquipo(id_equipo, nombre, btn) {
    if (!haySession) {
        sessionStorage.setItem('redirectAfterLogin', 'equipos.html')
        window.location.href = 'login.html'
        return
    }

    const id_usuario = parseInt(localStorage.getItem('id_usuario'))
    btn.disabled  = true
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Solicitando...'

    try {
        const res  = await fetch(`${API}/solicitudes`, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_usuario, id_equipo })
        })

        const data = await res.json()

        if (res.ok) {
            mostrarToast(`✅ Solicitud enviada para "${nombre}"`, 'success')
            btn.innerHTML    = '<i class="fas fa-check"></i> Solicitado'
            btn.style.background = '#22c55e'
        } else {
            mostrarToast(data.message || 'Error al enviar solicitud', 'error')
            btn.disabled  = false
            btn.innerHTML = '<i class="fas fa-hand-holding"></i> Solicitar'
        }
    } catch {
        mostrarToast('Error de conexión', 'error')
        btn.disabled  = false
        btn.innerHTML = '<i class="fas fa-hand-holding"></i> Solicitar'
    }
}

// ─── TOAST ────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div')
    toast.style.cssText = `
        position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
        background:${tipo === 'success' ? '#1a392a' : '#ef4444'};
        color:white; padding:14px 28px; border-radius:12px;
        font-size:0.88rem; font-weight:600; z-index:9999;
        box-shadow:0 8px 20px rgba(0,0,0,0.2);`
    toast.textContent = mensaje
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3500)
}

// ─── RENDERIZAR PÁGINA ────────────────────────────────────────────
function renderizarEquipos(equipos) {
    const contenedor = document.getElementById('contenedorEquipos')
    const subtitulo  = document.getElementById('subtituloSeccion')
    const totalPags  = Math.ceil(equipos.length / POR_PAGINA)

    // Asegurar que paginaActual no supere el total
    if (paginaActual > totalPags) paginaActual = 1

    const inicio = (paginaActual - 1) * POR_PAGINA
    const pagina = equipos.slice(inicio, inicio + POR_PAGINA)

    subtitulo.textContent = `${equipos.length} equipo${equipos.length !== 1 ? 's' : ''} — página ${paginaActual} de ${totalPags || 1}`

    if (equipos.length === 0) {
        contenedor.innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-box-open"></i>
                <p>No hay equipos en esta categoría.</p>
            </div>`
        renderizarPaginacion(0, 0)
        return
    }

    contenedor.innerHTML = pagina.map(equipo => {
        const disponible = equipo.estado === 'disponible'
        let boton = ''

        if (disponible) {
            boton = haySession
                ? `<button onclick="solicitarEquipo(${equipo.id_equipo}, '${equipo.nombre.replace(/'/g, "\\'")}', this)"
                    style="margin-top:12px; width:100%; padding:10px; border:none;
                    background:var(--primary); color:white; border-radius:10px; font-weight:700;
                    font-size:0.85rem; cursor:pointer; font-family:'Montserrat',sans-serif; transition:0.2s;">
                    <i class="fas fa-hand-holding"></i> Solicitar
                </button>`
                : `<a href="login.html"
                    style="display:block; margin-top:12px; width:100%; padding:10px; text-align:center;
                    background:var(--primary); color:white; border-radius:10px; font-weight:700;
                    font-size:0.85rem; text-decoration:none; box-sizing:border-box;">
                    <i class="fas fa-right-to-bracket"></i> Inicia sesión para solicitar
                </a>`
        } else {
            boton = `<button disabled
                style="margin-top:12px; width:100%; padding:10px; border:none;
                background:#e2e8f0; color:#94a3b8; border-radius:10px; font-weight:700;
                font-size:0.85rem; cursor:not-allowed; font-family:'Montserrat',sans-serif;">
                <i class="fas fa-ban"></i> No disponible
            </button>`
        }

        return `
        <div class="card-noticia" style="display:flex; flex-direction:column;">
            <div style="position:relative;">
                <img src="${equipo.ruta_imagen || 'https://placehold.co/300x180?text=Sin+imagen'}"
                    alt="${equipo.nombre}"
                    style="width:100%; height:180px; object-fit:cover; border-radius:12px;"
                    onerror="this.src='https://placehold.co/300x180?text=Sin+imagen'">
                <span style="position:absolute; top:10px; right:10px;
                            background:${getBadgeColor(equipo.estado)}; color:white;
                            padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700;">
                    ${equipo.estado}
                </span>
            </div>
            <div style="padding:15px 0; flex:1; display:flex; flex-direction:column;">
                <h3 style="margin:8px 0 5px; font-size:1rem;">${equipo.nombre}</h3>
                <p style="color:var(--text-muted); font-size:0.85rem; flex:1; line-height:1.5;">
                    ${equipo.descripcion || 'Sin descripción'}
                </p>
                <p style="color:var(--primary); font-size:0.82rem; margin-top:8px;">
                    <i class="fas fa-tag"></i> ${equipo.categoria}
                </p>
                ${boton}
            </div>
        </div>`
    }).join('')

    renderizarPaginacion(totalPags, paginaActual)
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ─── RENDERIZAR PAGINACIÓN ────────────────────────────────────────
function renderizarPaginacion(totalPags, actual) {
    let paginador = document.getElementById('paginador')

    if (!paginador) {
        paginador = document.createElement('div')
        paginador.id = 'paginador'
        paginador.style.cssText = `
            display:flex; justify-content:center; align-items:center;
            gap:8px; margin-top:40px; flex-wrap:wrap;`
        document.getElementById('contenedorEquipos').insertAdjacentElement('afterend', paginador)
    }

    if (totalPags <= 1) { paginador.innerHTML = ''; return }

    let html = ''

    // Botón anterior
    html += `<button onclick="cambiarPagina(${actual - 1})" ${actual === 1 ? 'disabled' : ''}
        style="padding:8px 14px; border-radius:8px; border:1.5px solid #e2e8f0;
        background:white; cursor:pointer; font-family:'Montserrat',sans-serif;
        font-weight:600; font-size:0.82rem; color:var(--primary);
        transition:0.2s; ${actual === 1 ? 'opacity:0.4; cursor:not-allowed;' : ''}">
        <i class="fas fa-chevron-left"></i>
    </button>`

    // Números
    for (let i = 1; i <= totalPags; i++) {
        const esActual = i === actual
        html += `<button onclick="cambiarPagina(${i})"
            style="padding:8px 14px; border-radius:8px; border:1.5px solid ${esActual ? 'var(--primary)' : '#e2e8f0'};
            background:${esActual ? 'var(--primary)' : 'white'};
            color:${esActual ? 'white' : 'var(--primary)'};
            cursor:pointer; font-family:'Montserrat',sans-serif;
            font-weight:700; font-size:0.82rem; transition:0.2s; min-width:36px;">
            ${i}
        </button>`
    }

    // Botón siguiente
    html += `<button onclick="cambiarPagina(${actual + 1})" ${actual === totalPags ? 'disabled' : ''}
        style="padding:8px 14px; border-radius:8px; border:1.5px solid #e2e8f0;
        background:white; cursor:pointer; font-family:'Montserrat',sans-serif;
        font-weight:600; font-size:0.82rem; color:var(--primary);
        transition:0.2s; ${actual === totalPags ? 'opacity:0.4; cursor:not-allowed;' : ''}">
        <i class="fas fa-chevron-right"></i>
    </button>`

    paginador.innerHTML = html
}

// ─── CAMBIAR PÁGINA ───────────────────────────────────────────────
function cambiarPagina(pagina) {
    const totalPags = Math.ceil(equiposFiltrados.length / POR_PAGINA)
    if (pagina < 1 || pagina > totalPags) return
    paginaActual = pagina
    renderizarEquipos(equiposFiltrados)
}

// ─── SELECCIONAR CATEGORÍA ────────────────────────────────────────
function seleccionarCategoria(idCategoria, elemento) {
    document.querySelectorAll('.categoria-item').forEach(el => el.classList.remove('activa'))
    elemento.classList.add('activa')
    categoriaActiva = idCategoria
    paginaActual    = 1

    document.getElementById('tituloSeccion').textContent = idCategoria
        ? elemento.querySelector('span:not(.badge-count)')?.textContent || 'Catálogo'
        : 'Catálogo de Equipos'

    equiposFiltrados = idCategoria
        ? todosLosEquipos.filter(e => e.id_categoria === idCategoria)
        : todosLosEquipos

    renderizarEquipos(equiposFiltrados)
}

// ─── FILTRAR CATEGORÍAS EN SIDEBAR ───────────────────────────────
function filtrarCategorias() {
    const texto = document.getElementById('buscador').value.toLowerCase()
    document.querySelectorAll('.categoria-item[data-nombre]').forEach(el => {
        el.parentElement.style.display =
            el.dataset.nombre.toLowerCase().includes(texto) ? '' : 'none'
    })
}

// ─── CARGAR CATEGORÍAS ────────────────────────────────────────────
async function cargarCategorias() {
    try {
        const res = await fetch(`${API}/categorias`)
        const categorias = await res.json()

        const lista = document.getElementById('listaCategorias')
        document.getElementById('cargandoCategorias').remove()

        categorias.forEach(cat => {
            const count = todosLosEquipos.filter(e => e.id_categoria === cat.id_categoria).length
            if (count === 0) return
            const li = document.createElement('li')
            li.innerHTML = `
                <a class="categoria-item" data-nombre="${cat.nombre}"
                onclick="seleccionarCategoria(${cat.id_categoria}, this)">
                    <i class="fas fa-box"></i>
                    <span>${cat.nombre}</span>
                    <span class="badge-count">${count}</span>
                </a>`
            lista.appendChild(li)
        })

        document.getElementById('badge-todos').textContent = todosLosEquipos.length

    } catch (error) {
        console.error('Error cargando categorías:', error)
    }
}

// ─── CARGAR EQUIPOS ───────────────────────────────────────────────
async function cargarEquipos() {
    try {
        const res = await fetch(`${API}/equipos`)
        todosLosEquipos  = await res.json()
        equiposFiltrados = todosLosEquipos
        renderizarEquipos(equiposFiltrados)
        await cargarCategorias()
    } catch (error) {
        document.getElementById('contenedorEquipos').innerHTML = `
            <div class="sin-resultados">
                <i class="fas fa-triangle-exclamation"></i>
                <p>Error al conectar con el servidor: ${error.message}</p>
            </div>`
    }
}

cargarEquipos()