/*
 * Observatory history content: the eight eras, sourced topic notes, timeline,
 * mathematician profiles, comparison examples, and formulas rendered by history-ui.js.
 */
export const eras = [
  {
    id: "origins",
    title: "The Origins of Mathematics",
    period: "c. 3000 BCE · earlier evidence is fragmentary",
    year: -3000,
    accent: "#d9b879",
    intro:
      "Long before formal notation, people counted, measured, and tracked recurring patterns. The earliest surviving records are only glimpses of much older practices.",
    topics: [
      {
        title: "Early counting and number systems",
        text: "Tally marks, tokens, and other counting aids helped people keep track of animals, goods, and elapsed time. Some marked bones are tens of thousands of years old, but their exact purpose is debated.",
        sources:
          "Chrisomalis, Numerical Notation (2010); British Museum, Ishango bone collection notes.",
      },
      {
        title: "Mathematics in ancient civilizations",
        text: "As settlements grew, record keepers in Mesopotamia and Egypt used numbers for taxation, trade, land measurement, and construction. Their surviving documents show practical calculation traditions rather than a single origin point for mathematics.",
        sources:
          "Robson, Mathematics in Ancient Iraq (2008); Imhausen, Mathematics in Ancient Egypt (2016).",
      },
      {
        title: "Why humans began developing mathematics",
        text: "Counting and measurement answer everyday needs: sharing resources, planning harvests, building, and coordinating exchange. The evidence suggests many communities developed mathematical practices independently; the motives and dates varied by place.",
        sources: "Robson (2008); Imhausen (2016); Chrisomalis (2010).",
      },
    ],
    fact: "A number can be recorded without positional notation: Egyptian scribes repeated symbols to show tens, hundreds, and thousands.",
  },
  {
    id: "ancient",
    title: "Ancient Mathematics",
    period: "c. 2000–300 BCE",
    year: -1500,
    accent: "#e4a76f",
    intro:
      "Clay tablets, papyri, and later Greek texts reveal distinct mathematical cultures. Their methods were shaped by local languages, institutions, and practical questions.",
    topics: [
      {
        title: "Egyptian mathematics",
        text: "Egyptian scribes used a decimal system with separate symbols for powers of ten and solved practical problems involving grain, wages, areas, and volumes. The Rhind Mathematical Papyrus, copied around 1650 BCE from an older source, preserves examples rather than a complete theory.",
        sources:
          "Imhausen, Mathematics in Ancient Egypt (2016); British Museum, Rhind Mathematical Papyrus.",
      },
      {
        title: "Babylonian mathematics",
        text: "Mesopotamian scribes used a place-value system based on 60, recorded on clay tablets with cuneiform numerals. Their tables and problem texts include sophisticated arithmetic and procedures for solving quadratic problems, though they did not use modern algebraic symbols.",
        sources:
          "Robson, Mathematics in Ancient Iraq (2008); Proust, “Mesopotamian Mathematics” (Encyclopedia of the History of Science).",
      },
      {
        title: "Greek mathematics",
        text: "Greek authors developed deductive geometry and wrote arguments that connected definitions, assumptions, and propositions. Greek mathematics drew on earlier knowledge from Egypt and Mesopotamia while developing its own proof-centered traditions.",
        sources:
          "Netz, The Shaping of Deduction in Greek Mathematics (1999); Heath, A History of Greek Mathematics (1921).",
      },
      {
        title: "Early discoveries and methods",
        text: "Ancient sources document approximations, tables, geometric rules, and methods for solving practical and theoretical problems. Because records are incomplete and copied across generations, claims about a first discovery are often uncertain.",
        sources: "Robson (2008); Imhausen (2016); Netz (1999).",
      },
    ],
    fact: "Babylonian base 60 still echoes in the 60 seconds per minute and 360 degrees of a full turn.",
  },
  {
    id: "classical",
    title: "Mathematics in the Classical World",
    period: "c. 600 BCE–300 CE",
    year: -300,
    accent: "#c7b6eb",
    intro:
      "Classical Greek mathematicians made geometric proof a powerful way to organize knowledge. Their works were copied, translated, criticized, and reused across many later mathematical traditions.",
    topics: [
      {
        title: "Euclid and geometry",
        text: "Euclid’s Elements, compiled around 300 BCE, presents plane geometry and number theory through definitions, postulates, and propositions. It is a landmark synthesis; Euclid should not be credited with inventing every result it contains.",
        sources: "Euclid, Elements, trans. Heath (1956); Netz (1999).",
      },
      {
        title: "Pythagoras and mathematical relationships",
        text: "The relationship now called the Pythagorean theorem was known in several cultures before the period associated with Pythagoras. Later Greek traditions connected the theorem and numerical ratios with the Pythagorean school, but details about Pythagoras’s own work are uncertain.",
        sources:
          "Robson (2008); Katz, A History of Mathematics (3rd ed., 2009).",
      },
      {
        title: "Archimedes and measurement",
        text: "Archimedes used geometric arguments to bound the value of pi and studied areas, volumes, and centers of gravity. His method of exhaustion anticipates some questions later addressed by calculus, but it was not calculus in the modern sense.",
        sources:
          "Archimedes, The Works of Archimedes, trans. Heath (1897); Netz & Noel, The Archimedes Codex (2007).",
      },
      {
        title: "The development of mathematical proof",
        text: "Greek proof traditions made explicit chains of reasoning central to geometry. They developed over time and alongside practical mathematics; no single culture or individual invented proof as a whole.",
        sources: "Netz, The Shaping of Deduction in Greek Mathematics (1999).",
      },
    ],
    fact: "Euclid’s Elements became one of the most influential mathematical books, copied and taught for more than two millennia.",
  },
  {
    id: "asia-islamic",
    title: "Mathematics in Asia and the Islamic World",
    period: "c. 200–1400 CE",
    year: 800,
    accent: "#86c9c3",
    intro:
      "Mathematics moved through scholarly networks spanning South Asia, the Middle East, North Africa, and Europe. Translation, commentary, and new research all shaped the ideas that traveled.",
    topics: [
      {
        title: "Indian mathematics",
        text: "Indian mathematicians developed important methods in arithmetic, algebra, and astronomy. The place-value decimal notation used today took shape through a long history of contributions, not a single moment or inventor.",
        sources: "Plofker, Mathematics in India (2009); Katz (2009).",
      },
      {
        title: "The development of zero",
        text: "Indian sources show zero developing both as a placeholder in positional notation and as a number used in calculation. Brahmagupta gave rules for arithmetic with zero in the seventh century, while earlier place-value uses and the broader history remain important.",
        sources:
          "Plofker (2009); Ifrah, The Universal History of Numbers (2000).",
      },
      {
        title: "Arabic and Islamic scholars",
        text: "Scholars working in Arabic-speaking intellectual centers translated, preserved, and extended mathematical works from Greek, Indian, and other traditions. Their work included algebra, arithmetic, astronomy, and trigonometry; it was a broad collaborative history rather than one isolated “golden age.”",
        sources:
          "Berggren, Episodes in the Mathematics of Medieval Islam (1986); Katz (2009).",
      },
      {
        title: "Al-Khwarizmi and algebra",
        text: "Al-Khwarizmi’s ninth-century treatise on calculation by completion and balancing organized methods for solving linear and quadratic equations. The word “algebra” derives from al-jabr in the title; “algorithm” descends through Latinized forms of his name.",
        sources:
          "Rosen, The Algebra of al-Khwarizmi (1831/modern editions); Berggren (1986).",
      },
    ],
    fact: "The word “algorithm” traces back through medieval Latin to a Latinized form of al-Khwarizmi’s name.",
  },
  {
    id: "algebra",
    title: "The Development of Algebra",
    period: "c. 800–1600 CE",
    year: 1450,
    accent: "#e7c878",
    intro:
      "Algebra grew from problem-solving procedures into a flexible symbolic language. Its notation emerged gradually across regions and generations.",
    topics: [
      {
        title: "From arithmetic to symbolic mathematics",
        text: "Early algebra often described unknown quantities and operations in words. Over centuries, abbreviations and symbols made expressions shorter and helped mathematicians manipulate general relationships.",
        sources:
          "Katz, A History of Mathematics (3rd ed., 2009); Kline, Mathematical Thought from Ancient to Modern Times (1972).",
      },
      {
        title: "The development of equations",
        text: "Methods for solving linear and quadratic equations appear in ancient sources, including Babylonian tablets and al-Khwarizmi’s treatise. Modern equation notation came later, as authors standardized symbols for unknowns, powers, and equality.",
        sources: "Robson (2008); Berggren (1986); Katz (2009).",
      },
      {
        title: "Important contributors to algebra",
        text: "Al-Khwarizmi systematized equation-solving in Arabic prose; later scholars including Omar Khayyam studied cubic equations geometrically. European authors such as François Viète advanced letter-based notation, while symbolic algebra continued to evolve.",
        sources:
          "Berggren (1986); Katz (2009); Rashed, The Development of Arabic Mathematics (1994).",
      },
    ],
    fact: "The familiar equals sign was introduced by Robert Recorde in 1557, chosen because parallel lines are “more equal.”",
  },
  {
    id: "scientific-revolution",
    title: "The Scientific Revolution",
    period: "c. 1500–1700",
    year: 1600,
    accent: "#7dbce1",
    intro:
      "New mathematical tools helped describe motion, planetary paths, and changing quantities. The period’s breakthroughs drew on earlier scholarship and unfolded through intense exchanges and disputes.",
    topics: [
      {
        title: "Mathematics and astronomy",
        text: "Mathematical models helped astronomers compare observations with competing accounts of the heavens. Copernicus, Kepler, and others used geometry and numerical analysis to rethink planetary motion.",
        sources: "Gingerich, The Book Nobody Read (2004); Kline (1972).",
      },
      {
        title: "Descartes and analytic geometry",
        text: "Descartes linked algebraic equations with geometric curves in La Géométrie (1637), helping establish analytic geometry. Coordinate methods developed through a wider history, including work by Fermat and others.",
        sources: "Descartes, La Géométrie (1637); Katz (2009).",
      },
      {
        title: "Newton and calculus",
        text: "Newton developed methods of fluxions to analyze changing quantities and used them in mechanics and astronomy. His work was developed independently of Leibniz’s calculus, and priority disputes followed their separate publications and correspondence.",
        sources:
          "Guicciardini, Isaac Newton on Mathematical Certainty and Method (2009); Katz (2009).",
      },
      {
        title: "Leibniz and calculus notation",
        text: "Leibniz published calculus methods using the integral sign and the differential notation dy/dx. These symbols proved effective and became standard; calculus emerged through related but independent work by Leibniz and Newton.",
        sources:
          "Bos, “The Fundamental Concepts of the Leibnizian Calculus” (1974); Katz (2009).",
      },
    ],
    fact: "The elongated S in ∫ is an initial letter from summa, Latin for “sum.”",
  },
  {
    id: "modern",
    title: "Modern Mathematics",
    period: "c. 1700–1900s",
    year: 1850,
    accent: "#b2a6ed",
    intro:
      "Mathematics expanded into new theories of uncertainty, structure, space, and logic. Many familiar branches became distinct disciplines during this period.",
    topics: [
      {
        title: "Probability and statistics",
        text: "Probability developed through studies of games of chance, insurance, and scientific inference. Statistics later grew into a broad toolkit for collecting, summarizing, and reasoning from data.",
        sources:
          "Hacking, The Emergence of Probability (1975); Stigler, The History of Statistics (1986).",
      },
      {
        title: "Abstract algebra",
        text: "Nineteenth-century work on equations, permutations, and number systems helped shift algebra toward the study of structures such as groups and fields. Emmy Noether later transformed the field with influential work on ideals and abstract methods.",
        sources:
          "Kleiner, A History of Abstract Algebra (2007); Dick, Emmy Noether (1981).",
      },
      {
        title: "Modern geometry",
        text: "Non-Euclidean geometries showed that consistent alternatives to Euclid’s parallel postulate could be explored. Geometry then broadened through differential, projective, and other approaches to space and transformation.",
        sources: "Gray, Worlds Out of Nothing (2007); Katz (2009).",
      },
      {
        title: "Mathematical logic",
        text: "Logicians formalized mathematical reasoning and studied the foundations and limits of formal systems. Work by Boole, Frege, Cantor, Hilbert, Gödel, and others reshaped how mathematics understood proof and infinity.",
        sources: "Ferreirós, Labyrinth of Thought (1999); Gray (2007).",
      },
      {
        title: "Computing and mathematics",
        text: "Mathematical logic and mechanical calculation informed the development of theoretical computing. In the twentieth century, electronic computers transformed numerical work, simulation, and the scale of problems mathematicians could investigate.",
        sources:
          "Davis, Engines of Logic (2000); Copeland, The Essential Turing (2004).",
      },
    ],
    fact: "Emmy Noether’s work linked symmetry with conservation laws in theoretical physics; the result is now known as Noether’s theorem.",
  },
  {
    id: "today",
    title: "Mathematics Today",
    period: "1900s–present",
    year: 2026,
    accent: "#78d5cb",
    intro:
      "Mathematics is woven into modern tools and scientific practice. Its applications keep changing as computation makes new questions tractable.",
    topics: [
      {
        title: "Mathematics in technology",
        text: "Algorithms, optimization, signal processing, and numerical methods underpin much of digital technology. These systems combine mathematical ideas with engineering choices, data, and software design.",
        sources:
          "National Academies, The Mathematical Sciences in 2025 (2013); SIAM, Mathematics of Information Technology.",
      },
      {
        title: "Mathematics in science and engineering",
        text: "Models express relationships in physical systems, help engineers test designs, and support predictions in fields from climate science to medicine. Models are approximations, so their assumptions and uncertainty matter.",
        sources:
          "National Academies (2013); OpenStax, Calculus and Modeling texts.",
      },
      {
        title: "Cryptography",
        text: "Modern cryptography uses number theory and algebra to protect communication and verify information. Widely used public-key systems rely on computational problems believed to be difficult for classical computers at relevant scales.",
        sources:
          "NIST, FIPS 186-5 (2023); Katz & Lindell, Introduction to Modern Cryptography (3rd ed., 2020).",
      },
      {
        title: "Artificial intelligence",
        text: "Machine learning uses optimization, linear algebra, probability, and statistics to fit models to data. Mathematical performance does not by itself guarantee that a system is reliable, fair, or appropriate for a task.",
        sources:
          "Goodfellow, Bengio & Courville, Deep Learning (2016); National Academies (2013).",
      },
      {
        title: "Data science",
        text: "Data science combines statistical reasoning, computing, and subject knowledge to find and communicate patterns in data. Sound conclusions depend on how data were gathered, which assumptions are made, and how uncertainty is handled.",
        sources:
          "National Academies (2013); NIST/SEMATECH e-Handbook of Statistical Methods.",
      },
    ],
    fact: "Error-correcting codes add carefully chosen redundancy so data can still be recovered after some information is corrupted.",
  },
];

