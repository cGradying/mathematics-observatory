const { FORMULA_LIBRARY, plainMath, randomInt, randomNonZero, roundTo, formatNumber, formatMoney, signed, signedLatex, makeFormula, buildAdditionalExample, buildPiecewiseExample } = window.ExploreFormulas;

const state = {
  selectedId: FORMULA_LIBRARY[0].id,
  activeCategory: "all",
  searchTerm: "",
  difficulty: "easy",
  currentExample: null,
  practiceProblem: null,
  exampleIndexes: {},
  piecewiseRuleCount: 2,
};

const EXAMPLE_INDEXES_BY_DIFFICULTY = {
  easy: [1, 2, 3],
  medium: [0, 4, 5],
  hard: [6, 7, 8, 9],
};

function renderMath(element, latex, displayMode = false, fallback = "") {
  if (!element) return;

  if (window.katex) {
    window.katex.render(latex, element, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } else {
    element.textContent = fallback || plainMath(latex);
  }
}

function fitFormulaExpression() {
    const expression = document.getElementById("active-formula-expression");
    if (!expression) return;

    const containerWidth = expression.clientWidth - 8;
    if (!containerWidth) return;

    const katexElem = expression.querySelector(".katex");
    const variableSymbols = document.querySelectorAll(
        "#active-formula-variables .variable-symbol .katex",
    );
    if (!katexElem) return;

    katexElem.style.removeProperty("font-size");
    const baseFontSize = parseFloat(window.getComputedStyle(katexElem).fontSize);
    const currentWidth = Math.max(
        katexElem.scrollWidth,
        katexElem.getBoundingClientRect().width,
    );

    if (currentWidth > containerWidth) {
        const scaleFactor = (containerWidth / currentWidth) * 0.98;
        katexElem.style.fontSize = `${baseFontSize * scaleFactor}px`;
    } else {
        katexElem.style.removeProperty("font-size");
    }

    const matchedSize = window.getComputedStyle(katexElem).fontSize;
    variableSymbols.forEach((symbol) => {
        symbol.style.fontSize = matchedSize;
    });
}
function getVisibleFormulas() {
  const query = state.searchTerm.toLowerCase();
  return FORMULA_LIBRARY.filter((formula) => {
    const matchesCategory =
      state.activeCategory === "all" ||
      formula.category === state.activeCategory;
    const searchable =
      `${formula.name} ${formula.category} ${formula.search} ${formula.purpose}`.toLowerCase();
    return matchesCategory && searchable.includes(query);
  });
}

function renderFormulaCards() {
  const list = document.getElementById("formula-card-list");
  const count = document.getElementById("visible-count");
  const summary = document.getElementById("results-summary");
  if (!list || !count || !summary) return;

  const formulas = getVisibleFormulas();
  count.textContent = `${formulas.length} ${formulas.length === 1 ? "item" : "items"}`;
  summary.textContent = state.searchTerm
    ? `${formulas.length} result${formulas.length === 1 ? "" : "s"} for “${state.searchTerm}”`
    : "";

  if (!formulas.length) {
    list.innerHTML =
      '<div class="empty-state">No formulas match this search. Try another term or choose a different topic.</div>';
    return;
  }

  if (!formulas.some((formula) => formula.id === state.selectedId)) {
    state.selectedId = formulas[0].id;
  }

  list.innerHTML = formulas
    .map((formula) => {
      const libraryIndex = FORMULA_LIBRARY.findIndex(
        (item) => item.id === formula.id,
      );
      const selected = formula.id === state.selectedId;
      return `
            <button class="formula-card${selected ? " is-selected" : ""}" type="button" data-formula-id="${formula.id}" aria-pressed="${selected}">
                <span class="card-index">${String(libraryIndex + 1).padStart(2, "0")}</span>
                <span class="formula-card-copy">
                    <strong>${formula.name}</strong>
                    <span>${formula.category}</span>
                </span>
                <span class="card-arrow" aria-hidden="true">›</span>
            </button>
        `;
    })
    .join("");

  list.querySelectorAll(".formula-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.formulaId;
      renderFormulaCards();
      renderActiveFormula();
    });
  });
}

