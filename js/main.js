(function () {
  var raiz = document.body.getAttribute("data-raiz") || "";
  var cfg = window.DOBLEBEAT || {};

  var cabecera = document.querySelector(".cabecera");
  var botonMenu = document.querySelector(".boton-menu");
  if (botonMenu) {
    botonMenu.addEventListener("click", function () {
      var abierto = cabecera.classList.toggle("menu-abierto");
      botonMenu.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    document.querySelectorAll(".menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        cabecera.classList.remove("menu-abierto");
        botonMenu.setAttribute("aria-expanded", "false");
      });
    });
  }

  var año = document.getElementById("anio");
  if (año) año.textContent = new Date().getFullYear();

  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animables = document.querySelectorAll(".aparece");
  if ("IntersectionObserver" in window && !reducir) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    animables.forEach(function (el) { obs.observe(el); });
  } else {
    animables.forEach(function (el) { el.classList.add("visible"); });
  }

  document.querySelectorAll("video.video-auto[data-src]").forEach(function (v) {
    if (!v.offsetParent) return;
    v.src = v.getAttribute("data-src");
    if (reducir) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  });

  document.querySelectorAll(".resena").forEach(function (r) {
    var p = r.querySelector("blockquote p");
    var b = r.querySelector(".leer-mas");
    if (!p || !b || p.scrollHeight <= p.clientHeight + 2) return;
    b.hidden = false;
    b.addEventListener("click", function () {
      var abierta = r.classList.toggle("abierta");
      b.textContent = abierta ? "Leer menos" : "Leer completa";
    });
  });

  var contadores = document.querySelectorAll("[data-contar]");
  if ("IntersectionObserver" in window && !reducir) {
    var obsC = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        obsC.unobserve(e.target);
        var el = e.target;
        var fin = parseFloat(el.getAttribute("data-contar"));
        var dec = (el.getAttribute("data-contar").split(".")[1] || "").length;
        var pre = el.getAttribute("data-pre") || "";
        var suf = el.getAttribute("data-suf") || "";
        var t0 = null;
        function paso(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / 1400);
          var v = fin * (1 - Math.pow(1 - p, 3));
          el.textContent = pre + v.toFixed(dec).replace(".", ",") + suf;
          if (p < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.5 });
    contadores.forEach(function (el) { obsC.observe(el); });
  }

  var grid = document.getElementById("galeria-grid");
  if (grid) {
    var fotos = window.FOTOS || [];
    var filtros = document.getElementById("galeria-filtros");
    var visor = document.getElementById("visor");
    var visorImg = visor.querySelector("img");
    var nombres = { boda: "Bodas", horaloca: "Hora Loca", fuego: "Fuego frío", atrezzo: "Atrezzo", equipo: "Equipo", verbena: "Verbenas", empresa: "Empresas", otros: "Otros" };
    var visibles = [];
    var actual = 0;

    var ruta = function (src) { return /^(https?:)?\//.test(src) ? src : raiz + src; };

    var pintar = function (cat) {
      grid.innerHTML = "";
      visibles = fotos.filter(function (f) { return !cat || f.categoria === cat; });
      visibles.forEach(function (f, i) {
        var fig = document.createElement("figure");
        var img = document.createElement("img");
        img.src = ruta(f.src);
        img.alt = f.alt || "";
        img.loading = "lazy";
        img.decoding = "async";
        fig.appendChild(img);
        fig.tabIndex = 0;
        fig.addEventListener("click", function () { abrir(i); });
        fig.addEventListener("keydown", function (e) { if (e.key === "Enter") abrir(i); });
        grid.appendChild(fig);
      });
    };

    var abrir = function (i) {
      actual = (i + visibles.length) % visibles.length;
      visorImg.src = ruta(visibles[actual].src);
      visorImg.alt = visibles[actual].alt || "";
      visor.hidden = false;
      document.body.style.overflow = "hidden";
    };
    var cerrar = function () {
      visor.hidden = true;
      visorImg.src = "";
      document.body.style.overflow = "";
    };
    visor.querySelector(".cerrar").addEventListener("click", cerrar);
    visor.querySelector(".anterior").addEventListener("click", function () { abrir(actual - 1); });
    visor.querySelector(".siguiente").addEventListener("click", function () { abrir(actual + 1); });
    visor.addEventListener("click", function (e) { if (e.target === visor) cerrar(); });
    document.addEventListener("keydown", function (e) {
      if (visor.hidden) return;
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") abrir(actual - 1);
      if (e.key === "ArrowRight") abrir(actual + 1);
    });

    var cats = [];
    fotos.forEach(function (f) { if (cats.indexOf(f.categoria) === -1) cats.push(f.categoria); });
    var boton = function (texto, cat, activo) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = texto;
      if (activo) b.classList.add("activo");
      b.addEventListener("click", function () {
        filtros.querySelectorAll("button").forEach(function (x) { x.classList.remove("activo"); });
        b.classList.add("activo");
        pintar(cat);
      });
      filtros.appendChild(b);
    };
    if (cats.length > 1) {
      boton("Todas", null, true);
      cats.forEach(function (c) { boton(nombres[c] || c, c, false); });
    }
    pintar(null);
  }

  document.querySelectorAll("[data-videos]").forEach(function (cajaVideos) {
    var donde = cajaVideos.getAttribute("data-videos");
    var lista = (window.VIDEOS || []).filter(function (v) {
      var s = v.seccion || "galeria";
      return s === donde || s === "ambas";
    });
    var idYoutube = function (url) {
      var m = String(url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
      return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : null);
    };
    lista.forEach(function (v) {
      var id = idYoutube(v.youtube);
      if (!id) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "video" + (v.formato === "horizontal" ? " horizontal" : "");
      b.style.backgroundImage = "url(https://i.ytimg.com/vi/" + id + "/hqdefault.jpg)";
      b.setAttribute("aria-label", "Reproducir vídeo: " + (v.titulo || "Doblebeat Show"));
      b.addEventListener("click", function () {
        if (b.classList.contains("cargado")) return;
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        f.allowFullscreen = true;
        f.title = v.titulo || "Vídeo de Doblebeat Show";
        b.appendChild(f);
        b.classList.add("cargado");
      });
      cajaVideos.appendChild(b);
    });
    if (!cajaVideos.children.length) {
      cajaVideos.hidden = true;
      var sec = cajaVideos.closest("[data-si-videos]");
      if (sec) sec.hidden = true;
    }
  });

  var parsearGoogle = function (url) {
    if (!url) return null;
    try {
      var u = new URL(url);
      var accion = u.origin + u.pathname.replace(/\/(viewform|formResponse)$/, "") + "/formResponse";
      var mapa = {};
      u.searchParams.forEach(function (valor, clave) {
        if (clave.indexOf("entry.") === 0) mapa[valor.trim().toUpperCase()] = clave;
      });
      return { accion: accion, mapa: mapa };
    } catch (e) {
      return null;
    }
  };

  document.querySelectorAll("[data-servicio]").forEach(function (a) {
    a.addEventListener("click", function () {
      var sel = document.getElementById("f-servicio");
      if (sel) {
        sel.value = a.getAttribute("data-servicio");
        var det = sel.closest("details");
        if (det) det.open = true;
      }
    });
  });

  document.querySelectorAll("form.form-presupuesto").forEach(function (form) {
    var aviso = form.querySelector(".mensaje-form");
    var boton = form.querySelector("button[type=submit]");
    var textoBoton = boton.textContent;
    var fecha = form.querySelector("[name=fecha]");
    if (fecha) fecha.min = new Date().toISOString().slice(0, 10);

    var mostrar = function (tipo, html) {
      aviso.className = "mensaje-form " + tipo;
      aviso.innerHTML = html;
      aviso.hidden = false;
      aviso.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "nearest" });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector("[name=web]").value) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
      var fechaTxt = d.fecha ? d.fecha.split("-").reverse().join("/") : "";
      var datos = {
        NOMBRE: d.nombre,
        TELEFONO: d.telefono,
        EMAIL: d.email,
        EVENTO: d.evento,
        FECHA: fechaTxt,
        LUGAR: d.lugar,
        INVITADOS: d.invitados,
        SERVICIO: d.servicio,
        ORIGEN: d.origen,
        MENSAJE: d.mensaje,
        PAGINA: document.title
      };
      var texto = "Hola Doblebeat Show, quiero pedir presupuesto.%0A%0A" + [
        ["Nombre", datos.NOMBRE], ["Teléfono", datos.TELEFONO], ["Email", datos.EMAIL],
        ["Evento", datos.EVENTO], ["Fecha", datos.FECHA], ["Lugar", datos.LUGAR],
        ["Invitados", datos.INVITADOS], ["Servicio", datos.SERVICIO], ["Mensaje", datos.MENSAJE]
      ].filter(function (p) { return p[1]; }).map(function (p) {
        return encodeURIComponent(p[0] + ": " + p[1]);
      }).join("%0A");
      var urlWa = "https://wa.me/" + cfg.whatsapp + "?text=" + texto;
      var google = parsearGoogle(cfg.formularioGoogle);

      if (!google) {
        window.open(urlWa, "_blank", "noopener");
        mostrar("ok", "<strong>¡Casi listo!</strong> Se ha abierto WhatsApp con tu solicitud. Solo tienes que pulsar enviar. Si no se abre, <a href=\"" + urlWa + "\" target=\"_blank\" rel=\"noopener\">pulsa aquí</a> o llámanos al <a href=\"tel:+34651306185\">651 306 185</a>.");
        return;
      }

      var cuerpo = new URLSearchParams();
      Object.keys(google.mapa).forEach(function (token) {
        if (datos[token] !== undefined) cuerpo.append(google.mapa[token], datos[token] || "");
      });
      boton.disabled = true;
      boton.textContent = "Enviando...";
      fetch(google.accion, { method: "POST", mode: "no-cors", body: cuerpo })
        .then(function () {
          form.reset();
          mostrar("ok", "<strong>¡Solicitud recibida!</strong> Te contestamos en menos de 24 horas. Si tienes prisa, <a href=\"" + urlWa + "\" target=\"_blank\" rel=\"noopener\">escríbenos por WhatsApp</a>.");
          if (typeof window.gtag === "function") window.gtag("event", "generate_lead");
        })
        .catch(function () {
          mostrar("error", "No se ha podido enviar. <a href=\"" + urlWa + "\" target=\"_blank\" rel=\"noopener\">Envíalo por WhatsApp</a> o llámanos al <a href=\"tel:+34651306185\">651 306 185</a>.");
        })
        .then(function () {
          boton.disabled = false;
          boton.textContent = textoBoton;
        });
    });
  });
})();
