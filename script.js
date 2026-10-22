const MIN_SIZE = 2;
const MAX_SIZE = 10;

const form = document.querySelector('#calculator-form');
const sizeOutput = document.querySelector('#matrix-size');
const matrixArea = document.querySelector('#matrix-area');
const resultsSection = document.querySelector('#results');
const message = document.querySelector('#form-message');
const decreaseButton = document.querySelector('#decrease-size');
const increaseButton = document.querySelector('#increase-size');
const copyLinkButton = document.querySelector('#copy-link-button');
const shareLinkStatus = document.querySelector('#share-link-status');

let matrixSize = 3;

function updateSizeControls() {
  sizeOutput.value = String(matrixSize);
  sizeOutput.textContent = String(matrixSize);
  decreaseButton.disabled = matrixSize <= MIN_SIZE;
  increaseButton.disabled = matrixSize >= MAX_SIZE;
}

function createMatrix() {
  clearMessage();
  const previousSize = Number(matrixArea.dataset.matrixSize) || 0;
  const previousCoefficients = [...matrixArea.querySelectorAll('.coefficient')].map((input) => input.value);
  const previousConstants = [...matrixArea.querySelectorAll('.constant')].map((input) => input.value);
  resultsSection.hidden = true;
  resultsSection.innerHTML = '';

  const headerCells = Array.from({ length: matrixSize }, (_, index) =>
    `<th scope="col">x<sub>${index + 1}</sub></th>`
  ).join('');
  const rows = Array.from({ length: matrixSize }, (_, rowIndex) => {
    const coefficientCells = Array.from({ length: matrixSize }, (_, columnIndex) => `
      <td>
        <input class="matrix-input coefficient" type="number" step="any" inputmode="decimal"
          aria-label="${rowIndex + 1}-tenglama, x${columnIndex + 1} koeffitsiyenti"
          placeholder="a${rowIndex + 1}${columnIndex + 1}" required>
      </td>`).join('');

    return `<tr>
      <th class="row-label" scope="row">${rowIndex + 1}</th>
      ${coefficientCells}
      <td><input class="matrix-input b-input constant" type="number" step="any" inputmode="decimal"
        aria-label="${rowIndex + 1}-tenglama ozod hadi" placeholder="b${rowIndex + 1}" required></td>
    </tr>`;
  }).join('');

  matrixArea.innerHTML = `
    <div class="matrix-caption"><strong>Koeffitsiyentlar matritsasi</strong><span>Kasr va o‘nlik sonlar qabul qilinadi</span></div>
    <div class="matrix-table-wrap">
      <table class="matrix-table" style="--column-count: ${matrixSize + 2}">
        <thead><tr><th scope="col">№</th>${headerCells}<th scope="col">b</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  matrixArea.dataset.matrixSize = String(matrixSize);

  const coefficientInputs = matrixArea.querySelectorAll('.coefficient');
  const constantInputs = matrixArea.querySelectorAll('.constant');
  const preservedSize = Math.min(previousSize, matrixSize);
  for (let row = 0; row < preservedSize; row += 1) {
    constantInputs[row].value = previousConstants[row];
    for (let column = 0; column < preservedSize; column += 1) {
      coefficientInputs[row * matrixSize + column].value = previousCoefficients[row * previousSize + column];
    }
  }
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

async function copyPageLink() {
  if (!['http:', 'https:'].includes(window.location.protocol)) {
    shareLinkStatus.textContent = 'Sayt hali internetga joylanmagan. Boshqalar ochishi uchun avval uni internetga joylash kerak.';
    return;
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    shareLinkStatus.textContent = 'Link nusxalandi. Endi Telegram yoki Instagramga yuborishingiz mumkin.';
  } catch (error) {
    shareLinkStatus.textContent = 'Linkni nusxalab bo‘lmadi. Brauzer ruxsatlarini tekshirib qayta urinib ko‘ring.';
    console.error('Sahifa linkini clipboardga nusxalashda xatolik:', error);
  }
}

function determinant(matrix) {
  const size = matrix.length;
  const values = matrix.map((row) => row.slice());
  const rowScales = values.map((row) => Math.max(...row.map(Math.abs)));
  let sign = 1;
  let result = 1;

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    let bestRatio = -1;

    for (let row = column; row < size; row += 1) {
      const ratio = rowScales[row] === 0 ? 0 : Math.abs(values[row][column]) / rowScales[row];
      if (ratio > bestRatio) {
        bestRatio = ratio;
        pivotRow = row;
      }
    }

    const pivot = values[pivotRow][column];
    if (rowScales[pivotRow] === 0 || Math.abs(pivot) <= Number.EPSILON * size * rowScales[pivotRow]) {
      return 0;
    }

    if (pivotRow !== column) {
      [values[column], values[pivotRow]] = [values[pivotRow], values[column]];
      [rowScales[column], rowScales[pivotRow]] = [rowScales[pivotRow], rowScales[column]];
      sign *= -1;
    }

    const diagonal = values[column][column];
    result *= diagonal;
    for (let row = column + 1; row < size; row += 1) {
      const factor = values[row][column] / diagonal;
      for (let nextColumn = column + 1; nextColumn < size; nextColumn += 1) {
        values[row][nextColumn] -= factor * values[column][nextColumn];
      }
    }
  }

  return sign * result;
}

function formatNumber(value) {
  if (Math.abs(value) < 1e-10) return '0';
  return new Intl.NumberFormat('uz-UZ', {
    maximumFractionDigits: 8,
    useGrouping: false
  }).format(value);
}

function readSystem() {
  const coefficientInputs = [...matrixArea.querySelectorAll('.coefficient')];
  const constantInputs = [...matrixArea.querySelectorAll('.constant')];
  const coefficients = Array.from({ length: matrixSize }, () => Array(matrixSize));
  const constants = [];

  for (let row = 0; row < matrixSize; row += 1) {
    for (let column = 0; column < matrixSize; column += 1) {
      const input = coefficientInputs[row * matrixSize + column];
      if (input.value.trim() === '' || !input.validity.valid || !Number.isFinite(input.valueAsNumber)) {
        input.focus();
        throw new Error('Iltimos, barcha koeffitsiyentlarni to‘g‘ri son bilan to‘ldiring.');
      }
      coefficients[row][column] = input.valueAsNumber;
    }

    const constantInput = constantInputs[row];
    if (constantInput.value.trim() === '' || !constantInput.validity.valid || !Number.isFinite(constantInput.valueAsNumber)) {
      constantInput.focus();
      throw new Error('Iltimos, barcha ozod hadlarni to‘g‘ri son bilan to‘ldiring.');
    }
    constants.push(constantInput.valueAsNumber);
  }

  return { coefficients, constants };
}

function renderResults(coefficients, constants) {
  const mainDeterminant = determinant(coefficients);
  resultsSection.hidden = false;

  if (mainDeterminant === 0) {
    resultsSection.innerHTML = `
      <div class="results-heading">
        <div><p class="section-kicker">HISOBLASH YAKUNI</p><h2>Yagona yechim topilmadi</h2></div>
        <div class="determinant-summary">Asosiy determinant <strong>D = 0</strong></div>
      </div>
      <p class="singular-message"><strong>D = 0.</strong> Kramer usuli bo‘yicha yagona yechim mavjud emas. Sistema yechimsiz yoki cheksiz ko‘p yechimga ega bo‘lishi mumkin.</p>`;
    return;
  }

  const answers = [];
  const determinants = [];
  for (let column = 0; column < matrixSize; column += 1) {
    const replaced = coefficients.map((row, rowIndex) =>
      row.map((value, columnIndex) => columnIndex === column ? constants[rowIndex] : value)
    );
    const replacedDeterminant = determinant(replaced);
    determinants.push(replacedDeterminant);
    answers.push(replacedDeterminant / mainDeterminant);
  }

  const answerCards = answers.map((answer, index) => `
    <article class="answer-card">
      <span class="answer-label">x<sub>${index + 1}</sub></span>
      <strong class="answer-value">${formatNumber(answer)}</strong>
    </article>`).join('');
  const determinantSteps = determinants.map((value, index) =>
    `D<sub>${index + 1}</sub> = ${formatNumber(value)}`
  ).join(' <span aria-hidden="true">·</span> ');

  resultsSection.innerHTML = `
    <div class="results-heading">
      <div><p class="section-kicker">HISOBLASH YAKUNI</p><h2>Natija</h2></div>
      <div class="determinant-summary">Asosiy determinant <strong>D = ${formatNumber(mainDeterminant)}</strong></div>
    </div>
    <div class="answer-grid">${answerCards}</div>
    <p class="determinant-detail"><strong>Almashtirilgan determinantlar:</strong> ${determinantSteps}</p>`;
}

decreaseButton.addEventListener('click', () => {
  if (matrixSize > MIN_SIZE) {
    matrixSize -= 1;
    updateSizeControls();
  }
});

increaseButton.addEventListener('click', () => {
  if (matrixSize < MAX_SIZE) {
    matrixSize += 1;
    updateSizeControls();
  }
});

document.querySelector('#generate-button').addEventListener('click', createMatrix);
copyLinkButton.addEventListener('click', copyPageLink);
document.querySelector('#clear-button').addEventListener('click', () => {
  createMatrix();
  matrixArea.querySelector('.matrix-input')?.focus();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearMessage();

  try {
    const { coefficients, constants } = readSystem();
    renderResults(coefficients, constants);
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    showMessage(error.message);
  }
});

matrixArea.addEventListener('input', clearMessage);
updateSizeControls();
createMatrix();