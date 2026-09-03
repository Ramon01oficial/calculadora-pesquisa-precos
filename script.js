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
      if (val > 0 && status === "valido") {
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
          <option value="excluido_1">Excluído (Inex./Excessivo)</option>
          <option value="excluido_2">Excluído (Outlier/Ajuste)</option>
        </select>
      </td>
      <td style="text-align: center;"><button class="btn-del">Excluir</button></td>
    `;

    corpoTabela.appendChild(tr);
  });

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

    let validosAtuais = itens.filter(i => i.statusManual === "valido");
    let expurgadosCount = itens.length - validosAtuais.length;

    if (validosAtuais.length < 2) {
      alert("Atenção: A pesquisa de preços requer no mínimo 2 preços válidos. Ajuste o status ou adicione mais itens.");
      return;
    }

    if (validosAtuais.length === 2 && inputJustificativaDoisItens.value.trim() === "") {
      alert("Atenção: Como a pesquisa possui apenas 2 preços válidos, é obrigatório registrar a justificativa para constar nos autos.");
      inputJustificativaDoisItens.focus();
      return;
    }

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

    let valoresValidos = validosAtuais.map(i => i.valor);
    let estat = calcularEstatisticas(valoresValidos);

    document.getElementById("qtdValidos").textContent = validosAtuais.length;
    document.getElementById("qtdExpurgados").textContent = expurgadosCount;

    document.getElementById("valMedia").textContent = floatParaMoeda(estat.media);
    document.getElementById("valMediana").textContent = floatParaMoeda(estat.mediana);
    document.getElementById("valMenor").textContent = floatParaMoeda(estat.menor);

    document.getElementById("valDesvio").textContent = floatParaMoeda(estat.desvio);
    document.getElementById("valCV").textContent = estat.cv.toFixed(2) + "%";

    let badgeCV = document.getElementById("badgeCV");
    let alertaAviso = document.getElementById("alertaAviso");
    let textoInfo = document.getElementById("textoInfo");

    if (estat.cv <= 25) {
      badgeCV.textContent = `Homogêneo (≤ 25%)`;
      badgeCV.className = "badge-success";
      badgeCV.style.color = "#16a34a";
    } else {
      badgeCV.textContent = `Heterogêneo (> 25%)`;
      badgeCV.className = "";
      badgeCV.style.color = "#dc2626";
      badgeCV.style.fontWeight = "700";
    }

    if (expurgadosCount > 0 || validosAtuais.length === 2) {
      alertaAviso.style.display = "block";
      let msg = `A pesquisa foi consolidada com ${validosAtuais.length} preços válidos`;
      if (validosAtuais.length === 2) {
        msg += ` (com indicação de justificativa nos autos)`;
      }
      if (expurgadosCount > 0) {
        msg += `, restando ${expurgadosCount} item(ns) desconsiderado(s)`;
      }
      textoInfo.textContent = msg + ".";
    } else {
      alertaAviso.style.display = "none";
      textoInfo.textContent = "A pesquisa restou consolidada com os preços informados, atendendo aos parâmetros de homogeneidade.";
    }

    painelResultado.style.display = "block";
  });
});
