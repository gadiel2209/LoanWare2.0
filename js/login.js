const API = 'https://prestamos-xi.vercel.app/api'

// ── ESTADÍSTICAS PÚBLICAS ──────────────────────────────────────────
async function cargarEstadisticas() {
    try {
        const [equiposRes, categoriasRes, solicitudesRes] = await Promise.all([
            fetch(`${API}/equipos`),
            fetch(`${API}/categorias`),
            fetch(`${API}/solicitudes`)
        ])

        const equipos      = await equiposRes.json()
        const categorias   = await categoriasRes.json()
        const solicitudes  = await solicitudesRes.json()

        // Equipos disponibles
        const disponibles = Array.isArray(equipos)
            ? equipos.filter(e => e.estado === 'disponible').length
            : 0

        // Total usuarios únicos en solicitudes (aproximado público)
        const totalPrestamos = Array.isArray(solicitudes) ? solicitudes.length : 0
        const totalCategorias = Array.isArray(categorias) ? categorias.length : 0

        // Usuarios registrados — endpoint público si existe
        let totalUsuarios = '—'
        try {
            const usuariosRes = await fetch(`${API}/usuarios/total`)
            if (usuariosRes.ok) {
                const u = await usuariosRes.json()
                totalUsuarios = u.total ?? '—'
            }
        } catch { /* no hay endpoint, dejamos —  */ }

        animarNumero('statEquipos',    disponibles)
        animarNumero('statPrestamos',  totalPrestamos)
        animarNumero('statCategorias', totalCategorias)
        if (totalUsuarios !== '—') animarNumero('statUsuarios', totalUsuarios)

    } catch {
        // Si falla, dejar los "—" sin romper el login
    }
}

// ── ANIMACIÓN DE CONTADOR ──────────────────────────────────────────
function animarNumero(id, objetivo) {
    const el       = document.getElementById(id)
    if (!el || objetivo === 0) { el && (el.textContent = objetivo); return }
    let actual     = 0
    const paso     = Math.ceil(objetivo / 30)
    const intervalo = setInterval(() => {
        actual += paso
        if (actual >= objetivo) {
            actual = objetivo
            clearInterval(intervalo)
        }
        el.textContent = actual
    }, 40)
}

// ── MOSTRAR/OCULTAR CONTRASEÑA ─────────────────────────────────────
document.getElementById('togglePassword').addEventListener('click', () => {
    const input  = document.getElementById('password')
    const icono  = document.getElementById('iconoPassword')
    const visible = input.type === 'password'
    input.type      = visible ? 'text' : 'password'
    icono.className = visible ? 'fas fa-eye-slash' : 'fas fa-eye'
})

// ── MOSTRAR ERROR ──────────────────────────────────────────────────
function mostrarError(mensaje) {
    const alerta = document.getElementById('alertaError')
    document.getElementById('mensajeError').textContent = mensaje
    alerta.classList.remove('hidden')
    alerta.classList.add('flex')
    setTimeout(() => {
        alerta.classList.add('hidden')
        alerta.classList.remove('flex')
    }, 4000)
}

// ── ESTADO DEL BOTÓN ───────────────────────────────────────────────
function setLoading(loading) {
    const btn   = document.getElementById('btnLogin')
    const texto = document.getElementById('textoBtn')
    btn.disabled          = loading
    texto.textContent     = loading ? 'Verificando...' : 'Entrar al Sistema'
    btn.style.opacity     = loading ? '0.6' : '1'
}

// ── LOGIN PRINCIPAL ────────────────────────────────────────────────
async function iniciarSesion() {
    const correo   = document.getElementById('correo').value.trim()
    const password = document.getElementById('password').value

    if (!correo || !password) {
        mostrarError('Por favor completa todos los campos.')
        return
    }

    setLoading(true)

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        // Verificamos si la respuesta es JSON antes de procesar
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("El servidor no respondió con JSON. Posible error 500.");
        }

        const data = await res.json();

        if (!res.ok) {
            mostrarError(data.message || 'Credenciales inválidas.');
            return;
        }

        // VALIDACIÓN CRUCIAL: Verificar que 'data.usuario' existe antes de usarlo
        if (!data.usuario) {
            mostrarError('Error: El servidor no envió los datos del usuario.');
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('id_usuario', data.usuario.id);
        localStorage.setItem('nombre', data.usuario.nombre);
        localStorage.setItem('id_rol', data.usuario.id_rol);

        window.location.href = data.usuario.id_rol === 1 ? 'adminDashboard.html' : 'home.html';

    } catch (err) {
        console.error(err);
        mostrarError('Error de conexión o error interno del servidor (500).');
    } finally {
        setLoading(false);
    }
}

// ── ENTER PARA ENVIAR ──────────────────────────────────────────────
document.getElementById('correo').addEventListener('keydown',   e => { if (e.key === 'Enter') iniciarSesion() })
document.getElementById('password').addEventListener('keydown', e => { if (e.key === 'Enter') iniciarSesion() })

// ── SI YA HAY SESIÓN ACTIVA, REDIRIGIR ────────────────────────────
const token = localStorage.getItem('token')
if (token) {
    const idRol = parseInt(localStorage.getItem('id_rol'))
    window.location.href = idRol === 1 ? 'adminDashboard.html' : 'home.html'
}

// ── CARGAR STATS AL INICIAR ────────────────────────────────────────
cargarEstadisticas()