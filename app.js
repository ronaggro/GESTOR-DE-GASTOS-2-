let proyectoActual = {
    nombre: 'Proyecto Actual',
    presupuesto: 1100000,
    gastos: []
};
let proyectos = [];

function actualizarUI() {
    document.getElementById('proyectoActualNombre').textContent = proyectoActual.nombre;
    document.getElementById('presupuestoActual').textContent = proyectoActual.presupuesto.toLocaleString();
    
    const listaGastos = document.getElementById('listaGastos');
    listaGas

tos.innerHTML = '';
    proyectoActual.gastos.forEach(gasto => {
        const li = document.createElement('li');
        li.className = 'list-item fade-in';
        const cuotaInfo = gasto.numeroCuotas ? ` (Cuota ${gasto.cuotaActual} de ${gasto.numeroCuotas})` : '';
        li.innerHTML = `
            <span><i class="fas fa-receipt"></i> ${gasto.nombre}${cuotaInfo}: $${gasto.valor.toLocaleString()}</span>
            <div>
                <button class="button button-outline" onclick="editarGasto(${gasto.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="button button-outline" onclick="eliminarGasto(${gasto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listaGastos.appendChild(li);
    });

    const totalGastos = proyectoActual.gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
    const presupuestoRestante = proyectoActual.presupuesto - totalGastos;
    document.getElementById('totalGastos').textContent = totalGastos.toLocaleString();
    document.getElementById('presupuestoRestante').textContent = presupuestoRestante.toLocaleString();
    document.getElementById('presupuestoRestante').className = presupuestoRestante < 0 ? 'text-red' : 'text-green';
}

function agregarGasto() {
    const nombre = document.getElementById('nuevoGasto').value;
    const valor = parseFloat(document.getElementById('nuevoValor').value);
    const numeroCuotas = parseInt(document.getElementById('numeroCuotas').value) || 0;
    const cuotaActual = parseInt(document.getElementById('cuotaActual').value) || 0;
    if (nombre && valor) {
        const nuevoGasto = {
            id: Date.now(),
            nombre,
            valor,
            numeroCuotas,
            cuotaActual,
            fecha: new Date()
        };
        proyectoActual.gastos.push(nuevoGasto);
        document.getElementById('nuevoGasto').value = '';
        document.getElementById('nuevoValor').value = '';
        document.getElementById('numeroCuotas').value = '';
        document.getElementById('cuotaActual').value = '';
        actualizarUI();
        mostrarNotificacion('Gasto agregado con éxito', 'success');
        guardarEnIndexedDB(nuevoGasto);
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(function(sw) {
                return sw.sync.register('sync-gastos');
            });
        }
    } else {
        mostrarNotificacion('Por favor, ingrese un nombre y un valor para el gasto', 'error');
    }
}

function eliminarGasto(id) {
    proyectoActual.gastos = proyectoActual.gastos.filter(gasto => gasto.id !== id);
    actualizarUI();
    mostrarNotificacion('Gasto eliminado', 'info');
    eliminarDeIndexedDB(id);
}

function editarGasto(id) {
    const gasto = proyectoActual.gastos.find(g => g.id === id);
    const nuevoValor = prompt('Ingrese el nuevo valor:', gasto.valor);
    if (nuevoValor !== null) {
        gasto.valor = parseFloat(nuevoValor);
        actualizarUI();
        mostrarNotificacion('Gasto actualizado', 'success');
        actualizarEnIndexedDB(gasto);
    }
}

function editarPresupuesto() {
    document.getElementById('editarPresupuestoForm').style.display = 'block';
    document.getElementById('editarPresupuestoBtn').style.display = 'none';
}

function guardarPresupuesto() {
    const nuevoPresupuesto = parseFloat(document.getElementById('nuevoPresupuesto').value);
    if (nuevoPresupuesto) {
        proyectoActual.presupuesto = nuevoPresupuesto;
        document.getElementById('editarPresupuestoForm').style.display = 'none';
        document.getElementById('editarPresupuestoBtn').style.display = 'inline-block';
        document.getElementById('nuevoPresupuesto').value = '';
        actualizarUI();
        mostrarNotificacion('Presupuesto actualizado', 'success');
    } else {
        mostrarNotificacion('Por favor, ingrese un valor válido para el presupuesto', 'error');
    }
}

function guardarProyecto() {
    const nombre = prompt('Ingrese un nombre para el proyecto presupuestario:');
    if (nombre) {
        proyectos.push({...proyectoActual, nombre});
        mostrarNotificacion('Proyecto presupuestario guardado con éxito', 'success');
    } else {
        mostrarNotificacion('Por favor, ingrese un nombre para el proyecto presupuestario', 'error');
    }
}

function cargarProyecto() {
    if (proyectos.length === 0) {
        mostrarNotificacion('No hay proyectos guardados', 'info');
        return;
    }
    const nombres = proyectos.map(p => p.nombre);
    const nombre = prompt('Seleccione un proyecto presupuestario:\n' + nombres.join('\n'));
    const proyecto = proyectos.find(p => p.nombre === nombre);
    if (proyecto) {
        proyectoActual = {...proyecto};
        actualizarUI();
        mostrarNotificacion(`Proyecto presupuestario "${nombre}" cargado`, 'success');
    } else {
        mostrarNotificacion('Proyecto no encontrado', 'error');
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.textContent = mensaje;
    notificacion.style.position = 'fixed';
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.padding = '10px 20px';
    notificacion.style.borderRadius = '5px';
    notificacion.style.color = '#fff';
    notificacion.style.zIndex = '1000';
    notificacion.style.animation = 'fadeIn 0.5s, fadeOut 0.5s 2.5s';
    
    switch(tipo) {
        case 'success':
            notificacion.style.backgroundColor = '#2ecc71';
            break;
        case 'error':
            notificacion.style.backgroundColor = '#e74c3c';
            break;
        case 'info':
            notificacion.style.backgroundColor = '#3498db';
            break;
        default:
            notificacion.style.backgroundColor = '#34495e';
    }

    document.body.appendChild(notificacion);

    setTimeout(() => {
        document.body.removeChild(notificacion);
    }, 3000);
}

function guardarEnIndexedDB(gasto) {
    const request = indexedDB.open('gestor-gastos-db', 1);
    request.onerror = function(event) {
        console.error("Error al abrir la base de datos:", event.target.error);
    };
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['gastos'], 'readwrite');
        const store = transaction.objectStore('gastos');
        const addRequest = store.add(gasto);
        addRequest.onerror = function(event) {
            console.error("Error al agregar gasto:", event.target.error);
        };
        addRequest.onsuccess = function(event) {
            console.log("Gasto agregado a IndexedDB con éxito");
        };
    };
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        db.createObjectStore('gastos', { keyPath: 'id' });
    };
}

function eliminarDeIndexedDB(id) {
    const request = indexedDB.open('gestor-gastos-db', 1);
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['gastos'], 'readwrite');
        const store = transaction.objectStore('gastos');
        const deleteRequest = store.delete(id);
        deleteRequest.onerror = function(event) {
            console.error("Error al eliminar gasto:", event.target.error);
        };
        deleteRequest.onsuccess = function(event) {
            console.log("Gasto eliminado de IndexedDB con éxito");
        };
    };
}

function actualizarEnIndexedDB(gasto) {
    const request = indexedDB.open('gestor-gastos-db', 1);
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['gastos'], 'readwrite');
        const store = transaction.objectStore('gastos');
        const putRequest = store.put(gasto);
        putRequest.onerror = function(event) {
            console.error("Error al actualizar gasto:", event.target.error);
        };
        putRequest.onsuccess = function(event) {
            console.log("Gasto actualizado en IndexedDB con éxito");
        };
    };
}

document.getElementById('agregarGastoBtn').addEventListener('click', agregarGasto);
document.getElementById('editarPresupuestoBtn').addEventListener('click', editarPresupuesto);
document.getElementById('guardarPresupuestoBtn').addEventListener('click', guardarPresupuesto);
document.getElementById('guardarProyectoBtn').addEventListener('click', guardarProyecto);
document.getElementById('cargarProyectoBtn').addEventListener('click', cargarProyecto);

actualizarUI();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
        console.log('Service Worker registrado con éxito:', registration);

        // Registrar sincronización periódica
        if ('periodicSync' in registration) {
            const status = navigator.permissions.query({
                name: 'periodic-background-sync',
            });
            if (status.state === 'granted') {
                registration.periodicSync.register('update-content', {
                    minInterval: 24 * 60 * 60 * 1000, // Una vez al día
                });
            }
        }

        // Solicitar permiso para notificaciones push
        if ('PushManager' in window) {
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    subscribeToPushNotifications(registration);
                }
            });
        }
    }).catch(function(error) {
        console.log('Registro de Service Worker fallido:', error);
    });
}

function subscribeToPushNotifications(registration) {
    const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('TU_CLAVE_PUBLICA_VAPID')
    };

    registration.pushManager.subscribe(subscribeOptions)
        .then(function(pushSubscription) {
            console.log('Suscrito a notificaciones push:', JSON.stringify(pushSubscription));
            // Aquí deberías enviar la suscripción a tu servidor
        })
        .catch(function(err) {
            console.log('Error al suscribirse a notificaciones push:', err);
        });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}