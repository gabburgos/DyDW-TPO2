/* promociones.js
   Manejo de catálogo, carrito y cálculo de promociones
*/

// Catálogo de ejemplo (editá los precios/nombres según necesites)
const catalogo = [
  { id: "p1", nombre: "Cubos Apilables", precio: 8500 },
  { id: "p2", nombre: "Juego de la Oca", precio: 25000 },
  { id: "p3", nombre: "Muñeca Bailarina", precio: 30000 },
  { id: "p4", nombre: "Juego Batalla Naval", precio: 40000 },
  { id: "p5", nombre: "Volante con Sonido", precio: 16000 },
  { id: "p6", nombre: "Valija Juliana Dentista", precio: 40000 },
  { id: "p7", nombre: "Juego Ludo Tradicional", precio: 22000 },
  { id: "p8", nombre: "Scrabble", precio: 55000 },
  { id: "p9", nombre: "Ajedrez", precio: 25000 },
  { id: "p10", nombre: "Generala", precio: 18000 },
  { id: "p11", nombre: "Damas", precio: 25000 },
  { id: "p12", nombre: "Juego UNO", precio: 18000 },
  { id: "p13", nombre: "Pictionary", precio: 65000 },
  { id: "p14", nombre: "Sopa China", precio: 40000 },
  { id: "p15", nombre: "Trust Financiero", precio: 40000 },
  { id: "p16", nombre: "Dr. Eureka", precio: 40000 },
  { id: "p17", nombre: "Misterio", precio: 25000 },
  { id: "p18", nombre: "Memotest Banderas", precio: 23000 },
  { id: "p19", nombre: "Kinmo", precio: 30000 },
  { id: "p20", nombre: "Mi Primer Memotest", precio: 18000 },
  { id: "p21", nombre: "Burakito", precio: 30000 },
  { id: "p22", nombre: "Sombreritos Voladores", precio: 25000 },
  { id: "p23", nombre: "Bichitos", precio: 13000 },
  { id: "p24", nombre: "Zoológico", precio: 12000 }
];

// Estado del carrito: array de items {id, nombre, precio, cantidad}
let carrito = [];

/* ---------- Helpers ---------- */

