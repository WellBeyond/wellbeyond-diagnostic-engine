'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsonRulesEngine = require('json-rules-engine');

// @ts-ignore

class DiagnosticEngine {
  constructor() {
    this.symptoms = [];
    this.solutions = {};
    this.diagnostics = {};
    this.factCreated = {};
    this.rules = [];
    this.factPriority = 1000;
    this.initialized = false;
    this.engine = new jsonRulesEngine.Engine([], {
      allowUndefinedFacts: false
    });
  }

  initialize(symptoms, solutions, diagnostics, diagnosticCallback, solutionCallback) {
    this.symptoms = symptoms || [];
    solutions.forEach(solution => {
      this.solutions[solution.id] = solution;
    });
    diagnostics.forEach(diagnostic => {
      this.diagnostics[diagnostic.id] = diagnostic;
    });
    this.diagnosticCallback = diagnosticCallback;
    this.solutionCallback = solutionCallback;
    this.parse();
    this.initialized = true;
    return this;
  }

  async run(symptoms, systemTypes) {
    this.engine.addFact('symptoms', symptoms);
    this.engine.addFact('systemTypes', systemTypes);
    this.engine.on('success', event => {
      console.log('success', event);
    }).on('failure', event => {
      console.log('failure', event);
    });

    try {
      await this.engine.run();
    } catch (e) {
      console.log(e);
    }
  }

  parse() {
    const self = this;
    self.engine.addOperator('containsOneOf', (factValue, jsonValue) => {
      if (!factValue || !factValue.length) return false;
      if (!jsonValue || !jsonValue.length) return false;
      let contains = false;
      jsonValue.forEach(val => {
        if (factValue.includes(val)) contains = true;
      });
      return contains;
    });
    self.symptoms.forEach(symptom => {
      symptom.rules && symptom.rules.forEach(potential => {
        const solution = this.solutions[potential.solutionId];

        if (solution) {
          const rule = this.createRuleForSolution(symptom, potential, solution);
          this.rules.push(rule);
        }
      });
      symptom.rootCauses && symptom.rootCauses.forEach(cause => {
        const root = this.symptoms.find(s => s.id === cause.symptomId);

        if (root) {
          const rule = this.createRuleForRootCause(symptom, cause, root);
          this.rules.push(rule);
        }
      });
    });
    self.addRules(self.rules);
  }

  createFact(factId) {
    const self = this;

    if (factId && !self.factCreated[factId]) {
      self.factCreated[factId] = true; // @ts-ignore

      this.engine.addFact(factId, function (params, almanac) {
        return new Promise((resolve, reject) => {
          const diagnostic = self.diagnostics[factId];

          if (diagnostic && self.diagnosticCallback) {
            return self.diagnosticCallback(diagnostic).then(answer => {
              resolve(answer);
            }, reason => {
              reject(reason);
            });
          } else {
            return reject();
          }
        });
      }, {
        cache: true,
        priority: self.factPriority--
      });
    }
  }

  createRuleForSolution(symptom, potential, solution) {
    const self = this;
    const rule = {};
    rule.name = symptom.name + ': ' + solution.name;
    rule.event = {
      type: 'solved',
      params: {
        symptomId: symptom.id,
        solutionId: solution.id,
        message: solution.name
      }
    };
    this.addConditions(rule, symptom, potential);

    if (solution.askDidItWork) {
      rule.conditions.all.push({
        fact: solution.id,
        operator: 'equal',
        value: 'yes'
      }); // @ts-ignore

      this.engine.addFact(solution.id, function (params, almanac) {
        return new Promise((resolve, reject) => {
          if (self.solutionCallback) {
            return self.solutionCallback(solution).then(answer => {
              resolve(answer);
            }, reason => {
              reject(reason);
            });
          } else {
            return reject();
          }
        });
      }, {
        cache: false,
        priority: self.factPriority--
      });
    }

    return new jsonRulesEngine.Rule(rule);
  }

  createRuleForRootCause(symptom, potential, root) {
    const rule = {};
    rule.name = symptom.name + ': ' + root.name;
    rule.event = {
      type: 'addSymptom',
      params: {
        symptomId: symptom.id,
        causeId: root.id,
        message: root.name
      }
    };
    this.addConditions(rule, symptom, potential);
    return new jsonRulesEngine.Rule(rule);
  }

  addConditions(rule, symptom, potential) {
    const self = this;
    rule.conditions = {
      all: [{
        fact: 'symptoms',
        operator: 'contains',
        value: symptom.id
      }]
    };

    if (potential.systemTypes && potential.systemTypes.length) {
      rule.conditions.all.push({
        fact: 'systemTypes',
        operator: 'containsOneOf',
        value: potential.systemTypes
      });
    }

    if (potential.mustBeYes) {
      potential.mustBeYes.forEach(diagnosticId => {
        rule.conditions.all.push({
          fact: diagnosticId,
          operator: 'equal',
          value: 'yes'
        });
        self.createFact(diagnosticId);
      });
    }

    potential.mustBeNo && potential.mustBeNo.forEach(diagnosticId => {
      rule.conditions.all.push({
        fact: diagnosticId,
        operator: 'equal',
        value: 'no'
      });
      self.createFact(diagnosticId);
    });
  }

  addRules(rules = []) {
    let priority = rules.length + 1;
    rules.forEach(rule => {
      rule.setPriority(priority--);
      this.engine.addRule(rule);
    });
  }

  getEngine() {
    return this.engine;
  }

}

Object.defineProperty(exports, 'Almanac', {
    enumerable: true,
    get: function () {
        return jsonRulesEngine.Almanac;
    }
});
Object.defineProperty(exports, 'Engine', {
    enumerable: true,
    get: function () {
        return jsonRulesEngine.Engine;
    }
});
Object.defineProperty(exports, 'Fact', {
    enumerable: true,
    get: function () {
        return jsonRulesEngine.Fact;
    }
});
Object.defineProperty(exports, 'Rule', {
    enumerable: true,
    get: function () {
        return jsonRulesEngine.Rule;
    }
});
exports.DiagnosticEngine = DiagnosticEngine;
//# sourceMappingURL=wellbeyond-diagnostic-engine.cjs.development.js.map
