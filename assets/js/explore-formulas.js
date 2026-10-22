(function () {
function makeFormula({
  id,
  name,
  category,
  latex,
  plain,
  search,
  purpose,
  variables,
  example,
  threeRuleLatex,
  threeRulePlain,
  piecewiseForms,
}) {
  return {
    id,
    name,
    category,
    latex,
    plain,
    search,
    purpose,
    variables: variables.map(([symbol, detail]) => ({ latex: symbol, detail })),
    threeRuleLatex,
    threeRulePlain,
    piecewiseForms,
    generateExample(exampleIndex = 0, piecewiseRuleCount = 2, difficulty = "easy") {
      const piecewiseForm = piecewiseForms?.[difficulty]?.[piecewiseRuleCount];
      const selectedExample = id === "piecewise-function" && piecewiseForm
        ? buildPiecewiseExample(piecewiseForm, exampleIndex)
        : exampleIndex === 0
          ? example
          : buildAdditionalExample(id, exampleIndex);
      const currentExample = selectedExample || example;
      return {
        question: currentExample.question,
        answer: currentExample.answer,
        tolerance: currentExample.tolerance ?? 0.03,
        steps: currentExample.steps.map(([label, math]) => ({ label, math })),
      };
    },
  };
}

const FORMULA_LIBRARY = [
  makeFormula({
    id: "gross-pay",
    name: "Gross Earnings",
    category: "Business Math",
    latex: "\\text{Gross Pay}=rh+o+a+c",
    plain: "Gross pay = regular wages + overtime pay + allowances + commission",
    search:
      "first term wages overtime allowances commissions payroll gross earnings",
    purpose:
      "Adds regular wages, overtime pay, allowances, and commissions before deductions.",
    variables: [
      ["r", "Hourly rate"],
      ["h", "Regular hours"],
      ["o", "Overtime pay"],
      ["a", "Allowances"],
      ["c", "Commissions"],
    ],
    example: {
      question:
        "A worker earns ₱180 per hour for 40 hours, ₱1,350 overtime pay, ₱500 allowances, and ₱800 commission. Find gross pay.",
      answer: 9850,
      steps: [
        ["Calculate regular wages.", "180\\times40=7200"],
        ["Add overtime, allowances, and commission.", "7200+1350+500+800"],
        ["Find gross pay.", "\\text{Gross Pay}=9850"],
      ],
    },
  }),
  makeFormula({
    id: "percentage-change",
    name: "Percentage Change",
    category: "Business Math",
    latex: "\\frac{\\text{New}-\\text{Old}}{\\text{Old}}\\times100\\%",
    plain: "(new value − old value) ÷ old value × 100%",
    search:
      "first term percentage increase decrease inflation markup discount profit",
    purpose:
      "Measures an increase or decrease relative to the original amount.",
    variables: [
      ["\\text{New}", "Value after the change"],
      ["\\text{Old}", "Starting value"],
    ],
    example: {
      question: "A price rises from ₱800 to ₱920. Find the percentage change.",
      answer: 15,
      steps: [
        ["Find the change.", "920-800=120"],
        ["Divide by the old value.", "\\frac{120}{800}=0.15"],
        ["Convert to percent.", "0.15\\times100\\%=15\\%"],
      ],
    },
  }),
  makeFormula({
    id: "markup-price",
    name: "Mark-up Price",
    category: "Business Math",
    latex: "\\text{Selling Price}=C(1+m)",
    plain: "Selling price = cost × (1 + mark-up rate)",
    search: "first term markup selling price cost mark-up rate business",
    purpose:
      "Adds a mark-up, calculated as a fraction of cost, to the original cost.",
    variables: [
      ["C", "Cost"],
      ["m", "Mark-up rate as a decimal"],
    ],
    example: {
      question:
        "Find the selling price for an item costing ₱1,200 with a 25% mark-up.",
      answer: 1500,
      steps: [
        ["Convert the mark-up to a decimal.", "m=25\\%=0.25"],
        ["Substitute the values.", "1200(1+0.25)"],
        ["Calculate the selling price.", "\\text{Selling Price}=1500"],
      ],
    },
  }),
  makeFormula({
    id: "discount-price",
    name: "Discounted Price",
    category: "Business Math",
    latex: "\\text{Sale Price}=P(1-d)",
    plain: "Sale price = original price × (1 − discount rate)",
    search: "first term discount sale price original price markdown",
    purpose:
      "Finds the amount paid after a discount is taken from the original price.",
    variables: [
      ["P", "Original price"],
      ["d", "Discount rate as a decimal"],
    ],
    example: {
      question: "Find the sale price of a ₱2,400 item discounted by 15%.",
      answer: 2040,
      steps: [
        ["Convert the discount to a decimal.", "d=15\\%=0.15"],
        ["Subtract the discount fraction from 1.", "1-0.15=0.85"],
        ["Multiply by the original price.", "2400(0.85)=2040"],
      ],
    },
  }),
  makeFormula({
    id: "vat-amount",
    name: "Value-Added Tax",
    category: "Business Math",
    latex: "\\text{VAT Amount}=N v",
    plain: "VAT amount = net price × VAT rate",
    search: "first term vat tax net price rate value-added tax",
    purpose: "Calculates the tax amount using the net price and VAT rate.",
    variables: [
      ["N", "Net price before VAT"],
      ["v", "VAT rate as a decimal"],
    ],
    example: {
      question: "Find the VAT on a net price of ₱1,500 at 12%.",
      answer: 180,
      steps: [
        ["Convert the rate to a decimal.", "12\\%=0.12"],
        ["Multiply the net price by the rate.", "1500(0.12)=180"],
        ["The VAT amount is ₱180.", "\\text{VAT}=180"],
      ],
    },
  }),
  makeFormula({
    id: "profit-loss",
    name: "Profit or Loss",
    category: "Business Math",
    latex: "\\text{Profit}=R-C",
    plain: "Profit = total revenue − total cost",
    search: "first term profit loss revenue cost business mathematics",
    purpose:
      "Compares total revenue with total cost. A positive result is profit; a negative result is loss.",
    variables: [
      ["R", "Total revenue"],
      ["C", "Total cost"],
    ],
    example: {
      question:
        "A business has ₱12,500 revenue and ₱9,800 total cost. Find its profit or loss.",
      answer: 2700,
      steps: [
        ["Subtract total cost from revenue.", "12500-9800"],
        ["Interpret the positive result.", "\\text{Profit}=2700"],
      ],
    },
  }),
  makeFormula({
    id: "arithmetic-term",
    name: "Arithmetic Sequence",
    category: "Sequences",
    latex: "a_n=a_1+(n-1)d",
    plain: "aₙ = a₁ + (n − 1)d",
    search: "first term arithmetic sequence nth term common difference",
    purpose:
      "Finds a term in a sequence with a constant difference between consecutive terms.",
    variables: [
      ["a_n", "The nth term"],
      ["a_1", "First term"],
      ["n", "Term position"],
      ["d", "Common difference"],
    ],
    example: {
      question:
        "An arithmetic sequence starts at 7 and has common difference 4. Find its 12th term.",
      answer: 51,
      steps: [
        ["Identify the values.", "a_1=7,\\quad d=4,\\quad n=12"],
        ["Substitute in the formula.", "a_{12}=7+(12-1)4"],
        ["Calculate.", "a_{12}=51"],
      ],
    },
  }),
  makeFormula({
    id: "arithmetic-series",
    name: "Arithmetic Series",
    category: "Sequences",
    latex: "S_n=\\frac{n}{2}(a_1+a_n)=\\frac{n}{2}[2a_1+(n-1)d]",
    plain: "Sₙ = n/2(a₁ + aₙ) = n/2[2a₁ + (n − 1)d]",
    search: "first term arithmetic series sum of n terms sigma notation",
    purpose:
      "Adds the first n terms of an arithmetic sequence without listing every term.",
    variables: [
      ["S_n", "Sum of the first n terms"],
      ["a_1", "First term"],
      ["a_n", "Last included term"],
      ["d", "Common difference"],
      ["n", "Number of terms"],
    ],
    example: {
      question: "Find the sum of the first 10 terms when a₁ = 3 and d = 2.",
      answer: 120,
      steps: [
        ["Find the 10th term.", "a_{10}=3+(10-1)2=21"],
        ["Use the arithmetic-series formula.", "S_{10}=\\frac{10}{2}(3+21)"],
        ["Calculate the sum.", "S_{10}=120"],
      ],
    },
  }),
  makeFormula({
    id: "geometric-term",
    name: "Geometric Sequence",
    category: "Sequences",
    latex: "a_n=a_1r^{n-1}",
    plain: "aₙ = a₁rⁿ⁻¹",
    search: "first term geometric sequence nth term common ratio",
    purpose:
      "Finds a term in a sequence where each term is multiplied by the same ratio.",
    variables: [
      ["a_n", "The nth term"],
      ["a_1", "First term"],
      ["r", "Common ratio"],
      ["n", "Term position"],
    ],
    example: {
      question:
        "A geometric sequence starts at 5 with common ratio 3. Find the 4th term.",
      answer: 135,
      steps: [
        ["Identify the values.", "a_1=5,\\quad r=3,\\quad n=4"],
        ["Substitute.", "a_4=5(3)^{4-1}"],
        ["Evaluate.", "a_4=135"],
      ],
    },
  }),
  makeFormula({
    id: "finite-geometric-series",
    name: "Finite Geometric Series",
    category: "Sequences",
    latex: "S_n=a_1\\frac{1-r^n}{1-r},\\quad r\\ne1",
    plain: "Sₙ = a₁(1 − rⁿ)/(1 − r), for r ≠ 1",
    search: "first term finite geometric series sum terms common ratio",
    purpose:
      "Finds the sum of a finite geometric sequence when the common ratio is not 1.",
    variables: [
      ["S_n", "Sum of the first n terms"],
      ["a_1", "First term"],
      ["r", "Common ratio"],
      ["n", "Number of terms"],
    ],
    example: {
      question:
        "Find the sum of the first 5 terms of a geometric sequence with a₁ = 2 and r = 3.",
      answer: 242,
      steps: [
        ["Substitute the values.", "S_5=2\\frac{1-3^5}{1-3}"],
        ["Evaluate the powers.", "S_5=2\\frac{-242}{-2}"],
        ["Calculate the sum.", "S_5=242"],
      ],
    },
  }),
  makeFormula({
    id: "infinite-geometric-series",
    name: "Infinite Geometric Series",
    category: "Sequences",
    latex: "S_\\infty=\\frac{a_1}{1-r},\\quad |r|<1",
    plain: "S∞ = a₁/(1 − r), when |r| < 1",
    search: "first term infinite geometric series convergent common ratio",
    purpose:
      "Finds the sum of an infinite geometric series when the common ratio has absolute value less than 1.",
    variables: [
      ["S_\\infty", "Infinite sum"],
      ["a_1", "First term"],
      ["r", "Common ratio; |r| < 1"],
    ],
    example: {
      question:
        "Find the sum of an infinite geometric series with a₁ = 12 and r = 1/3.",
      answer: 18,
      steps: [
        ["Check convergence.", "|1/3|<1"],
        ["Substitute the values.", "S_\\infty=\\frac{12}{1-1/3}"],
        ["Calculate.", "S_\\infty=18"],
      ],
    },
  }),
  makeFormula({
    id: "temperature-conversions",
    name: "Temperature Conversions",
    category: "Measurement",
    latex:
      "\\begin{aligned}T_F&=\\frac95T_C+32\\\\T_C&=\\frac59(T_F-32)\\\\T_K&=T_C+273.15\\end{aligned}",
    plain: "°F = (9/5)°C + 32; °C = (5/9)(°F − 32); K = °C + 273.15",
    search:
      "first term measurement temperature celsius fahrenheit kelvin conversion",
    purpose: "Converts temperatures between Celsius, Fahrenheit, and Kelvin.",
    variables: [
      ["T_C", "Temperature in Celsius"],
      ["T_F", "Temperature in Fahrenheit"],
      ["T_K", "Temperature in Kelvin"],
    ],
    example: {
      question: "Convert 25°C to Fahrenheit.",
      answer: 77,
      steps: [
        ["Use the Celsius-to-Fahrenheit rule.", "T_F=\\frac95(25)+32"],
        ["Multiply and add.", "T_F=45+32=77"],
        ["State the converted temperature.", "25^\\circ C=77^\\circ F"],
      ],
    },
  }),
  makeFormula({
    id: "rectangular-prism",
    name: "Rectangular Prism",
    category: "Geometry",
    latex: "V=lwh,\\quad SA=2(lw+lh+wh)",
    plain: "Volume = lwh; surface area = 2(lw + lh + wh)",
    search:
      "first term measurement geometry rectangular prism surface area volume",
    purpose:
      "Calculates the volume and total surface area of a rectangular prism.",
    variables: [
      ["l", "Length"],
      ["w", "Width"],
      ["h", "Height"],
      ["V", "Volume"],
      ["SA", "Surface area"],
    ],
    example: {
      question:
        "Find the volume of a rectangular prism with length 4, width 3, and height 2 units.",
      answer: 24,
      steps: [
        ["Use the volume formula.", "V=lwh"],
        ["Substitute the dimensions.", "V=4(3)(2)"],
        ["Calculate.", "V=24\\text{ units}^3"],
      ],
    },
  }),
  makeFormula({
    id: "cylinder",
    name: "Cylinder",
    category: "Geometry",
    latex: "V=\\pi r^2h,\\quad SA=2\\pi rh+2\\pi r^2",
    plain: "V = πr²h; SA = 2πrh + 2πr²",
    search: "first term measurement geometry cylinder area volume",
    purpose:
      "Calculates the volume and total surface area of a right circular cylinder.",
    variables: [
      ["r", "Radius of the circular base"],
      ["h", "Height"],
      ["V", "Volume"],
      ["SA", "Total surface area"],
    ],
    example: {
      question:
        "Find the volume of a cylinder with radius 3 and height 4 units. Give the answer to two decimals.",
      answer: 113.1,
      tolerance: 0.05,
      steps: [
        ["Use the volume formula.", "V=\\pi r^2h"],
        ["Substitute the values.", "V=\\pi(3)^2(4)=36\\pi"],
        ["Approximate.", "V\\approx113.10\\text{ units}^3"],
      ],
    },
  }),
  makeFormula({
    id: "sphere",
    name: "Sphere",
    category: "Geometry",
    latex: "V=\\frac43\\pi r^3,\\quad SA=4\\pi r^2",
    plain: "V = 4πr³/3; SA = 4πr²",
    search: "first term measurement geometry sphere surface area volume",
    purpose: "Calculates the volume and surface area of a sphere.",
    variables: [
      ["r", "Radius"],
      ["V", "Volume"],
      ["SA", "Surface area"],
    ],
    example: {
      question:
        "Find the volume of a sphere with radius 2 units. Give the answer to two decimals.",
      answer: 33.51,
      tolerance: 0.05,
      steps: [
        ["Use the volume formula.", "V=\\frac43\\pi r^3"],
        ["Substitute the radius.", "V=\\frac43\\pi(2)^3=\\frac{32\\pi}{3}"],
        ["Approximate.", "V\\approx33.51\\text{ units}^3"],
      ],
    },
  }),
  makeFormula({
    id: "cone",
    name: "Right Circular Cone",
    category: "Geometry",
    latex:
      "V=\\frac13\\pi r^2h,\\quad SA=\\pi rL+\\pi r^2,\\quad L=\\sqrt{r^2+h^2}",
    plain: "V = πr²h/3; SA = πrL + πr²; L = √(r² + h²)",
    search:
      "first term measurement geometry cone slant height surface area volume",
    purpose:
      "Calculates cone volume and total surface area; the slant height L follows from the radius and height.",
    variables: [
      ["r", "Base radius"],
      ["h", "Vertical height"],
      ["L", "Slant height"],
      ["V", "Volume"],
      ["SA", "Total surface area"],
    ],
    example: {
      question:
        "Find the volume of a cone with radius 3 and height 4 units. Give the answer to two decimals.",
      answer: 37.7,
      tolerance: 0.05,
      steps: [
        ["Use the volume formula.", "V=\\frac13\\pi r^2h"],
        ["Substitute the values.", "V=\\frac13\\pi(3)^2(4)=12\\pi"],
        ["Approximate.", "V\\approx37.70\\text{ units}^3"],
      ],
    },
  }),
  makeFormula({
    id: "pyramid-volume",
    name: "Pyramid Volume",
    category: "Geometry",
    latex: "V=\\frac13A_{\\text{base}}h",
    plain: "V = (base area × height)/3",
    search: "first term measurement geometry pyramid volume base area",
    purpose:
      "Finds the volume of a pyramid from its base area and perpendicular height.",
    variables: [
      ["A_{\\text{base}}", "Area of the base"],
      ["h", "Perpendicular height"],
      ["V", "Volume"],
    ],
    example: {
      question:
        "Find the volume of a pyramid with base area 24 square units and height 9 units.",
      answer: 72,
      steps: [
        ["Use the volume formula.", "V=\\frac13A_{\\text{base}}h"],
        ["Substitute the values.", "V=\\frac13(24)(9)"],
        ["Calculate.", "V=72\\text{ units}^3"],
      ],
    },
  }),
  makeFormula({
    id: "rectangle-measurement",
    name: "Rectangle Area & Perimeter",
    category: "Measurement",
    latex: "P=2(l+w),\\quad A=lw",
    plain: "P = 2(l + w); A = lw",
    search:
      "second term measurement residential spaces rectangle perimeter area",
    purpose:
      "Finds the boundary length and surface area of a rectangular room or space.",
    variables: [
      ["l", "Length"],
      ["w", "Width"],
      ["P", "Perimeter"],
      ["A", "Area"],
    ],
    example: {
      question: "Find the area of a rectangular room 8 m long and 5 m wide.",
      answer: 40,
      steps: [
        ["Use the area formula.", "A=lw"],
        ["Substitute the dimensions.", "A=8(5)"],
        ["Calculate.", "A=40\\text{ m}^2"],
      ],
    },
  }),
  makeFormula({
    id: "triangle-measurement",
    name: "Triangle Area & Perimeter",
    category: "Measurement",
    latex: "P=a+b+c,\\quad A=\\frac12bh",
    plain: "P = a + b + c; A = bh/2",
    search: "second term measurement triangle residential space perimeter area",
    purpose:
      "Finds a triangle's perimeter from its side lengths and area from its base and perpendicular height.",
    variables: [
      ["a,b,c", "Side lengths"],
      ["b", "Base"],
      ["h", "Perpendicular height"],
      ["P", "Perimeter"],
      ["A", "Area"],
    ],
    example: {
      question: "Find the area of a triangle with base 4 m and height 3 m.",
      answer: 6,
      steps: [
        ["Use the triangle-area formula.", "A=\\frac12bh"],
        ["Substitute the measurements.", "A=\\frac12(4)(3)"],
        ["Calculate.", "A=6\\text{ m}^2"],
      ],
    },
  }),
  makeFormula({
    id: "piecewise-function",
    name: "Piecewise Function",
    category: "Functions",
    latex: "f(x)=\\begin{cases}x+1,&x\\leq0\\\\2x,&x>0\\end{cases}",
    plain: "Use x + 1 when x ≤ 0 and 2x when x > 0",
    piecewiseForms: {
      easy: {
        2: {
          latex: "f(x)=\\begin{cases}x+1,&x\\leq0\\\\2x,&x>0\\end{cases}",
          plain: "Use x + 1 when x ≤ 0 and 2x when x > 0",
          branches: [
            { formulaLatex: "x+1", conditionLatex: "x\\leq0", conditionText: "x ≤ 0", sampleInputs: [-2, -1, 0], evaluate: (x) => x + 1, substitute: (x) => `(${x})+1` },
            { formulaLatex: "2x", conditionLatex: "x>0", conditionText: "x > 0", sampleInputs: [1, 2, 3], evaluate: (x) => 2 * x, substitute: (x) => `2(${x})` },
          ],
        },
        3: {
          latex: "f(x)=\\begin{cases}x+1,&x\\leq0\\\\-2x,&0<x\\leq2\\\\x^2-1,&x>2\\end{cases}",
          plain: "Use x + 1 when x ≤ 0, −2x when 0 < x ≤ 2, and x² − 1 when x > 2",
          branches: [
            { formulaLatex: "x+1", conditionLatex: "x\\leq0", conditionText: "x ≤ 0", sampleInputs: [-2, -1, 0], evaluate: (x) => x + 1, substitute: (x) => `(${x})+1` },
            { formulaLatex: "-2x", conditionLatex: "0<x\\leq2", conditionText: "0 < x ≤ 2", sampleInputs: [1, 2], evaluate: (x) => -2 * x, substitute: (x) => `-2(${x})` },
            { formulaLatex: "x^2-1", conditionLatex: "x>2", conditionText: "x > 2", sampleInputs: [3, 4, 5], evaluate: (x) => x ** 2 - 1, substitute: (x) => `(${x})^2-1` },
          ],
        },
      },
      medium: {
        2: {
          latex: "f(x)=\\begin{cases}x^2+1,&x<2\\\\3x-2,&x\\geq2\\end{cases}",
          plain: "Use x² + 1 when x < 2 and 3x − 2 when x ≥ 2",
          branches: [
            { formulaLatex: "x^2+1", conditionLatex: "x<2", conditionText: "x < 2", sampleInputs: [-1, 0, 1], evaluate: (x) => x ** 2 + 1, substitute: (x) => `(${x})^2+1` },
            { formulaLatex: "3x-2", conditionLatex: "x\\geq2", conditionText: "x ≥ 2", sampleInputs: [2, 3, 4], evaluate: (x) => 3 * x - 2, substitute: (x) => `3(${x})-2` },
          ],
        },
        3: {
          latex: "f(x)=\\begin{cases}x^2,&x<0\\\\2x+1,&0\\leq x<3\\\\3x-4,&x\\geq3\\end{cases}",
          plain: "Use x² when x < 0, 2x + 1 when 0 ≤ x < 3, and 3x − 4 when x ≥ 3",
          branches: [
            { formulaLatex: "x^2", conditionLatex: "x<0", conditionText: "x < 0", sampleInputs: [-3, -2, -1], evaluate: (x) => x ** 2, substitute: (x) => `(${x})^2` },
            { formulaLatex: "2x+1", conditionLatex: "0\\leq x<3", conditionText: "0 ≤ x < 3", sampleInputs: [0, 1, 2], evaluate: (x) => 2 * x + 1, substitute: (x) => `2(${x})+1` },
            { formulaLatex: "3x-4", conditionLatex: "x\\geq3", conditionText: "x ≥ 3", sampleInputs: [3, 4, 5], evaluate: (x) => 3 * x - 4, substitute: (x) => `3(${x})-4` },
          ],
        },
      },
      hard: {
        2: {
          latex: "f(x)=\\begin{cases}\\frac{x^2-1}{2},&x\\leq-1\\\\2x^2+3,&x>-1\\end{cases}",
          plain: "Use (x² − 1) ÷ 2 when x ≤ −1 and 2x² + 3 when x > −1",
          branches: [
            { formulaLatex: "\\frac{x^2-1}{2}", conditionLatex: "x\\leq-1", conditionText: "x ≤ −1", sampleInputs: [-3, -2, -1], evaluate: (x) => (x ** 2 - 1) / 2, substitute: (x) => `\\frac{(${x})^2-1}{2}` },
            { formulaLatex: "2x^2+3", conditionLatex: "x>-1", conditionText: "x > −1", sampleInputs: [0, 1, 2], evaluate: (x) => 2 * x ** 2 + 3, substitute: (x) => `2(${x})^2+3` },
          ],
        },
        3: {
          latex: "f(x)=\\begin{cases}\\frac{x^2+1}{2},&x<-1\\\\2x-3,&-1\\leq x<2\\\\x^2-4,&x\\geq2\\end{cases}",
          plain: "Use (x² + 1) ÷ 2 when x < −1, 2x − 3 when −1 ≤ x < 2, and x² − 4 when x ≥ 2",
          branches: [
            { formulaLatex: "\\frac{x^2+1}{2}", conditionLatex: "x<-1", conditionText: "x < −1", sampleInputs: [-3, -2], evaluate: (x) => (x ** 2 + 1) / 2, substitute: (x) => `\\frac{(${x})^2+1}{2}` },
            { formulaLatex: "2x-3", conditionLatex: "-1\\leq x<2", conditionText: "−1 ≤ x < 2", sampleInputs: [-1, 0, 1], evaluate: (x) => 2 * x - 3, substitute: (x) => `2(${x})-3` },
            { formulaLatex: "x^2-4", conditionLatex: "x\\geq2", conditionText: "x ≥ 2", sampleInputs: [2, 3, 4], evaluate: (x) => x ** 2 - 4, substitute: (x) => `(${x})^2-4` },
          ],
        },
      },
    },
    search: "second term piecewise function domain fare rates tax income model",
    purpose:
      "Models situations that use different rules over different intervals or conditions.",
    variables: [
      ["f(x)", "Output selected by the input"],
      ["g(x),h(x)", "Rules for the separate intervals"],
      ["D_1,D_2", "Domains where each rule applies"],
    ],
    example: {
      question: "For f(x)=x+2 when x<0 and f(x)=2x−1 when x≥0, find f(3).",
      answer: 5,
      steps: [
        ["Choose the rule for x = 3.", "3\\geq0"],
        ["Substitute in the second rule.", "f(3)=2(3)-1"],
        ["Simplify.", "f(3)=5"],
      ],
    },
  }),
  makeFormula({
    id: "right-triangle-ratios",
    name: "Right Triangle Ratios",
    category: "Trigonometry",
    latex:
      "\\sin\\theta=\\frac{O}{H},\\quad\\cos\\theta=\\frac{A}{H},\\quad\\tan\\theta=\\frac{O}{A}",
    plain:
      "sin θ = opposite/hypotenuse; cos θ = adjacent/hypotenuse; tan θ = opposite/adjacent",
    search:
      "second term trigonometry right triangle soh cah toa sine cosine tangent",
    purpose:
      "Relates an acute angle in a right triangle to the ratios of its side lengths.",
    variables: [
      ["O", "Side opposite θ"],
      ["A", "Side adjacent to θ"],
      ["H", "Hypotenuse"],
      ["\\theta", "Angle being considered"],
    ],
    example: {
      question:
        "A right triangle has opposite side 3 and hypotenuse 5 for angle θ. Find sin θ.",
      answer: 0.6,
      steps: [
        ["Use the sine ratio.", "\\sin\\theta=\\frac{O}{H}"],
        ["Substitute the side lengths.", "\\sin\\theta=\\frac35"],
        ["Calculate.", "\\sin\\theta=0.6"],
      ],
    },
  }),
  makeFormula({
    id: "oblique-triangle-area",
    name: "Oblique Triangle Area",
    category: "Trigonometry",
    latex: "K=\\frac12ab\\sin C=\\frac12bc\\sin A=\\frac12ac\\sin B",
    plain: "Area = ½ab sin C = ½bc sin A = ½ac sin B",
    search: "second term oblique triangle area sine formula",
    purpose:
      "Finds the area of a triangle when two sides and their included angle are known.",
    variables: [
      ["K", "Triangle area"],
      ["a,b,c", "Side lengths opposite A, B, C"],
      ["A,B,C", "Triangle angles"],
    ],
    example: {
      question:
        "Find the area when two sides are 8 and 10 units and their included angle is 30°.",
      answer: 20,
      steps: [
        ["Use the included-angle area formula.", "K=\\frac12ab\\sin C"],
        ["Substitute the values.", "K=\\frac12(8)(10)\\sin30^\\circ"],
        ["Calculate.", "K=20\\text{ units}^2"],
      ],
    },
  }),
  makeFormula({
    id: "herons-formula",
    name: "Heron's Formula",
    category: "Trigonometry",
    latex: "K=\\sqrt{s(s-a)(s-b)(s-c)},\\quad s=\\frac{a+b+c}{2}",
    plain: "Area = √[s(s − a)(s − b)(s − c)], where s = (a + b + c)/2",
    search: "second term heron formula oblique triangle semiperimeter area",
    purpose: "Finds a triangle's area from its three side lengths.",
    variables: [
      ["K", "Triangle area"],
      ["a,b,c", "Side lengths"],
      ["s", "Semiperimeter"],
    ],
    example: {
      question: "Find the area of a triangle with side lengths 13, 14, and 15.",
      answer: 84,
      steps: [
        ["Find the semiperimeter.", "s=\\frac{13+14+15}{2}=21"],
        ["Substitute in Heron's formula.", "K=\\sqrt{21(8)(7)(6)}"],
        ["Calculate.", "K=84\\text{ units}^2"],
      ],
    },
  }),
  makeFormula({
    id: "law-of-sines",
    name: "Law of Sines",
    category: "Trigonometry",
    latex: "\\frac{a}{\\sin A}=\\frac{b}{\\sin B}=\\frac{c}{\\sin C}",
    plain: "a/sin A = b/sin B = c/sin C",
    search: "second term law of sines oblique triangle missing side angle",
    purpose:
      "Relates each side of a triangle to the sine of its opposite angle.",
    variables: [
      ["a,b,c", "Side lengths"],
      ["A,B,C", "Opposite angles"],
    ],
    example: {
      question: "If a = 10, A = 30°, and B = 45°, find side b to two decimals.",
      answer: 14.14,
      tolerance: 0.03,
      steps: [
        ["Use the law of sines.", "\\frac{a}{\\sin A}=\\frac{b}{\\sin B}"],
        ["Solve for b.", "b=\\frac{10\\sin45^\\circ}{\\sin30^\\circ}"],
        ["Approximate.", "b\\approx14.14"],
      ],
    },
  }),
  makeFormula({
    id: "law-of-cosines",
    name: "Law of Cosines",
    category: "Trigonometry",
    latex: "c^2=a^2+b^2-2ab\\cos C",
    plain: "c² = a² + b² − 2ab cos C",
    search: "second term law of cosines oblique triangle side angle",
    purpose:
      "Finds a side from two other sides and their included angle; it also generalizes the Pythagorean theorem.",
    variables: [
      ["a,b,c", "Side lengths opposite A, B, C"],
      ["C", "Angle between sides a and b"],
    ],
    example: {
      question: "Find c² when a = 7, b = 9, and C = 60°.",
      answer: 67,
      steps: [
        ["Use the law of cosines.", "c^2=a^2+b^2-2ab\\cos C"],
        ["Substitute the values.", "c^2=7^2+9^2-2(7)(9)\\cos60^\\circ"],
        ["Simplify.", "c^2=49+81-63=67"],
      ],
    },
  }),
  makeFormula({
    id: "expected-value",
    name: "Expected Value",
    category: "Probability",
    latex: "E(X)=\\mu=\\sum_x xP(x)",
    plain: "E(X) = μ = ΣxP(x)",
    search:
      "second term discrete random variable expected value probability distribution mean",
    purpose:
      "Finds the long-run average value of a discrete random variable using its probabilities.",
    variables: [
      ["x", "Possible value"],
      ["P(x)", "Probability of that value"],
      ["\\mu", "Expected value"],
    ],
    example: {
      question:
        "X is 0, 1, or 2 with probabilities 0.2, 0.5, and 0.3. Find E(X).",
      answer: 1.1,
      steps: [
        ["Multiply each value by its probability.", "0(0.2)+1(0.5)+2(0.3)"],
        ["Add the products.", "0+0.5+0.6"],
        ["State the expected value.", "E(X)=1.1"],
      ],
    },
  }),
  makeFormula({
    id: "variance",
    name: "Variance of a Discrete Variable",
    category: "Probability",
    latex: "\\sigma^2=\\sum_x(x-\\mu)^2P(x)=\\sum_xx^2P(x)-\\mu^2",
    plain: "σ² = Σ(x − μ)²P(x) = Σx²P(x) − μ²",
    search:
      "second term discrete random variable variance probability distribution",
    purpose:
      "Measures the probability-weighted spread of values around the expected value.",
    variables: [
      ["\\sigma^2", "Variance"],
      ["x", "Possible value"],
      ["P(x)", "Probability of that value"],
      ["\\mu", "Expected value"],
    ],
    example: {
      question:
        "For values 0, 1, 2 with probabilities 0.2, 0.5, 0.3 and μ = 1.1, find the variance.",
      answer: 0.49,
      steps: [
        ["Use the shortcut formula.", "\\sigma^2=\\sum x^2P(x)-\\mu^2"],
        ["Calculate the weighted squares.", "0^2(0.2)+1^2(0.5)+2^2(0.3)=1.7"],
        ["Subtract the squared mean.", "\\sigma^2=1.7-1.1^2=0.49"],
      ],
    },
  }),
  makeFormula({
    id: "standard-deviation",
    name: "Standard Deviation",
    category: "Probability",
    latex: "\\sigma=\\sqrt{\\sigma^2}",
    plain: "σ = √(σ²)",
    search: "second term discrete random variable standard deviation spread",
    purpose:
      "Expresses the typical spread in the original units by taking the square root of the variance.",
    variables: [
      ["\\sigma", "Standard deviation"],
      ["\\sigma^2", "Variance"],
    ],
    example: {
      question: "Find the standard deviation when variance is 0.49.",
      answer: 0.7,
      steps: [
        ["Take the square root of the variance.", "\\sigma=\\sqrt{0.49}"],
        ["Evaluate.", "\\sigma=0.7"],
      ],
    },
  }),
  makeFormula({
    id: "z-score",
    name: "Standard Normal Z-Score",
    category: "Probability",
    latex: "Z=\\frac{X-\\mu}{\\sigma}",
    plain: "Z = (X − μ)/σ",
    search:
      "second term normal distribution standard normal z score percentiles probability",
    purpose:
      "Converts a value to the number of standard deviations it lies above or below the mean.",
    variables: [
      ["X", "Observed value"],
      ["\\mu", "Mean"],
      ["\\sigma", "Standard deviation"],
    ],
    example: {
      question: "Find the z-score for X = 85 when μ = 75 and σ = 5.",
      answer: 2,
      steps: [
        ["Use the z-score formula.", "Z=\\frac{X-\\mu}{\\sigma}"],
        ["Substitute the values.", "Z=\\frac{85-75}{5}"],
        ["Calculate.", "Z=2"],
      ],
    },
  }),
  makeFormula({
    id: "compound-interest",
    name: "Compound Amount",
    category: "Finance",
    latex: "A=P\\left(1+\\frac{r}{m}\\right)^{mt}",
    plain: "A = P(1 + r/m)ᵐᵗ",
    search: "third term compound interest maturity future value nominal rate",
    purpose:
      "Finds the accumulated amount when interest is compounded m times each year.",
    variables: [
      ["A", "Maturity or future value"],
      ["P", "Principal"],
      ["r", "Annual rate as a decimal"],
      ["m", "Compounding periods per year"],
      ["t", "Time in years"],
    ],
    example: {
      question:
        "Find the maturity value of ₱10,000 at 5% compounded annually for 2 years.",
      answer: 11025,
      steps: [
        ["Identify the values.", "P=10000,\\quad r=0.05,\\quad m=1,\\quad t=2"],
        ["Substitute.", "A=10000(1+0.05)^2"],
        ["Calculate.", "A=11025"],
      ],
    },
  }),
  makeFormula({
    id: "compound-interest-amount",
    name: "Compound Interest Earned",
    category: "Finance",
    latex: "I_c=A-P",
    plain: "Compound interest earned = maturity value − principal",
    search: "third term compound interest amount earned paid",
    purpose:
      "Finds the interest earned or paid by subtracting principal from the maturity value.",
    variables: [
      ["I_c", "Compound interest amount"],
      ["A", "Maturity value"],
      ["P", "Principal"],
    ],
    example: {
      question:
        "An investment grows from ₱10,000 to ₱11,025. Find the compound interest earned.",
      answer: 1025,
      steps: [
        ["Subtract the principal from the maturity value.", "I_c=11025-10000"],
        ["Calculate.", "I_c=1025"],
      ],
    },
  }),
  makeFormula({
    id: "ordinary-annuity-future-value",
    name: "Ordinary Annuity Future Value",
    category: "Finance",
    latex: "F=R\\left[\\frac{(1+i)^n-1}{i}\\right]",
    plain: "F = R[(1 + i)ⁿ − 1]/i",
    search: "third term ordinary annuity future value periodic payment savings",
    purpose:
      "Finds the accumulated value of equal payments made at the end of each period.",
    variables: [
      ["F", "Future value"],
      ["R", "Periodic payment"],
      ["i", "Interest rate per period"],
      ["n", "Number of payments"],
    ],
    example: {
      question:
        "Find the future value of three ₱1,000 end-of-year payments at 5% per year.",
      answer: 3152.5,
      tolerance: 0.05,
      steps: [
        ["Identify the values.", "R=1000,\\quad i=0.05,\\quad n=3"],
        ["Substitute.", "F=1000\\left[\\frac{(1.05)^3-1}{0.05}\\right]"],
        ["Calculate.", "F=3152.50"],
      ],
    },
  }),
  makeFormula({
    id: "ordinary-annuity-present-value",
    name: "Ordinary Annuity Present Value",
    category: "Finance",
    latex: "P=R\\left[\\frac{1-(1+i)^{-n}}{i}\\right]",
    plain: "P = R[1 − (1 + i)⁻ⁿ]/i",
    search: "third term ordinary annuity present value payments",
    purpose:
      "Finds the present value of equal payments made at the end of each period.",
    variables: [
      ["P", "Present value"],
      ["R", "Periodic payment"],
      ["i", "Interest rate per period"],
      ["n", "Number of payments"],
    ],
    example: {
      question:
        "Find the present value of three ₱1,000 end-of-year payments at 5% per year.",
      answer: 2723.25,
      tolerance: 0.05,
      steps: [
        ["Identify the values.", "R=1000,\\quad i=0.05,\\quad n=3"],
        ["Substitute.", "P=1000\\left[\\frac{1-(1.05)^{-3}}{0.05}\\right]"],
        ["Calculate.", "P\\approx2723.25"],
      ],
    },
  }),
  makeFormula({
    id: "deferred-annuity-present-value",
    name: "Deferred Annuity Present Value",
    category: "Finance",
    latex: "P_{def}=R\\left[\\frac{1-(1+i)^{-n}}{i}\\right](1+i)^{-k}",
    plain: "Pdef = ordinary-annuity present value × (1 + i)⁻ᵏ",
    search: "third term deferred annuity present value deferral periods",
    purpose:
      "Discounts an ordinary annuity's present value back across k deferred periods.",
    variables: [
      ["P_{def}", "Present value today"],
      ["R", "Periodic payment"],
      ["i", "Rate per period"],
      ["n", "Number of payments"],
      ["k", "Deferred periods"],
    ],
    example: {
      question:
        "Find the present value of three ₱1,000 payments at 5% per period, deferred for 2 periods.",
      answer: 2470.86,
      tolerance: 0.05,
      steps: [
        [
          "Find the annuity value at its start.",
          "1000\\left[\\frac{1-(1.05)^{-3}}{0.05}\\right]\\approx2723.25",
        ],
        ["Discount it for two periods.", "P_{def}=2723.25(1.05)^{-2}"],
        ["Calculate.", "P_{def}\\approx2470.86"],
      ],
    },
  }),
  makeFormula({
    id: "fair-market-value",
    name: "Fair Market Value",
    category: "Finance",
    latex: "\\text{FMV}=D+PV(\\text{cash flows})",
    plain: "FMV = down payment + present value of future cash flows",
    search: "third term fair market value cash flow down payment present value",
    purpose:
      "Combines a down payment with the present value of the remaining cash-flow stream.",
    variables: [
      ["D", "Down payment"],
      ["PV", "Present value of cash flows"],
    ],
    example: {
      question:
        "A property has a ₱100,000 down payment and cash flows with a present value of ₱150,000. Find its FMV.",
      answer: 250000,
      steps: [
        ["Use the fair-market-value relationship.", "\\text{FMV}=D+PV"],
        ["Substitute the values.", "\\text{FMV}=100000+150000"],
        ["Calculate.", "\\text{FMV}=250000"],
      ],
    },
  }),
  makeFormula({
    id: "loan-amortization",
    name: "Loan Amortization Payment",
    category: "Finance",
    latex: "R=\\frac{Pi}{1-(1+i)^{-n}}",
    plain: "R = Pi/[1 − (1 + i)⁻ⁿ]",
    search: "third term loan amortization payment loan periodic interest",
    purpose:
      "Calculates the equal periodic payment needed to repay a loan over n periods.",
    variables: [
      ["R", "Periodic payment"],
      ["P", "Loan principal"],
      ["i", "Interest rate per period"],
      ["n", "Number of payments"],
    ],
    example: {
      question:
        "Find the monthly payment on a ₱10,000 loan at 1% per month for 12 months.",
      answer: 888.49,
      tolerance: 0.05,
      steps: [
        ["Identify the values.", "P=10000,\\quad i=0.01,\\quad n=12"],
        ["Substitute.", "R=\\frac{10000(0.01)}{1-(1.01)^{-12}}"],
        ["Calculate.", "R\\approx888.49"],
      ],
    },
  }),
  makeFormula({
    id: "one-sample-z-test",
    name: "One-Sample Z-Test Statistic",
    category: "Statistics",
    latex: "Z=\\frac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt n}",
    plain: "Z = (x̄ − μ₀)/(σ/√n)",
    search:
      "third term hypothesis testing one sample z test known population standard deviation",
    purpose:
      "Standardizes a sample mean's difference from a hypothesized mean when population σ is known.",
    variables: [
      ["\\bar{x}", "Sample mean"],
      ["\\mu_0", "Hypothesized population mean"],
      ["\\sigma", "Known population standard deviation"],
      ["n", "Sample size"],
    ],
    example: {
      question: "Find Z when x̄ = 52, μ₀ = 50, σ = 8, and n = 16.",
      answer: 1,
      steps: [
        ["Find the standard error.", "\\frac{8}{\\sqrt{16}}=2"],
        ["Substitute in the z statistic.", "Z=\\frac{52-50}{2}"],
        ["Calculate.", "Z=1"],
      ],
    },
  }),
  makeFormula({
    id: "one-sample-t-test",
    name: "One-Sample t-Test Statistic",
    category: "Statistics",
    latex: "t=\\frac{\\bar{x}-\\mu_0}{s/\\sqrt n},\\quad df=n-1",
    plain: "t = (x̄ − μ₀)/(s/√n); df = n − 1",
    search:
      "third term hypothesis testing one sample t test unknown population standard deviation",
    purpose:
      "Standardizes a sample mean against a hypothesized mean when population σ is unknown.",
    variables: [
      ["\\bar{x}", "Sample mean"],
      ["\\mu_0", "Hypothesized mean"],
      ["s", "Sample standard deviation"],
      ["n", "Sample size"],
      ["df", "Degrees of freedom"],
    ],
    example: {
      question:
        "Find t and degrees of freedom when x̄ = 52, μ₀ = 50, s = 4, and n = 16.",
      answer: 2,
      steps: [
        ["Find the standard error.", "\\frac{4}{\\sqrt{16}}=1"],
        ["Calculate t.", "t=\\frac{52-50}{1}=2"],
        ["Find degrees of freedom.", "df=16-1=15"],
      ],
    },
  }),
  makeFormula({
    id: "independent-samples-t-test",
    name: "Independent-Samples t-Test",
    category: "Statistics",
    latex:
      "t=\\frac{\\bar{x}_1-\\bar{x}_2}{s_p\\sqrt{\\frac1{n_1}+\\frac1{n_2}}},\\quad s_p=\\sqrt{\\frac{(n_1-1)s_1^2+(n_2-1)s_2^2}{n_1+n_2-2}}",
    plain:
      "Pooled two-sample t statistic for independent samples with equal variances",
    search:
      "third term hypothesis testing independent samples equal variance pooled t test",
    purpose:
      "Compares two independent sample means under the equal-variance assumption.",
    variables: [
      ["\\bar{x}_1,\\bar{x}_2", "The two sample means"],
      ["s_1,s_2", "Sample standard deviations"],
      ["n_1,n_2", "Sample sizes"],
      ["s_p", "Pooled standard deviation"],
    ],
    example: {
      question:
        "Compute the pooled t statistic for x̄₁=80, x̄₂=74, s₁=6, s₂=5, n₁=10, and n₂=12.",
      answer: 2.56,
      tolerance: 0.04,
      steps: [
        [
          "Find the pooled standard deviation.",
          "s_p=\\sqrt{\\frac{9(36)+11(25)}{20}}\\approx5.47",
        ],
        [
          "Find the standard error.",
          "5.47\\sqrt{\\frac1{10}+\\frac1{12}}\\approx2.34",
        ],
        ["Calculate t.", "t=\\frac{80-74}{2.34}\\approx2.56"],
      ],
    },
  }),
  makeFormula({
    id: "pearson-correlation",
    name: "Pearson's r",
    category: "Statistics",
    latex:
      "r=\\frac{n\\sum xy-(\\sum x)(\\sum y)}{\\sqrt{[n\\sum x^2-(\\sum x)^2][n\\sum y^2-(\\sum y)^2]}}",
    plain: "Pearson correlation coefficient r",
    search:
      "third term regression pearson r correlation relationship variables",
    purpose:
      "Measures the direction and strength of a linear relationship between two variables.",
    variables: [
      ["n", "Number of paired observations"],
      ["x,y", "Paired data values"],
      ["r", "Correlation coefficient from −1 to 1"],
    ],
    example: {
      question: "For x = 1, 2, 3 and y = 2, 4, 6, find Pearson's r.",
      answer: 1,
      steps: [
        [
          "Find the needed sums.",
          "n=3,\\quad \\sum x=6,\\quad \\sum y=12,\\quad \\sum xy=28",
        ],
        [
          "Substitute in the formula.",
          "r=\\frac{3(28)-6(12)}{\\sqrt{[3(14)-36][3(56)-144]}}",
        ],
        ["Calculate.", "r=1"],
      ],
    },
  }),
  makeFormula({
    id: "linear-regression",
    name: "Simple Linear Regression",
    category: "Statistics",
    latex:
      "\\hat y=b_0+b_1x,\\quad b_1=\\frac{n\\sum xy-(\\sum x)(\\sum y)}{n\\sum x^2-(\\sum x)^2},\\quad b_0=\\bar y-b_1\\bar x",
    plain: "ŷ = b₀ + b₁x; b₁ is slope; b₀ is intercept",
    search: "third term regression best fit line slope intercept prediction",
    purpose:
      "Models a linear trend, using the slope and intercept estimated from paired data.",
    variables: [
      ["\\hat y", "Predicted response"],
      ["b_0", "Vertical intercept"],
      ["b_1", "Slope"],
      ["x", "Explanatory variable"],
    ],
    example: {
      question:
        "A regression model has slope b₁ = 2.5 and mean point (x̄, ȳ) = (4, 14). Find b₀ and predict ŷ when x = 5.",
      answer: 16.5,
      steps: [
        ["Find the intercept.", "b_0=14-2.5(4)=4"],
        ["Write the regression line.", "\\hat y=4+2.5x"],
        ["Predict for x = 5.", "\\hat y=4+2.5(5)=16.5"],
      ],
    },
  }),
  makeFormula({
    id: "logic-conditional-forms",
    name: "Conditional Statement Forms",
    category: "Logic",
    latex:
      "\\begin{aligned}\\text{Conditional: }&p\\to q\\\\\\text{Converse: }&q\\to p\\\\\\text{Inverse: }&\\neg p\\to\\neg q\\\\\\text{Contrapositive: }&\\neg q\\to\\neg p\\end{aligned}",
    plain:
      "Conditional p → q; converse q → p; inverse ¬p → ¬q; contrapositive ¬q → ¬p",
    search:
      "third term logic truth values proposition conditional converse inverse contrapositive",
    purpose:
      "Names the conditional and the related statements formed by reversing or negating its propositions.",
    variables: [
      ["p", "Antecedent proposition"],
      ["q", "Consequent proposition"],
      ["\\neg", "Logical negation"],
      ["\\to", "If-then implication"],
    ],
    example: {
      question:
        "For p = true and q = false, what is the truth value of the conditional p → q? Enter 1 for true or 0 for false.",
      answer: 0,
      steps: [
        [
          "A conditional is false only when its antecedent is true and its consequent is false.",
          "p=\\text{T},\\quad q=\\text{F}",
        ],
        ["This pair is the false case.", "p\\to q=\\text{F}"],
        ["Use 0 for false.", "0"],
      ],
    },
  }),
];

// Each formula keeps its original worked example, followed by nine distinct
// practice versions. The New example button cycles through this set of ten.
function buildAdditionalExample(id, index, ruleCount = 2) {
  const i = index;
  const make = (question, answer, steps, tolerance = 0.03) => ({
    question,
    answer,
    tolerance,
    steps,
  });
  const r2 = (value) => roundTo(value, 2);
  const r3 = (value) => roundTo(value, 3);

  switch (id) {
    case "gross-pay": {
      const rate = 100 + 20 * i;
      const hours = 24 + i;
      const overtime = 300 + 125 * i;
      const allowances = 200 + 50 * i;
      const commission = 100 + 40 * i;
      const regular = rate * hours;
      const answer = regular + overtime + allowances + commission;
      return make(
        `A worker earns ₱${rate} per hour for ${hours} hours, plus ₱${overtime} overtime pay, ₱${allowances} in allowances, and ₱${commission} commission. Find gross pay.`,
        answer,
        [
          ["Calculate regular wages.", `${rate}\\times${hours}=${regular}`],
          ["Add all earnings.", `${regular}+${overtime}+${allowances}+${commission}`],
          ["Find gross pay.", `\\text{Gross Pay}=${answer}`],
        ],
      );
    }
    case "percentage-change": {
      const oldValue = 500 + 150 * i;
      const percent = 5 + i;
      const newValue = r2(oldValue * (1 + percent / 100));
      const change = r2(newValue - oldValue);
      return make(
        `A price increases from ₱${oldValue} to ₱${newValue}. Find the percentage change.`,
        percent,
        [
          ["Find the change.", `${newValue}-${oldValue}=${change}`],
          ["Divide by the original value.", `\\frac{${change}}{${oldValue}}=${percent / 100}`],
          ["Convert to a percent.", `${percent / 100}\\times100\\%=${percent}\\%`],
        ],
      );
    }
    case "markup-price": {
      const cost = 500 + 100 * i;
      const percent = 10 + 5 * i;
      const rate = percent / 100;
      const answer = r2(cost * (1 + rate));
      return make(
        `Find the selling price of an item costing ₱${cost} with a ${percent}% mark-up.`,
        answer,
        [
          ["Write the rate as a decimal.", `m=${percent}\\%= ${rate}`],
          ["Substitute in the formula.", `${cost}(1+${rate})`],
          ["Calculate the selling price.", `\\text{Selling Price}=${answer}`],
        ],
      );
    }
    case "discount-price": {
      const original = 1000 + 250 * i;
      const percent = 5 + 3 * i;
      const rate = percent / 100;
      const answer = r2(original * (1 - rate));
      return make(
        `Find the sale price of a ₱${original} item discounted by ${percent}%.`,
        answer,
        [
          ["Write the discount as a decimal.", `d=${percent}\\%=${rate}`],
          ["Find the fraction of the price paid.", `1-${rate}=${1 - rate}`],
          ["Multiply by the original price.", `${original}(${1 - rate})=${answer}`],
        ],
      );
    }
    case "vat-amount": {
      const net = 800 + 200 * i;
      const rate = 0.12;
      const answer = r2(net * rate);
      return make(
        `Find the 12% VAT on a net price of ₱${net}.`,
        answer,
        [
          ["Write the VAT rate as a decimal.", `12\\%=0.12`],
          ["Multiply the net price by the rate.", `${net}(0.12)=${answer}`],
          ["State the VAT amount.", `\\text{VAT}=${answer}`],
        ],
      );
    }
    case "profit-loss": {
      const revenue = 5000 + 800 * i;
      const cost = 3500 + 400 * i;
      const result = revenue - cost;
      return make(
        `A business has ₱${revenue} in revenue and ₱${cost} in costs. Find its profit or loss.`,
        Math.abs(result),
        [
          ["Subtract cost from revenue.", `${revenue}-${cost}=${result}`],
          ["Interpret the result.", result >= 0 ? `\\text{Profit}=${result}` : `\\text{Loss}=${Math.abs(result)}`],
        ],
      );
    }
    case "arithmetic-term": {
      const first = 2 + i;
      const difference = 2 + (i % 5);
      const position = 5 + i;
      const answer = first + (position - 1) * difference;
      return make(
        `An arithmetic sequence starts at ${first} and has common difference ${difference}. Find its ${position}th term.`,
        answer,
        [
          ["Identify the values.", `a_1=${first},\\quad d=${difference},\\quad n=${position}`],
          ["Substitute in the formula.", `a_{${position}}=${first}+(${position}-1)${difference}`],
          ["Calculate.", `a_{${position}}=${answer}`],
        ],
      );
    }
    case "arithmetic-series": {
      const first = 1 + (i % 7);
      const difference = 2 + (i % 4);
      const terms = 5 + i;
      const last = first + (terms - 1) * difference;
      const answer = (terms * (first + last)) / 2;
      return make(
        `Find the sum of the first ${terms} terms when a₁ = ${first} and d = ${difference}.`,
        answer,
        [
          ["Find the last term.", `a_{${terms}}=${first}+(${terms}-1)${difference}=${last}`],
          ["Use the arithmetic-series formula.", `S_{${terms}}=\\frac{${terms}}{2}(${first}+${last})`],
          ["Calculate the sum.", `S_{${terms}}=${answer}`],
        ],
      );
    }
    case "geometric-term": {
      const first = 2 + i;
      const ratio = 2 + (i % 2);
      const position = 3 + (i % 5);
      const answer = first * ratio ** (position - 1);
      return make(
        `A geometric sequence starts at ${first} with common ratio ${ratio}. Find its ${position}th term.`,
        answer,
        [
          ["Identify the values.", `a_1=${first},\\quad r=${ratio},\\quad n=${position}`],
          ["Substitute.", `a_{${position}}=${first}(${ratio})^{${position}-1}`],
          ["Evaluate.", `a_{${position}}=${answer}`],
        ],
      );
    }
    case "finite-geometric-series": {
      const first = 1 + (i % 6);
      const ratio = 2;
      const terms = 3 + (i % 5);
      const answer = first * (ratio ** terms - 1) / (ratio - 1);
      return make(
        `Find the sum of the first ${terms} terms of a geometric sequence with a₁ = ${first} and r = 2.`,
        answer,
        [
          ["Substitute in the finite-series formula.", `S_{${terms}}=${first}\\frac{1-2^{${terms}}}{1-2}`],
          ["Evaluate the power.", `S_{${terms}}=${first}\\frac{1-${ratio ** terms}}{-1}`],
          ["Calculate the sum.", `S_{${terms}}=${answer}`],
        ],
      );
    }
    case "infinite-geometric-series": {
      const first = 6 + 3 * i;
      const denominator = 2 + (i % 4);
      const ratio = 1 / denominator;
      const answer = r2(first / (1 - ratio));
      return make(
        `Find the sum of an infinite geometric series with a₁ = ${first} and r = 1/${denominator}.`,
        answer,
        [
          ["Check that the series converges.", `|1/${denominator}|<1`],
          ["Substitute in the infinite-series formula.", `S_\\infty=\\frac{${first}}{1-1/${denominator}}`],
          ["Calculate the sum.", `S_\\infty\\approx${answer}`],
        ],
        0.05,
      );
    }
    case "temperature-conversions": {
      const celsius = 5 + 6 * i;
      const fahrenheit = r2((9 / 5) * celsius + 32);
      return make(
        `Convert ${celsius}°C to Fahrenheit.`,
        fahrenheit,
        [
          ["Use the conversion rule.", `T_F=\\frac95(${celsius})+32`],
          ["Multiply and add.", `T_F=${r2((9 / 5) * celsius)}+32=${fahrenheit}`],
          ["State the converted temperature.", `${celsius}^\\circ C=${fahrenheit}^\\circ F`],
        ],
      );
    }
    case "rectangular-prism": {
      const l = 2 + (i % 6);
      const w = 3 + (i % 5);
      const h = 2 + (i % 4);
      const answer = l * w * h;
      return make(
        `Find the volume of a rectangular prism with length ${l}, width ${w}, and height ${h} units.`,
        answer,
        [
          ["Use the volume formula.", "V=lwh"],
          ["Substitute the dimensions.", `V=${l}(${w})(${h})`],
          ["Calculate.", `V=${answer}\\text{ units}^3`],
        ],
      );
    }
    case "cylinder": {
      const radius = 2 + (i % 6);
      const height = 3 + i;
      const answer = r2(Math.PI * radius ** 2 * height);
      return make(
        `Find the volume of a cylinder with radius ${radius} and height ${height} units. Round to two decimals.`,
        answer,
        [
          ["Use the volume formula.", "V=\\pi r^2h"],
          ["Substitute the values.", `V=\\pi(${radius})^2(${height})=${radius ** 2 * height}\\pi`],
          ["Approximate.", `V\\approx${answer}\\text{ units}^3`],
        ],
        0.05,
      );
    }
    case "sphere": {
      const radius = 1 + i;
      const answer = r2((4 / 3) * Math.PI * radius ** 3);
      return make(
        `Find the volume of a sphere with radius ${radius} units. Round to two decimals.`,
        answer,
        [
          ["Use the volume formula.", "V=\\frac43\\pi r^3"],
          ["Substitute the radius.", `V=\\frac43\\pi(${radius})^3`],
          ["Approximate.", `V\\approx${answer}\\text{ units}^3`],
        ],
        0.05,
      );
    }
    case "cone": {
      const radius = 2 + (i % 5);
      const height = 3 + (i % 6);
      const answer = r2((Math.PI * radius ** 2 * height) / 3);
      return make(
        `Find the volume of a cone with radius ${radius} and height ${height} units. Round to two decimals.`,
        answer,
        [
          ["Use the volume formula.", "V=\\frac13\\pi r^2h"],
          ["Substitute the values.", `V=\\frac13\\pi(${radius})^2(${height})`],
          ["Approximate.", `V\\approx${answer}\\text{ units}^3`],
        ],
        0.05,
      );
    }
    case "pyramid-volume": {
      const baseArea = 12 + 4 * i;
      const height = 3 + i;
      const answer = (baseArea * height) / 3;
      return make(
        `Find the volume of a pyramid with base area ${baseArea} square units and height ${height} units.`,
        answer,
        [
          ["Use the volume formula.", "V=\\frac13A_{\\text{base}}h"],
          ["Substitute the values.", `V=\\frac13(${baseArea})(${height})`],
          ["Calculate.", `V=${answer}\\text{ units}^3`],
        ],
      );
    }
    case "rectangle-measurement": {
      const length = 4 + i;
      const width = 3 + (i % 6);
      const area = length * width;
      return make(
        `A rectangular room is ${length} m long and ${width} m wide. Find its area.`,
        area,
        [
          ["Use the area formula.", "A=lw"],
          ["Substitute the dimensions.", `A=${length}(${width})`],
          ["Calculate.", `A=${area}\\text{ m}^2`],
        ],
      );
    }
    case "triangle-measurement": {
      const base = 4 + i;
      const height = 3 + (i % 6);
      const area = (base * height) / 2;
      return make(
        `Find the area of a triangle with base ${base} m and perpendicular height ${height} m.`,
        area,
        [
          ["Use the triangle-area formula.", "A=\\frac12bh"],
          ["Substitute the measurements.", `A=\\frac12(${base})(${height})`],
          ["Calculate.", `A=${area}\\text{ m}^2`],
        ],
      );
    }
    case "piecewise-function": {
      if (ruleCount === 3) {
        const branch = i % 3;
        const x = branch === 0 ? -(i % 5 + 1) : branch === 1 ? i % 2 + 1 : i % 5 + 3;
        const answer = branch === 0
          ? x + 1
          : branch === 1
            ? -2 * x
            : x ** 2 - 1;
        const rule = branch === 0
          ? `f(${x})=${x}+1`
          : branch === 1
            ? `f(${x})=-2(${x})`
            : `f(${x})=${x}^2-1`;
        const chosenDomain = branch === 0 ? `${x}\\leq0` : branch === 1 ? `0<${x}\\leq2` : `${x}>2`;
        return make(
          `For f(x)=x+1 when x≤0, −2x when 0<x≤2, and x²−1 when x>2, find f(${x}).`,
          answer,
          [
            ["Choose the rule for the input.", chosenDomain],
            ["Substitute into that rule.", rule],
            ["Simplify.", `f(${x})=${answer}`],
          ],
        );
      }
      const x = i + 1;
      const multiplier = 2 + (i % 4);
      const constant = 1 + (i % 5);
      const answer = multiplier * x - constant;
      return make(
        `For f(x)=x+${constant} when x<0 and f(x)=${multiplier}x−${constant} when x≥0, find f(${x}).`,
        answer,
        [
          ["Choose the rule for the input.", `${x}\\geq0`],
          ["Substitute in the second rule.", `f(${x})=${multiplier}(${x})-${constant}`],
          ["Simplify.", `f(${x})=${answer}`],
        ],
      );
    }
    case "right-triangle-ratios": {
      const triples = [[5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [11, 60, 61], [28, 45, 53], [33, 56, 65]];
      const [opposite, adjacent, hypotenuse] = triples[(i - 1) % triples.length];
      const questionType = i % 3;
      const [ratioName, numerator, denominator, answer] = questionType === 0
        ? ["sin", opposite, hypotenuse, opposite / hypotenuse]
        : questionType === 1
          ? ["cos", adjacent, hypotenuse, adjacent / hypotenuse]
          : ["tan", opposite, adjacent, opposite / adjacent];
      const rounded = r3(answer);
      return make(
        `A right triangle has opposite side ${opposite}, adjacent side ${adjacent}, and hypotenuse ${hypotenuse} for angle θ. Find ${ratioName} θ to three decimals.`,
        rounded,
        [
          [`Use the ${ratioName} ratio.`, ratioName === "sin" ? "\\sin\\theta=\\frac{O}{H}" : ratioName === "cos" ? "\\cos\\theta=\\frac{A}{H}" : "\\tan\\theta=\\frac{O}{A}"],
          ["Substitute the side lengths.", `\\${ratioName}\\theta=\\frac{${numerator}}{${denominator}}`],
          ["Round to three decimals.", `\\${ratioName}\\theta\\approx${rounded}`],
        ],
        0.005,
      );
    }
    case "oblique-triangle-area": {
      const a = 5 + i;
      const b = 7 + i;
      const angle = [30, 45, 60][i % 3];
      const area = r2(0.5 * a * b * Math.sin((angle * Math.PI) / 180));
      return make(
        `Find the area of a triangle with sides ${a} and ${b} and included angle ${angle}°. Round to two decimals.`,
        area,
        [
          ["Use the included-angle formula.", "K=\\frac12ab\\sin C"],
          ["Substitute the values.", `K=\\frac12(${a})(${b})\\sin${angle}^\\circ`],
          ["Approximate.", `K\\approx${area}\\text{ units}^2`],
        ],
        0.05,
      );
    }
    case "herons-formula": {
      const triangles = [[3, 4, 5], [5, 5, 6], [5, 12, 13], [6, 8, 10], [7, 15, 20], [8, 15, 17], [9, 12, 15], [10, 24, 26], [7, 8, 9]];
      const [a, b, c] = triangles[(i - 1) % triangles.length];
      const s = (a + b + c) / 2;
      const area = r2(Math.sqrt(s * (s - a) * (s - b) * (s - c)));
      return make(
        `Find the area of a triangle with side lengths ${a}, ${b}, and ${c}.`,
        area,
        [
          ["Find the semiperimeter.", `s=\\frac{${a}+${b}+${c}}{2}=${s}`],
          ["Substitute in Heron's formula.", `K=\\sqrt{${s}(${s - a})(${s - b})(${s - c})}`],
          ["Calculate the area.", `K\\approx${area}\\text{ units}^2`],
        ],
        0.05,
      );
    }
    case "law-of-sines": {
      const a = 8 + i;
      const angleA = 30;
      const angleB = [30, 45, 60][i % 3];
      const sideB = r2((a * Math.sin((angleB * Math.PI) / 180)) / Math.sin((angleA * Math.PI) / 180));
      return make(
        `If a = ${a}, A = 30°, and B = ${angleB}°, find side b to two decimals.`,
        sideB,
        [
          ["Use the law of sines.", "\\frac{a}{\\sin A}=\\frac{b}{\\sin B}"],
          ["Solve for b.", `b=\\frac{${a}\\sin${angleB}^\\circ}{\\sin30^\\circ}`],
          ["Approximate.", `b\\approx${sideB}`],
        ],
        0.05,
      );
    }
    case "law-of-cosines": {
      const a = 5 + i;
      const b = 7 + i;
      const angle = [60, 90, 120][i % 3];
      const cSquared = r2(a ** 2 + b ** 2 - 2 * a * b * Math.cos((angle * Math.PI) / 180));
      return make(
        `Find c² when a = ${a}, b = ${b}, and C = ${angle}°.`,
        cSquared,
        [
          ["Use the law of cosines.", "c^2=a^2+b^2-2ab\\cos C"],
          ["Substitute the values.", `c^2=${a}^2+${b}^2-2(${a})(${b})\\cos${angle}^\\circ`],
          ["Calculate.", `c^2\\approx${cSquared}`],
        ],
        0.05,
      );
    }
    case "expected-value":
    case "variance": {
      const p0 = 0.1 + (i % 3) * 0.05;
      const p1 = 0.2 + ((i + 1) % 4) * 0.05;
      const p2 = r3(1 - p0 - p1);
      const mean = r3(p1 + 2 * p2);
      const variance = r3(p0 * mean ** 2 + p1 * (1 - mean) ** 2 + p2 * (2 - mean) ** 2);
      if (id === "expected-value") {
        return make(
          `X takes values 0, 1, and 2 with probabilities ${p0}, ${p1}, and ${p2}. Find E(X).`,
          mean,
          [
            ["Multiply each value by its probability.", `0(${p0})+1(${p1})+2(${p2})`],
            ["Add the products.", `${p1}+${2 * p2}=${mean}`],
            ["State the expected value.", `E(X)=${mean}`],
          ],
          0.005,
        );
      }
      return make(
        `For X = 0, 1, 2 with probabilities ${p0}, ${p1}, ${p2} and μ = ${mean}, find the variance.`,
        variance,
        [
          ["Use the weighted squared deviations.", `\\sigma^2=0^2(${p0})+1^2(${p1})+2^2(${p2})-${mean}^2`],
          ["Find the weighted second moment.", `0+${p1}+${4 * p2}=${r3(p1 + 4 * p2)}`],
          ["Subtract the squared mean.", `\\sigma^2\\approx${variance}`],
        ],
        0.005,
      );
    }
    case "standard-deviation": {
      const variance = r2(0.16 + 0.09 * i);
      const answer = r2(Math.sqrt(variance));
      return make(
        `Find the standard deviation when the variance is ${variance}.`,
        answer,
        [
          ["Take the square root of the variance.", `\\sigma=\\sqrt{${variance}}`],
          ["Evaluate.", `\\sigma\\approx${answer}`],
        ],
        0.02,
      );
    }
    case "z-score": {
      const mean = 60 + i;
      const observed = mean + 5 + i;
      const deviation = 5 + (i % 4);
      const answer = r2((observed - mean) / deviation);
      return make(
        `Find the z-score for X = ${observed} when μ = ${mean} and σ = ${deviation}.`,
        answer,
        [
          ["Use the z-score formula.", "Z=\\frac{X-\\mu}{\\sigma}"],
          ["Substitute the values.", `Z=\\frac{${observed}-${mean}}{${deviation}}`],
          ["Calculate.", `Z=${answer}`],
        ],
        0.02,
      );
    }
    case "compound-interest":
    case "compound-interest-amount": {
      const principal = 5000 + 1000 * i;
      const rate = 0.04 + (i % 5) * 0.01;
      const periods = [1, 2, 4, 12][i % 4];
      const years = 2 + (i % 3);
      const maturity = r2(principal * (1 + rate / periods) ** (periods * years));
      if (id === "compound-interest") {
        return make(
          `Find the maturity value of ₱${principal} at ${(rate * 100).toFixed(0)}% compounded ${periods} time(s) per year for ${years} years.`,
          maturity,
          [
            ["Identify the values.", `P=${principal},\\quad r=${rate},\\quad m=${periods},\\quad t=${years}`],
            ["Substitute.", `A=${principal}\\left(1+\\frac{${rate}}{${periods}}\\right)^{${periods * years}}`],
            ["Calculate.", `A\\approx${maturity}`],
          ],
          0.05,
        );
      }
      const earned = r2(maturity - principal);
      return make(
        `An investment of ₱${principal} grows to ₱${maturity}. Find the compound interest earned.`,
        earned,
        [
          ["Subtract the principal from the maturity value.", `I_c=${maturity}-${principal}`],
          ["Calculate.", `I_c\\approx${earned}`],
        ],
        0.05,
      );
    }
    case "ordinary-annuity-future-value":
    case "ordinary-annuity-present-value":
    case "deferred-annuity-present-value": {
      const payment = 500 + 100 * i;
      const rate = 0.03 + (i % 5) * 0.005;
      const periods = 3 + i;
      const defer = 1 + (i % 4);
      const ordinaryFuture = payment * (((1 + rate) ** periods - 1) / rate);
      const ordinaryPresent = payment * ((1 - (1 + rate) ** -periods) / rate);
      let answer;
      let question;
      let steps;
      if (id === "ordinary-annuity-future-value") {
        answer = r2(ordinaryFuture);
        question = `Find the future value of ${periods} end-of-period payments of ₱${payment} at ${Number((rate * 100).toFixed(2))}% per period.`;
        steps = [
          ["Identify the values.", `R=${payment},\\quad i=${rate},\\quad n=${periods}`],
          ["Substitute.", `F=${payment}\\left[\\frac{(1+${rate})^{${periods}}-1}{${rate}}\\right]`],
          ["Calculate.", `F\\approx${answer}`],
        ];
      } else if (id === "ordinary-annuity-present-value") {
        answer = r2(ordinaryPresent);
        question = `Find the present value of ${periods} end-of-period payments of ₱${payment} at ${Number((rate * 100).toFixed(2))}% per period.`;
        steps = [
          ["Identify the values.", `R=${payment},\\quad i=${rate},\\quad n=${periods}`],
          ["Substitute.", `P=${payment}\\left[\\frac{1-(1+${rate})^{-${periods}}}{${rate}}\\right]`],
          ["Calculate.", `P\\approx${answer}`],
        ];
      } else {
        answer = r2(ordinaryPresent / (1 + rate) ** defer);
        question = `Find the present value of ${periods} payments of ₱${payment} at ${Number((rate * 100).toFixed(2))}% per period, deferred for ${defer} periods.`;
        steps = [
          ["Find the annuity value at its start.", `${payment}\\left[\\frac{1-(1+${rate})^{-${periods}}}{${rate}}\\right]\\approx${r2(ordinaryPresent)}`],
          ["Discount it for the deferred periods.", `P_{def}=${r2(ordinaryPresent)}(1+${rate})^{-${defer}}`],
          ["Calculate.", `P_{def}\\approx${answer}`],
        ];
      }
      return make(question, answer, steps, 0.05);
    }
    case "fair-market-value": {
      const down = 50000 + 10000 * i;
      const presentValue = 100000 + 20000 * i;
      const answer = down + presentValue;
      return make(
        `A property has a ₱${down} down payment and future cash flows worth ₱${presentValue} today. Find its fair market value.`,
        answer,
        [
          ["Use the fair-market-value relationship.", "\\text{FMV}=D+PV"],
          ["Substitute the values.", `\\text{FMV}=${down}+${presentValue}`],
          ["Calculate.", `\\text{FMV}=${answer}`],
        ],
      );
    }
    case "loan-amortization": {
      const principal = 5000 + 1000 * i;
      const rate = 0.01 + (i % 4) * 0.002;
      const periods = 12 + 6 * i;
      const payment = r2((principal * rate) / (1 - (1 + rate) ** -periods));
      return make(
        `Find the periodic payment on a ₱${principal} loan at ${Number((rate * 100).toFixed(2))}% per period for ${periods} periods.`,
        payment,
        [
          ["Identify the values.", `P=${principal},\\quad i=${rate},\\quad n=${periods}`],
          ["Substitute.", `R=\\frac{${principal}(${rate})}{1-(1+${rate})^{-${periods}}}`],
          ["Calculate the payment.", `R\\approx${payment}`],
        ],
        0.05,
      );
    }
    case "one-sample-z-test":
    case "one-sample-t-test": {
      const hypothesized = 40 + i;
      const sampleMean = hypothesized + 2 + (i % 5);
      const deviation = 4 + (i % 4);
      const sampleSize = id === "one-sample-z-test" ? 16 : 9 + i;
      const standardError = deviation / Math.sqrt(sampleSize);
      const statistic = r2((sampleMean - hypothesized) / standardError);
      const isZ = id === "one-sample-z-test";
      const question = isZ
        ? `Find Z when x̄ = ${sampleMean}, μ₀ = ${hypothesized}, σ = ${deviation}, and n = ${sampleSize}.`
        : `Find t and degrees of freedom when x̄ = ${sampleMean}, μ₀ = ${hypothesized}, s = ${deviation}, and n = ${sampleSize}.`;
      const steps = [
        ["Find the standard error.", `\\frac{${deviation}}{\\sqrt{${sampleSize}}}\\approx${r2(standardError)}`],
        [isZ ? "Substitute in the z statistic." : "Calculate t.", `${isZ ? "Z" : "t"}=\\frac{${sampleMean}-${hypothesized}}{${r2(standardError)}}\\approx${statistic}`],
      ];
      if (!isZ) steps.push(["Find degrees of freedom.", `df=${sampleSize}-1=${sampleSize - 1}`]);
      return make(question, statistic, steps, 0.05);
    }
    case "independent-samples-t-test": {
      const n1 = 8 + (i % 5);
      const n2 = 10 + (i % 4);
      const s1 = 3 + (i % 4);
      const s2 = 4 + (i % 3);
      const mean1 = 65 + 2 * i;
      const mean2 = 60 + i;
      const pooled = Math.sqrt((((n1 - 1) * s1 ** 2) + ((n2 - 1) * s2 ** 2)) / (n1 + n2 - 2));
      const standardError = pooled * Math.sqrt(1 / n1 + 1 / n2);
      const statistic = r2((mean1 - mean2) / standardError);
      return make(
        `Compute the pooled t statistic for x̄₁=${mean1}, x̄₂=${mean2}, s₁=${s1}, s₂=${s2}, n₁=${n1}, and n₂=${n2}.`,
        statistic,
        [
          ["Find the pooled standard deviation.", `s_p=\\sqrt{\\frac{${n1 - 1}(${s1}^2)+${n2 - 1}(${s2}^2)}{${n1 + n2 - 2}}}\\approx${r2(pooled)}`],
          ["Find the standard error.", `${r2(pooled)}\\sqrt{\\frac1{${n1}}+\\frac1{${n2}}}\\approx${r2(standardError)}`],
          ["Calculate t.", `t=\\frac{${mean1}-${mean2}}{${r2(standardError)}}\\approx${statistic}`],
        ],
        0.05,
      );
    }
    case "pearson-correlation": {
      const x0 = i;
      const slope = i % 2 ? 2 : -2;
      const intercept = 5 + i;
      const xs = [x0, x0 + 1, x0 + 2];
      const ys = xs.map((x) => slope * x + intercept);
      const result = slope > 0 ? 1 : -1;
      return make(
        `For x = ${xs.join(", ")} and y = ${ys.join(", ")}, find Pearson's r.`,
        result,
        [
          ["Check the direction of the paired data.", slope > 0 ? "y\\text{ increases with }x" : "y\\text{ decreases as }x\\text{ increases}"],
          ["The points lie on a straight line.", `r=${result}`],
          ["State the correlation.", `r=${result}`],
        ],
      );
    }
    case "linear-regression": {
      const slope = 1 + i / 4;
      const meanX = 2 + i;
      const meanY = 10 + 2 * i;
      const targetX = meanX + 1;
      const intercept = r2(meanY - slope * meanX);
      const prediction = r2(intercept + slope * targetX);
      return make(
        `A regression model has slope b₁ = ${slope} and mean point (x̄, ȳ) = (${meanX}, ${meanY}). Find b₀ and predict ŷ when x = ${targetX}.`,
        prediction,
        [
          ["Find the intercept.", `b_0=${meanY}-${slope}(${meanX})=${intercept}`],
          ["Write the regression line.", `\\hat y=${intercept}+${slope}x`],
          ["Predict at the given x.", `\\hat y=${intercept}+${slope}(${targetX})=${prediction}`],
        ],
      );
    }
    case "logic-conditional-forms": {
      const variantIndex = i - 1;
      const pTrue = variantIndex % 2 === 0;
      const qTrue = Math.floor(variantIndex / 2) % 2 === 1;
      const forms = [
        ["conditional", pTrue, qTrue],
        ["converse", qTrue, pTrue],
        ["inverse", !pTrue, !qTrue],
        ["contrapositive", !qTrue, !pTrue],
      ];
      const [form, antecedent, consequent] = forms[Math.floor(variantIndex / 4) % forms.length];
      const isTrue = !antecedent || consequent;
      return make(
        `If p is ${pTrue ? "true" : "false"} and q is ${qTrue ? "true" : "false"}, evaluate the ${form}. Enter 1 for true or 0 for false.`,
        isTrue ? 1 : 0,
        [
          ["Write the truth values.", `p=${pTrue ? "\\text{T}" : "\\text{F}"},\\quad q=${qTrue ? "\\text{T}" : "\\text{F}"}`],
          ["A conditional is false only when its antecedent is true and its consequent is false.", `${antecedent ? "\\text{T}" : "\\text{F}"}\\to${consequent ? "\\text{T}" : "\\text{F}"}`],
          ["Enter the requested code.", isTrue ? "1" : "0"],
        ],
      );
    }
    default:
      return null;
  }
}

function buildPiecewiseExample(form, index) {
  const branchIndex = index % form.branches.length;
  const branch = form.branches[branchIndex];
  const inputIndex = Math.floor(index / form.branches.length) % branch.sampleInputs.length;
  const x = branch.sampleInputs[inputIndex];
  const answer = branch.evaluate(x);
  return {
    question: `For the displayed piecewise function, find f(${x}).`,
    answer,
    tolerance: 0.001,
    steps: [
      ["Choose the rule whose condition includes the input.", `${x}\\text{ satisfies }${branch.conditionLatex}`],
      ["Substitute the input into that rule.", `f(${x})=${branch.substitute(x)}`],
      ["Evaluate.", `f(${x})=${answer}`],
    ],
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNonZero(min, max) {
  let value = 0;
  while (value === 0) value = randomInt(min, max);
  return value;
}

function roundTo(value, digits) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatMoney(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function signed(value) {
  return `${value < 0 ? "−" : "+"} ${Math.abs(value)}`;
}

function signedLatex(value) {
  return value < 0 ? `${value}` : `+${value}`;
}

function plainMath(latex) {
  return latex
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1) ÷ ($2)")
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("\\quad", "  ")
    .replaceAll("\\geq", "≥")
    .replaceAll("\\leq", "≤")
    .replaceAll("\\approx", "≈")
    .replaceAll("\\times", "×")
    .replaceAll("\\sum", "Σ")
    .replaceAll("\\%", "%")
    .replaceAll("\\bar{x}", "x̄")
    .replaceAll("\\,", " ")
    .replace(/[{}]/g, "");
}

window.ExploreFormulas = { FORMULA_LIBRARY, plainMath, randomInt, randomNonZero, roundTo, formatNumber, formatMoney, signed, signedLatex, makeFormula, buildAdditionalExample, buildPiecewiseExample };
})();