function formatoPesos(num) {
  return num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function actualizarSelectProductos() {
  const select = document.getElementById("selectProducto");
  catalogo.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.nombre} — $${formatoPesos(p.precio)}`;
    select.appendChild(opt);
  });
}

function encontrarProducto(id) {
  return catalogo.find(p => p.id === id);
}

function actualizarTablaCarrito() {
  const tbody = document.querySelector("#tablaCarrito tbody");
  tbody.innerHTML = "";

  if (carrito.length === 0) {
    document.getElementById("vacíoCarrito").style.display = "block";
  } else {
    document.getElementById("vacíoCarrito").style.display = "none";
  }

  carrito.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td>$${formatoPesos(item.precio)}</td>
      <td>${item.cantidad}</td>
      <td>$${formatoPesos(item.precio * item.cantidad)}</td>
      <td><button class="btn btn-sm btn-outline-danger eliminar" data-index="${index}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });

  // agregar listeners para eliminar
  document.querySelectorAll(".eliminar").forEach(btn => {
    btn.addEventListener("click", function () {
      const idx = parseInt(this.getAttribute("data-index"));
      carrito.splice(idx, 1);
      actualizarTablaCarrito();
    });
  });
}

/* ---------- Lógica de promociones ---------- */

/*
Estrategia:
- Construimos array unitPrices con precio unitario repetido por cantidad (p.ej. [12000,12000,8500,...])
- Para 50% en el segundo: ordenamos desc (mayor a menor), y por cada par (i,i+1) aplicar 50% sobre el segundo (el menor del par).
- Para 3x2: ordenamos asc (menor a mayor) y por cada grupo de 3 tomar el más barato como descuento.
- Para 10% en > $30000: 10% sobre totalSinDesc si cumple condición.
*/

function calcularTotalesYDescuento(promoKey) {
  // Construir unitPrices
  let unitPrices = [];
  carrito.forEach(item => {
    for (let i = 0; i < item.cantidad; i++) unitPrices.push(item.precio);
  });

  const totalSinDesc = unitPrices.reduce((s, p) => s + p, 0);

  let descuento = 0;

  if (unitPrices.length === 0) {
    return { totalSinDesc: 0, descuento: 0, totalFinal: 0 };
  }

  if (promoKey === "50_segundo") {
    // ordenar desc y aplicar 50% sobre el segundo de cada par
    unitPrices.sort((a, b) => b - a);
    for (let i = 0; i + 1 < unitPrices.length; i += 2) {
      const secondPrice = unitPrices[i + 1]; // el más barato del par
      descuento += secondPrice * 0.5;
    }
  } else if (promoKey === "3x2") {
    // ordenar asc y "regalar" el más barato en cada grupo de 3
    unitPrices.sort((a, b) => a - b);
    const grupos = Math.floor(unitPrices.length / 3);
    for (let i = 0; i < grupos; i++) {
      // cada grupo tomamos el más barato disponible (empezando por los más baratos)
      descuento += unitPrices[i];
    }
  } else if (promoKey === "10_mas_30000") {
    if (totalSinDesc > 30000) {
      descuento = totalSinDesc * 0.10;
    }
  }

  const totalFinal = totalSinDesc - descuento;
  return { totalSinDesc, descuento, totalFinal };
}

/* ---------- Eventos y montaje ---------- */

document.addEventListener("DOMContentLoaded", function () {
  actualizarSelectProductos();
  actualizarTablaCarrito();

  const btnAgregar = document.getElementById("btnAgregar");
  btnAgregar.addEventListener("click", function () {
    const select = document.getElementById("selectProducto");
    const prodId = select.value;
    const qty = parseInt(document.getElementById("qtyProducto").value, 10);

    if (!prodId) {
      alert("Seleccioná un producto antes de agregar.");
      return;
    }
    if (!qty || qty <= 0) {
      alert("Ingresá una cantidad válida.");
      return;
    }

    const prod = encontrarProducto(prodId);
    // Si el producto ya está en el carrito, sumar cantidad
    const existente = carrito.find(i => i.id === prodId);
    if (existente) {
      existente.cantidad += qty;
    } else {
      carrito.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: qty });
    }

    actualizarTablaCarrito();
  });

  // Formulario de cálculo
  const form = document.getElementById("formPromos");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const promoKey = document.getElementById("promo").value;
    const resultado = document.getElementById("resultado");

    if (carrito.length === 0) {
      resultado.innerHTML = `<p style="color:#FF6F61">El carrito está vacío. Agregá productos para calcular la promoción.</p>`;
      return;
    }
    if (!promoKey) {
      resultado.innerHTML = `<p style="color:#FF6F61">Seleccioná una promoción.</p>`;
      return;
    }

    const { totalSinDesc, descuento, totalFinal } = calcularTotalesYDescuento(promoKey);

    // Mensajes amigables explicando cómo se aplicó la promoción
    let detallePromo = "";
    if (promoKey === "50_segundo") {
      detallePromo = "Se aplica 50% sobre cada segundo producto (en pares).";
    } else if (promoKey === "3x2") {
      detallePromo = "Por cada 3 unidades, la más barata queda gratis.";
    } else if (promoKey === "10_mas_30000") {
      detallePromo = totalSinDesc > 30000
        ? "Se aplicó 10% porque la compra supera $30.000."
        : "No alcanza $30.000: no se aplica el descuento del 10%.";
    }

    resultado.innerHTML = `
      <h4>🧮 Resultado</h4>
      <p><strong>Total sin descuento:</strong> $${formatoPesos(totalSinDesc)}</p>
      <p><strong>Descuento aplicado:</strong> $${formatoPesos(descuento)}</p>
      <p><strong>Total final:</strong> <span style="color:#FF6F61;font-weight:bold;">$${formatoPesos(totalFinal)}</span></p>
      <hr />
      <p style="font-size:0.95rem;color:#555;">${detallePromo}</p>
    `;
  });
});
