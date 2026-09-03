// Configuração da senha
const SENHA_SISTEMA = "auditoria2026";

function validarAcesso(event) {
  if (event) event.preventDefault();
  
  const inputEl = document.getElementById('inputSenha');
  const erroEl = document.getElementById('erroSenha');
  
  const senhaInformada = inputEl.value.trim().toLowerCase();

  if (senhaInformada === SENHA_SISTEMA) {
    sessionStorage.setItem('acesso_autorizado', 'true');
    liberarTela();
  } else {
    erroEl.style.display = 'block';
    inputEl.value = '';
    inputEl.focus();
  }
}

function liberarTela() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
}

function bloquearAcesso() {
  sessionStorage.removeItem('acesso_autorizado');
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('inputSenha').value = '';
  document.getElementById('erroSenha').style.display = 'none';
}

window.addEventListener('load', () => {
  if (sessionStorage.getItem('acesso_autorizado') === 'true') {
    liberarTela();
  }
});

/* --- Função de Máscara Moeda (Real em Tempo Real) --- */
function formatarMoedaInput(input) {
  let value = input.value.replace(/\D/g, "");
  
  if (value === "") {
    input.value = "";
    return;
  }

  value = (parseInt(value, 10) / 100).toFixed(2);
  value = value.replace(".", ",");
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  input.value = value;
}

/* --- Função de Máscara CNPJ (00.000.000/0000-00) --- */
function formatarCNPJInput(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 14) v = v.slice(0, 14);

  v = v.replace(/^(\d{2})(\d)/, "$1.$2");
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
  v = v.replace(/(\d{4})(\d)/, "$1-$2");

  input.value = v;
}

/* --- Lógica da Calculadora --- */
let contadorLinhas = 0;

function adicionarLinhaTabela(fornecedor = '', cnpj = '', tipo = 'Pública', valor = '', statusExpurgo = 'VALIDO') {
  contadorLinhas++;
  const tbody = document.getElementById('corpoTabela');
  const tr = document.createElement('tr');
  tr.id = `linha-${contadorLinhas}`;
  
  tr.innerHTML = `
    <td class="col-index" style="text-align:center;"></td>
    <td><input type="text" class="input-fornecedor" value="${fornecedor}" placeholder="Nome do fornecedor"></td>
    <td>
      <input type="text" class="input-cnpj" value="${cnpj}" placeholder="00.000.000/0000-00" maxlength="18" oninput="formatarCNPJInput(this)">
    </td>
    <td>
      <select class="select-tipo">
        <option value="Pública" ${tipo === 'Pública' ? 'selected' : ''}>Pública</option>
        <option value="Privada" ${tipo === 'Privada' ? 'selected' : ''}>Privada</option>
      </select>
    </td>
    <td class="col-valor">
      <input type="text" class="input-valor" value="${valor}" placeholder="0,00" oninput="formatarMoedaInput(this)">
    </td>
    <td>
      <select class="select-expurgo" onchange="atualizarEstiloLinha(this)">
        <option value="VALIDO" ${statusExpurgo === 'VALIDO' ? 'selected' : ''}>Válido</option>
        <option value="EXCLUIDO_1" ${statusExpurgo === 'EXCLUIDO_1' ? 'selected' : ''}>Excluído 1ª</option>
        <option value="EXCLUIDO_2" ${statusExpurgo === 'EXCLUIDO_2' ? 'selected' : ''}>Excluído 2ª</option>
      </select>
    </td>
    <td style="text-align:center;">
      <button type="button" class="btn-remover" onclick="removerLinha(this)">Excluir</button>
    </td>
  `;
  
  tbody.appendChild(tr);
  atualizarEstiloLinha(tr.querySelector('.select-expurgo'));
  renumerarTabela();
}

function atualizarEstiloLinha(selectElement) {
  const tr = selectElement.closest('tr');
  const status = selectElement.value;
  
  tr.classList.remove('excluido-1', 'excluido-2');
  if (status === 'EXCLUIDO_1') tr.classList.add('excluido-1');
  else if (status === 'EXCLUIDO_2') tr.classList.add('excluido-2');
}

function removerLinha(btn) {
  const tr = btn.closest('tr');
  tr.remove();
  renumerarTabela();
}

function renumerarTabela() {
  const linhas = document.querySelectorAll('#corpoTabela tr');
  linhas.forEach((tr, index) => {
    tr.querySelector('.col-index').textContent = index + 1;
  });
}

adicionarLinhaTabela();
adicionarLinhaTabela();
adicionarLinhaTabela();

// Funções auxiliares estatísticas
function calcularMedia(arr) {
  return arr.reduce((acc, v) => acc + v, 0) / arr.length;
}

function calcularCV(arr) {
  if (arr.length < 2) return 0;
  let media = calcularMedia(arr);
  let variancia = arr.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / (arr.length - 1);
  let desvioPadrao = Math.sqrt(variancia);
  return (desvioPadrao / media) * 100;
}

