document.addEventListener("DOMContentLoaded", () => {
  const corpoTabela = document.getElementById("corpoTabela");
  const btnAdicionar = document.getElementById("btnAdicionar");
  const btnCalcular = document.getElementById("btnCalcular");
  const painelResultado = document.getElementById("painelResultado");

  // Formatador de CNPJ (00.000.000/0000-00)
  function formatarCNPJ(v) {
    v = v.replace(/\D/g, "");
    if (v.length > 14) v = v.substring(0, 14);
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
  }

  // Formatador de Moeda (R$ 0,00)
  function formatarMoeda(v) {
    v = v.replace(/\D/g, "");
    if (v === "") return "0,00";
    let valor = (parseInt(v, 10) / 100).toFixed(2);
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return valor;
  }

  // Converter Texto Moeda em Número Float
  function moedaParaFloat(v) {
    if (!v) return 0;
    let limpo = v.replace(/\./g, "").replace(",", ".");
    return parseFloat(limpo) || 0;
  }

  // Formatador Float para Moeda BRL
  function floatParaMoeda(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  // Eventos de entrada de dados com máscara
  corpoTabela.addEventListener("input", (e) => {
    if (e.target.classList.contains("input-cnpj")) {
      e.target.value = formatarCNPJ(e.target.value);
    }
    if (e.target.classList.contains("input-valor")) {
      e.target.value = formatarMoeda(e.target.value);
    }
  });

  corpoTabela.addEventListener("blur", (e) => {
    if (e.target.classList.contains("input-valor")) {
      if (!e.target.value || e.target.value.trim() === "") {
        e.target.value = "0,00";
      }
    }
  }, true);

  // Ação de Exclusão de Linha
  corpoTabela.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-del")) {
      e.target.closest("tr").remove();
      atualizarNumeracao();
    }
  });

  function atualizarNumeracao() {
    const linhas = corpoTabela.querySelectorAll("tr");
    linhas.forEach((tr, index) => {
      tr.cells[0].textContent = index + 1;
    });
  }

  // Ação de Adicionar Linha
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
      <td><span class="status-badge-valido">Válido</span></td>
      <td style="text-align: center;"><button class="btn-del">Excluir</button></td>
    `;

    corpoTabela.appendChild(tr);
  });

  // Ação de Cálculo e Estatística
  btnCalcular.addEventListener("click", () => {
    const inputsValores = corpoTabela.querySelectorAll(".input-valor");
    let valores = [];

    inputsValores.forEach(input => {
      let num = moedaParaFloat(input.value);
      if (num > 0) valores.push(num);
    });

    if (valores.length === 0) {
      alert("Por favor, informe ao menos um valor válido maior que zero.");
      return;
    }

    // Cálculos Básicos
    let soma = valores.reduce((acc, curr) => acc + curr, 0);
    let media = soma / valores.length;
    let menor = Math.min(...valores);

    // Mediana
    let ordenados = [...valores].sort((a, b) => a - b);
    let mediana = 0;
    let meio = Math.floor(ordenados.length / 2);
    if (ordenados.length % 2 === 0) {
      mediana = (ordenados[meio - 1] + ordenados[meio]) / 2;
    } else {
      mediana = ordenados[meio];
    }

    // Desvio Padrão Amostral e CV
    let desvioPadrao = 0;
    if (valores.length > 1) {
      let variancia = valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / (valores.length - 1);
      desvioPadrao = Math.sqrt(variancia);
    }
    let cv = media > 0 ? (desvioPadrao / media) * 100 : 0;

    // Atualização do DOM
    document.getElementById("qtdValidos").textContent = valores.length;
    document.getElementById("qtdExpurgados").textContent = "0";

    document.getElementById("valMedia").textContent = floatParaMoeda(media);
    document.getElementById("valMediana").textContent = floatParaMoeda(mediana);
    document.getElementById("valMenor").textContent = floatParaMoeda(menor);

    document.getElementById("valDesvio").textContent = floatParaMoeda(desvioPadrao);
    document.getElementById("valCV").textContent = cv.toFixed(2) + "%";

    let badgeCV = document.getElementById("badgeCV");
    if (cv <= 25) {
      badgeCV.textContent = "Homogêneo (≤ 25%)";
      badgeCV.className = "badge-success";
    } else {
      badgeCV.textContent = "Heterogêneo (> 25%)";
      badgeCV.style.color = "#dc2626";
      badgeCV.style.fontWeight = "700";
    }

    painelResultado.style.display = "block";
  });
});
