const regions = [
  "Nord America",
  "Sud America",
  "Africa",
  "Europa",
  "Asia",
  "Oceania",
];

const colorsPaisos = [
  "#0072B2",
  "#E69F00",
  "#009E73",
  "#CC79A7",
  "#D55E00",
  "#56B4E9",
  "#F0E442",
  "#6F4E7C",
];

const fontsEnergia = [
  ["coal_electricity", "Carbo", "#536878"],
  ["gas_electricity", "Gas", "#D9835B"],
  ["oil_electricity", "Petroli", "#B9A394"],
  ["nuclear_electricity", "Nuclear", "#B98FB3"],
  ["hydro_electricity", "Hidroelectrica", "#70A9C4"],
  ["wind_electricity", "Eolica", "#8BC9C2"],
  ["solar_electricity", "Solar", "#E8C66A"],
  ["biofuel_electricity", "Bioenergia", "#78AA82"],
  [
    "other_renewable_exc_biofuel_electricity",
    "Altres renovables",
    "#A7C69D",
  ],
];

let dades = [];
let regioPerPais = {};

function numero(valor) {
  if (valor === "" || valor == null) {
    return null;
  }

  const resultat = Number(valor);
  return Number.isFinite(resultat) ? resultat : null;
}

function dibuixarMapa(any) {
  const tipus = document.querySelector(
    'input[name="mapMetric"]:checked',
  ).value;
  const esEmissions = tipus === "emissions";
  const columna = esEmissions
    ? "greenhouse_gas_emissions"
    : "carbon_intensity_elec";
  const unitat = esEmissions ? "Mt CO2e" : "gCO2/kWh";
  const etiqueta = esEmissions ? "Emissions GEH" : "Intensitat carboni";
  const escala = esEmissions
    ? [
        [0, "#f7fbff"],
        [0.2, "#c6dbef"],
        [0.4, "#6baed6"],
        [0.7, "#2171b5"],
        [1, "#08306b"],
      ]
    : [
        [0, "#075143"],
        [0.25, "#4fb477"],
        [0.5, "#f2e86d"],
        [0.75, "#e58b45"],
        [1, "#b33f2f"],
      ];

  const files = dades.filter(function (fila) {
    return (
      Number(fila.year) === any &&
      regioPerPais[fila.iso_code] &&
      numero(fila[columna]) !== null
    );
  });
  const valors = files.map(function (fila) {
    return numero(fila[columna]);
  });
  let maxim = Math.max.apply(null, valors);

  if (!esEmissions) {
    maxim = Math.ceil(maxim / 100) * 100;
  }

  Plotly.newPlot(
    "cleanMap",
    [
      {
        type: "choropleth",
        locations: files.map(function (fila) {
          return fila.iso_code;
        }),
        z: valors,
        text: files.map(function (fila) {
          return fila.country;
        }),
        locationmode: "ISO-3",
        zmin: 0,
        zmax: Math.ceil(maxim),
        colorscale: escala,
        colorbar: { title: unitat },
        marker: { line: { color: "#ffffff", width: 0.4 } },
        hovertemplate:
          "%{text}<br>" +
          etiqueta +
          ": %{z:.0f} " +
          unitat +
          "<extra></extra>",
      },
    ],
    {
      margin: { t: 12, r: 20, b: 12, l: 20 },
      geo: {
        projection: { type: "natural earth" },
        showframe: false,
        showcoastlines: false,
        showcountries: true,
        countrycolor: "#d9ddd6",
        bgcolor: "rgba(0,0,0,0)",
      },
    },
    { responsive: true },
  );
}