export const timeline = [
  {
    label: "Counting records",
    year: -3000,
    era: "origins",
    detail: "Early tallies and accounting marks",
    period: "c. 3000 BCE",
  },
  {
    label: "Place value in Babylon",
    year: -1800,
    era: "ancient",
    detail: "Base-60 place-value calculations",
    period: "c. 1800 BCE",
  },
  {
    label: "Euclid’s Elements",
    year: -300,
    era: "classical",
    detail: "Axiomatic geometry compiled",
    period: "c. 300 BCE",
  },
  {
    label: "Brahmagupta on zero",
    year: 628,
    era: "asia-islamic",
    detail: "Arithmetic rules including zero",
    period: "628 CE",
  },
  {
    label: "Al-Khwarizmi’s algebra",
    year: 820,
    era: "asia-islamic",
    detail: "Systematic equation-solving treatise",
    period: "c. 820 CE",
  },
  {
    label: "Symbolic algebra grows",
    year: 1591,
    era: "algebra",
    detail: "Viète publishes influential symbolic methods",
    period: "1591 CE",
  },
  {
    label: "Calculus takes shape",
    year: 1670,
    era: "scientific-revolution",
    detail: "Independent work by Newton and Leibniz",
    period: "c. 1670 CE",
  },
  {
    label: "Modern mathematical fields",
    year: 1900,
    era: "modern",
    detail: "Logic, structures, and computation expand",
    period: "1900s",
  },
  {
    label: "Mathematics today",
    year: 2026,
    era: "today",
    detail: "Data, computation, and new applications",
    period: "Today",
  },
];

