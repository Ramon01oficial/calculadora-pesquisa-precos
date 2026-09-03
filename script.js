document.addEventListener("DOMContentLoaded", () => {
  const corpoTabela = document.getElementById("corpoTabela");
  const btnAdicionar = document.getElementById("btnAdicionar");

  // Ação de excluir linha
  corpoTabela.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-del")) {
      e.target.closest("tr").remove();
      atualizarNumeracao();
    }
  });

  // Reordenar os números de sequência
  function atualizarNumeracao() {
    const linhas = corpoTabela.querySelectorAll("tr");
    linhas.forEach((tr, index) => {
      tr.cells[0].textContent = index + 1;
    });
  }

  // Adicionar nova linha
  btnAdicionar.addEventListener("click", () => {
    const total = corpoTabela.querySelectorAll("tr").length + 1;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td style="text-align: center; font-weight: 600;">${total}</td>
      <td><input type="text" class="input-sim" value="Nome do fornecedor"></td>
      <td><input type="text" class="input-sim" value="00.000.000/0000-00"></td>
      <td>
        <select class="input-sim">
          <option selected>Pública</option>
          <option>Privada</option>
        </select>
      </td>
      <td><input type="text" class="input-sim" value="0,00"></td>
      <td><span class="status-badge-valido">Válido</span></td>
      <td style="text-align: center;"><button class="btn-del">Excluir</button></td>
    `;

    corpoTabela.appendChild(tr);
  });
});