function dibuixarEmissionsRegionals(any) {
  const filesAny = dades
    .filter(function (fila) {
      return (
        Number(fila.year) === any &&
        regioPerPais[fila.iso_code] &&
        numero(fila.greenhouse_gas_emissions) !== null
      );
    })
    .map(function (fila) {
      return {
        pais: fila.country,
        regio: regioPerPais[fila.iso_code],
        emissions: numero(fila.greenhouse_gas_emissions),
      };
    });

  const traces = [];

  regions.forEach(function (regio) {
    const filesRegio = filesAny
      .filter(function (fila) {
        return fila.regio === regio;
      })
      .sort(function (a, b) {
        return b.emissions - a.emissions;
      });
    const total = filesRegio.reduce(function (suma, fila) {
      return suma + fila.emissions;
    }, 0);
    const principals = filesRegio.filter(function (fila, index) {
      return index < 8 && fila.emissions / total >= 0.02;
    });
    const altres = filesRegio.filter(function (fila) {
      return principals.indexOf(fila) === -1;
    });

    if (altres.length > 0) {
      principals.push({
        pais: "Altres",
        emissions: altres.reduce(function (suma, fila) {
          return suma + fila.emissions;
        }, 0),
        agrupats: altres.length,
      });
    }

    principals.forEach(function (fila, index) {
      const esAltres = fila.pais === "Altres";
      let hover =
        fila.pais +
        "<br>" +
        regio +
        "<br>Emissions: %{y:.2f} Mt CO2e" +
        "<br>Pes regional: " +
        ((fila.emissions / total) * 100).toFixed(1) +
        "%";

      if (esAltres) {
        hover += "<br>Països agrupats: " + fila.agrupats;
      }

      traces.push({
        x: [regio],
        y: [fila.emissions],
        type: "bar",
        marker: {
          color: esAltres ? "#A7ADB4" : colorsPaisos[index],
          line: { color: "#ffffff", width: 1.2 },
          pattern: esAltres
            ? {
                shape: "/",
                fgcolor: "#7B8188",
                size: 7,
                solidity: 0.25,
              }
            : undefined,
        },
        hovertemplate: hover + "<extra></extra>",
        showlegend: false,
      });
    });
  });

  Plotly.newPlot(
    "regionalEmissionsChart",
    traces,
    {
      barmode: "stack",
      margin: { t: 18, r: 24, b: 56, l: 70 },
      xaxis: {
        categoryorder: "array",
        categoryarray: regions,
      },
      yaxis: {
        title: "Mt CO2e",
        gridcolor: "#e8ebe6",
        zeroline: false,
      },
      plot_bgcolor: "rgba(0,0,0,0)",
      paper_bgcolor: "rgba(0,0,0,0)",
    },
    { responsive: true },
  );
}

function dibuixarFontsEnergia(pais) {
  const filesPais = dades
    .filter(function (fila) {
      return fila.country === pais && Number(fila.year) >= 2000;
    })
    .sort(function (a, b) {
      return Number(a.year) - Number(b.year);
    });

  const traces = fontsEnergia.map(function (font) {
    return {
      x: filesPais.map(function (fila) {
        return Number(fila.year);
      }),
      y: filesPais.map(function (fila) {
        return numero(fila[font[0]]);
      }),
      name: font[1],
      type: "scatter",
      mode: "lines",
      stackgroup: "generacio",
      fill: "tonexty",
      fillcolor: font[2],
      line: { color: "#ffffff", width: 0.8 },
      hovertemplate:
        font[1] +
        "<br>Any: %{x}<br>Generacio: %{y:,.0f} TWh<extra></extra>",
    };
  });

  Plotly.newPlot(
    "energySourcesChart",
    traces,
    {
      margin: { t: 18, r: 24, b: 56, l: 74 },
      hovermode: "x unified",
      xaxis: { title: "Any", gridcolor: "#eef0ec" },
      yaxis: {
        title: "Generacio electrica acumulada (TWh)",
        gridcolor: "#eef0ec",
        rangemode: "tozero",
        zeroline: false,
      },
      legend: {
        orientation: "h",
        x: 0,
        y: 1.02,
        xanchor: "left",
        yanchor: "bottom",
      },
      plot_bgcolor: "rgba(0,0,0,0)",
      paper_bgcolor: "rgba(0,0,0,0)",
    },
    { responsive: true },
  );
}