export const mathematicians = [
  {
    name: "Pythagoras",
    years: "c. 570–c. 495 BCE",
    region: "Samos / southern Italy",
    contribution:
      "Pythagoras led a philosophical community in southern Italy whose members studied number, geometry, astronomy, and musical ratios. Their school treated numerical relationships as a way to understand the world. Because Pythagoras left no writings and later accounts mix history with legend, historians cannot confidently assign the theorem or every discovery to him personally.",
    ideas: ["Pythagorean theorem", "Numerical ratios", "Pythagorean school"],
    note: "Biographical details and attributions are uncertain; the right-triangle relationship predates him.",
  },
  {
    name: "Euclid",
    years: "fl. c. 300 BCE",
    region: "Alexandria, Egypt",
    contribution:
      "Euclid’s Elements organized geometry and parts of number theory into definitions, postulates, and propositions supported by proofs. Compiled in Alexandria around 300 BCE, it became a model for building mathematics from stated assumptions. Euclid gathered and systematized earlier results as well as presenting demonstrations, so the work is better understood as a rigorous synthesis than as a list of inventions.",
    ideas: ["Axioms and proof", "Plane geometry", "Number theory"],
    note: "Little is known about Euclid’s life; Elements organizes knowledge from earlier sources.",
  },
  {
    name: "Archimedes",
    years: "c. 287–212 BCE",
    region: "Syracuse, Sicily",
    contribution: "Archimedes used geometric arguments to calculate areas and volumes and to establish tight bounds for pi by comparing circles with polygons. He also investigated levers, centers of gravity, and floating bodies. His surviving treatises combine exact reasoning with practical questions about measurement and mechanics, making him one of antiquity’s most influential mathematical authors.",
    ideas: ["Exhaustion method", "Buoyancy", "Area and volume"],
    note: "His surviving works include rigorous bounds for the circle constant pi.",
  },
  {
    name: "Brahmagupta",
    years: "c. 598–c. 668 CE",
    region: "Northwestern India",
    contribution:
      "In his 628 CE work Brahmasphutasiddhanta, Brahmagupta described arithmetic rules for zero and negative quantities, methods for quadratic equations, and techniques used in mathematical astronomy. He worked in a scholarly tradition centered at Ujjain in northwestern India. His writing is an early systematic source for treating positive, negative, and zero values within calculation rules.",
    ideas: ["Zero", "Negative numbers", "Algebra"],
    note: "His Brahmasphutasiddhanta dates to 628 CE.",
  },
  {
    name: "Al-Khwarizmi",
    years: "c. 780–c. 850 CE",
    region: "Baghdad, Abbasid Caliphate",
    contribution:
      "Working in ninth-century Baghdad, al-Khwarizmi wrote a treatise that set out step-by-step methods for solving linear and quadratic equations by completing and balancing terms. The title’s word al-jabr gave us “algebra.” His separate work on Indian numerals helped transmit place-value calculation, while the word “algorithm” developed from Latinized forms of his name.",
    ideas: ["Algebra", "Hindu-Arabic numerals", "Algorithms"],
    note: "His works survive unevenly, often through later translations.",
  },
  {
    name: "René Descartes",
    years: "1596–1650",
    region: "France / Dutch Republic",
    contribution: "In La Géométrie (1637), Descartes showed how algebraic equations could describe geometric curves and how geometric problems could be approached through equations. This connection helped establish analytic geometry and coordinate methods, creating a bridge between algebra and geometry that later mathematics could extend. Fermat developed closely related methods independently during the same period.",
    ideas: ["Analytic geometry", "Coordinates", "Algebraic curves"],
    note: "Fermat developed closely related analytic methods independently.",
  },
  {
    name: "Isaac Newton",
    years: "1642/43–1727",
    region: "England",
    contribution:
      "Newton developed his method of fluxions to describe changing quantities, then used mathematical analysis in work on motion, gravitation, and planetary paths. The Principia (1687) expressed mechanics through geometric arguments and mathematical laws. Newton’s calculus was developed independently of Leibniz’s; their different notation and publication histories later became the focus of a long priority dispute.",
    ideas: ["Fluxions", "Motion", "Gravitation"],
    note: "Calculus was developed independently by Newton and Leibniz; birth year differs by calendar.",
  },
  {
    name: "Gottfried Wilhelm Leibniz",
    years: "1646–1716",
    region: "Holy Roman Empire",
    contribution: "Leibniz independently developed calculus and published his differential methods in the 1680s. His notation—including dy/dx for a derivative and the elongated integral sign—made calculation with changing quantities easier to express and became standard. He also studied binary arithmetic, connecting a compact system of 0s and 1s with broader questions about number and logic.",
    ideas: ["Differentials", "Integral notation", "Binary arithmetic"],
    note: "The priority controversy with Newton reflected independent development.",
  },
  {
    name: "Leonhard Euler",
    years: "1707–1783",
    region: "Switzerland",
    contribution:
      "Euler published influential work across analysis, number theory, mechanics, geometry, and astronomy, often turning difficult problems into reusable methods. He helped establish modern function notation and developed results that shaped differential equations and graph theory. His 1736 study of the Königsberg bridges became a landmark in graph theory, while his textbooks carried mathematical techniques to generations of readers.",
    ideas: ["Functions", "Graph theory", "Euler’s identity"],
    note: "Euler’s identity is commonly written e^(iπ)+1=0.",
  },
  {
    name: "Carl Friedrich Gauss",
    years: "1777–1855",
    region: "Germany",
    contribution:
      "Gauss’s Disquisitiones Arithmeticae (1801) reorganized number theory and introduced tools that influenced later research. He also applied least-squares methods to astronomical observations, worked on geodesy and magnetism, and studied curved surfaces. His work ranged from pure mathematics to measurement, showing how abstract techniques could clarify practical scientific problems.",
    ideas: ["Number theory", "Least squares", "Curvature"],
    note: "The “Prince of Mathematicians” label is a later honorific.",
  },
  {
    name: "Emmy Noether",
    years: "1882–1935",
    region: "Germany",
    contribution:
      "Noether transformed abstract algebra by developing structural ways to study rings, ideals, and invariant quantities. In mathematical physics, her 1918 theorem showed that continuous symmetries of a system correspond to conservation laws—for example, time symmetry to conservation of energy. Her ideas reshaped both modern algebra and theoretical physics, despite the barriers that restricted her academic career in Germany.",
    ideas: ["Ring theory", "Noether’s theorem", "Invariant theory"],
    note: "Her theorem is foundational in mathematical physics.",
  },
  {
    name: "Alan Turing",
    years: "1912–1954",
    region: "England",
    contribution:
      "Turing’s 1936 paper described an abstract machine that could follow precise instructions, giving mathematicians a way to define what is computable. During the Second World War, he worked at Bletchley Park on methods to help decrypt German naval Enigma messages. His later writing explored machine intelligence, while his theoretical model remains central to computer science.",
    ideas: ["Turing machine", "Computability", "Cryptanalysis"],
    note: "His 1936 paper helped define the limits and possibilities of computation.",
  },
];