function renderActiveFormula() {
  const selected = FORMULA_LIBRARY.find(
    (formula) => formula.id === state.selectedId,
  );
  if (!selected) return;

  const category = document.getElementById("active-formula-category");
  const name = document.getElementById("active-formula-name");
  const expression = document.getElementById("active-formula-expression");
  const purpose = document.getElementById("active-formula-purpose");
  const variables = document.getElementById("active-formula-variables");
  const number = document.getElementById("active-formula-number");
  const piecewiseToggle = document.getElementById("piecewise-rules-toggle");
  if (!category || !name || !expression || !purpose || !variables || !number)
    return;

  category.textContent = selected.category;
  name.textContent = selected.name;
  purpose.textContent = selected.purpose;
  number.textContent = `${String(FORMULA_LIBRARY.indexOf(selected) + 1).padStart(2, "0")} / ${String(FORMULA_LIBRARY.length).padStart(2, "0")}`;
  const isPiecewise = selected.id === "piecewise-function";
  const useThreeRules = isPiecewise && state.piecewiseRuleCount === 3;
  const piecewiseForm = isPiecewise
    ? selected.piecewiseForms?.[state.difficulty]?.[state.piecewiseRuleCount]
    : null;
  piecewiseToggle?.classList.toggle("hidden", !isPiecewise);
  if (piecewiseToggle) {
    piecewiseToggle.textContent = useThreeRules ? "Show 2 rules" : "Show 3 rules";
    piecewiseToggle.setAttribute("aria-pressed", String(useThreeRules));
  }
  const activeVariables = piecewiseForm
    ? [
        { latex: "f(x)", detail: "Output selected by the input" },
        { latex: "x", detail: "Input value" },
        ...piecewiseForm.branches.map((branch, index) => ({
          latex: branch.formulaLatex,
          detail: `Rule ${index + 1} when ${branch.conditionText}`,
        })),
      ]
    : selected.variables;
  renderMath(
    expression,
    piecewiseForm?.latex || selected.latex,
    true,
    piecewiseForm?.plain || selected.plain,
  );
  requestAnimationFrame(fitFormulaExpression);

  variables.innerHTML = activeVariables
    .map(
      (variable, index) => `
        <div class="variable-pill">
            <span class="variable-symbol" data-variable-index="${index}"></span>
            <span>${variable.detail}</span>
        </div>
    `,
    )
    .join("");

  activeVariables.forEach((variable, index) => {
    renderMath(
      variables.querySelector(`[data-variable-index="${index}"]`),
      variable.latex,
    );
  });

  resetPractice();
  generateExample();
}

function resetPractice() {
  state.currentExample = null;
  state.practiceProblem = null;

  const solution = document.getElementById("formula-solution");
  const form = document.getElementById("practice-form");
  const feedback = document.getElementById("practice-feedback");
  const input = document.getElementById("student-answer");
  const status = document.getElementById("practice-status");

  solution?.classList.add("hidden");
  form?.classList.add("hidden");
  if (solution) solution.innerHTML = "";
  if (feedback) {
    feedback.textContent = "";
    feedback.className = "practice-feedback";
  }
  if (input) input.value = "";
  if (status) status.textContent = "Example ready";
}

function generateExample() {
  const formula = FORMULA_LIBRARY.find((item) => item.id === state.selectedId);
  const question = document.getElementById("practice-question");
  if (!formula || !question) return;

  const difficulty = state.difficulty;
  const examplePool = EXAMPLE_INDEXES_BY_DIFFICULTY[difficulty];
  const formulaIndexes = state.exampleIndexes[formula.id] || (state.exampleIndexes[formula.id] = {});
  const poolPosition = formulaIndexes[difficulty] ?? 0;
  const exampleIndex = examplePool[poolPosition];
  state.currentExample = formula.generateExample(
    exampleIndex,
    state.piecewiseRuleCount,
    difficulty,
  );
  formulaIndexes[difficulty] = (poolPosition + 1) % examplePool.length;
  state.practiceProblem = null;
  question.textContent = state.currentExample.question;

  const solution = document.getElementById("formula-solution");
  const form = document.getElementById("practice-form");
  const feedback = document.getElementById("practice-feedback");
  const input = document.getElementById("student-answer");
  const status = document.getElementById("practice-status");

  solution?.classList.add("hidden");
  form?.classList.add("hidden");
  if (solution) solution.innerHTML = "";
  if (feedback) {
    feedback.textContent = "";
    feedback.className = "practice-feedback";
  }
  if (input) input.value = "";
  if (status) status.textContent = `${difficulty} · Example ${poolPosition + 1} of ${examplePool.length}`;
}

function renderSolution(example, heading = "Worked solution") {
  const solution = document.getElementById("formula-solution");
  if (!solution || !example) return;

  solution.innerHTML = `
        <p class="solution-heading">${heading}</p>
        <ol class="solution-steps">
            ${example.steps
              .map(
                (step, index) => `
                <li>
                    <span class="solution-step-number">${index + 1}</span>
                    <span>${step.label}<span class="solution-math" data-step-index="${index}"></span></span>
                </li>
            `,
              )
              .join("")}
        </ol>
    `;

  example.steps.forEach((step, index) => {
    renderMath(
      solution.querySelector(`[data-step-index="${index}"]`),
      step.math,
    );
  });
  solution.classList.remove("hidden");
}

function showSolution() {
  if (!state.currentExample) generateExample();
  renderSolution(state.currentExample);
  const status = document.getElementById("practice-status");
  if (status) status.textContent = "Solution open";
}

function startPracticeMode() {
  if (!state.currentExample) generateExample();
  state.practiceProblem = state.currentExample;

  const form = document.getElementById("practice-form");
  const solution = document.getElementById("formula-solution");
  const feedback = document.getElementById("practice-feedback");
  const input = document.getElementById("student-answer");
  const status = document.getElementById("practice-status");

  form?.classList.remove("hidden");
  solution?.classList.add("hidden");
  if (feedback) {
    feedback.textContent = "";
    feedback.className = "practice-feedback";
  }
  if (input) {
    input.value = "";
    input.focus();
  }
  if (status) status.textContent = "Your turn";
}

