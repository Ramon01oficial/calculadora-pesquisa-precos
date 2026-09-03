// Configuração da senha
const SENHA_SISTEMA = "ramon123";

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
  let value = input.value.replace(/\D/g, ""); // Remove tudo que não for dígito
  
  if (value === "") {
    input.value = "";
    return;
  }

  // Converte para centavos e formata no padrão brasileiro
  value = (parseInt(value, 10) / 100).toFixed(2);
  
  // Substitui ponto decimal por vírgula e aplica separador de milhar
  value = value.replace(".", ",");
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  input.value = value;
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
    <td><input type="text" class="input-cnpj" value="${cnpj}" placeholder="00.000.000/0000-00"></td>
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

// Cálculo estatístico
document.getElementById('btnCalcular').addEventListener('click', function() {
  const linhas = document.querySelectorAll('#corpoTabela tr');
  const divResultado = document.getElementById('resultado');

  let valoresValidos = [];
  let qtdDesconsiderados = 0;

  linhas.forEach(tr => {
    let statusExpurgo = tr.querySelector('.select-expurgo').value;
    
    // Tratamento dos valores formatados (remove os pontos de milhar e troca vírgula por ponto)
    let rawVal = tr.querySelector('.input-valor').value.replace(/\./g, '').replace(',', '.');
    let val = parseFloat(rawVal);

    if (!isNaN(val) && val > 0) {
      if (statusExpurgo === 'VALIDO') {
        valoresValidos.push(val);
      } else {
        qtdDesconsiderados++;
      }
    }
  });

  let qtdValidos = valoresValidos.length;

  if (qtdValidos === 0) {
    divResultado.className = 'result-box erro';
    divResultado.innerHTML = '<strong>Erro:</strong> Informe pelo menos um valor válido para calcular.';
    divResultado.style.display = 'block';
    return;
  }

  valoresValidos.sort((a, b) => a - b);

  let soma = valoresValidos.reduce((acc, v) => acc + v, 0);
  let mediaFinal = soma / qtdValidos;

  let meio = Math.floor(qtdValidos / 2);
  let medianaFinal = (qtdValidos % 2 !== 0) 
    ? valoresValidos[meio] 
    : (valoresValidos[meio - 1] + valoresValidos[meio]) / 2;

  let menorPrecoFinal = valoresValidos[0];

  let desvioPadrao = 0;
  let cvFinal = 0;
  let dadosEstatisticos = '';

  if (qtdValidos >= 2) {
    let variancia = valoresValidos.reduce((acc, v) => acc + Math.pow(v - mediaFinal, 2), 0) / (qtdValidos - 1);
    desvioPadrao = Math.sqrt(variancia);
    cvFinal = (desvioPadrao / mediaFinal) * 100;

    let statusCv = cvFinal <= 25 
      ? "<span style='color:green; font-weight:bold;'>Homogêneo (<= 25%)</span>" 
      : "<span style='color:red; font-weight:bold;'>Heterogêneo (> 25%)</span>";

    dadosEstatisticos = `
      <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 10px 0;">
      <strong>Desvio Padrão:</strong> R$ ${desvioPadrao.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}<br>
      <strong>Coeficiente de Variação Final (CV):</strong> ${cvFinal.toFixed(2).replace('.', ',')}% - ${statusCv}
    `;
  }

  divResultado.className = (qtdValidos < 3) ? 'result-box alerta' : 'result-box sucesso';

  divResultado.innerHTML = `
    <strong>Preços Válidos Utilizados:</strong> ${qtdValidos} item(ns)<br>
    <strong>Preços Desconsiderados Automáticos:</strong> ${qtdDesconsiderados} item(ns)<br>
    
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
