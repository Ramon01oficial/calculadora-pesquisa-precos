// Trava de Acesso Simples por Senha
(function verificarAcesso() {
  const SENHA_CORRETA = "ramon123"; // Escolha a senha aqui
  let senhaInformada = prompt("Digite a senha de acesso à Calculadora de Preços:");

  if (senhaInformada !== SENHA_CORRETA) {
    alert("Acesso negado. Senha incorreta.");
    document.body.innerHTML = "<h2 style='text-align:center; margin-top:50px; color:red;'>Acesso não autorizado.</h2>";
  }
})();

let contadorLinhas = 0;

function adicionarLinhaTabela(fornecedor = '', cnpj = '', tipo = 'Pública', valor = '', statusExpurgo = 'VALIDO') {



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
    <td class="col-valor"><input type="text" class="input-valor" value="${valor}" placeholder="0,00"></td>
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

// Inicializa com 3 linhas limpas
adicionarLinhaTabela();
adicionarLinhaTabela();
adicionarLinhaTabela();

// Listener do Botão Calcular
document.getElementById('btnCalcular').addEventListener('click', function() {
  const linhas = document.querySelectorAll('#corpoTabela tr');
  const divResultado = document.getElementById('resultado');

  let valoresValidos = [];
  let qtdDesconsiderados = 0;

  linhas.forEach(tr => {
    let statusExpurgo = tr.querySelector('.select-expurgo').value;
    let rawVal = tr.querySelector('.input-valor').value.replace('.', '').replace(',', '.');
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

  // Ordenação para cálculo de mediana e menor preço
  valoresValidos.sort((a, b) => a - b);

  // 1. Média Simples
  let soma = valoresValidos.reduce((acc, v) => acc + v, 0);
  let mediaFinal = soma / qtdValidos;

  // 2. Mediana
  let meio = Math.floor(qtdValidos / 2);
  let medianaFinal = (qtdValidos % 2 !== 0) 
    ? valoresValidos[meio] 
    : (valoresValidos[meio - 1] + valoresValidos[meio]) / 2;

  // 3. Menor Preço
  let menorPrecoFinal = valoresValidos[0];

  // Métricas Estatísticas
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
      <strong>Desvio Padrão:</strong> R$ ${desvioPadrao.toFixed(2).replace('.', ',')}<br>
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
        <strong>R$ ${mediaFinal.toFixed(2).replace('.', ',')}</strong>
      </div>
      <div class="metodo-card">
        <span>Mediana</span>
        <strong>R$ ${medianaFinal.toFixed(2).replace('.', ',')}</strong>
      </div>
      <div class="metodo-card">
        <span>Menor Preço</span>
        <strong>R$ ${menorPrecoFinal.toFixed(2).replace('.', ',')}</strong>
      </div>
    </div>

    ${dadosEstatisticos}
  `;
  
  divResultado.style.display = 'block';
});

document.getElementById('btnAdicionar').addEventListener('click', () => adicionarLinhaTabela());
