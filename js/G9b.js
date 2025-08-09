document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map", {
    center: [10, -70],
    zoom: 4,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    scrollWheelZoom: true,
    attributionControl: false,
  });

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    {
      attribution: "&copy; CartoDB",
      maxZoom: 18,
    },
  ).addTo(map);

  const colorScale = chroma.scale("viridis").domain([0, 100]);

  function getColor(value) {
    if (isNaN(value)) {
      return "#ccc";
    }
    return colorScale(value).hex();
  }

  function formatNumber(value, locale = "es", decimalPlaces = 2) {
    const formatOptions = {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    };
    return value.toLocaleString(locale, formatOptions);
  }

  fetch("/data/charts/C3/es/G9b.geojson")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((geojson) => {
      if (!geojson || !geojson.features) {
        throw new Error("Invalid GeoJSON data");
      }

      const layer = L.geoJSON(geojson, {
        style: (feature) => {
          const value = parseFloat(feature.properties.value);
          const fillColor = getColor(value);
          return {
            color: chroma(fillColor).darken(1.5).hex(),
            weight: 0.5,
            fillColor: fillColor,
            fillOpacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          const country = props.country || "Unknown";
          const region = props.region || "No region";
          const lines = [];
          lines.push(`<strong>${country}</strong>`);

          if (region !== "No region") {
            lines.push(`<strong>Región:</strong> ${region}`);
          }

          if (props.value) {
            lines.push(
              `<strong>Valor:</strong> ${formatNumber(parseFloat(props.value))}`,
            );
          } else {
            lines.push(`<strong>Valor:</strong> sin datos`);
          }
          layer.bindPopup(lines.join("<br>"));
        },
      }).addTo(map);

      map.fitBounds(layer.getBounds());
      addLegend();
    })
    .catch((error) => {
      console.error("Error loading or processing GeoJSON:", error);
      // Opcional: mostrar un mensaje de error al usuario
      const errorDiv = document.createElement("div");
      errorDiv.style.cssText =
        "position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: #ff6b6b; color: white; padding: 10px; border-radius: 4px; z-index: 1000;";
      errorDiv.textContent = "Error al cargar los datos del mapa";
      document.getElementById("map").appendChild(errorDiv);
    });

  function addLegend() {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "legend");
      div.innerHTML =
        '<canvas id="color-scale" width="50" height="140"></canvas>';
      return div;
    };

    legend.addTo(map);

    // Dibujar la barra de colores
    const canvas = document.getElementById("color-scale");
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 10, 0, 130);

    for (let i = 0; i <= 100; i++) {
      gradient.addColorStop(1 - i / 100, colorScale(i).hex());
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, 15, 120);

    // Ticks (marcas)
    ctx.fillStyle = "#000";
    ctx.font = "10px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const values = [0, 25, 50, 75, 100];
    values.forEach((value) => {
      const y = 130 - (value / 100) * 120;
      ctx.fillRect(25, y, 4, 1);
      ctx.fillText(value, 32, y);
    });
  }
});
