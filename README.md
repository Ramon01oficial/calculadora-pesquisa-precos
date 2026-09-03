# 🧮 Calculadora de Pesquisa de Preços (Lei nº 14.133/2021)

Ferramenta web interativa e de alta performance desenvolvida para auxiliar órgãos e entidades da Administração Pública na consolidação, análise estatística e filtragem de preços para a elaboração de pesquisas de mercado, em estrita conformidade com a **Lei nº 14.133/2021** e a **Instrução Normativa SEGES/ME nº 65/2021**.

---

## 🚀 Principais Funcionalidades

- **Dinâmica de Itens Flexível:** Adição e remoção dinâmica de fornecedores, com formatação automática em tempo real para campos de CNPJ e valores monetários (BRL).
- **Tratamento de Expurgo em Duas Etapas (IN 65/2021):**
  - **1ª Análise:** Identificação e exclusão manual de preços inexequíveis ou excessivamente elevados.
  - **2ª Análise (Automática/Manual):** Verificação estatística da homogeneidade dos preços. Caso o Coeficiente de Variação (CV) supere 25%, o sistema conta com rotinas inteligentes de suporte ao ajuste do desvio padrão.
- **Validação de Preços Mínimos:** Regras automatizadas que garantem o quantitativo regulamentar de preços válidos.
- **Tratamento Especial para 2 Preços:** Alerta inteligente e campo obrigatório para registro da justificativa nos autos quando a pesquisa consolida exatamente 2 preços válidos (conforme § 2º do art. 5º da IN SEGES/ME nº 65/2021).
- **Indicadores Estatísticos Completos:**
  - Média Simples
  - Mediana
  - Menor Preço
  - Desvio Padrão
  - Coeficiente de Variação (CV) com badge indicativo automático de Homogeneidade ($\le 25\%$) ou Heterogeneidade ($> 25\%$).

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído de forma nativa para garantir máxima velocidade, leveza e compatibilidade universal, sem necessidade de instalações complexas de frameworks pesados:
- **HTML5 Semântico**
- **CSS3 Moderno** (com variáveis, design responsivo e foco em usabilidade corporativa)
- **JavaScript (ES6+)** para lógica de negócios, manipulação do DOM e cálculos estatísticos em tempo real.

---

## 📂 Estrutura de Arquivos

```text
├── index.html       # Estrutura principal da interface de usuário
├── style.css        # Estilização visual, cartões e componentes responsivos
└── script.js        # Regras de cálculo, máscaras, validações e automações estatísticas