function actualitzar(redibuixarFonts) {
  const any = Number(document.getElementById("yearSlider").value);
  const pais = document.getElementById("countrySelect").value;
  const fila = dades.find(function (d) {
    return d.country === pais && Number(d.year) === any;
  });

  document.getElementById("yearLabel").textContent = any;

  const fossil = fila ? numero(fila.fossil_share_elec) : null;
  const emissions = fila ? numero(fila.greenhouse_gas_emissions) : null;
  const carboni = fila ? numero(fila.carbon_intensity_elec) : null;

  document.getElementById("kpiFossil").textContent =
    fossil === null ? "—" : fossil.toFixed(1) + "%";
  document.getElementById("kpiEmissions").textContent =
    emissions === null
      ? "—"
      : emissions.toLocaleString("ca-ES", {
          maximumFractionDigits: 0,
        }) + " Mt CO2e";
  document.getElementById("kpiCarbon").textContent =
    carboni === null
      ? "—"
      : carboni.toLocaleString("ca-ES", {
          maximumFractionDigits: 0,
        }) + " gCO2/kWh";

  dibuixarMapa(any);
  dibuixarEmissionsRegionals(any);

  if (redibuixarFonts) {
    dibuixarFontsEnergia(pais);
  }
}

function iniciar() {
  const slider = document.getElementById("yearSlider");
  const select = document.getElementById("countrySelect");
  const paisos = dades
    .filter(function (fila) {
      if (Number(fila.year) < 2000) {
        return false;
      }

      return fontsEnergia.some(function (font) {
        return numero(fila[font[0]]) !== null;
      });
    })
    .map(function (fila) {
      return fila.country;
    })
    .filter(function (pais, index, llista) {
      return llista.indexOf(pais) === index;
    })
    .sort();

  select.innerHTML = "";
  paisos.forEach(function (pais) {
    select.add(new Option(pais, pais));
  });
  select.value = "World";

  slider.addEventListener("input", function () {
    actualitzar(false);
  });
  select.addEventListener("change", function () {
    actualitzar(true);
  });
  document
    .querySelectorAll('input[name="mapMetric"]')
    .forEach(function (radio) {
      radio.addEventListener("change", function () {
        actualitzar(false);
      });
    });

  actualitzar(true);
}

function guardarDades(filesRegions, filesEnergia) {
  regioPerPais = {};

  filesRegions.forEach(function (fila) {
    if (fila.iso_code) {
      regioPerPais[fila.iso_code] = fila.region;
    }
  });

  dades = filesEnergia.filter(function (fila) {
    return fila.country && fila.year;
  });

  iniciar();
}

function separarFilaCSV(fila) {
  const valors = [];
  let valor = "";
  let dintreCometes = false;

  for (let i = 0; i < fila.length; i++) {
    const caracter = fila[i];

    if (caracter === '"') {
      if (dintreCometes && fila[i + 1] === '"') {
        valor += '"';
        i++;
      } else {
        dintreCometes = !dintreCometes;
      }
    } else if (caracter === "," && !dintreCometes) {
      valors.push(valor);
      valor = "";
    } else {
      valor += caracter;
    }
  }

  valors.push(valor);
  return valors;
}

function carregarCSV(url) {
  return fetch(url)
    .then(function (resposta) {
      if (!resposta.ok) {
        throw new Error("No s'ha pogut carregar " + url);
      }

      return resposta.text();
    })
    .then(function (text) {
      const files = text.trim().split(/\r?\n/);
      const capcaleres = separarFilaCSV(files[0]);

      return files.slice(1).map(function (fila) {
        const valors = separarFilaCSV(fila);
        const resultat = {};

        capcaleres.forEach(function (capcalera, index) {
          resultat[capcalera] = valors[index] || "";
        });

        return resultat;
      });
    });
}

Promise.all([
  carregarCSV("country-regions.csv"),
  carregarCSV("owid-energy-data.csv"),
]).then(function (resultats) {
  guardarDades(resultats[0], resultats[1]);
});
