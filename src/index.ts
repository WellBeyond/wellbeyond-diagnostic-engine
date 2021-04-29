// @ts-ignore
import { Engine, Rule, Fact, Almanac, RuleResult, Event } from 'json-rules-engine';

class Diagnostics {
  engine: Engine;

  constructor () {
    this.engine = new Engine([], {allowUndefinedFacts: true});
  }

  addRules (rules:Rule[] = []):void {
    let priority = rules.length + 1;
    rules.forEach((rule) => {
      rule.priority = priority--;
      this.engine.addRule(rule);
    });
  }

  getEngine ():Engine {
    return this.engine;
  }

}

export {
    Diagnostics,
    Engine,
    Rule,
    Fact,
    Almanac,
    RuleResult
}