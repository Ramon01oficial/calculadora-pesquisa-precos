/* --- Máscaras de Entrada --- */
function formatarMoedaInput(input) {
  let value = input.value.replace(/\D/g, "");
  if (value === "") { input.value = ""; return; }
  value = (parseInt(value, 10) / 100).toFixed(2);
  value = value.replace(".", ",");
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  input.value = value;
}

function formatarCNPJInput(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 14) v = v.slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, "$1.$2");
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
  v = v.replace(/(\d{4})(\d)/, "$1-$2");
  input.value = v;
}

/* --- Manipulação da Tabela --- */
let contadorLinhas = 0;

function adicionarLinhaTabela(fornecedor = '', cnpj = '', tipo = 'Pública', valor = '', statusExpurgo = 'VALIDO', justificativa = '') {
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
      <input type="text" class="input-justificativa" value="${justificativa}" placeholder="Motivo do expurgo..." style="display:none; margin-top:4px; font-size:11px;">
    </td>
    <td class="col-acao" style="text-align:center;">
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
  const inputJust = tr.querySelector('.input-justificativa');
  
  tr.classList.remove('excluido-1', 'excluido-2');
  
  if (status === 'EXCLUIDO_1') {
    tr.classList.add('excluido-1');
    inputJust.style.display = 'block';
  } else if (status === 'EXCLUIDO_2') {
    tr.classList.add('excluido-2');
    inputJust.style.display = 'block';
  } else {
    inputJust.style.display = 'none';
    inputJust.value = '';
  }
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

// Cálculos estatísticos
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

// Botão Calcular
document.getElementById('btnCalcular').addEventListener('click', function() {
  const linhas = document.querySelectorAll('#corpoTabela tr');
  const divResultado = document.getElementById('resultado');
  const btnPdf = document.getElementById('btnGerarPDF');

  let itensValidos = [];

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
    btnPdf.style.display = 'none';
    return;
  }

  // Outlier auto-expurgo
  let valores = itensValidos.map(i => i.valor);
  let cvAtual = calcularCV(valores);
  let houveExpurgoAutomatico = false;

  while (cvAtual > 25 && itensValidos.length > 1) {
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
    
    let inputJust = itemRemovido.tr.querySelector('.input-justificativa');
    if (!inputJust.value) {
      inputJust.value = 'Expurgado automaticamente por divergência estatística (Outlier)';
    }
    
    atualizarEstiloLinha(itemRemovido.selectExpurgo);
    houveExpurgoAutomatico = true;

    valores = itensValidos.map(i => i.valor);
    cvAtual = calcularCV(valores);
  }

  // Resultados Finais
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
  let recomendacaoMetodo = '';

  if (qtdValidos >= 2) {
    let variancia = valores.reduce((acc, v) => acc + Math.pow(v - mediaFinal, 2), 0) / (qtdValidos - 1);
    desvioPadrao = Math.sqrt(variancia);
    cvFinal = (desvioPadrao / mediaFinal) * 100;

    let statusCv = cvFinal <= 25 
      ? "<span style='color:green; font-weight:bold;'>Homogêneo (<= 25%)</span>" 
      : "<span style='color:red; font-weight:bold;'>Heterogêneo (> 25%)</span>";

    if (cvFinal <= 25) {
      recomendacaoMetodo = `<strong>Sugestão Metodológica:</strong> Recomenda-se utilizar a <strong>MÉDIA SIMPLES (R$ ${mediaFinal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")})</strong> como valor estimado.`;
    } else {
      recomendacaoMetodo = `<strong>Sugestão Metodológica:</strong> Amostra com dispersão. Recomenda-se utilizar a <strong>MEDIANA (R$ ${medianaFinal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")})</strong> para mitigar distorções de preços.`;
    }

    dadosEstatisticos = `
      <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 10px 0;">
      <strong>Desvio Padrão Final:</strong> R$ ${desvioPadrao.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")}<br>
      <strong>Coeficiente de Variação Final (CV):</strong> ${cvFinal.toFixed(2).replace('.', ',')}% - ${statusCv}
    `;
  } else {
    recomendacaoMetodo = `<strong>Sugestão Metodológica:</strong> Com 1 valor válido (mercado exclusivo/restrito), adote o <strong>MENOR PREÇO / VALOR ÚNICO (R$ ${menorPrecoFinal.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".")})</strong> devidamente fundamentado.`;
    dadosEstatisticos = `
      <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 10px 0;">
      <span style="color:#1a73e8; font-weight:bold;">ℹ️ Amostra de item específico / mercado restrito.</span>
    `;
  }

  let alertaAmostra = '';
  if (qtdValidos < 3) {
    alertaAmostra = `
      <div style="margin-bottom:12px; padding:10px; background:#e8f0fe; border-left:4px solid #1a73e8; color:#174ea6; font-size:12px; line-height:1.4;">
        <strong>📌 ORIENTAÇÃO PARA A INSTRUÇÃO PROCESSUAL (Art. 6º, § 4º, IN SEGES/ME 65/2021):</strong><br>
        A pesquisa restou consolidada com <strong>${qtdValidos} preço(s) válido(s)</strong>.<br>
        <em>Para fins de auditoria, certifique-se de registrar nos autos a justificativa da especificidade do objeto ou limitação de mercado.</em>
      </div>
    `;
  }

  let avisoExpurgo = houveExpurgoAutomatico 
    ? `<div style="margin-bottom:10px; padding:8px; background:#fef7e0; border-left:4px solid #f2994a; color:#b76e00; font-weight:bold; font-size:12px;">
        ⚡ O sistema realizou o expurgo automático de outlier(s) para sanear o CV <= 25%.
       </div>`
    : '';

  divResultado.className = 'result-box sucesso';

  divResultado.innerHTML = `
    ${alertaAmostra}
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
    <div style="margin-top:10px; padding:8px; background:#f1f3f4; border-radius:4px; font-size:12px; color:#3c4043;">
      ${recomendacaoMetodo}
    </div>
  `;
  
  divResultado.style.display = 'block';
  btnPdf.style.display = 'inline-block';
});

/* --- Exportação para PDF --- */
function gerarPDF() {
  const elemento = document.getElementById('conteudoParaPDF');
  const cabecalho = document.getElementById('cabecalhoPDF');
  const colunasAcao = document.querySelectorAll('.col-acao');

  cabecalho.style.display = 'block';
  colunasAcao.forEach(el => el.style.display = 'none');

  const opcoes = {
    margin:       10,
    filename:     `Parecer_Pesquisa_Precos_${new Date().toISOString().slice(0,10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opcoes).from(elemento).save().then(() => {
    cabecalho.style.display = 'none';
    colunasAcao.forEach(el => el.style.display = '');
  });
}

document.getElementById('btnAdicionar').addEventListener('click', () => adicionarLinhaTabela());