export const comparisons = [
  {
    label: "Numeral systems",
    oldLabel: "Roman numerals",
    old: "XLII",
    newLabel: "Hindu-Arabic digits",
    modern: "42",
    caption: "A positional decimal system writes the same value compactly.",
  },
  {
    label: "Algebra",
    oldLabel: "Rhetorical algebra",
    old: "The square and ten roots equal thirty-nine.",
    newLabel: "Symbolic algebra",
    modern: "x² + 10x = 39",
    caption:
      "Words gradually gave way to compact symbols for unknowns and operations.",
  },
  {
    label: "Calculus",
    oldLabel: "Newton’s dot notation",
    old: "ẋ",
    newLabel: "Leibniz notation",
    modern: "dy/dx",
    caption:
      "Different notations emphasize different views of changing quantities.",
  },
];

export const formulas = [
  {
    title: "A right triangle",
    context: "Euclid’s Elements, Book I, Proposition 47",
    original:
      "In right-angled triangles the square on the side subtending the right angle is equal to the squares on the sides containing the right angle.",
    latex: "a^2+b^2=c^2",
  },
  {
    title: "Circle measurement",
    context: "Archimedes’ bounds for the circle constant",
    original:
      "The ratio of a circle’s circumference to its diameter lies between 3 10/71 and 3 1/7.",
    latex: "3+\\frac{10}{71}<\\pi<3+\\frac{1}{7}",
  },
  {
    title: "A relation of change",
    context: "Leibniz’s differential notation",
    original: "A small change in y compared with a small change in x.",
    latex: "\\frac{dy}{dx}=f'(x)",
  },
  {
    title: "A celebrated identity",
    context: "Euler’s relation among five constants",
    original:
      "One identity links the exponential constant, imaginary unit, circle constant, one, and zero.",
    latex: "e^{i\\pi}+1=0",
  },
];
