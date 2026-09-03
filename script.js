document.addEventListener("DOMContentLoaded", () => {
  const corpoTabela = document.getElementById("corpoTabela");
  const btnAdicionar = document.getElementById("btnAdicionar");
  const btnCalcular = document.getElementById("btnCalcular");
  const painelResultado = document.getElementById("painelResultado");
  const painelJustificativaDoisItens = document.getElementById("painelJustificativaDoisItens");
  const inputJustificativaDoisItens = document.getElementById("inputJustificativaDoisItens");

  function formatarCNPJ(v) {
    v = v.replace(/\D/g, "");
    if (v.length > 14) v = v.substring(0, 14);
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
  }

  function formatarMoeda(v) {
    v = v.replace(/\D/g, "");
    if (v === "") return "0,00";
    let valor = (parseInt(v, 10) / 100).toFixed(2);
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return valor;
  }

  function moedaParaFloat(v) {
    if (!v) return 0;
    let limpo = v.replace(/\./g, "").replace(",", ".");
    return parseFloat(limpo) || 0;
  }

  function floatParaMoeda(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  corpoTabela.addEventListener("input", (e) => {
    if (e.target.classList.contains("input-cnpj")) {
      e.target.value = formatarCNPJ(e.target.value);
    }
    if (e.target.classList.contains("input-valor")) {
      e.target.value = formatarMoeda(e.target.value);
      verificarQuantidadeValidosDinamica();
    }
  });

  corpoTabela.addEventListener("change", (e) => {
    if (e.target.classList.contains("select-status")) {
      verificarQuantidadeValidosDinamica();
    }
  });

  function verificarQuantidadeValidosDinamica() {
    const linhas = corpoTabela.querySelectorAll("tr");
    let validosCount = 0;
    linhas.forEach(tr => {
      const val = moedaParaFloat(tr.querySelector(".input-valor").value);
      const status = tr.querySelector(".select-status").value;
      if (val > 0 && (status === "valido" || status === "automatico")) {
        validosCount++;
      }
    });

    if (validosCount === 2) {
      painelJustificativaDoisItens.style.display = "block";
    } else {
      painelJustificativaDoisItens.style.display = "none";
    }
  }

  corpoTabela.addEventListener("blur", (e) => {
    if (e.target.classList.contains("input-valor")) {
      if (!e.target.value || e.target.value.trim() === "") {
        e.target.value = "0,00";
      }
    }
  }, true);

  corpoTabela.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-del")) {
      e.target.closest("tr").remove();
      atualizarNumeracao();
      verificarQuantidadeValidosDinamica();
    }
  });

  function atualizarNumeracao() {
    const linhas = corpoTabela.querySelectorAll("tr");
    linhas.forEach((tr, index) => {
      tr.cells[0].textContent = index + 1;
    });
  }

  btnAdicionar.addEventListener("click", () => {
    const total = corpoTabela.querySelectorAll("tr").length + 1;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td style="text-align: center; font-weight: 600;">${total}</td>
      <td><input type="text" class="input-sim" placeholder="Nome do fornecedor"></td>
      <td><input type="text" class="input-sim input-cnpj" placeholder="00.000.000/0000-00" maxlength="18"></td>
      <td>
        <select class="input-sim">
          <option value="Pública" selected>Pública</option>
          <option value="Privada">Privada</option>
        </select>
      </td>
      <td><input type="text" class="input-sim input-valor" value="0,00"></td>
      <td>
        <select class="input-sim select-status">
          <option value="valido" selected>Válido</option>
          <option value="excluido_1">Excluído (Inex./Excessivo - 1ª Análise)</option>
          <option value="excluido_2">Excluído Manual (2ª Análise)</option>
        </select>
      </td>
      <td style="text-align: center;"><button class="btn-del">Excluir</button></td>
    `;

    corpoTabela.appendChild(tr);
  });

  function calcularEstatisticas(listaValores) {
    let n = listaValores.length;
    if (n === 0) return { media: 0, mediana: 0, menor: 0, desvio: 0, cv: 0 };
    let soma = listaValores.reduce((a, b) => a + b, 0);
    let media = soma / n;
    let menor = Math.min(...listaValores);

    let ordenados = [...listaValores].sort((a, b) => a - b);
    let mediana = 0;
    let meio = Math.floor(n / 2);
    if (n % 2 === 0) {
      mediana = (ordenados[meio - 1] + ordenados[meio]) / 2;
    } else {
      mediana = ordenados[meio];
    }

    let desvio = 0;
    if (n > 1) {
      let variancia = listaValores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / (n - 1);
      desvio = Math.sqrt(variancia);
    }
    let cv = media > 0 ? (desvio / media) * 100 : 0;
    return { media, mediana, menor, desvio, cv };
  }

  btnCalcular.addEventListener("click", () => {
    const linhas = corpoTabela.querySelectorAll("tr");
    let itens = [];

    linhas.forEach((tr, idx) => {
      const inputValor = tr.querySelector(".input-valor");
      const selectStatus = tr.querySelector(".select-status");
      let val = moedaParaFloat(inputValor.value);

      if (val > 0) {
        itens.push({
          index: idx,
          tr: tr,
          selectStatus: selectStatus,
          valor: val,
          statusManual: selectStatus.value
        });
      }
    });

    if (itens.length === 0) {
      alert("Por favor, informe ao menos um valor válido maior que zero.");
      return;
    }

    // 1. Separar os excluídos manualmente na 1ª análise (Inexequíveis / Excessivos)
    let itensPrimeiraAnalise = itens.filter(i => i.statusManual === "excluido_1");
    let candidatosRestantes = itens.filter(i => i.statusManual !== "excluido_1");

    if (candidatosRestantes.length < 2) {
      alert("Atenção: Após a 1ª análise, restaram menos de 2 preços. Ajuste os filtros.");
      return;
    }

    // 2. Verificar homogeneidade inicial dos restantes (CV)
    let valoresCandidatos = candidatosRestantes.map(i => i.valor);
    let estatInicial = calcularEstatisticas(valoresCandidatos);

    let expurgosSegundaAnaliseCount = 0;
    let validosAtuais = [...candidatosRestantes];

    // AUTOMAÇÃO DA 2ª ANÁLISE (Se CV > 25% e houver mais de 2 itens, o sistema expurga automaticamente o outlier mais distante da média)
    let infoAutomaticaTexto = "";
    if (estatInicial.cv > 25 && candidatosRestantes.length > 2) {
      // Loop para tentar otimizar a homogeneidade se possível mantendo ao menos 2 ou 3 itens
      while (validosAtuais.length > 2) {
        let valsTemp = validosAtuais.map(i => i.valor);
        let estatTemp = calcularEstatisticas(valsTemp);
        
        if (estatTemp.cv <= 25) break; // Ficou homogêneo!

        // Encontrar o item mais distante da média (maior desvio absoluto)
        let mediaAtual = estatTemp.media;
        let itemMaisDistante = validosAtuais.reduce((prev, curr) => {
          return Math.abs(curr.valor - mediaAtual) > Math.abs(prev.valor - mediaAtual) ? curr : prev;
        });

        // Remove dos válidos e conta como expurgado na 2ª análise automática
        validosAtuais = validosAtuais.filter(i => i.index !== itemMaisDistante.index);
        expurgosSegundaAnaliseCount++;
      }
      infoAutomaticaTexto = ` (Expurgo automático de outlier realizado por inteligência estatística para adequação ao CV ≤ 25%)`;
    }

    let totalExpurgados = itensPrimeiraAnalise.length + expurgosSegundaAnaliseCount;

    if (validosAtuais.length < 2) {
      alert("Atenção: A filtragem automática reduziu os preços válidos a menos de 2. Reveja os valores informados.");
      return;
    }

    if (validosAtuais.length === 2 && inputJustificativaDoisItens.value.trim() === "") {
      alert("Atenção: Como a pesquisa possui apenas 2 preços válidos após as análises, é obrigatório registrar a justificativa.");
      inputJustificativaDoisItens.focus();
      return;
    }

    let valoresValidosFinal = validosAtuais.map(i => i.valor);
    let estatFinal = calcularEstatisticas(valoresValidosFinal);

    // Preenchendo os campos do painel
    document.getElementById("qtdValidos").textContent = validosAtuais.length;
    document.getElementById("qtdExpurgados").textContent = totalExpurgados;

    // Se quisermos detalhar visualmente na tela a contagem exata por etapa:
    // Vamos injetar ou atualizar os textos do card de aviso
    let alertaAviso = document.getElementById("alertaAviso");
    let textoInfo = document.getElementById("textoInfo");

    document.getElementById("valMedia").textContent = floatParaMoeda(estatFinal.media);
    document.getElementById("valMediana").textContent = floatParaMoeda(estatFinal.mediana);
    document.getElementById("valMenor").textContent = floatParaMoeda(estatFinal.menor);

    document.getElementById("valDesvio").textContent = floatParaMoeda(estatFinal.desvio);
    document.getElementById("valCV").textContent = estatFinal.cv.toFixed(2) + "%";

    let badgeCV = document.getElementById("badgeCV");
    if (estatFinal.cv <= 25) {
      badgeCV.textContent = `Homogêneo (≤ 25%)`;
      badgeCV.className = "badge-success";
      badgeCV.style.color = "#16a34a";
    } else {
      badgeCV.textContent = `Heterogêneo (> 25%)`;
      badgeCV.className = "";
      badgeCV.style.color = "#dc2626";
      badgeCV.style.fontWeight = "700";
    }

    alertaAviso.style.display = "block";
    textoInfo.innerHTML = `Pesquisa consolidada com <b>${validosAtuais.length}</b> preços válidos. ` +
      `<i>1ª Análise (Inex./Excessivos):</i> ${itensPrimeiraAnalise.length} item(ns) | ` +
      `<i>2ª Análise (Outliers Automáticos):</i> ${expurgosSegundaAnaliseCount} item(ns)${infoAutomaticaTexto}.`;

    painelResultado.style.display = "block";
  });
});