function checkPracticeAnswer() {
  const problem = state.practiceProblem || state.currentExample;
  const input = document.getElementById("student-answer");
  const feedback = document.getElementById("practice-feedback");
  const status = document.getElementById("practice-status");
  if (!problem || !input || !feedback) return;

  if (input.value.trim() === "") {
    feedback.textContent = "Enter a numerical answer before checking.";
    feedback.className = "practice-feedback error";
    return;
  }

  const answer = Number(input.value);
  if (!Number.isFinite(answer)) {
    feedback.textContent = "Enter a valid number before checking.";
    feedback.className = "practice-feedback error";
    return;
  }

  const correct = Math.abs(answer - problem.answer) <= problem.tolerance;
  if (correct) {
    feedback.textContent =
      "Correct. Generate a new example when you are ready.";
    feedback.className = "practice-feedback success";
    if (status) status.textContent = "Correct";
  } else {
    feedback.textContent = `Not quite. Review the steps, then try a new example. The answer is ${formatNumber(problem.answer)}.`;
    feedback.className = "practice-feedback error";
    if (status) status.textContent = "Review";
    renderSolution(problem, "Review the solution");
  }
}

function setActiveCategory(category) {
  state.activeCategory = category;
  state.searchTerm = "";

  const search = document.getElementById("formula-search");
  if (search) search.value = "";

  document.querySelectorAll(".formula-filter").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.category === category);
  });

  renderFormulaCards();
  if (getVisibleFormulas().length) renderActiveFormula();
}

function setupFormulaExplorer() {
  const search = document.getElementById("formula-search");
  const surprise = document.getElementById("surprise-formula-btn");
  const generate = document.getElementById("generate-example-btn");
  const solution = document.getElementById("show-solution-btn");
  const practice = document.getElementById("try-it-yourself-btn");
  const submit = document.getElementById("submit-answer-btn");
  const answer = document.getElementById("student-answer");
  const difficultyButtons = document.querySelectorAll(".difficulty-button");
  const piecewiseToggle = document.getElementById("piecewise-rules-toggle");
  const themeToggle = document.getElementById("explore-theme-toggle");
  if (!search) return;

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === "dark";
    document.body.dataset.theme = isDark ? "dark" : "light";
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
      themeToggle.querySelector(".theme-toggle-label").textContent = isDark ? "Light mode" : "Dark mode";
      themeToggle.querySelector("[aria-hidden='true']").textContent = isDark ? "☀" : "◐";
    }
    if (persist) {
      try {
        localStorage.setItem("explore-color-theme", isDark ? "dark" : "light");
      } catch {
        // The theme still applies for this visit if storage is unavailable.
      }
    }
  };

  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("explore-color-theme") || "light";
  } catch {
    // Use the light theme when browser storage is unavailable.
  }
  applyTheme(savedTheme);
  themeToggle?.addEventListener("click", () => {
    applyTheme(document.body.dataset.theme === "dark" ? "light" : "dark", true);
  });

  const formulaDisplay = document.querySelector(".formula-display");
  if (formulaDisplay && "ResizeObserver" in window) {
    new ResizeObserver(() =>
      requestAnimationFrame(fitFormulaExpression),
    ).observe(formulaDisplay);
  }
  document.fonts?.ready.then(() => requestAnimationFrame(fitFormulaExpression));

  search.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim();
    renderFormulaCards();
    if (getVisibleFormulas().length) renderActiveFormula();
  });

  document.querySelectorAll(".formula-filter").forEach((button) => {
    button.addEventListener("click", () =>
      setActiveCategory(button.dataset.category),
    );
  });

  surprise?.addEventListener("click", () => {
    const formulas = getVisibleFormulas();
    if (!formulas.length) return;
    const selected = formulas[Math.floor(Math.random() * formulas.length)];
    state.selectedId = selected.id;
    renderFormulaCards();
    renderActiveFormula();
  });

  generate?.addEventListener("click", generateExample);
  piecewiseToggle?.addEventListener("click", () => {
    state.piecewiseRuleCount = state.piecewiseRuleCount === 2 ? 3 : 2;
    renderActiveFormula();
  });
  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.difficulty = button.dataset.difficulty;
      difficultyButtons.forEach((option) => {
        option.setAttribute(
          "aria-pressed",
          String(option.dataset.difficulty === state.difficulty),
        );
      });
      if (state.selectedId === "piecewise-function") {
        renderActiveFormula();
      } else {
        generateExample();
      }
    });
  });
  solution?.addEventListener("click", showSolution);
  practice?.addEventListener("click", startPracticeMode);
  submit?.addEventListener("click", checkPracticeAnswer);
  answer?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkPracticeAnswer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      document.activeElement !== search &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      search.focus();
    }
  });

  document.querySelectorAll("[data-category-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveCategory(button.dataset.categoryFilter);
      document
        .getElementById("formula-lab")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const count = document.getElementById("formula-count");
  if (count) count.textContent = FORMULA_LIBRARY.length;

  renderFormulaCards();
  renderActiveFormula();
}

document.addEventListener("DOMContentLoaded", setupFormulaExplorer);
