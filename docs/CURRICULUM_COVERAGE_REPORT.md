# Interactive curriculum coverage

This report compares the interactive Visualize, Laboratory, and Challenges pages with the supplied three-term Grade 11 General Mathematics budget of work. A topic appearing in a selector or example bank does not mean every competency is taught or fully covered. Calculators support exploration; they do not replace instruction, interpretation, or locally supplied tax/financial assumptions.

## Coverage by curriculum cluster

| Term and curriculum cluster | Current interactive support | Coverage |
|---|---|---|
| Term 1 · Earnings and payroll | Wages, overtime, allowance, commission and piecework helper; editable gross pay model | Partial: annual-to-weekly/monthly salary, deductions, benefits, tax/net pay, and region-specific payroll rules are not modeled. |
| Term 1 · Percentages and buying/selling | Sequential markup, discount and VAT; profit/loss amount and percentage; inflation/purchasing-power models | Partial: benefits, deductions, and alternative VAT interpretations need guided examples. |
| Term 1 · Patterns and sequences | Arithmetic, geometric and Fibonacci sequence terms, series tables, sigma expansion | Partial: visual pattern discovery, missing-term rule challenges, and periodic-payment activities need more explicit treatment. |
| Term 1 · Financial applications | Compound interest, ordinary annuity, level-payment loan helpers | Partial: simple interest, deferred/general annuities, cash-flow fair market value, nominal-rate conversions, and full amortization tables need lessons. |
| Term 1 · Measurement and conversion | Temperature, linear scale distance, rectangular prism, cylinder, sphere, cone, square pyramid and isosceles triangular prism area/volume; Heron triangle area | Partial: metric unit conversion, composite solids, currency, time, blueprints, and cost estimation need worked activities. |
| Term 1 · Functions and graphs | Interactive linear, quadratic, absolute-value, square-root, and cube-root rule graphs | Partial: complete domains/ranges, transformations, and graph-matching challenges need explicit guided studies. |
| Term 2 · Piecewise functions | Editable base-plus-distance fare model with live fare curve | Partial: multi-interval piecewise graphing, tax brackets, and rule-selection activities are not yet represented. |
| Term 2 · Data and probability | Data summaries, scatter correlation, regression line, discrete expected value/variance | Partial: data types and measurement levels, probability experiments, and contextual interpretation need activities. |
| Term 2 · Basic trigonometry | Right-triangle side calculator; Heron formula | Partial: bearings, elevation/depression, law of sines/cosines, and triangle area using included angle need guided practice. |
| Term 2 · Practical measurement | Shape measures, scale distance, temperature, wage/price contexts | Partial: composite objects, area/perimeter and capacity, material/labor cost, currency/time conversions need examples. |
| Term 2 · Random variables | Discrete distribution calculator validates total probability and computes expectation/variance/SD | Partial: distribution construction and contextual decisions need lessons; continuous random variables need a dedicated model. |
| Term 2 · Normal distribution | z-score, standard-normal cumulative approximation and density visualization | Partial: table use, interval probabilities, percentiles and inverse z lookup are not implemented. CDF is a numerical approximation. |
| Term 2 · Sampling | Seeded repeatable simulation of sample means for different sample sizes | Partial: sampling frames, random/non-random methods, parameter/statistic distinctions and sample-size planning need instruction. |
| Term 3 · Compound interest, annuities, loans | Compounding frequencies, ordinary annuity FV/PV, fixed-payment loan and balance chart | Partial: general/deferred annuity timelines, mortgages, variable-rate scenarios, and complete amortization schedule need work. |
| Term 3 · Hypothesis testing | Challenges draw on the supplied worked-example collection | Not implemented as an interactive calculator: null/alternative hypotheses, significance, Type I/II errors, z-tests, one-sample/paired/independent t-tests need a dedicated inferential-statistics study. |
| Term 3 · Correlation and regression | Editable paired observations, Pearson r and least-squares line | Partial: residuals, prediction limits, cautions about extrapolation, and interpretation in context need activities. |
| Term 3 · Logic, syllogisms and fallacies | Truth tables for conjunction, disjunction, conditional, biconditional, exclusive-or | Partial: propositions, negation, tautologies/contradictions, syllogisms, and fallacy recognition need dedicated material. |

## Challenge bank inventory

Challenges loads **215 existing curriculum examples**. The count is the number of entries in the repository’s topic example JSON files, not newly authored questions in this task.

| Topic bank | Questions |
|---|---:|
| Business mathematics | 54 |
| Functions | 30 |
| Logic and mathematical reasoning | 30 |
| Measurement and conversion | 6 |
| Sequences and series | 55 |
| Statistics | 34 |
| Trigonometry | 6 |
| **Total** | **215** |

The source bank supplies structured prompts, given information, method, formula, worked solution, answer, and common mistake. Its questions are mostly numerical calculation and short classification/concept checks. The page supports topic/search/difficulty filters, random selection, answer entry, answer feedback, solution reveal, retry, and next question. It does not yet provide a comprehensive newly authored multiple-choice bank, graph matching, or inferential-statistics challenge set. Difficulty labels present in source data are beginner 55, intermediate 59, application 45, advanced 37, challenge 18, and analysis 1.

## What the pages use

- **Visualize** offers 24 focused study modes with editable inputs, live calculations, and topic-appropriate plots or tables.
- **Laboratory** offers 14 guided investigations with resettable inputs, observations, and reflection prompts: compounding; simple versus compound interest; geometric sequences; Fibonacci; linear coefficients; outlier effect; correlation/regression; expected value; loan repayment; solid geometry; Heron area; temperature; markup/discount/VAT; and seeded sampling variation.
- **Challenges** loads the existing topic/example JSON at runtime and filters its supplied worked examples; it does not synthesize new questions or claim that the bank covers every competency.

## Known model limits

- The triangular-prism calculator assumes an isosceles cross-section described by its base and altitude. It is not a general three-side prism model.
- Wage overtime uses a default 1.5 multiplier. Tax, payroll deductions, statutory rates, and financial fees are intentionally not invented.
- Annuity tools currently use the ordinary-annuity end-of-period assumption.
- The normal CDF uses a standard numerical approximation; outputs should be treated as approximate.
- Interactive pages are local learning tools. Their examples and calculations are not a substitute for checking conventions and assumptions from a specific problem.
