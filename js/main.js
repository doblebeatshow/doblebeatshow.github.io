(function () {
  var raiz = document.body.getAttribute("data-raiz") || "";
  var cfg = window.DOBLEBEAT || {};
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ICONO_PAUSA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  var ICONO_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  var cabecera = document.querySelector(".cabecera");
  var botonMenu = document.querySelector(".boton-menu");
  if (botonMenu) {
    var fijarMenu = function (abierto) {
      cabecera.classList.toggle("menu-abierto", abierto);
      botonMenu.setAttribute("aria-expanded", abierto ? "true" : "false");
      botonMenu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    };
    botonMenu.addEventListener("click", function () {
      fijarMenu(!cabecera.classList.contains("menu-abierto"));
    });
    document.querySelectorAll(".menu a").forEach(function (a) {
      a.addEventListener("click", function () { fijarMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cabecera.classList.contains("menu-abierto")) {
        fijarMenu(false);
        botonMenu.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (cabecera.classList.contains("menu-abierto") && !cabecera.contains(e.target)) fijarMenu(false);
    });
  }


  // Aviso de cookies: Google Tag Manager solo se carga tras aceptar
  var CLAVE_COOKIES = "doblebeat-cookies";
  var leerCookies = function () {
    try {
      var c = JSON.parse(localStorage.getItem(CLAVE_COOKIES) || "null");
      if (c && Date.now() - c.fecha < 3.4e10) return c;
    } catch (e) {}
    return null;
  };
  var guardarCookies = function (si) {
    try { localStorage.setItem(CLAVE_COOKIES, JSON.stringify({ analitica: si, fecha: Date.now() })); } catch (e) {}
  };
  var borrarCookiesGA = function () {
    var dominio = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function (par) {
      var nombre = par.split("=")[0].trim();
      if (!/^_ga/.test(nombre)) return;
      ["", "; domain=." + dominio, "; domain=" + dominio].forEach(function (d) {
        document.cookie = nombre + "=; Max-Age=0; path=/" + d;
      });
    });
  };
  var aviso = null;
  var cerrarAviso = function () { if (aviso) aviso.hidden = true; };
  var abrirAviso = function (conFoco) {
    if (!aviso) {
      aviso = document.createElement("section");
      aviso.className = "aviso-cookies";
      aviso.setAttribute("aria-label", "Aviso de cookies");
      aviso.innerHTML = '<p><strong>¿Nos dejas medir las visitas?</strong> Usamos Google Analytics solo si lo aceptas, para saber qué páginas se consultan. <a href="' + raiz + 'privacidad/#cookies">Más información</a></p>' +
        '<div class="aviso-cookies-botones"><button type="button" class="btn btn-hueco" data-cookies="no">Rechazar</button><button type="button" class="btn btn-hueco" data-cookies="si">Aceptar</button></div>';
      aviso.querySelectorAll("[data-cookies]").forEach(function (b) {
        b.addEventListener("click", function () {
          var si = b.getAttribute("data-cookies") === "si";
          guardarCookies(si);
          if (si) {
            if (typeof window.cargarGTM === "function") window.cargarGTM();
          } else {
            if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: "denied" });
            borrarCookiesGA();
          }
          cerrarAviso();
        });
      });
      document.body.appendChild(aviso);
    }
    aviso.hidden = false;
    if (conFoco) aviso.querySelector("button").focus();
  };
  document.querySelectorAll(".pie .creditos").forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "enlace-cookies";
    b.textContent = "Configurar cookies";
    b.addEventListener("click", function () { abrirAviso(true); });
    c.appendChild(b);
  });
  if (!leerCookies()) abrirAviso(false);

  var año = document.getElementById("anio");
  if (año) año.textContent = new Date().getFullYear();

  // Cinta: se mueve solo con JavaScript, sin movimiento reducido, con pausa y mientras se ve
  document.querySelectorAll(".cinta").forEach(function (cinta) {
    if (reducir) return;
    cinta.classList.add("en-marcha");
    var pausa = document.createElement("button");
    pausa.type = "button";
    pausa.className = "cinta-pausa";
    pausa.setAttribute("aria-label", "Pausar la cinta");
    pausa.innerHTML = ICONO_PAUSA;
    pausa.addEventListener("click", function () {
      var parada = cinta.classList.toggle("en-pausa");
      pausa.setAttribute("aria-label", parada ? "Reanudar la cinta" : "Pausar la cinta");
      pausa.innerHTML = parada ? ICONO_PLAY : ICONO_PAUSA;
    });
    cinta.appendChild(pausa);
    if ("IntersectionObserver" in window) {
      var pista = cinta.querySelector(".pista");
      new IntersectionObserver(function (entradas) {
        pista.style.animationPlayState = entradas[0].isIntersecting ? "" : "paused";
      }).observe(cinta);
    }
  });

  // Vídeos automáticos: tras cargar la página, con pausa, y nunca con ahorro de datos o movimiento reducido
  var conexion = navigator.connection || {};
  var ahorro = conexion.saveData || /(^|-)2g$/.test(conexion.effectiveType || "");
  var iniciarVideos = function () {
    if (reducir || ahorro) return;
    document.querySelectorAll("video.video-auto[data-src]").forEach(function (v) {
      if (!v.offsetParent) return;
      v.src = v.getAttribute("data-src");
      var intento = v.play();
      if (intento && intento.catch) intento.catch(function () {});

      var pausadoAMano = false;
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "video-pausa";
      boton.setAttribute("aria-label", "Pausar el vídeo");
      boton.innerHTML = ICONO_PAUSA;
      boton.addEventListener("click", function () {
        pausadoAMano = !v.paused;
        if (v.paused) v.play(); else v.pause();
        boton.setAttribute("aria-label", pausadoAMano ? "Reproducir el vídeo" : "Pausar el vídeo");
        boton.innerHTML = pausadoAMano ? ICONO_PLAY : ICONO_PAUSA;
      });
      v.parentNode.appendChild(boton);

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entradas) {
          if (pausadoAMano) return;
          if (entradas[0].isIntersecting) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            v.pause();
          }
        }).observe(v);
      }
    });
  };
  if (document.readyState === "complete") iniciarVideos();
  else window.addEventListener("load", iniciarVideos);

  document.querySelectorAll(".resena").forEach(function (r) {
    var p = r.querySelector("blockquote p");
    var b = r.querySelector(".leer-mas");
    if (!p || !b || p.scrollHeight <= p.clientHeight + 2) return;
    b.hidden = false;
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", function () {
      var abierta = r.classList.toggle("abierta");
      b.textContent = abierta ? "Leer menos" : "Leer completa";
      b.setAttribute("aria-expanded", abierta ? "true" : "false");
    });
  });

  document.querySelectorAll("dialog.captura").forEach(function (dlg) {
    if (typeof dlg.showModal !== "function") return;
    var img = dlg.querySelector("img");
    dlg.parentNode.querySelectorAll("a.ver-captura").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        img.src = a.getAttribute("href");
        img.alt = a.closest(".resena").querySelector("h3").textContent;
        dlg.showModal();
      });
    });
    dlg.querySelector(".cerrar").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  });

  var grid = document.getElementById("galeria-grid");
  if (grid) {
    var fotos = window.FOTOS || [];
    var filtros = document.getElementById("galeria-filtros");
    var visor = document.getElementById("visor");
    var visorImg = visor.querySelector("img");
    var nombres = { boda: "Bodas", horaloca: "Hora Loca", fuego: "Fuego frío", atrezzo: "Atrezzo", equipo: "Equipo", verbena: "Verbenas", empresa: "Empresas", otros: "Otros" };
    var visibles = [];
    var actual = 0;
    var origenFoco = null;

    var ruta = function (src) { return /^(https?:)?\//.test(src) ? src : raiz + src; };

    var abrir = function (i, origen) {
      actual = (i + visibles.length) % visibles.length;
      visorImg.src = ruta(visibles[actual].src);
      visorImg.alt = visibles[actual].alt || "";
      if (visor.hidden) {
        origenFoco = origen || document.activeElement;
        visor.hidden = false;
        document.body.style.overflow = "hidden";
        visor.querySelector(".cerrar").focus();
      }
    };
    var cerrar = function () {
      visor.hidden = true;
      visorImg.removeAttribute("src");
      document.body.style.overflow = "";
      if (origenFoco && origenFoco.focus) origenFoco.focus();
    };

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
        fig.setAttribute("role", "button");
        fig.setAttribute("aria-label", "Ampliar foto: " + (f.alt || "Doblebeat Show"));
        fig.addEventListener("click", function () { abrir(i, fig); });
        fig.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            abrir(i, fig);
          }
        });
        grid.appendChild(fig);
      });
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
      if (e.key === "Tab") {
        var botones = visor.querySelectorAll("button");
        var primero = botones[0];
        var ultimo = botones[botones.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    });

    var cats = [];
    fotos.forEach(function (f) { if (cats.indexOf(f.categoria) === -1) cats.push(f.categoria); });
    var boton = function (texto, cat, activo) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = texto;
      b.setAttribute("aria-pressed", activo ? "true" : "false");
      b.addEventListener("click", function () {
        filtros.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
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
      b.style.backgroundImage = "url(https://i.ytimg.com/vi_webp/" + id + "/hqdefault.webp)";
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

  // El formulario llega ya con el tipo de evento de la página en la que está
  var preseleccionar = function () {
    var campoEvento = document.getElementById("f-evento");
    var campoServicio = document.getElementById("f-servicio");
    if (!campoEvento) return;
    var ruta = location.pathname;
    var evento = null;
    var servicio = null;
    if (/\/(verbenas|discomovil-fiestas-[^/]+)\//.test(ruta)) { evento = "Verbena o fiesta patronal"; servicio = "Verbena / discomóvil"; }
    else if (/\/empresas\//.test(ruta)) { evento = "Evento de empresa"; servicio = "Sonorización"; }
    else if (/\/eventos-privados\//.test(ruta)) { evento = "Evento privado"; }
    if (evento) campoEvento.value = evento;
    if (servicio && campoServicio) campoServicio.value = servicio;
  };
  preseleccionar();

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
        if (datos[token] !== undefined) cuerpo.append(google.mapa[token], datos[token] || "-");
      });
      boton.disabled = true;
      boton.textContent = "Enviando…";
      form.setAttribute("aria-busy", "true");
      fetch(google.accion, { method: "POST", mode: "no-cors", body: cuerpo })
        .then(function () {
          form.reset();
          preseleccionar();
          mostrar("ok", "<strong>¡Solicitud recibida!</strong> Te contestamos en menos de 24 horas. Si tienes prisa, <a href=\"" + urlWa + "\" target=\"_blank\" rel=\"noopener\">escríbenos por WhatsApp</a>.");
          if (window.dataLayer) window.dataLayer.push({ event: "generate_lead" });
        })
        .catch(function () {
          mostrar("error", "No se ha podido enviar. <a href=\"" + urlWa + "\" target=\"_blank\" rel=\"noopener\">Envíalo por WhatsApp</a> o llámanos al <a href=\"tel:+34651306185\">651 306 185</a>.");
        })
        .then(function () {
          boton.disabled = false;
          boton.textContent = textoBoton;
          form.removeAttribute("aria-busy");
        });
    });
  });
})();