// Cálculo e expurgo automático de Outliers (IN 65/2021)
document.getElementById('btnCalcular').addEventListener('click', function() {
  const linhas = document.querySelectorAll('#corpoTabela tr');
  const divResultado = document.getElementById('resultado');

  let itensValidos = [];

  // 1. Coleta dados das linhas
  linhas.forEach(tr => {
    let selectExpurgo = tr.querySelector('.select-expurgo');
    let rawVal = tr.querySelector('.input-valor').value.replace(/\./g, '').replace(',', '.');
    let val = parseFloat(rawVal);

    if (!isNaN(val) && val > 0) {
      if (selectExpurgo.value === 'EXCLUIDO_2') {
        selectExpurgo.value = 'VALIDO';
        atualizarEstiloLinha(selectExpurgo);
      }

      if (selectExpurgo.value === 'VALIDO') {
        itensValidos.push({ tr, valor: val, selectExpurgo });
      }
    }
  });

  if (itensValidos.length === 0) {
    divResultado.className = 'result-box erro';
    divResultado.innerHTML = '<strong>Erro:</strong> Informe pelo menos um valor válido para calcular.';
    divResultado.style.display = 'block';
    return;
  }

  // 2. Loop de saneamento de Outliers
  let valores = itensValidos.map(i => i.valor);
  let cvAtual = calcularCV(valores);
  let houveExpurgoAutomatico = false;

  while (cvAtual > 25 && itensValidos.length >= 3) {
    let mediaTemp = calcularMedia(itensValidos.map(i => i.valor));
    
    let indexOutlier = 0;
    let maiorDistancia = -1;

    itensValidos.forEach((item, idx) => {
      let dist = Math.abs(item.valor - mediaTemp);
      if (dist > maiorDistancia) {
        maiorDistancia = dist;
        indexOutlier = idx;
      }
    });

    let itemRemovido = itensValidos.splice(indexOutlier, 1)[0];
    itemRemovido.selectExpurgo.value = 'EXCLUIDO_2';
    atualizarEstiloLinha(itemRemovido.selectExpurgo);
    houveExpurgoAutomatico = true;

    valores = itensValidos.map(i => i.valor);
    cvAtual = calcularCV(valores);
  }

  // 3. Processa resultados finais
  let qtdValidos = itensValidos.length;
  let qtdDesconsiderados = Array.from(document.querySelectorAll('.select-expurgo')).filter(s => s.value !== 'VALIDO').length;

  valores.sort((a, b) => a - b);

  let soma = valores.reduce((acc, v) => acc + v, 0);
  let mediaFinal = soma / qtdValidos;

  let meio = Math.floor(qtdValidos / 2);
  let medianaFinal = (qtdValidos % 2 !== 0) 
    ? valores[meio] 
    : (valores[meio - 1] + valores[meio]) / 2;

  let menorPrecoFinal = valores[0];

  let desvioPadrao = 0;
  let cvFinal = 0;
  let dadosEstatisticos = '';

  if (qtdValidos >= 2) {
    let variancia = valores.reduce((acc, v) => acc + Math.pow(v - mediaFinal, 2), 0) / (qtdValidos - 1);
    desvioPadrao = Math.sqrt(variancia);
    cvFinal = (desvioPadrao / mediaFinal) * 100;

    let statusCv = cvFinal <= 25 
      ? "<span style='color:green; font-weight:bold;'>Homogêneo (<= 25%)</span>" 
      : "<span style='color:red; font-weight:bold;'>Heterogêneo (> 25%)</span>";

    dadosEstatisticos = `
      <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 10px 0;">
      <strong>Desvio Padrão Final:</strong> R$ ${desvioPadrao.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}<br>
      <strong>Coeficiente de Variação Final (CV):</strong> ${cvFinal.toFixed(2).replace('.', ',')}% - ${statusCv}
    `;
  }

  let avisoExpurgo = houveExpurgoAutomatico 
    ? `<div style="margin-bottom:10px; padding:8px; background:#e8f0fe; border-left:4px solid #1a73e8; color:#1a73e8; font-weight:bold;">
        ℹ️ Foram identificados e marcados automaticamente os preços discrepantes (Outliers em azul) para adequação ao CV <= 25%.
       </div>`
    : '';

  divResultado.className = (qtdValidos < 3) ? 'result-box alerta' : 'result-box sucesso';

  divResultado.innerHTML = `
    ${avisoExpurgo}
    <strong>Preços Válidos Utilizados:</strong> ${qtdValidos} item(ns)<br>
    <strong>Preços Desconsiderados (Expurgados):</strong> ${qtdDesconsiderados} item(ns)<br>
    
    <div class="metodos-grid">
      <div class="metodo-card">
        <span>Média Simples</span>
        <strong>R$ ${mediaFinal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</strong>
      </div>
      <div class="metodo-card">
        <span>Mediana</span>
        <strong>R$ ${medianaFinal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</strong>
      </div>
      <div class="metodo-card">
        <span>Menor Preço</span>
        <strong>R$ ${menorPrecoFinal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</strong>
      </div>
    </div>

    ${dadosEstatisticos}
  `;
  
  divResultado.style.display = 'block';
});

document.getElementById('btnAdicionar').addEventListener('click', () => adicionarLinhaTabela());
