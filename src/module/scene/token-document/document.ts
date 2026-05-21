import { SceneMythras } from "../document";



class TokenDocumentMythras<TParent extends SceneMythras | null = SceneMythras | null> extends TokenDocument<TParent> {
  /** @override */
  override updateSource(changes: Record<string, any> = {}, options: any = {}): any {
    // In Foundry V14, TokenDocument validation fails for unlinked tokens if the ActorDelta
    // is missing required fields (system, items, effects, flags).
    // When super._preCreate is called for unlinked tokens, it calls updateSource with a new delta.
    if (changes.delta && !this.actorLink) {
      if (changes.delta.system === undefined) changes.delta.system = {};
      if (changes.delta.items === undefined) changes.delta.items = [];
      if (changes.delta.effects === undefined) changes.delta.effects = [];
      if (changes.delta.flags === undefined) changes.delta.flags = {};
    }
    return super.updateSource(changes, options);
  }
}

export {TokenDocumentMythras}