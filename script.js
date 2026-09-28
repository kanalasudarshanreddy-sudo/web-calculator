// Grab the display element once
const display = document.getElementById("display");

// Calculator state
let current = "0";      // the string currently shown
let resetNext = false;  // true right after "=", so next digit starts fresh

// Update the on-screen display
function render() {
  display.textContent = current;
}

// Append a number or decimal point
function inputNumber(value) {
  if (resetNext) {
    // After an equals, typing a digit starts a new number
    current = value === "." ? "0." : value;
    resetNext = false;
    return;
  }
  if (value === ".") {
    // Only allow one decimal point in the current number segment
    const lastNumber = current.split(/[\+\-\*\/]/).pop();
    if (lastNumber.includes(".")) return;
  }
  // Replace a lone leading "0" unless we're typing a decimal
  if (current === "0" && value !== ".") {
    current = value;
  } else {
    current += value;
  }
}

// Append an operator (+ - * /)
function inputOperator(op) {
  resetNext = false;
  const lastChar = current.slice(-1);
  if ("+-*/".includes(lastChar)) {
    // Replace the trailing operator instead of stacking two
    current = current.slice(0, -1) + op;
  } else {
    current += op;
  }
}

// Evaluate the expression safely
function calculate() {
  try {
    // Tokenize into numbers and operators, then evaluate without eval()
    const result = evaluateExpression(current);
    if (!isFinite(result)) {
      current = "Error";
    } else {
      // Round to avoid floating-point noise like 0.1 + 0.2
      current = String(Math.round(result * 1e10) / 1e10);
    }
  } catch {
    current = "Error";
  }
  resetNext = true;
}

// A small expression evaluator that respects * and / before + and -
function evaluateExpression(expr) {
  const tokens = expr.match(/(\d+\.?\d*)|[\+\-\*\/]/g);
  if (!tokens) throw new Error("empty");

  // First pass: handle * and /
  const pass1 = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const num = parseFloat(tokens[i + 1]);
    if (op === "*") {
      pass1.push(parseFloat(pass1.pop()) * num);
    } else if (op === "/") {
      pass1.push(parseFloat(pass1.pop()) / num);
    } else {
      pass1.push(op, num);
    }
  }

  // Second pass: handle + and -
  let result = parseFloat(pass1[0]);
  for (let i = 1; i < pass1.length; i += 2) {
    const op = pass1[i];
    const num = parseFloat(pass1[i + 1]);
    if (op === "+") result += num;
    else if (op === "-") result -= num;
  }
  return result;
}

// Clear everything
function clearAll() {
  current = "0";
  resetNext = false;
}

// Delete the last character
function deleteLast() {
  if (resetNext) {
    clearAll();
    return;
  }
  current = current.length > 1 ? current.slice(0, -1) : "0";
}

// Convert the current value to a percentage
function percent() {
  try {
    const value = evaluateExpression(current);
    current = String(value / 100);
    resetNext = true;
  } catch {
    current = "Error";
  }
}

// Wire up all button clicks using event delegation
document.querySelector(".buttons").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.num !== undefined) {
    inputNumber(button.dataset.num);
  } else if (button.dataset.op !== undefined) {
    inputOperator(button.dataset.op);
  } else {
    switch (button.dataset.action) {
      case "clear": clearAll(); break;
      case "delete": deleteLast(); break;
      case "percent": percent(); break;
      case "equals": calculate(); break;
    }
  }
  render();
});

// Bonus: keyboard support
document.addEventListener("keydown", (event) => {
  const key = event.key;
  if (/[0-9.]/.test(key)) {
    inputNumber(key);
  } else if ("+-*/".includes(key)) {
    inputOperator(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearAll();
  } else {
    return;
  }
  render();
});

// Initial paint
render();
