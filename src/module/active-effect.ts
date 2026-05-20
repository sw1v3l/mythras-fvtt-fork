import { ActorMythras } from "./actor";
import { ItemMythras } from "./item/base";

/** Disable Active Effects */
// TODO: Implement Active Effects for Mythras
export class ActiveEffectMythras extends ActiveEffect<ActorMythras | ItemMythras> {
  // TODO: Implement Active Effects for Mythras

  /**
   * Migrate legacy duration properties to the new schema.
   * Preferred 'seconds' over other duration properties in v14.
   */
  override prepareData() {
    super.prepareData();
    const duration = this.duration;
    if (duration.seconds === undefined && duration.startTime !== undefined) {
      // Logic for migration or handling could go here if needed
    }
  }
}